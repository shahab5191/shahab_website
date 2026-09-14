import type { Terminal } from "./types";
import type { Kernel } from "./Kernel";
import { getTheme, setTheme, themeNames } from "./theme";
import { Renderer } from "./Renderer";

/** Context handed to a command when it runs. */
export interface CommandContext {
  terminal: Terminal;
  kernel: Kernel;
  args: string[];
  renderer: Renderer;
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

registerCommand("clear", (ctx) => {
  ctx.terminal.clear();
});

registerCommand("echo", (ctx) => {
  ctx.terminal.writeLine(ctx.args.join(" "));
});

registerCommand("neofetch", (ctx) => {
  const t = ctx.terminal;

  // CP437 full block (U+2588 maps to glyph 0xDB in the VGA 8x16 font).
  const BLOCK = String.fromCharCode(0xdb);

  const HEADER = "shahab@portfolio";
  const DIVIDER = "----------------";

  const LOGO = [
    "          @@@@@@@@ ",
    "      @@@@@@@@@@@@@@@@",
    "    @@@@            @@@@",
    "  @@@@    @@@@@@@@    @@@@",
    " @@@    @@@@@   @@@@    @@@",
    " @@   @@@@        @@@@   @@",
    "@@@   @@@           @@",
    "@@@@@@@@            @@@@@@@@",
    "      @@@           @@   @@@",
    " @@    @@@        @@@    @@@",
    " @@@    @@@@@  @@@@@    @@@",
    "  @@@@    @@@@@@@@    @@@@",
    "    @@@@            @@@@",
    "      @@@@@@@@@@@@@@@@",
    "          @@@@@@@@ ",
  ];

  const INFO: [string, string][] = [
    ["OS", "Web Terminal v1.0"],
    ["Name", "Shahab Oveysi"],
    ["Role", "Senior Software Eng & Tech Lead"],
    ["Exp", "10+ Years | Xeneta (Norway)"],
    ["Langs", "Python, TypeScript, Go, C/C++"],
    ["Cloud", "AWS, Docker, K8s, Terraform"],
    ["Backend", "FastAPI, Node.js, Microservices"],
    ["Data/AI", "AWS Bedrock, Snowflake, PG"],
    ["Contact", "oveysi.shahab@gmail.com"],
    ["LinkedIn", "/in/shahab-oveysi"],
  ];

  const PALETTE = [
    "Red",
    "Orange",
    "Yellow",
    "Green",
    "Cyan",
    "Blue",
    "Purple",
    "LightRed",
    "LightGreen",
    "LightBlue",
    "LightGrey",
    "MediumGrey",
    "Brown",
    "DarkGrey",
    "White",
    "Black",
  ];
  const blockRow = (colors: string[]): string =>
    colors.map((c) => `{${c}}${BLOCK}${BLOCK}${BLOCK}{/}`).join(" ");

  const logoWidth = Math.max(...LOGO.map((l) => l.length));
  const infoCol = logoWidth + 2;
  const pad = (left: string, right = ""): string =>
    `{accent}${left.padEnd(infoCol)}{/}${right}`;

  t.writeLine(`{accent}${HEADER}{/}`);
  t.writeLine(pad(LOGO[0] ?? "", DIVIDER));
  for (let i = 0; i < INFO.length; i++) {
    const [key, value] = INFO[i] ?? ["", ""];
    t.writeLine(pad(LOGO[i + 1] ?? "", `{accent}${key}{/}: ${value}`));
  }
  for (let i = INFO.length + 1; i < LOGO.length; i++) {
    t.writeLine(pad(LOGO[i] ?? ""));
  }
  t.writeLine(" ".repeat(infoCol) + blockRow(PALETTE.slice(0, 8)));
  t.writeLine(" ".repeat(infoCol) + blockRow(PALETTE.slice(8, 16)));
});

registerCommand("ui", (ctx) => {
  ctx.terminal.writeLine("transitioning to modern UI...");
  ctx.kernel.requestUi();
});

registerCommand("theme", (ctx) => {
  const name = ctx.args[0];
  if (!name) {
    ctx.terminal.writeLine(`current theme: ${getTheme().name}`);
    ctx.terminal.writeLine(`available themes: ${themeNames().join(", ")}`);
    return;
  }
  if (setTheme(name)) {
    ctx.terminal.writeLine(`theme set to ${getTheme().name}`);
    ctx.terminal.refresh();
    ctx.renderer.setBloomFactor(getTheme().bloomFactor);
  } else {
    ctx.terminal.writeLine(`unknown theme: ${name}`);
    ctx.terminal.writeLine(`available themes: ${themeNames().join(", ")}`);
  }
});
