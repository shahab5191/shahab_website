import type { Process, SystemArgs, Terminal } from "../core/types";
import { Colors } from "../core/types";

class Vec2 {
  x: number = 0;
  y: number = 0;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Example full-screen process: two shapes drifting on the framebuffer.
 *
 * Same coroutine shape as `BounceDemo`: `nextFrame` for animation, `pollKeys`
 * for raw input, and `exit` to quit.
 */
export class TestProcess implements Process {
  private rectSpeed = new Vec2();
  private rectPos = new Vec2();
  private rectSize = new Vec2();
  private circleSpeed = new Vec2();
  private circlePos = new Vec2();
  private circleRadius = 0;

  async run(terminal: Terminal, args: SystemArgs): Promise<void> {
    this.rectSpeed.x = 10;
    this.rectSpeed.y = 1;
    this.circleSpeed.x = -1;
    this.circleSpeed.y = -10;
    this.rectPos.x = 100;
    this.rectPos.y = 100;
    this.rectSize.x = 100;
    this.rectSize.y = 100;
    this.circlePos.x = 100;
    this.circlePos.y = 100;
    this.circleRadius = 50;

    this.draw(terminal);

    while (true) {
      const deltaTime = await terminal.nextFrame();

      for (const event of terminal.pollKeys()) {
        if (event.key === "q" || event.key === "Escape") {
          args.exit();
          return;
        }
      }

      this.rectPos.x += this.rectSpeed.x * deltaTime;
      this.rectPos.y += this.rectSpeed.y * deltaTime;
      this.circlePos.x += this.circleSpeed.x * deltaTime;
      this.circlePos.y += this.circleSpeed.y * deltaTime;

      this.draw(terminal);
    }
  }

  private draw(terminal: Terminal): void {
    const g = terminal.graphics;
    g.clearScreen();
    g.drawCircle(
      this.circlePos.x,
      this.circlePos.y,
      this.circleRadius,
      Colors.Red,
      true,
    );
    g.drawRect(
      this.rectPos.x,
      this.rectPos.y,
      this.rectSize.x,
      this.rectSize.y,
      Colors.LightBlue,
    );
  }
}
