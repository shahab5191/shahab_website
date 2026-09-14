/**
 * CP437 glyphs for box-drawing and punctuation (IBM VGA 8x16 font).
 *
 * The Unicode box-drawing/punctuation codepoints used in the designs live
 * above 0xFF and would render as '?', so we use the CP437 byte values that
 * map to the same glyph shapes.
 */

export const H = String.fromCharCode(0xc4); // ─ single horizontal
export const V = String.fromCharCode(0xb3); // │ single vertical
export const TL = String.fromCharCode(0xda); // ┌
export const TR = String.fromCharCode(0xbf); // ┐
export const BL = String.fromCharCode(0xc0); // └
export const BR = String.fromCharCode(0xd9); // ┘

export const DH = String.fromCharCode(0xcd); // ═ double horizontal
export const DV = String.fromCharCode(0xba); // ║ double vertical
export const DTL = String.fromCharCode(0xc9); // ╔
export const DTR = String.fromCharCode(0xbb); // ╗
export const DBL = String.fromCharCode(0xc8); // ╚
export const DBR = String.fromCharCode(0xbc); // ╝

export const DOT = String.fromCharCode(0xfa); // · middle dot
export const BULLET = String.fromCharCode(0x07); // • bullet

/** Full content width in columns (terminal text area). */
export const WIDTH = 78;

/** Center text within a fixed width (truncates if too long). */
export function center(text: string, width: number): string {
  const pad = width - text.length;
  if (pad <= 0) return text.slice(0, width);
  const left = pad >> 1;
  return " ".repeat(left) + text + " ".repeat(pad - left);
}

/** A full-width single-line box with centered title lines. */
export function header(lines: string[]): string[] {
  const inner = WIDTH - 2;
  return [
    TL + H.repeat(inner) + TR,
    ...lines.map((l) => V + center(l, inner) + V),
    BL + H.repeat(inner) + BR,
  ];
}

/** A full-width double-line box with centered title lines. */
export function doubleHeader(lines: string[]): string[] {
  const inner = WIDTH - 2;
  return [
    DTL + DH.repeat(inner) + DTR,
    ...lines.map((l) => DV + center(l, inner) + DV),
    DBL + DH.repeat(inner) + DBR,
  ];
}

/** A full-width horizontal divider. */
export function divider(): string {
  return H.repeat(WIDTH);
}
