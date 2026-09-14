import type { Process, SystemArgs, Terminal } from "../core/types";
import { getTheme, getColors, type ColorName } from "../core/theme";

type Coord = [number, number];

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

interface ActivePiece {
  type: PieceType;
  rot: number;
  col: number;
  row: number;
}

/** Square pixel tile; board is 10x20, the classic playfield. */
const TILE = 16;
const COLS = 10;
const ROWS = 20;
/** Text rows reserved at the top for the HUD. */
const HUD_ROWS = 2;
/** Border thickness around the play field, in tiles. */
const BORDER = 1;

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

const PIECE_COLORS: Record<PieceType, ColorName> = {
  I: "Cyan",
  O: "Yellow",
  T: "Purple",
  S: "Green",
  Z: "Red",
  J: "Blue",
  L: "Orange",
};

/** Base (rotation 0) cells, normalized to the top-left of their bounding box. */
const BASE_SHAPES: Record<PieceType, Coord[]> = {
  I: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  O: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  T: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
};

/** Rotate a shape 90° clockwise and normalize back to the top-left origin. */
function rotateCW(cells: Coord[]): Coord[] {
  const rotated = cells.map(([x, y]) => [-y, x] as Coord);
  const minX = Math.min(...rotated.map(([x]) => x));
  const minY = Math.min(...rotated.map(([, y]) => y));
  return rotated.map(([x, y]) => [x - minX, y - minY]);
}

function buildRotations(base: Coord[]): Coord[][] {
  const rotations: Coord[][] = [base];
  let current = base;
  for (let i = 1; i < 4; i++) {
    current = rotateCW(current);
    rotations.push(current);
  }
  return rotations;
}

const ROTATIONS: Record<PieceType, Coord[][]> = Object.fromEntries(
  PIECE_TYPES.map((t) => [t, buildRotations(BASE_SHAPES[t])]),
) as Record<PieceType, Coord[][]>;

/** Width of a piece's bounding box in its base rotation (for spawn centering). */
function pieceWidth(type: PieceType): number {
  const cells = ROTATIONS[type][0]!;
  const xs = cells.map(([x]) => x);
  return Math.max(...xs) - Math.min(...xs) + 1;
}

/** 7-bag randomizer so every piece type appears before any repeats. */
class Bag {
  private bag: PieceType[] = [];

  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j]!, this.bag[i]!];
      }
    }
    return this.bag.pop()!;
  }
}

const LINE_SCORES = [0, 100, 300, 500, 800];

/** Full-screen Tetris rendered on the terminal framebuffer. */
export class TetrisGame implements Process {
  private readonly bag = new Bag();

  private board: (PieceType | null)[][] = [];
  private current: ActivePiece | null = null;
  private next: PieceType = "I";
  private score = 0;
  private lines = 0;
  private level = 1;
  private elapsed = 0;
  private paused = false;
  private over = false;

  private originX = 0;
  private originY = 0;
  private previewX = 0;

  async run(terminal: Terminal, args: SystemArgs): Promise<void> {
    const g = terminal.graphics;
    const boardW = COLS * TILE;
    const boardH = ROWS * TILE;

    this.originX = Math.floor((g.width - boardW) / 2);
    this.originY = HUD_ROWS * g.cellHeight + Math.floor((g.height - HUD_ROWS * g.cellHeight - boardH) / 2);
    this.previewX = this.originX + boardW + 2 * TILE;

    this.reset();
    this.draw(terminal);

    while (true) {
      const dt = await terminal.nextFrame();

      for (const event of terminal.pollKeys()) {
        this.handleKey(event.key, args);
      }

      if (!this.over && !this.paused) {
        this.elapsed += dt;
        const tick = this.fallInterval();
        while (this.elapsed >= tick) {
          this.elapsed -= tick;
          if (!this.tryMove(0, 1)) this.lockPiece();
        }
      }

      this.draw(terminal);
    }
  }

  private reset(): void {
    this.board = Array.from({ length: ROWS }, () =>
      new Array<PieceType | null>(COLS).fill(null),
    );
    this.current = null;
    this.next = this.bag.next();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.elapsed = 0;
    this.paused = false;
    this.over = false;
    this.spawn();
  }

  private fallInterval(): number {
    return Math.max(0.05, 0.6 - (this.level - 1) * 0.05);
  }

  private rotations(type: PieceType, rot: number): Coord[] {
    return ROTATIONS[type][rot]!;
  }

  private isEmpty(col: number, row: number): boolean {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    return this.board[row]![col] === null;
  }

  private collides(cells: Coord[], col: number, row: number): boolean {
    return cells.some(([cx, cy]) => !this.isEmpty(col + cx, row + cy));
  }

  private spawn(): boolean {
    const type = this.next;
    this.current = {
      type,
      rot: 0,
      col: Math.floor((COLS - pieceWidth(type)) / 2),
      row: 0,
    };
    this.next = this.bag.next();
    const cells = this.rotations(type, 0);
    if (this.collides(cells, this.current.col, this.current.row)) {
      this.over = true;
      this.current = null;
      return false;
    }
    return true;
  }

  private tryMove(dc: number, dr: number): boolean {
    if (!this.current) return false;
    const cells = this.rotations(this.current.type, this.current.rot);
    const nc = this.current.col + dc;
    const nr = this.current.row + dr;
    if (this.collides(cells, nc, nr)) return false;
    this.current.col = nc;
    this.current.row = nr;
    return true;
  }

  private rotatePiece(dir: 1 | -1): void {
    if (!this.current) return;
    const rot = (this.current.rot + dir + 4) % 4;
    const cells = this.rotations(this.current.type, rot);
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!this.collides(cells, this.current.col + dx, this.current.row)) {
        this.current.rot = rot;
        this.current.col += dx;
        return;
      }
    }
  }

  private ghostRow(): number {
    if (!this.current) return 0;
    const cells = this.rotations(this.current.type, this.current.rot);
    let row = this.current.row;
    while (!this.collides(cells, this.current.col, row + 1)) row++;
    return row;
  }

  private hardDrop(): void {
    if (!this.current) return;
    let dist = 0;
    while (this.tryMove(0, 1)) dist++;
    this.score += dist * 2;
    this.lockPiece();
  }

  private lockPiece(): void {
    if (!this.current) return;
    const cells = this.rotations(this.current.type, this.current.rot);
    for (const [cx, cy] of cells) {
      const col = this.current.col + cx;
      const row = this.current.row + cy;
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        this.board[row]![col] = this.current.type;
      }
    }

    const cleared = this.clearLines();
    if (cleared > 0) {
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.score += LINE_SCORES[cleared]! * this.level;
    }

    this.current = null;
    this.spawn();
  }

  private clearLines(): number {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r]!.every((c) => c !== null)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array<PieceType | null>(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    return cleared;
  }

  private handleKey(key: string, args: SystemArgs): void {
    if (key === "q" || key === "Escape") {
      args.exit();
      return;
    }
    if (key === "r") {
      this.reset();
      return;
    }
    if (key === "p") {
      this.paused = !this.paused;
      return;
    }
    if (this.over || this.paused) return;

    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.tryMove(-1, 0);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.tryMove(1, 0);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        if (this.tryMove(0, 1)) this.score += 1;
        else this.lockPiece();
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case "x":
      case "X":
        this.rotatePiece(1);
        break;
      case "z":
      case "Z":
        this.rotatePiece(-1);
        break;
      case " ":
        this.hardDrop();
        break;
    }
  }

  private draw(terminal: Terminal): void {
    const g = terminal.graphics;
    const theme = getTheme();
    const colors = getColors();

    g.clearScreen(theme.background);

    g.drawText(1, 0, "TETRIS", theme.accent);
    g.drawText(
      1,
      1,
      `score ${this.score}   level ${this.level}   lines ${this.lines}`,
      theme.dim,
    );
    const hint = "arrows/WASD move   up/x rotate   space drop   p pause   q quit";
    g.drawText(Math.max(1, Math.floor((g.cols - hint.length) / 2)), g.rows - 1, hint, theme.dim);

    const boardX = this.originX - BORDER * TILE;
    const boardY = this.originY - BORDER * TILE;
    const boardW = COLS * TILE + 2 * BORDER * TILE;
    const boardH = ROWS * TILE + 2 * BORDER * TILE;
    g.drawRect(boardX, boardY, boardW, 1, colors.DarkGrey);
    g.drawRect(boardX, boardY + boardH - 1, boardW, 1, colors.DarkGrey);
    g.drawRect(boardX, boardY, 1, boardH, colors.DarkGrey);
    g.drawRect(boardX + boardW - 1, boardY, 1, boardH, colors.DarkGrey);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = this.board[r]![c];
        if (type) {
          this.drawCell(g, this.cellX(c), this.cellY(r), colors[PIECE_COLORS[type]]);
        }
      }
    }

    if (this.current) {
      const type = this.current.type;
      const ghostRow = this.ghostRow();
      if (ghostRow > this.current.row) {
        for (const [cx, cy] of this.rotations(type, this.current.rot)) {
          this.drawCell(g, this.cellX(this.current.col + cx), this.cellY(ghostRow + cy), colors.DarkGrey);
        }
      }
      for (const [cx, cy] of this.rotations(type, this.current.rot)) {
        this.drawCell(g, this.cellX(this.current.col + cx), this.cellY(this.current.row + cy), colors[PIECE_COLORS[type]]);
      }
    }

    this.drawPreview(g, colors);

    if (this.over) {
      const msg = "GAME OVER";
      const sub = "press r to restart, q to quit";
      g.drawText(center(g.cols, msg.length), Math.floor(g.rows / 2), msg, theme.accent);
      g.drawText(
        center(g.cols, sub.length),
        Math.floor(g.rows / 2) + 1,
        sub,
        theme.foreground,
      );
    }
  }

  private drawPreview(g: Terminal["graphics"], colors: ReturnType<typeof getColors>): void {
    const labelRow = Math.floor((this.originY - g.cellHeight) / g.cellHeight);
    g.drawText(Math.floor(this.previewX / g.cellWidth), labelRow, "next", getTheme().dim);

    const cells = ROTATIONS[this.next][0]!;
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const w = Math.max(...xs) - Math.min(...xs) + 1;
    const h = Math.max(...ys) - Math.min(...ys) + 1;
    const ox = this.previewX + Math.floor((4 * TILE - w * TILE) / 2);
    const oy = this.originY + Math.floor((2 * TILE - h * TILE) / 2);
    for (const [cx, cy] of cells) {
      this.drawCell(g, ox + cx * TILE, oy + cy * TILE, colors[PIECE_COLORS[this.next]]);
    }
  }

  private cellX(col: number): number {
    return this.originX + col * TILE;
  }

  private cellY(row: number): number {
    return this.originY + row * TILE;
  }

  private drawCell(g: Terminal["graphics"], x: number, y: number, color: string): void {
    g.drawRect(x + 1, y + 1, TILE - 2, TILE - 2, color);
  }
}

function center(total: number, length: number): number {
  return Math.max(0, Math.floor((total - length) / 2));
}
