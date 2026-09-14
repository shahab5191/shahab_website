import type { Shell } from "./Shell";
import { getCommand, type CommandContext } from "./commands";
import { SignalController, SignalError } from "./Signals";
import type {
  Graphics,
  KeyEvent,
  Process,
  SystemArgs,
  TerminalControl,
} from "./types";

/**
 * The OS Kernel: drives a single shared `Terminal` (tty), manages the base
 * shell and any foreground process, and routes input/frames to whoever is
 * awaiting them.
 *
 * A process is a coroutine (`run`); it suspends on `terminal` input and resumes
 * when the kernel delivers keys/frames. Each process owns a `SignalController`;
 * Ctrl+C raises SIGINT, replacing a process raises SIGTERM, and a process may
 * install handlers to override the default terminate action.
 */
export class Kernel {
  private graphics: Graphics;
  private terminal: TerminalControl;
  private shell: Shell;
  private process: Process | null = null;
  private controller: SignalController | null = null;

  /** Hook invoked by the `ui` command; wired to the DOM overlay in bootstrap. */
  onUiRequest: (() => void) | null = null;

  constructor(graphics: Graphics, terminal: TerminalControl, shell: Shell) {
    this.graphics = graphics;
    this.terminal = terminal;
    this.shell = shell;
    shell.onCommand = (line) => this.execute(line);
  }

  get activeProcess(): Process | null {
    return this.process;
  }

  /** Start the base shell as the initial foreground process. */
  boot(): void {
    this.spawn(this.shell);
  }

  /** Route a sanitized key event into the terminal (tty). */
  handleInput(event: KeyEvent): void {
    if (event.modifiers.ctrl && event.key === "c") {
      this.raise("SIGINT");
      return;
    }
    this.terminal.pushKey(event);
  }

  /** Advance the frame clock; resolves any awaited `nextFrame`. */
  update(deltaTime: number): void {
    this.terminal.pushFrame(deltaTime);
  }

  /** Deliver a signal to the foreground process. */
  raise(signal: "SIGINT" | "SIGTERM"): void {
    this.controller?.raise(signal);
  }

  /** Kill any running process and hand control to a new one. */
  spawn(process: Process): void {
    this.controller?.terminate("SIGTERM");
    this.process = process;
    this.controller = new SignalController();
    this.terminal.attach(this.controller);

    const args: SystemArgs = {
      cols: this.graphics.cols,
      rows: this.graphics.rows,
      exit: (code) => this.exitActive(code),
      signals: this.controller,
    };

    let result: Promise<void> | void;
    try {
      result = process.run(this.terminal, args);
    } catch (error) {
      result = Promise.reject(error);
    }

    const settle = (error?: unknown): void => {
      if (error && !(error instanceof SignalError)) {
        console.error(error);
      }
      if (this.process === process) {
        this.process = null;
        this.controller = null;
        this.restoreShell();
      }
    };
    Promise.resolve(result).then(
      () => settle(),
      (error: unknown) => settle(error),
    );
  }

  requestUi(): void {
    this.onUiRequest?.();
  }

  private exitActive(_code?: number): void {
    this.controller?.terminate("SIGTERM");
  }

  private restoreShell(): void {
    this.spawn(this.shell);
  }

  private execute(line: string): void {
    const trimmed = line.trim();
    if (trimmed === "") return;

    const [name, ...rest] = trimmed.split(/\s+/);
    const command = name !== undefined ? getCommand(name) : undefined;

    if (!command) {
      this.terminal.writeLine(`command not found: ${name ?? ""}`);
      return;
    }

    const ctx: CommandContext = {
      terminal: this.terminal,
      kernel: this,
      args: rest,
    };
    command(ctx);
  }
}
