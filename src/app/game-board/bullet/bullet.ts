import { DynamicSprite } from '../dynamic-sprite';
import { Sprite } from '../sprite';

export class Bullet extends DynamicSprite {
  id: number;

  constructor(x: number, y: number, xTo: number, yTo: number, rotation: number, id: number) {
    // dummy values until my image generation limit refreshes
    super(x, y, 'bullet.png', 32, 32, 0.7);
    super.moveSpriteTo(xTo, yTo);
    super.setRotation(rotation);
    this.id = id;
  }

  override collidesWith(other: Sprite) {
    // dummy function
    return !super.isMoving();
  }
}
