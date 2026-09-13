import type { Graphics, KeyEvent, Process, SystemArgs } from "../core/types";
import { Palette } from "../core/types";

/**
 * Example process: an animated bouncing box.
 *
 * Demonstrates the full Process lifecycle: `init` draws the first frame,
 * `update` animates every frame (re-flagging the VRAM as dirty), `handleInput`
 * handles the `q` key, and `exit` hands control back to the shell.
 */
export class BounceDemo implements Process {
  private graphics!: Graphics;
  private exit!: (code?: number) => void;

  private x = 0;
  private y = 0;
  private vx = 90;
  private vy = 55;
  private size = 6;
  private elapsed = 0;

  init(graphics: Graphics, systemArgs: SystemArgs): void {
    this.graphics = graphics;
    this.exit = systemArgs.exit;
    this.x = graphics.width / 2;
    this.y = graphics.height / 2;
    this.elapsed = 0;
    this.draw();
  }

  handleInput(event: KeyEvent): void {
    if (event.key === "q" || event.key === "Escape") {
      this.exit();
    }
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    if (this.x <= 0 || this.x + this.size >= this.graphics.width) {
      this.vx = -this.vx;
      this.x = Math.max(0, Math.min(this.x, this.graphics.width - this.size));
    }
    if (this.y <= 0 || this.y + this.size >= this.graphics.height) {
      this.vy = -this.vy;
      this.y = Math.max(0, Math.min(this.y, this.graphics.height - this.size));
    }

    this.draw();
  }

  cleanup(): void {
    // No external resources to release.
  }

  private draw(): void {
    const g = this.graphics;
    g.clearScreen(Palette.background);
    g.drawText(0, 0, "BOUNCE DEMO - press q to exit", Palette.accent);
    g.drawText(0, 1, `t=${this.elapsed.toFixed(2)}s`, Palette.dim);
    g.drawRect(
      Math.floor(this.x),
      Math.floor(this.y),
      this.size,
      this.size,
      Palette.foreground,
    );
  }
}
