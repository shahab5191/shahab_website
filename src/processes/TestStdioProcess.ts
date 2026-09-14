import type { Process, KeyEvent, Terminal, SystemArgs } from "../core/types";

/**
 * Pure line-oriented process: reads a name from stdin, writes a greeting to
 * stdout, then exits. Demonstrates the terminal (tty) contract — the process
 * handles no interface; `readLine`/`writeLine` do all rendering and editing.
 */
export class StdioProcess implements Process {
  private exit!: (code?: number) => void;
  private keys: KeyEvent[] = [];

  async run(terminal: Terminal, args: SystemArgs): Promise<void> {
    this.exit = args.exit;
    while (true) {
      let event: KeyEvent = await terminal.nextKey();
      if (event.key === "q" || event.key === "Escape") {
        this.exit();
        return;
      }
      this.keys.push(event);
      terminal.writeLine(event.key);
    }
  }
}
