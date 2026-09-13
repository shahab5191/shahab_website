import type { Graphics } from "./types";
import type { Kernel } from "./Kernel";
import type { Shell } from "./Shell";

/** Context handed to a command when it runs. */
export interface CommandContext {
  graphics: Graphics;
  kernel: Kernel;
  shell: Shell;
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
  ctx.shell.writeLine("available commands:");
  for (const name of commandNames()) {
    ctx.shell.writeLine(`  ${name}`);
  }
});

registerCommand("clear", (ctx) => {
  ctx.shell.clear();
});

registerCommand("echo", (ctx) => {
  ctx.shell.writeLine(ctx.args.join(" "));
});

registerCommand("about", (ctx) => {
  ctx.shell.writeLine("CRT terminal portfolio");
  ctx.shell.writeLine("a WebGL-powered virtual OS");
  ctx.shell.writeLine("");
  ctx.shell.writeLine("type `help` for commands, `demo` to run a process.");
});

registerCommand("ui", (ctx) => {
  ctx.shell.writeLine("transitioning to modern UI...");
  ctx.kernel.requestUi();
});
