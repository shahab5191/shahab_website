import type { Shell } from "./Shell";
import { getCommand, type CommandContext } from "./commands";
import type { Graphics, KeyEvent, Process, SystemArgs } from "./types";

/**
 * The OS Kernel: a small state machine that routes input to either the shell
 * or an active foreground process, and manages process lifecycle.
 *
 * It depends only on the `Graphics` interface (not the concrete
 * `TerminalGraphics`), keeping it trivially testable.
 */
export class Kernel {
  private graphics: Graphics;
  private shell: Shell;
  private process: Process | null = null;

  /** Hook invoked by the `ui` command; wired to the DOM overlay in bootstrap. */
  onUiRequest: (() => void) | null = null;

  constructor(graphics: Graphics, shell: Shell) {
    this.graphics = graphics;
    this.shell = shell;
    shell.onCommand = (line) => this.execute(line);
  }

  get activeProcess(): Process | null {
    return this.process;
  }

  /** Route a sanitized key event to the foreground process or the shell. */
  handleInput(event: KeyEvent): void {
    if (this.process) {
      this.process.handleInput(event);
    } else {
      this.shell.handleInput(event);
    }
  }

  /** Advance the active process by one frame (no-op when the shell is up). */
  update(deltaTime: number): void {
    this.process?.update(deltaTime);
  }

  /** Kill any running process and hand control to a new one. */
  spawn(process: Process): void {
    this.killActive();
    this.process = process;
    const args: SystemArgs = {
      cols: this.graphics.cols,
      rows: this.graphics.rows,
      exit: (code) => this.exitActive(code),
    };
    process.init(this.graphics, args);
  }

  requestUi(): void {
    this.onUiRequest?.();
  }

  private exitActive(_code?: number): void {
    this.killActive();
    this.shell.redraw();
  }

  private killActive(): void {
    if (this.process) {
      this.process.cleanup();
      this.process = null;
    }
  }

  private execute(line: string): void {
    this.shell.writeLine(`${this.shell.prompt}${line}`);
    const trimmed = line.trim();

    if (trimmed === "") {
      this.shell.redraw();
      return;
    }

    const [name, ...rest] = trimmed.split(/\s+/);
    const command = name !== undefined ? getCommand(name) : undefined;

    if (!command) {
      this.shell.writeLine(`command not found: ${name ?? ""}`);
      this.shell.redraw();
      return;
    }

    const ctx: CommandContext = {
      graphics: this.graphics,
      kernel: this,
      shell: this.shell,
      args: rest,
    };
    command(ctx);

    // Only redraw if the command did not spawn a foreground process.
    if (!this.process) {
      this.shell.redraw();
    }
  }
}
