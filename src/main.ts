import { TerminalGraphics } from "./core/TerminalGraphics";
import { TerminalSession } from "./core/Terminal";
import { Shell } from "./core/Shell";
import { Kernel } from "./core/Kernel";
import { registerCommand } from "./core/commands";
import "./core/portfolio";
import type { Renderer } from "./core/Renderer";
import { ThreeRenderer } from "./core/ThreeRenderer";
import { BounceDemo } from "./processes/BounceDemo";
import { SnakeGame } from "./processes/Snake";
import { BlocksGame } from "./processes/Blocks";
import type { KeyEvent } from "./core/types";

const iframe = document.getElementById("ui") as HTMLIFrameElement;

let uiVisible = false;

window.addEventListener("message", (e) => {
  if (e.data === "hide-ui") {
    const canvas = document.getElementById("screen") as HTMLCanvasElement;
    uiVisible = false;
    iframe.style.opacity = "0";
    setTimeout(() => {
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.blur();
      canvas.focus();
      window.focus();
    }, 300);
  }
});

function sanitizeKey(event: KeyboardEvent): KeyEvent | null {
  const { key } = event;
  const ignored = new Set([
    "Control",
    "Shift",
    "Alt",
    "Meta",
    "CapsLock",
    "Tab",
    "Dead",
    "AltGraph",
    "Process",
  ]);
  if (ignored.has(key)) return null;
  return {
    key,
    modifiers: {
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    },
  };
}

function boot(): void {
  const screen = document.getElementById("screen") as HTMLCanvasElement | null;
  if (!screen) throw new Error("missing #screen canvas");

  // 80x25 grid, 9x16 cells (720x400), IBM VGA 8x16 bitmap font.
  const graphics = new TerminalGraphics({
    cols: 80,
    rows: 25,
    cellWidth: 9,
    cellHeight: 16,
  });
  const terminal = new TerminalSession(graphics);
  const shell = new Shell();
  const renderer: Renderer = new ThreeRenderer(screen);
  const kernel = new Kernel(graphics, terminal, shell, renderer);

  registerCommand("demo", (ctx) => ctx.kernel.spawn(new BounceDemo()));
  registerCommand("snake", (ctx) => ctx.kernel.spawn(new SnakeGame()));
  registerCommand("blocks", (ctx) => ctx.kernel.spawn(new BlocksGame()));

  kernel.onUiRequest = () => {
    const iframe = document.getElementById("ui") as HTMLIFrameElement;
    console.log(iframe);
    iframe.style.opacity = "1";
    iframe.style.width = `100vw`;
    iframe.style.height = `100vh`;
    iframe.contentWindow?.focus();
    uiVisible = true;
  };

  terminal.writeLine("welcome to the CRT terminal");
  terminal.writeLine("type 'help' for commands, 'demo' to run a process");
  kernel.boot();

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    renderer.resize(
      Math.floor(window.innerWidth * dpr),
      Math.floor(window.innerHeight * dpr),
    );
  };
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("keydown", (event) => {
    const keyEvent = sanitizeKey(event);
    if (!keyEvent) return;
    event.preventDefault();
    kernel.handleInput(keyEvent);
  });

  let last = performance.now();
  const loop = (now: number): void => {
    const deltaTime = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!uiVisible) {
      kernel.update(deltaTime);
      renderer.render(graphics);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot();
