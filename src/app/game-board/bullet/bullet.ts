import { DynamicSprite } from '../dynamic-sprite';
import { Sprite } from '../sprite';

export class Bullet extends DynamicSprite {
  constructor(x: number, y: number, xTo: number, yTo: number, rotation: number, id: number) {
    super(x, y, 'bullet.png', 32, 32, 0.7, id);
    super.moveSpriteTo(xTo, yTo);
    super.setRotation(rotation);
  }

  override collidesWith(other: Sprite) {
    // dummy function
    return !super.isMoving();
  }
}
