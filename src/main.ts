import { TerminalGraphics } from './core/TerminalGraphics';
import { Shell } from './core/Shell';
import { Kernel } from './core/Kernel';
import { registerCommand } from './core/commands';
import { Canvas2DRenderer, type Renderer } from './core/Renderer';
import { BounceDemo } from './processes/BounceDemo';
import type { KeyEvent } from './core/types';

function sanitizeKey(event: KeyboardEvent): KeyEvent | null {
  const { key } = event;
  const ignored = new Set([
    'Control',
    'Shift',
    'Alt',
    'Meta',
    'CapsLock',
    'Tab',
    'Dead',
    'AltGraph',
    'Process',
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
  const screen = document.getElementById('screen') as HTMLCanvasElement | null;
  if (!screen) throw new Error('missing #screen canvas');

  // 80x25 grid, 9x16 cells (720x400), IBM VGA 8x16 bitmap font.
  const graphics = new TerminalGraphics({ cols: 80, rows: 25, cellWidth: 9, cellHeight: 16 });
  const shell = new Shell(graphics);
  const kernel = new Kernel(graphics, shell);
  const renderer: Renderer = new Canvas2DRenderer(screen);

  // Process-spawning commands are registered at bootstrap, keeping the core
  // command module free of process imports.
  registerCommand('demo', (ctx) => ctx.kernel.spawn(new BounceDemo()));

  // Future: wired to the Three.js camera animation / DOM overlay.
  kernel.onUiRequest = () => {
    console.info('[kernel] ui transition requested (not yet implemented)');
  };

  shell.writeLine('welcome to the CRT terminal');
  shell.writeLine("type 'help' for commands, 'demo' to run a process");
  shell.redraw();

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    renderer.resize(Math.floor(window.innerWidth * dpr), Math.floor(window.innerHeight * dpr));
  };
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('keydown', (event) => {
    const keyEvent = sanitizeKey(event);
    if (!keyEvent) return;
    event.preventDefault();
    kernel.handleInput(keyEvent);
  });

  let last = performance.now();
  const loop = (now: number): void => {
    const deltaTime = Math.min((now - last) / 1000, 0.1);
    last = now;
    kernel.update(deltaTime);
    if (graphics.consumeDirty()) {
      renderer.render(graphics);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot();
