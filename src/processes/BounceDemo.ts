import type { Process, SystemArgs, Terminal } from "../core/types";
import { getTheme } from "../core/theme";

/**
 * Example process: an animated bouncing box.
 *
 * Demonstrates the coroutine lifecycle: `run` draws the first frame, then loops
 * on `terminal.nextFrame` (suspending each tick), reads raw keys via
 * `pollKeys`, and calls `exit` to hand control back to the shell.
 */
export class BounceDemo implements Process {
  private x = 0;
  private y = 0;
  private vx = 90;
  private vy = 55;
  private size = 6;
  private elapsed = 0;

  async run(terminal: Terminal, args: SystemArgs): Promise<void> {
    const g = terminal.graphics;
    this.x = g.width / 2;
    this.y = g.height / 2;
    this.elapsed = 0;
    this.draw(terminal);

    while (true) {
      const deltaTime = await terminal.nextFrame();

      for (const event of terminal.pollKeys()) {
        if (event.key === "q" || event.key === "Escape") {
          args.exit();
          return;
        }
      }

      this.elapsed += deltaTime;
      this.x += this.vx * deltaTime;
      this.y += this.vy * deltaTime;

      if (this.x <= 0 || this.x + this.size >= g.width) {
        this.vx = -this.vx;
        this.x = Math.max(0, Math.min(this.x, g.width - this.size));
      }
      if (this.y <= 0 || this.y + this.size >= g.height) {
        this.vy = -this.vy;
        this.y = Math.max(0, Math.min(this.y, g.height - this.size));
      }

      this.draw(terminal);
    }
  }

  private draw(terminal: Terminal): void {
    const g = terminal.graphics;
    const theme = getTheme();
    g.clearScreen(theme.background);
    g.drawText(0, 0, "BOUNCE DEMO - press q to exit", theme.accent);
    g.drawText(0, 1, `t=${this.elapsed.toFixed(2)}s`, theme.dim);
    g.drawRect(
      Math.floor(this.x),
      Math.floor(this.y),
      this.size,
      this.size,
      theme.foreground,
    );
  }
}
