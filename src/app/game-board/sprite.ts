// Defines a sprite that does not move ex. a wall
export class Sprite {
  private sprite: string;
  private width: number;
  private height: number;
  private xPos: number;
  private yPos: number;

  constructor(
    sprite: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ) {
    this.sprite = sprite;
    this.width = width;
    this.height = height;
    this.xPos = x - width / 2;
    this.yPos = y - height / 2;
  }

  collidesWith(other: Sprite): boolean {
    // not implemented yet
    return false;
  }

  getSprite(): string {
    return this.sprite;
  }
  getWidth(): number {
    return this.width;
  }
  getHeight(): number {
    return this.height;
  }
  setPosition(x: number, y: number): void {
    this.xPos = x;
    this.yPos = y;
  }
  getPosition(): Array<number> {
    return [this.xPos, this.yPos];
  }
}
