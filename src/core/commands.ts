import type { Terminal } from "./types";
import type { Kernel } from "./Kernel";

/** Context handed to a command when it runs. */
export interface CommandContext {
  terminal: Terminal;
  kernel: Kernel;
  args: string[];
}

export type Command = (ctx: CommandContext) => void;

const registry = new Map<string, Command>();

export function registerCommand(name: string, fn: Command): void {
  registry.set(name, fn);
}

export function getCommand(name: string): Command | undefined {
  return registry.get(name);
}

export function commandNames(): string[] {
  return [...registry.keys()].sort();
}

// ---------------------------------------------------------------------------
// Built-in commands
// ---------------------------------------------------------------------------

registerCommand("help", (ctx) => {
  ctx.terminal.writeLine("available commands:");
  for (const name of commandNames()) {
    ctx.terminal.writeLine(`  ${name}`);
  }
});

registerCommand("clear", (ctx) => {
  ctx.terminal.clear();
});

registerCommand("echo", (ctx) => {
  ctx.terminal.writeLine(ctx.args.join(" "));
});

registerCommand("about", (ctx) => {
  ctx.terminal.writeLine("CRT terminal portfolio");
  ctx.terminal.writeLine("a WebGL-powered virtual OS");
  ctx.terminal.writeLine("");
  ctx.terminal.writeLine("type `help` for commands, `demo` to run a process.");
});

registerCommand("neofetch", (ctx) => {
  const { cols, rows } = ctx.terminal.graphics;
  ctx.terminal.writeLine("shahab@crt");
  ctx.terminal.writeLine("----------------");
  ctx.terminal.writeLine(`os      CRT terminal portfolio`);
  ctx.terminal.writeLine(`kernel  ${ctx.kernel.constructor.name}`);
  ctx.terminal.writeLine(`screen  ${cols}x${rows}`);
  ctx.terminal.writeLine(`shell   crt`);
});

registerCommand("ui", (ctx) => {
  ctx.terminal.writeLine("transitioning to modern UI...");
  ctx.kernel.requestUi();
});
