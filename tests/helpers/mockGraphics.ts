import type { Graphics } from "../../src/core/types";

/**
 * A minimal in-memory Graphics implementation for testing Shell and Kernel
 * logic without a real DOM canvas.
 */
export class MockGraphics implements Graphics {
  readonly cols: number;
  readonly rows: number;
  readonly cellWidth = 8;
  readonly cellHeight = 16;
  readonly width: number;
  readonly height: number;

  drawTextCalls: { col: number; row: number; text: string; color?: string }[] =
    [];
  drawRectCalls: number = 0;
  clearCount = 0;

  constructor(cols = 80, rows = 25) {
    this.cols = cols;
    this.rows = rows;
    this.width = cols * this.cellWidth;
    this.height = rows * this.cellHeight;
  }

  drawText(col: number, row: number, text: string, color?: string): void {
    this.drawTextCalls.push({ col, row, text, color });
  }

  drawRect(
    _x: number,
    _y: number,
    _w: number,
    _h: number,
    _color?: string,
  ): void {
    this.drawRectCalls += 1;
  }

  drawCircle(
    _x: number,
    _y: number,
    _radius: number,
    _color?: string,
    _fill?: boolean,
  ): void {}

  setPixel(_x: number, _y: number, _color?: string): void {}

  clearScreen(_color?: string): void {
    this.clearCount += 1;
  }
}
