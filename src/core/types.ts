/**
 * Shared contracts for the OS Kernel, processes, and graphics layer.
 *
 * Everything in this file is a plain interface so processes and commands can be
 * written against the contract without depending on concrete implementations.
 */

import type { SignalControl, Signals } from "./Signals";

/** Modifier keys held during a key event. */
export interface Modifiers {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/** A sanitized key event routed by the Kernel. */
export interface KeyEvent {
  /** `"a"`, `"Enter"`, `"Backspace"`, `"ArrowUp"`, etc. */
  key: string;
  modifiers: Modifiers;
}

/**
 * The graphics handle handed to a running process. It is the VRAM drawing
 * surface (an off-screen canvas). Implemented by `TerminalGraphics`.
 *
 * All coordinates for text are grid-based (`col`, `row`); shapes and pixels use
 * raw canvas pixel coordinates.
 */
export interface Graphics {
  readonly cols: number;
  readonly rows: number;
  /** Raw canvas width in pixels. */
  readonly width: number;
  /** Raw canvas height in pixels. */
  readonly height: number;
  /** Width of a single character cell in pixels. */
  readonly cellWidth: number;
  /** Height of a single character cell in pixels. */
  readonly cellHeight: number;

  drawText(col: number, row: number, text: string, color?: RetroColor): void;
  drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color?: RetroColor,
  ): void;
  drawCircle(
    x: number,
    y: number,
    radius: number,
    color?: RetroColor,
    fill?: boolean,
  ): void;
  setPixel(x: number, y: number, color?: RetroColor): void;
  clearScreen(color?: RetroColor): void;
}

/**
 * The terminal (tty) handle handed to a running process. It is the stdio
 * seam shared by the kernel, the shell, and every child process.
 *
 * Line-oriented programs use `readLine`/`writeLine`; full-screen programs use
 * `nextKey`/`nextFrame`/`pollKeys` plus the `graphics` framebuffer. Line
 * editing (echo, cursor, history, Ctrl+W) is provided here so any process
 * awaiting `readLine` gets it for free, like a kernel line discipline.
 */
export interface Terminal {
  /** Append text to stdout (scrollback). Embedded `\n` flushes full lines. */
  write(text: string): void;
  /** Append a line of text to stdout (scrollback). */
  writeLine(text?: string): void;
  /** Clear the scrollback and redraw. */
  clear(): void;
  /** Re-render the current screen state (e.g. after a theme change). */
  refresh(): void;
  /**
   * Read a line of input (cooked mode). Renders `prompt` plus an editable
   * buffer with echo, cursor movement, and history. Resolves on Enter.
   */
  readLine(prompt?: string): Promise<string>;
  /** Read the next raw key (no echo), for full-screen programs. */
  nextKey(): Promise<KeyEvent>;
  /** Drain and return any buffered raw keys (non-blocking). */
  pollKeys(): KeyEvent[];
  /** Resolve with the elapsed seconds since the previous frame. */
  nextFrame(): Promise<number>;
  /** The framebuffer, for full-screen drawing. */
  readonly graphics: Graphics;
}

/**
 * The kernel-facing side of the tty: the methods the OS uses to deliver
 * events to whatever is awaiting them. Held only by the `Kernel`; processes
 * see the narrower `Terminal` handle.
 */
export interface TerminalControl extends Terminal {
  /** Deliver a key event from the OS. */
  pushKey(event: KeyEvent): void;
  /** Deliver a frame tick (elapsed seconds) from the OS. */
  pushFrame(deltaTime: number): void;
  /** Bind the current foreground process's signal controller. */
  attach(controller: SignalControl): void;
}

/** Arguments the OS passes to a process on spawn. */
export interface SystemArgs {
  cols: number;
  rows: number;
  /** Call this to terminate the process and return control to the shell. */
  exit: (code?: number) => void;
  /** The process's own signal handle (check `terminated`, install handlers). */
  signals: Signals;
}

/**
 * The Process interface. Every program (shell, games, CLI tools) implements it
 * as an async coroutine: it suspends by awaiting `terminal` input or frames
 * and resumes when the OS delivers them.
 */
export interface Process {
  run(terminal: Terminal, args: SystemArgs): Promise<void> | void;
}

/**
 * A color accepted by the graphics layer. Historically a union of the named
 * palette literals; themes are now dynamic, so any CSS color string is valid.
 */
export type RetroColor = string;
