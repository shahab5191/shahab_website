import {
  type Graphics,
  type KeyEvent,
  type Process,
  type SystemArgs,
  Colors,
} from "../core/types";

class Vec2 {
  x: number = 0;
  y: number = 0;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

export class TestProcess implements Process {
  private exit!: (code?: number) => void;
  private rectSpeed = new Vec2();
  private rectPos = new Vec2();
  private rectSize = new Vec2();
  private circleSpeed = new Vec2();
  private circlePos = new Vec2();
  private circleRadius = 0;

  private graphics!: Graphics;

  private _updateShapes() {
    if (!this.graphics) {
      console.log("no graphics");
      return;
    }
    this.graphics.clearScreen();
    this.graphics.drawCircle(
      this.circlePos.x,
      this.circlePos.y,
      this.circleRadius,
      Colors.Red,
      true,
    );
    this.graphics.drawRect(
      this.rectPos.x,
      this.rectPos.y,
      this.rectSize.x,
      this.rectSize.y,
      Colors.LightBlue,
    );
  }

  init(graphics: Graphics, systemArgs: SystemArgs): void {
    this.exit = systemArgs.exit
    this.graphics = graphics;
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
    this._updateShapes();
  }

  handleInput(event: KeyEvent): void {
    if (event.key === "q" || event.key === "Escape") {
      this.exit();
    }
  }

  update(deltaTime: number): void {
    this.rectPos.x += this.rectSpeed.x * deltaTime;
    this.rectPos.y += this.rectSpeed.y * deltaTime;
    this.circlePos.x += this.circleSpeed.x * deltaTime;
    this.circlePos.y += this.circleSpeed.y * deltaTime;
    this._updateShapes();
  }

  cleanup(): void {
    console.log("cleanup");
  }
}
