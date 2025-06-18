import { DynamicSprite } from '../dynamic-sprite';

export abstract class Tank extends DynamicSprite {
  private id: number;
  constructor(sprite: string, id: number) {
    super(0, 0, sprite, 64, 64, 0.5);
    this.id = id;
  }
}
