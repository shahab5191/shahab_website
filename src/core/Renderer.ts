import type { TerminalGraphics } from './TerminalGraphics';

/**
 * A presentation-layer renderer. It consumes the VRAM (TerminalGraphics) and
 * draws it to the visible screen.
 *
 * `Canvas2DRenderer` is a temporary fallback that blits the off-screen canvas
 * scaled to the display. The WebGL/Three.js renderer will implement the same
 * interface later, uploading the VRAM canvas as a `CanvasTexture` with shaders.
 */
export interface Renderer {
  render(graphics: TerminalGraphics): void;
  resize(width: number, height: number): void;
}

export class Canvas2DRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas2DRenderer: could not acquire 2D context');
    this.canvas = canvas;
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    // Note: assigning width/height resets the context state, so smoothing is
    // re-disabled inside render() on every frame.
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(graphics: TerminalGraphics): void {
    const src = graphics.getCanvas();
    const ctx = this.ctx;
    const dw = this.canvas.width;
    const dh = this.canvas.height;

    // Disable smoothing every frame: it is reset whenever the canvas is
    // resized, so setting it once in the constructor is not enough.
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, dw, dh);

    // Integer scaling keeps every VRAM pixel a uniform square, so the image
    // stays crisp at any display size (letterboxed to preserve aspect ratio).
    const scale = Math.max(1, Math.floor(Math.min(dw / src.width, dh / src.height)));
    const w = src.width * scale;
    const h = src.height * scale;
    const x = Math.floor((dw - w) / 2);
    const y = Math.floor((dh - h) / 2);

    ctx.drawImage(src, x, y, w, h);
  }
}
