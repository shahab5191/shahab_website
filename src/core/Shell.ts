import type { Process, SystemArgs, Terminal } from "./types";

/**
 * The base foreground process: a command-line shell.
 *
 * It has no screen or input state of its own; it loops on `terminal.readLine`
 * (which provides prompt, echo, cursor, and history via the line discipline)
 * and delegates each submitted line to `onCommand`, wired by the Kernel.
 */
export class Shell implements Process {
  readonly prompt = "> ";

  /** Set by the Kernel. Invoked with the raw input line on Enter. */
  onCommand: (line: string) => void = () => {};

  async run(terminal: Terminal, args: SystemArgs): Promise<void> {
    while (!args.signals.terminated) {
      const line = await terminal.readLine(this.prompt);
      this.onCommand(line);
    }
  }
}
