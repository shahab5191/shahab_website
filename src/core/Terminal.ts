import type { Graphics, KeyEvent, Terminal } from "./types";
import { Palette } from "./types";
import { SignalError } from "./Signals";
import type { SignalControl } from "./Signals";

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

interface Waiter<T> {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

/**
 * The terminal (tty): owns the scrollback, the line discipline (echo, cursor,
 * history), and the async input plumbing that turns pushed key/frame events
 * into values awaited by processes.
 *
 * Modes are implicit in what a process awaits: `readLine` puts the terminal in
 * cooked mode (it renders scrollback + prompt); `nextFrame`/`nextKey`/`pollKeys`
 * put it in raw mode (the process owns the framebuffer).
 */
export class TerminalSession implements Terminal {
  readonly graphics: Graphics;

  private lines: string[] = [];
  private pending = "";
  private prompt = "> ";
  private buffer = "";
  private cursor = 0;
  private history: string[] = [];
  private historyIndex = -1;
  private draft = "";

  private readLineWaiter: Waiter<string> | null = null;
  private keyWaiter: Waiter<KeyEvent> | null = null;
  private frameWaiter: Waiter<number> | null = null;
  private keyQueue: KeyEvent[] = [];
  private controller: SignalControl | null = null;

  constructor(graphics: Graphics) {
    this.graphics = graphics;
  }

  /** Copy of the scrollback rows (exposed for tests/tools). */
  get scrollback(): readonly string[] {
    return [...this.lines];
  }

  /** Current input line (exposed for tests/tools). */
  get input(): string {
    return this.buffer;
  }

  /** Bind the current foreground process's signal controller. */
  attach(controller: SignalControl): void {
    this.controller = controller;
  }

  write(text: string): void {
    this.pending += text;
    const idx = this.pending.lastIndexOf("\n");
    if (idx !== -1) {
      const complete = this.pending.slice(0, idx);
      this.pending = this.pending.slice(idx + 1);
      for (const chunk of wrapText(complete, this.graphics.cols)) {
        this.pushLine(chunk);
      }
    }
    this.redraw();
  }

  writeLine(text = ""): void {
    this.write(text + "\n");
  }

  clear(): void {
    this.lines = [];
    this.pending = "";
    this.redraw();
  }

  readLine(prompt = "> "): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!this.beginAwait(reject)) return;
      this.flushPending();
      this.prompt = prompt;
      this.buffer = "";
      this.cursor = 0;
      this.historyIndex = -1;
      this.readLineWaiter = { resolve, reject };
      this.redraw();
    });
  }

  nextKey(): Promise<KeyEvent> {
    return new Promise<KeyEvent>((resolve, reject) => {
      if (!this.beginAwait(reject)) return;
      const queued = this.keyQueue.shift();
      if (queued) {
        resolve(queued);
        return;
      }
      this.keyWaiter = { resolve, reject };
    });
  }

  pollKeys(): KeyEvent[] {
    const keys = this.keyQueue;
    this.keyQueue = [];
    return keys;
  }

  nextFrame(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      if (!this.beginAwait(reject)) return;
      this.frameWaiter = { resolve, reject };
    });
  }

  /** Deliver a key event from the OS. */
  pushKey(event: KeyEvent): void {
    if (this.readLineWaiter) {
      this.handleEditorKey(event);
      return;
    }
    if (this.keyWaiter) {
      const waiter = this.keyWaiter;
      this.keyWaiter = null;
      waiter.resolve(event);
      return;
    }
    this.keyQueue.push(event);
  }

  /** Deliver a frame tick from the OS. */
  pushFrame(deltaTime: number): void {
    if (this.frameWaiter) {
      const waiter = this.frameWaiter;
      this.frameWaiter = null;
      waiter.resolve(deltaTime);
    }
  }

  private beginAwait(reject: (error: unknown) => void): boolean {
    if (this.controller?.terminated) {
      reject(new SignalError("SIGTERM"));
      return false;
    }
    this.controller?.bindInterrupt((error) => this.onSignalInterrupt(error));
    return true;
  }

  private onSignalInterrupt(error: unknown): void {
    if (this.readLineWaiter) {
      const waiter = this.readLineWaiter;
      this.readLineWaiter = null;
      this.buffer = "";
      this.cursor = 0;
      waiter.reject(error);
      return;
    }
    if (this.keyWaiter) {
      const waiter = this.keyWaiter;
      this.keyWaiter = null;
      waiter.reject(error);
      return;
    }
    if (this.frameWaiter) {
      const waiter = this.frameWaiter;
      this.frameWaiter = null;
      waiter.reject(error);
      return;
    }
    this.keyQueue = [];
  }

  private flushPending(): void {
    if (this.pending === "") return;
    for (const chunk of wrapText(this.pending, this.graphics.cols)) {
      this.pushLine(chunk);
    }
    this.pending = "";
  }

  private pushLine(chunk: string): void {
    this.lines.push(chunk);
    if (this.lines.length > MAX_SCROLLBACK) {
      this.lines.splice(0, this.lines.length - MAX_SCROLLBACK);
    }
  }

  private redraw(): void {
    const g = this.graphics;
    g.clearScreen(Palette.background);

    const reserve = this.readLineWaiter ? 1 : 0;
    const maxOutputRows = g.rows - reserve;
    const start = Math.max(0, this.lines.length - maxOutputRows);
    for (let i = start; i < this.lines.length; i++) {
      g.drawText(0, i - start, this.lines[i] ?? "", Palette.foreground);
    }

    if (this.readLineWaiter) {
      const row = g.rows - 1;
      g.drawText(0, row, this.prompt, Palette.accent);
      g.drawText(this.prompt.length, row, this.buffer, Palette.foreground);

      const cursorCol = this.prompt.length + this.cursor;
      g.drawRect(
        cursorCol * g.cellWidth,
        row * g.cellHeight,
        g.cellWidth,
        g.cellHeight,
        Palette.foreground,
      );
      const charUnder = this.buffer[this.cursor];
      if (charUnder) {
        g.drawText(cursorCol, row, charUnder, Palette.background);
      }
    }
  }

  private submitLine(): void {
    const waiter = this.readLineWaiter;
    if (!waiter) return;
    const line = this.buffer;
    const full = this.prompt + line;
    for (const chunk of wrapText(full, this.graphics.cols)) {
      this.pushLine(chunk);
    }
    if (line.trim() !== "" && this.history[this.history.length - 1] !== line) {
      this.history.push(line);
    }
    this.buffer = "";
    this.cursor = 0;
    this.historyIndex = -1;
    this.readLineWaiter = null;
    this.redraw();
    waiter.resolve(line);
  }

  private handleEditorKey(event: KeyEvent): void {
    const { key, modifiers } = event;
    if (modifiers.ctrl) {
      this.handleCtrlKey(key);
      return;
    }

    switch (key) {
      case "Enter":
        this.submitLine();
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
