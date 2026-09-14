import type { Process, SystemArgs, Terminal } from "../core/types";
import { getTheme, getColors } from "../core/theme";

interface Cell {
  col: number;
  row: number;
}

interface Dir {
  dc: number;
  dr: number;
}

const UP: Dir = { dc: 0, dr: -1 };
const DOWN: Dir = { dc: 0, dr: 1 };
const LEFT: Dir = { dc: -1, dr: 0 };
const RIGHT: Dir = { dc: 1, dr: 0 };

/** Square pixel tile so horizontal and vertical movement feel identical. */
const TILE = 8;
/** Text rows reserved at the top for the score/hint HUD. */
const HUD_ROWS = 2;
/** Border thickness around the play field, in tiles. */
const BORDER = 1;

/** Full-screen snake game rendered on the terminal framebuffer. */
export class SnakeGame implements Process {
  private readonly startLength = 4;
  private readonly baseTick = 0.12;

  private snake: Cell[] = [];
  private food: Cell = { col: 0, row: 0 };
  private dir: Dir = RIGHT;
  private pending: Dir = RIGHT;
  private score = 0;
  private elapsed = 0;
  private paused = false;
  private over = false;
  private won = false;

  private originX = 0;
  private originY = 0;
  private gridCols = 0;
  private gridRows = 0;

  async run(terminal: Terminal, args: SystemArgs): Promise<void> {
    const g = terminal.graphics;
    const hudHeight = HUD_ROWS * g.cellHeight;
    const availW = g.width - 2 * BORDER * TILE;
    const availH = g.height - hudHeight - 2 * BORDER * TILE;

    this.gridCols = Math.floor(availW / TILE);
    this.gridRows = Math.floor(availH / TILE);
    this.originX = BORDER * TILE + Math.floor((availW - this.gridCols * TILE) / 2);
    this.originY =
      hudHeight + BORDER * TILE + Math.floor((availH - this.gridRows * TILE) / 2);

    this.reset();
    this.draw(terminal);

    while (true) {
      const dt = await terminal.nextFrame();

      for (const event of terminal.pollKeys()) {
        this.handleKey(event.key, args);
      }

      if (!this.over && !this.paused) {
        this.elapsed += dt;
        const tick = Math.max(0.04, this.baseTick - this.score * 0.002);
        while (this.elapsed >= tick) {
          this.elapsed -= tick;
          this.step();
        }
      }

      this.draw(terminal);
    }
  }

  private reset(): void {
    const c = Math.floor(this.gridCols / 2);
    const r = Math.floor(this.gridRows / 2);
    this.snake = [];
    for (let i = 0; i < this.startLength; i++) {
      this.snake.push({ col: c - i, row: r });
    }
    this.dir = RIGHT;
    this.pending = RIGHT;
    this.score = 0;
    this.elapsed = 0;
    this.paused = false;
    this.over = false;
    this.won = false;
    this.spawnFood();
  }

  private spawnFood(): void {
    const occupied = new Set(this.snake.map((s) => `${s.col},${s.row}`));
    const free: Cell[] = [];
    for (let col = 0; col < this.gridCols; col++) {
      for (let row = 0; row < this.gridRows; row++) {
        if (!occupied.has(`${col},${row}`)) free.push({ col, row });
      }
    }
    if (free.length === 0) {
      this.won = true;
      this.over = true;
      return;
    }
    this.food = free[Math.floor(Math.random() * free.length)]!;
  }

  private step(): void {
    if (this.over) return;

    if (this.pending.dc !== -this.dir.dc || this.pending.dr !== -this.dir.dr) {
      this.dir = this.pending;
    }

    const head = this.snake[0]!;
    const newHead = { col: head.col + this.dir.dc, row: head.row + this.dir.dr };

    if (
      newHead.col < 0 ||
      newHead.col >= this.gridCols ||
      newHead.row < 0 ||
      newHead.row >= this.gridRows
    ) {
      this.over = true;
      return;
    }

    if (
      this.snake.some((s) => s.col === newHead.col && s.row === newHead.row)
    ) {
      this.over = true;
      return;
    }

    this.snake.unshift(newHead);

    if (newHead.col === this.food.col && newHead.row === this.food.row) {
      this.score += 1;
      this.spawnFood();
    } else {
      this.snake.pop();
    }
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
    if (key === "p" || key === " ") {
      this.paused = !this.paused;
      return;
    }

    const dir = dirForKey(key);
    if (dir) {
      this.pending = dir;
    }
  }

  private draw(terminal: Terminal): void {
    const g = terminal.graphics;
    const theme = getTheme();
    const colors = getColors();

    g.clearScreen(theme.background);

    g.drawText(1, 0, "SNAKE", theme.accent);
    g.drawText(
      1,
      1,
      `score ${this.score}   arrows/WASD move   p pause   q quit`,
      theme.dim,
    );

    const boardX = this.originX - BORDER * TILE;
    const boardY = this.originY - BORDER * TILE;
    const boardW = this.gridCols * TILE + 2 * BORDER * TILE;
    const boardH = this.gridRows * TILE + 2 * BORDER * TILE;
    g.drawRect(boardX, boardY, boardW, 1, colors.DarkGrey);
    g.drawRect(boardX, boardY + boardH - 1, boardW, 1, colors.DarkGrey);
    g.drawRect(boardX, boardY, 1, boardH, colors.DarkGrey);
    g.drawRect(boardX + boardW - 1, boardY, 1, boardH, colors.DarkGrey);

    this.snake.forEach((cell, i) => {
      const color = i === 0 ? colors.LightGreen : colors.Green;
      this.drawCell(g, cell.col, cell.row, color);
    });

    this.drawCell(g, this.food.col, this.food.row, colors.Red);

    if (this.over) {
      const msg = this.won ? "YOU WIN!" : "GAME OVER";
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

  private drawCell(g: Terminal["graphics"], col: number, row: number, color: string): void {
    const x = this.originX + col * TILE;
    const y = this.originY + row * TILE;
    g.drawRect(x + 1, y + 1, TILE - 2, TILE - 2, color);
  }
}

function dirForKey(key: string): Dir | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return UP;
    case "ArrowDown":
    case "s":
    case "S":
      return DOWN;
    case "ArrowLeft":
    case "a":
    case "A":
      return LEFT;
    case "ArrowRight":
    case "d":
    case "D":
      return RIGHT;
    default:
      return null;
  }
}

function center(total: number, length: number): number {
  return Math.max(0, Math.floor((total - length) / 2));
}
