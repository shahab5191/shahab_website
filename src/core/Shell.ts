import type { Graphics, KeyEvent } from "./types";
import { Palette } from "./types";

const MAX_SCROLLBACK = 500;

/** Split text into display rows, hard-wrapping at `width` columns. */
export function wrapText(text: string, width: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    if (raw.length === 0) {
      out.push("");
      continue;
    }
    for (let i = 0; i < raw.length; i += width) {
      out.push(raw.slice(i, i + width));
    }
  }
  return out;
}

/**
 * The default foreground process: a command-line shell with scrollback,
 * command history, and Vim/Emacs-style line editing.
 *
 * It renders into the provided `Graphics` (VRAM) and delegates command
 * execution via the `onCommand` callback (wired by the Kernel).
 */
export class Shell {
  readonly prompt = "> ";

  private graphics: Graphics;
  private lines: string[] = [];
  private buffer = "";
  private cursor = 0;
  private history: string[] = [];
  private historyIndex = -1;
  private draft = "";

  /** Set by the Kernel. Invoked with the raw input line on Enter. */
  onCommand: (line: string) => void = () => {};

  constructor(graphics: Graphics) {
    this.graphics = graphics;
  }

  /** Current input line (exposed for tests/tools). */
  get input(): string {
    return this.buffer;
  }

  /** Number of scrollback rows (exposed for tests/tools). */
  get scrollbackLength(): number {
    return this.lines.length;
  }

  /** Copy of the scrollback rows (exposed for tests/tools). */
  get scrollback(): readonly string[] {
    return [...this.lines];
  }

  clear(): void {
    this.lines = [];
    this.buffer = "";
    this.cursor = 0;
    this.redraw();
  }

  /** Append a line (wrapped) to the scrollback. */
  writeLine(text = ""): void {
    for (const chunk of wrapText(text, this.graphics.cols)) {
      this.lines.push(chunk);
    }
    if (this.lines.length > MAX_SCROLLBACK) {
      this.lines.splice(0, this.lines.length - MAX_SCROLLBACK);
    }
  }

  handleInput(event: KeyEvent): void {
    const { key, modifiers } = event;
    if (modifiers.ctrl) {
      this.handleCtrlKey(key);
      return;
    }

    switch (key) {
      case "Enter":
        this.submit();
        return;
      case "Backspace":
        if (this.cursor > 0) {
          this.buffer =
            this.buffer.slice(0, this.cursor - 1) +
            this.buffer.slice(this.cursor);
          this.cursor -= 1;
        }
        break;
      case "ArrowLeft":
        this.cursor = Math.max(0, this.cursor - 1);
        break;
      case "ArrowRight":
        this.cursor = Math.min(this.buffer.length, this.cursor + 1);
        break;
      case "ArrowUp":
        this.historyBack();
        break;
      case "ArrowDown":
        this.historyForward();
        break;
      case "Home":
        this.cursor = 0;
        break;
      case "End":
        this.cursor = this.buffer.length;
        break;
      case "Delete":
        this.buffer =
          this.buffer.slice(0, this.cursor) +
          this.buffer.slice(this.cursor + 1);
        break;
      default:
        if (key.length === 1) {
          this.buffer =
            this.buffer.slice(0, this.cursor) +
            key +
            this.buffer.slice(this.cursor);
          this.cursor += 1;
        }
        break;
    }

    this.redraw();
  }

  redraw(): void {
    const g = this.graphics;
    g.clearScreen(Palette.background);

    const maxOutputRows = g.rows - 1;
    const start = Math.max(0, this.lines.length - maxOutputRows);
    for (let i = start; i < this.lines.length; i++) {
      g.drawText(0, i - start, this.lines[i] ?? "", Palette.foreground);
    }

    const promptRow = g.rows - 1;
    g.drawText(0, promptRow, this.prompt, Palette.accent);
    g.drawText(this.prompt.length, promptRow, this.buffer, Palette.foreground);

    const cursorCol = this.prompt.length + this.cursor;
    g.drawRect(
      cursorCol * g.cellWidth,
      promptRow * g.cellHeight,
      g.cellWidth,
      g.cellHeight,
      Palette.foreground,
    );
    const charUnder = this.buffer[this.cursor];
    if (charUnder) {
      g.drawText(cursorCol, promptRow, charUnder, Palette.background);
    }
  }

  private submit(): void {
    const line = this.buffer;
    this.buffer = "";
    this.cursor = 0;
    this.historyIndex = -1;
    if (line.trim() !== "" && this.history[this.history.length - 1] !== line) {
      this.history.push(line);
    }
    this.onCommand(line);
  }

  private handleCtrlKey(key: string): void {
    switch (key) {
      case "w":
        this.deleteWordBeforeCursor();
        break;
      case "u":
        this.buffer = this.buffer.slice(this.cursor);
        this.cursor = 0;
        break;
      case "a":
        this.cursor = 0;
        break;
      case "e":
        this.cursor = this.buffer.length;
        break;
      default:
        break;
    }
    this.redraw();
  }

  private deleteWordBeforeCursor(): void {
    const before = this.buffer.slice(0, this.cursor);
    const match = before.match(/(\S+)$/);
    if (match) {
      this.buffer =
        before.slice(0, before.length - match[0].length) +
        this.buffer.slice(this.cursor);
      this.cursor -= match[0].length;
    }
  }

  private historyBack(): void {
    if (this.history.length === 0) return;
    if (this.historyIndex === -1) {
      this.draft = this.buffer;
      this.historyIndex = this.history.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex -= 1;
    }
    this.buffer = this.history[this.historyIndex] ?? "";
    this.cursor = this.buffer.length;
  }

  private historyForward(): void {
    if (this.historyIndex === -1) return;
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex += 1;
      this.buffer = this.history[this.historyIndex] ?? "";
    } else {
      this.historyIndex = -1;
      this.buffer = this.draft;
    }
    this.cursor = this.buffer.length;
  }
}
