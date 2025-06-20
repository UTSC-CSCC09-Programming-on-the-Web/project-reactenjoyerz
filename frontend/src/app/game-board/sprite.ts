// Defines a sprite that does not move ex. a wall
export class Sprite {
  private sprite: string;
  private width: number;
  private height: number;
  private xPos: number;
  private yPos: number;
  private id: number;

  constructor(
    sprite: string,
    width: number,
    height: number,
    x: number,
    y: number,
    id: number
  ) {
    this.sprite = sprite;
    this.width = width;
    this.height = height;
    this.xPos = x - width / 2;
    this.yPos = y - height / 2;
    this.id = id;
  }

  collidesWith(other: Sprite): boolean {
    const otherWidth = other.getWidth();
    const otherHeight = other.getHeight();
    const [otherX, otherY] = other.getPosition();

    return (this.xPos < otherX + otherWidth && otherX < this.xPos + this.width) &&
           (this.yPos < otherY + otherHeight && otherY < this.yPos + this.height)
  }

  getId() : number { return this.id; }

  getSprite(): string {
    return this.sprite;
  }
  setWidth(width: number): void { this.width = width; }
  setHeight(height: number): void { this.height = height; }
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
