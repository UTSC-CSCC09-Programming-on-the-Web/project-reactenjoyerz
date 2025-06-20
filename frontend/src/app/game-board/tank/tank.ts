import { Bullet } from '../bullet/bullet';
import { DynamicSprite } from '../dynamic-sprite';
import { Wall } from '../wall/wall';

export abstract class Tank extends DynamicSprite {
  constructor(sprite: string, id: number) {
    super(960, 540, sprite, 40, 64, 0.5, id);
  }

  // no overloading :(
  testCollisionWall(wall: Wall) : boolean {
    const [dx, dy] = super.getDirection();
    if (!super.collidesWith(wall) || (dx === 0 && dy === 0)) return false;

    let [x, y] = super.getPosition();
    const [wallX, wallY] = wall.getPosition();

    const width = super.getWidth();
    const height = super.getHeight();
    const wallWidth = wall.getWidth();
    const wallHeight = wall.getHeight();

    // if it collides it either hits the top or bottom or the left or right sides
    
    if (wallY < y && y + height < wallY + wallHeight) { // tank hits side of wall
      if (x < wallX) super.setPosition(wallX - width, y);
      else super.setPosition(wallWidth + wallX, y);
      super.setDirection(0, dy);

    } else if (wallX < x && x + width < wallX + wallWidth) { // tank hits top or bottom of wall
      if (y < wallY) super.setPosition(x, wallY - height);
      else super.setPosition(x, wallHeight + wallY)
      super.setDirection(dx, 0);

    } else { // tank hits corner of wall
      let cx, cy: number = 0;
      cx = x < wallX ? wallX - width : wallWidth + wallX;
      cy = y < wallY ? wallY - height: wallHeight + wallY;

      if (Math.abs(x - cx) < Math.abs(y - cy)) {
        super.setPosition(cx, y);
        super.setDirection(0, dy);
      } else {
        super.setPosition(x, cy);
        super.setDirection(dx, 0);
      }
    }

    super.stopMoving();
    return false;
  }

  testCollisionBullet(bullet: Bullet) {
    return super.collidesWith(bullet);
  }
}
