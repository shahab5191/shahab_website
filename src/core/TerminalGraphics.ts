import type { Graphics } from './types';
import { Palette } from './types';
import type { BitmapFont } from './BitmapFont';
import { vga8x16 } from './fonts/vga8x16';

export interface TerminalGraphicsOptions {
  cols?: number;
  rows?: number;
  cellWidth?: number;
  cellHeight?: number;
  font?: BitmapFont;
}

/** Codepoints whose 9th column duplicates the 8th (box-drawing/block chars). */
const CONNECTING_START = 0xb0;
const CONNECTING_END = 0xdf;

/**
 * Pre-render the 256 glyphs into a 16x16 atlas of `cellWidth x cellHeight`
 * cells. Glyph pixels are white-on-transparent so the renderer can tint them
 * to any color.
 */
function buildGlyphAtlas(font: BitmapFont): HTMLCanvasElement {
  const atlasWidth = 16 * font.cellWidth;
  const atlasHeight = 16 * font.cellHeight;
  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('TerminalGraphics: could not build glyph atlas');
  const image = ctx.createImageData(atlasWidth, atlasHeight);

  for (let code = 0; code < 256; code++) {
    const glyph = font.glyphs[code];
    const col = code & 0x0f;
    const row = code >> 4;
    for (let py = 0; py < font.glyphHeight; py++) {
      const bits = glyph?.[py] ?? 0;
      for (let px = 0; px < font.glyphWidth; px++) {
        if (bits & (0x80 >> px)) {
          const offset = ((row * font.cellHeight + py) * atlasWidth + col * font.cellWidth + px) * 4;
          image.data[offset] = 255;
          image.data[offset + 1] = 255;
          image.data[offset + 2] = 255;
          image.data[offset + 3] = 255;
        }
      }
      // Extend the rightmost column into the spacing column for box-drawing
      // glyphs so horizontal lines connect seamlessly.
      if (font.cellWidth > font.glyphWidth && code >= CONNECTING_START && code <= CONNECTING_END) {
        if (bits & 0x01) {
          const offset =
            ((row * font.cellHeight + py) * atlasWidth + col * font.cellWidth + font.glyphWidth) * 4;
          image.data[offset] = 255;
          image.data[offset + 1] = 255;
          image.data[offset + 2] = 255;
          image.data[offset + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * The VRAM: an off-screen 2D canvas plus a thin drawing API.
 *
 * Text is drawn from a 1-bit bitmap font (no anti-aliasing), and the canvas
 * itself keeps `imageSmoothingEnabled = false`. Any mutation flips an internal
 * `isDirty` flag that the renderer consumes once per frame before uploading
 * the canvas to the GPU.
 */
export class TerminalGraphics implements Graphics {
  readonly cols: number;
  readonly rows: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly width: number;
  readonly height: number;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private font: BitmapFont;
  private atlas: HTMLCanvasElement;
  private atlasCache = new Map<string, HTMLCanvasElement>();
  private _isDirty = false;

  constructor(options: TerminalGraphicsOptions = {}) {
    this.cols = options.cols ?? 80;
    this.rows = options.rows ?? 25;
    this.font = options.font ?? vga8x16;
    this.cellWidth = options.cellWidth ?? this.font.cellWidth;
    this.cellHeight = options.cellHeight ?? this.font.cellHeight;

    this.width = this.cols * this.cellWidth;
    this.height = this.rows * this.cellHeight;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('TerminalGraphics: could not acquire 2D context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.atlas = buildGlyphAtlas(this.font);

    this.clearScreen(Palette.background);
  }

  /** True if the VRAM has been mutated since the last GPU upload. */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /** Reads and clears the dirty flag (used by the render loop). */
  consumeDirty(): boolean {
    const dirty = this._isDirty;
    this._isDirty = false;
    return dirty;
  }

  /** The underlying canvas to upload to the GPU as a `CanvasTexture`. */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  markDirty(): void {
    this._isDirty = true;
  }

  drawText(col: number, row: number, text: string, color: string = Palette.foreground): void {
    const atlas = this.tintedAtlas(color);
    let x = col * this.cellWidth;
    const y = row * this.cellHeight;

    for (const ch of text) {
      let code = ch.codePointAt(0) ?? 0;
      if (code >= 256) code = 0x3f; // '?' fallback
      const sx = (code & 0x0f) * this.font.cellWidth;
      const sy = (code >> 4) * this.font.cellHeight;
      this.ctx.drawImage(
        atlas,
        sx,
        sy,
        this.font.cellWidth,
        this.font.cellHeight,
        x,
        y,
        this.cellWidth,
        this.cellHeight,
      );
      x += this.cellWidth;
    }

    this.markDirty();
  }

  drawRect(x: number, y: number, w: number, h: number, color: string = Palette.foreground): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
    this.markDirty();
  }

  drawCircle(x: number, y: number, radius: number, color: string = Palette.foreground): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.markDirty();
  }

  setPixel(x: number, y: number, color: string = Palette.foreground): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    this.markDirty();
  }

  clearScreen(color: string = Palette.background): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.markDirty();
  }

  /** Lazily build (and cache) a color-tinted copy of the white glyph atlas. */
  private tintedAtlas(color: string): HTMLCanvasElement {
    const cached = this.atlasCache.get(color);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = this.atlas.width;
    canvas.height = this.atlas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('TerminalGraphics: could not tint glyph atlas');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(this.atlas, 0, 0);

    this.atlasCache.set(color, canvas);
    return canvas;
  }
}
