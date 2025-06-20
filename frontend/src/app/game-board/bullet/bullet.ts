import { DynamicSprite } from '../dynamic-sprite';
import { Wall } from '../wall/wall';

export class Bullet extends DynamicSprite {
  nBounces: number = 0;
  flag: boolean = false;

  constructor(x: number, y: number, xTo: number, yTo: number, rotation: number, id: number) {
    super(x, y, 'bullet.png', 17, 32, 0.7, id);
    super.moveSpriteTo(xTo, yTo);
    super.setRotation(rotation);
  }

  testCollisionWall(wall: Wall) : boolean {
    if (!super.collidesWith(wall)) {
      this.flag = false;
      return false;
    }

    if (this.nBounces++ === 2) return true;

    const rot = this.getRotation();
    let nRot: number = 0;

    let [x, y] = super.getPosition();
    const [wallX, wallY] = wall.getPosition();

    const width = super.getWidth();
    const height = super.getHeight();
    const wallWidth = wall.getWidth();
    const wallHeight = wall.getHeight();

    // if it collides it either hits the top or bottom or the left or right sides

    if (wallY < y && y + height < wallY + wallHeight) { // bullet hits side of wall
      nRot = 2*Math.PI - rot;

    } else if (wallX < x && x + width < wallX + wallWidth) { // bullet hits bottom or top of wall
      nRot = Math.PI - rot;

    } else { // bullet hits corner of wall
      nRot = Math.PI + rot;
    }

    super.setRotation(nRot);

    nRot = Math.PI + nRot; // account for weird coordinate space since [0, 1] is a downwards pointing vector
    super.setDirection(-Math.sin(nRot), Math.cos(nRot));
    return false;
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
