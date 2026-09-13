/**
 * Shared contracts for the OS Kernel, processes, and graphics layer.
 *
 * Everything in this file is a plain interface so processes and commands can be
 * written against the contract without depending on concrete implementations.
 */

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

  drawText(col: number, row: number, text: string, color?: string): void;
  drawRect(x: number, y: number, w: number, h: number, color?: string): void;
  drawCircle(x: number, y: number, radius: number, color?: string): void;
  setPixel(x: number, y: number, color?: string): void;
  clearScreen(color?: string): void;
}

/** Arguments the OS passes to a process on spawn. */
export interface SystemArgs {
  cols: number;
  rows: number;
  /** Call this to terminate the process and return control to the shell. */
  exit: (code?: number) => void;
}

/**
 * The Process interface. Every interactive application (games, chat clients,
 * pagers) implements this so the OS can blindly route input and lifecycle
 * events to it.
 */
export interface Process {
  /** Called when the process is spawned by the shell. */
  init(graphics: Graphics, systemArgs: SystemArgs): void;
  /** Receives raw keystrokes from the OS. */
  handleInput(event: KeyEvent): void;
  /** Optional: called per frame for physics/animations in games. */
  update(deltaTime: number): void;
  /** Called when the process exits or is killed by the OS. */
  cleanup(): void;
}

/** Named colors shared across the terminal. */
export const Colors = {
  Black: "#000000",
  White: "#FFFFFF",
  Red: "#68372B",
  Cyan: "#70A4B2",
  Purple: "#6F3D86",
  Green: "#588D43",
  Blue: "#352879",
  Yellow: "#B8C76F",
  Orange: "#813300",
  Brown: "#432D00",
  LightRed: "#9A6759",
  DarkGrey: "#444444",
  MediumGrey: "#6C6C6C",
  LightGreen: "#9AD284",
  LightBlue: "#6C5EB5",
  LightGrey: "#959595"
}

/** Named color palette shared across the terminal. */
export const Palette = {
  background: Colors.Black,
  foreground: Colors.LightGreen,
  accent: Colors.Cyan,
  dim: Colors.DarkGrey,
} as const;


