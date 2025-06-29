import { Sprite } from './sprite.ts';

export type DSpriteDump = {
  newX: number,
  newY: number,
  dx: number,
  dy: number,
  x: number,
  y: number,
  rotation: number,
}

export class DynamicSprite extends Sprite {
  private rotation = 0;

  // used by moveSpriteTo and moveSprite to animate the movement of the sprite
  private newX: number = 0;
  private newY: number = 0;
  private slopeX: number = 0;
  private slopeY: number = 0;
  private move: boolean = false;
  private animationSpeed: number;

  // COPILOT USED: initialize above variables
  constructor(
    x: number,
    y: number,
    sprite: string,
    width: number,
    height: number,
    animationSpeed: number,
    id: number,
    clone?: DSpriteDump
  ) {
    super(sprite, width, height, x, y, id, clone);
    if (clone) {
      this.rotation = clone.rotation;
      this.newX = clone.newX;
      this.newY = clone.newY;
      this.slopeX = clone.dx;
      this.slopeY = clone.dy;
    }

    this.animationSpeed = animationSpeed;
  }

  isMoving(): boolean {
    return this.move;
  }

  setRotation(deg: number): void {
    this.rotation = deg;
  }

  getRotation(): number {
    return this.rotation;
  }
  moveSpriteTo(newX: number, newY: number): void {
    this.newX = newX - super.getWidth() / 2;
    this.newY = newY - super.getHeight() / 2;
    let [oldX, oldY] = super.getPosition();
    const norm = Math.sqrt(
      Math.pow(this.newX - oldX, 2) + Math.pow(this.newY - oldY, 2),
    );
    this.slopeX = (this.newX - oldX) / norm;
    this.slopeY = (this.newY - oldY) / norm;
  }

  // COPILOT USED: autocomplete
  moveSprite(delta: number): void {
    if (this.slopeX === 0 && this.slopeY === 0) return;

    let [oldX, oldY] = super.getPosition();
    const distance = this.animationSpeed * delta;
    const dx = this.slopeX * distance;
    const dy = this.slopeY * distance;

    let newX = oldX + dx;
    let newY = oldY + dy;

    let flag = 0;

    if (Math.abs(oldX - this.newX) < Math.abs(dx)) {
      newX = this.newX;
      flag += 1;
    }

    if (Math.abs(oldY - this.newY) < Math.abs(dy)) {
      newY = this.newY;
      flag += 1;
    }

    super.setPosition(newX, newY);
    if (flag === 2) {
      this.slopeX = 0;
      this.slopeY = 0;
    }
  }

  stopMoving(): void {
    this.slopeX = 0;
    this.slopeY = 0;
  }
  setDirection(dx: number, dy: number): void {
    this.slopeX = dx
    this.slopeY = dy;
  }
  getDirection(): Array<number> { return this.move ? [this.slopeX, this.slopeY] : [0, 0]; }
  setAnimationSpeed(speed: number): void { this.animationSpeed = speed; }

  dump(): ClonedDSprite {
    const [x, y] = this.getPosition();
    return {
      x,
      y,
      dx: this.slopeX,
      dy: this.slopeY,
      newX: this.newX,
      newY: this.slopeY,
      rotation: this.rotation,
    }
  }
}
