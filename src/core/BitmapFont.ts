/**
 * A monochrome bitmap font, the data model for pixel-perfect terminal text.
 *
 * Unlike `fillText` (which always anti-aliases), glyphs are 1-bit bitmaps:
 * one byte per row, bit 7 is the leftmost pixel. The renderer blits these into
 * the VRAM so edges stay crisp at any scale.
 */
export interface BitmapFont {
  readonly name: string;
  /** Width of the glyph bitmap in pixels (e.g. 8). */
  readonly glyphWidth: number;
  /** Height of the glyph bitmap in pixels (e.g. 16). */
  readonly glyphHeight: number;
  /** Width of a character cell, >= glyphWidth (extra columns are spacing). */
  readonly cellWidth: number;
  /** Height of a character cell, >= glyphHeight. */
  readonly cellHeight: number;
  /** 256 glyphs (one per byte value), each `glyphHeight` bytes. */
  readonly glyphs: readonly Uint8Array[];
}

export interface BitmapFontInit {
  name: string;
  glyphWidth: number;
  glyphHeight: number;
  cellWidth?: number;
  cellHeight?: number;
  /** 256 * glyphHeight bytes, glyph-major then row-major. */
  data: Uint8Array;
}

export function createBitmapFont(init: BitmapFontInit): BitmapFont {
  const cellWidth = init.cellWidth ?? init.glyphWidth;
  const cellHeight = init.cellHeight ?? init.glyphHeight;
  const glyphs: Uint8Array[] = new Array(256);
  for (let i = 0; i < 256; i++) {
    glyphs[i] = init.data.subarray(i * init.glyphHeight, (i + 1) * init.glyphHeight);
  }
  return {
    name: init.name,
    glyphWidth: init.glyphWidth,
    glyphHeight: init.glyphHeight,
    cellWidth,
    cellHeight,
    glyphs,
  };
}

/** Parse a hex string (two chars per byte) into a byte array. */
export function parseHexFontData(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
