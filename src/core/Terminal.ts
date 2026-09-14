import type { Graphics, KeyEvent, Terminal } from "./types";
import { getTheme, resolveColor } from "./theme";
import { SignalError } from "./Signals";
import type { SignalControl } from "./Signals";

const MAX_SCROLLBACK = 500;
const BLINK_INTERVAL = 0.5;

// CP437 glyphs used for the scrollbar (U+2588/U+2592 map to these in the font).
const BLOCK = String.fromCharCode(0xdb);
const SHADE = String.fromCharCode(0xb1);

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

/** A colored run of text within a scrollback row. */
interface Segment {
  text: string;
  color: string;
}

/**
 * Parse inline color markup into segments. `{ColorName}` switches color,
 * `{/}` resets to the default. Unknown or malformed tags are emitted literally.
 */
function parseInline(text: string, defaultColor: string): Segment[] {
  const segments: Segment[] = [];
  let buf = "";
  let color = defaultColor;

  const flush = (): void => {
    if (buf.length > 0) {
      segments.push({ text: buf, color });
      buf = "";
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === "{") {
      const close = text.indexOf("}", i + 1);
      if (close !== -1) {
        const tag = text.slice(i + 1, close);
        if (tag === "/") {
          flush();
          color = defaultColor;
          i = close + 1;
          continue;
        }
        const resolved = resolveColor(tag);
        if (resolved) {
          flush();
          color = resolved;
          i = close + 1;
          continue;
        }
      }
    }
    buf += ch;
    i += 1;
  }
  flush();
  return segments;
}

/** Wrap colored segments into rows of `width` columns, preserving color runs. */
function wrapSegments(segments: Segment[], width: number): Segment[][] {
  const rows: Segment[][] = [];
  let row: Segment[] = [];
  let col = 0;

  for (const seg of segments) {
    let text = seg.text;
    while (text.length > 0) {
      if (col >= width) {
        rows.push(row);
        row = [];
        col = 0;
        continue;
      }
      const take = Math.min(text.length, width - col);
      row.push({ text: text.slice(0, take), color: seg.color });
      col += take;
      text = text.slice(take);
      if (col >= width) {
        rows.push(row);
        row = [];
        col = 0;
      }
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
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

  private lines: Segment[][] = [];
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

  private blinkElapsed = 0;
  private cursorVisible = true;
  private scrollOffset = 0;

  readonly marginVertical: number;
  readonly marginHorizontal: number;

  constructor(graphics: Graphics) {
    this.graphics = graphics;
    this.marginVertical = 1;
    this.marginHorizontal = 1;
  }

  /** Usable columns once the horizontal margins are reserved. */
  private get textCols(): number {
    return this.graphics.cols - 2 * this.marginHorizontal;
  }

  /** Usable rows once the vertical margins are reserved. */
  private get textRows(): number {
    return this.graphics.rows - 2 * this.marginVertical;
  }

  /** Output rows visible this frame (one fewer while the prompt is shown). */
  private get maxOutputRows(): number {
    return this.textRows - (this.readLineWaiter ? 1 : 0);
  }

  /** Copy of the scrollback rows (exposed for tests/tools). */
  get scrollback(): readonly string[] {
    return this.lines.map((row) => row.map((s) => s.text).join(""));
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
    this.scrollOffset = 0;
    this.pending += text;
    const idx = this.pending.lastIndexOf("\n");
    if (idx !== -1) {
      const complete = this.pending.slice(0, idx);
      this.pending = this.pending.slice(idx + 1);
      this.pushText(complete);
    }
    this.redraw();
  }

  writeLine(text = ""): void {
    this.write(text + "\n");
  }

  clear(): void {
    this.lines = [];
    this.pending = "";
    this.scrollOffset = 0;
    this.redraw();
  }

  refresh(): void {
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
      this.cursorVisible = true;
      this.blinkElapsed = 0;
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
      return;
    }
    if (!this.readLineWaiter) return;
    this.blinkElapsed += deltaTime;
    if (this.blinkElapsed >= BLINK_INTERVAL) {
      this.blinkElapsed %= BLINK_INTERVAL;
      this.cursorVisible = !this.cursorVisible;
      this.redraw();
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
    this.pushText(this.pending);
    this.pending = "";
  }

  /** Parse and wrap a block of output text (may contain `\n`) into rows. */
  private pushText(text: string): void {
    for (const raw of text.split("\n")) {
      if (raw === "") {
        this.pushRow([]);
        continue;
      }
      const segments = parseInline(raw, getTheme().foreground);
      for (const row of wrapSegments(segments, this.textCols)) {
        this.pushRow(row);
      }
    }
  }

  private pushRow(row: Segment[]): void {
    this.lines.push(row);
    if (this.lines.length > MAX_SCROLLBACK) {
      this.lines.splice(0, this.lines.length - MAX_SCROLLBACK);
    }
  }

  private redraw(): void {
    const g = this.graphics;
    const theme = getTheme();
    g.clearScreen(theme.background);

    const maxOutputRows = this.maxOutputRows;
    const total = this.lines.length;
    const maxScroll = Math.max(0, total - maxOutputRows);
    if (this.scrollOffset > maxScroll) this.scrollOffset = maxScroll;

    const viewEnd = total - this.scrollOffset;
    const start = Math.max(0, viewEnd - maxOutputRows);
    const end = Math.min(total, viewEnd);

    for (let i = start; i < end; i++) {
      const row = this.lines[i] ?? [];
      let col = this.marginHorizontal;
      for (const seg of row) {
        g.drawText(
          col,
          this.marginVertical + (i - start),
          seg.text,
          seg.color,
        );
        col += seg.text.length;
      }
    }

    this.drawScrollbar(start, maxOutputRows, total, maxScroll, theme);

    if (this.readLineWaiter) {
      const row = maxOutputRows;
      g.drawText(
        this.marginHorizontal,
        this.marginVertical + row,
        this.prompt,
        theme.accent,
      );
      g.drawText(
        this.marginHorizontal + this.prompt.length,
        this.marginVertical + row,
        this.buffer,
        theme.foreground,
      );

      if (this.cursorVisible) {
        const cursorCol = this.prompt.length + this.cursor;
        g.drawRect(
          (this.marginHorizontal + cursorCol) * g.cellWidth,
          (this.marginVertical + row) * g.cellHeight,
          g.cellWidth,
          g.cellHeight,
          theme.foreground,
        );
        const charUnder = this.buffer[this.cursor];
        if (charUnder) {
          g.drawText(
            this.marginHorizontal + cursorCol,
            this.marginVertical + row,
            charUnder,
            theme.background,
          );
        }
      }
    }
  }

  /** Render a one-column scrollbar in the right margin when content overflows. */
  private drawScrollbar(
    start: number,
    maxOutputRows: number,
    total: number,
    maxScroll: number,
    theme: ReturnType<typeof getTheme>,
  ): void {
    if (maxScroll <= 0) return;
    const g = this.graphics;
    const barCol = g.cols - 1;
    const thumbSize = Math.max(1, Math.floor((maxOutputRows * maxOutputRows) / total));
    const thumbTop = Math.floor((start * maxOutputRows) / total);

    for (let r = 0; r < maxOutputRows; r++) {
      const inThumb = r >= thumbTop && r < thumbTop + thumbSize;
      g.drawText(
        barCol,
        this.marginVertical + r,
        inThumb ? BLOCK : SHADE,
        inThumb ? theme.accent : theme.dim,
      );
    }
  }

  /** Submit the current line to the shell. */
  private submitLine(): void {
    const waiter = this.readLineWaiter;
    if (!waiter) return;
    const line = this.buffer;
    const segments: Segment[] = [
      { text: this.prompt, color: getTheme().accent },
      { text: line, color: getTheme().foreground },
    ];
    for (const row of wrapSegments(segments, this.textCols)) {
      this.pushRow(row);
    }
    this.scrollOffset = 0;
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
    this.cursorVisible = true;
    this.blinkElapsed = 0;
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
      case "PageUp":
        this.scrollByPage(1);
        break;
      case "PageDown":
        this.scrollByPage(-1);
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

  /** Scroll the view by `dir` pages: +1 up (older), -1 down (newer). */
  private scrollByPage(dir: number): void {
    const maxScroll = Math.max(0, this.lines.length - this.maxOutputRows);
    const page = Math.max(1, this.maxOutputRows - 1);
    this.scrollOffset = Math.min(
      maxScroll,
      Math.max(0, this.scrollOffset + dir * page),
    );
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
