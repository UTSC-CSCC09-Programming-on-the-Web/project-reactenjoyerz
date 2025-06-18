import { DynamicSprite } from '../dynamic-sprite';
import { Wall } from '../wall/wall';

export class Bullet extends DynamicSprite {
  constructor(x: number, y: number, xTo: number, yTo: number, rotation: number, id: number) {
    super(x, y, 'bullet.png', 17, 32, 0.7, id);
    super.moveSpriteTo(xTo, yTo);
    super.setRotation(rotation);
  }

  testCollision(wall: Wall) : boolean {
    return super.collidesWith(wall);
  }

  // override to never stop moving
  override moveSprite(delta: number): void {
    const [dx, dy] = super.getDirection();
    const [x, y] = super.getPosition();
    super.setPosition(
      x + dx * delta,
      y + dy * delta
    );
  }
}
