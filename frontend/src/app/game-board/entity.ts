export class Entity {
  private width: number;
  private height: number;
  private xPos: number;
  private yPos: number;

  constructor(width: number, height: number, x: number, y: number) {
    this.width = width;
    this.height = height;
    this.xPos = x - width / 2;
    this.yPos = y - height / 2;
  }

  collidesWith(other: Entity): boolean {
    // not implemented yet
    const otherWidth = other.getWidth();
    const otherHeight = other.getHeight();
    const [otherX, otherY] = other.getPosition();

    return (this.xPos < otherX + otherWidth && otherX < this.xPos + this.width) &&
           (this.yPos < otherY + otherHeight && otherY < this.yPos + this.height)
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