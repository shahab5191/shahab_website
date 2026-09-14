import type { Process, SystemArgs, Terminal } from "../core/types";

/**
 * Pure line-oriented process: reads a name from stdin, writes a greeting to
 * stdout, then exits. Demonstrates the terminal (tty) contract — the process
 * handles no interface; `readLine`/`writeLine` do all rendering and editing.
 */
export class GreetProcess implements Process {
  async run(terminal: Terminal, _args: SystemArgs): Promise<void> {
    const name = await terminal.readLine("What's your name? ");
    terminal.writeLine(`hello ${name.trim() || "stranger"}`);
  }
}
