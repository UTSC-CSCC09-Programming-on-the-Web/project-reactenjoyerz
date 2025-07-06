import { DSprite }  from './dynamic-sprite';
import { Sprite, collidesWith } from "./sprite";

const animationSpeed = 0.7;
export type Bullet = {
  nBounces: number,
  dSprite: DSprite,
}

export function testCollisionWall(bullet: Bullet, wall: Sprite) : boolean {
  const sprite = bullet.dSprite.sprite;

  if (!collidesWith(sprite, wall))
    return false;

  if (bullet.nBounces++ === 2) return true;

  const rot = bullet.dSprite.rotation;
  let nRot = 0;

  const wallX = wall.x;
  const wallY = wall.y;
  const wallWidth = wall.width;
  const wallHeight = wall.height;

  const x = sprite.x;
  const y = sprite.y;
  const width = sprite.width;
  const height = sprite.height;

  // if it collides it either hits the top or bottom or the left or right sides

  if (wallY < y && y + height < wallY + wallHeight) { // bullet hits side of wall
    nRot = 2*Math.PI - rot;

  } else if (wallX < x && x + width < wallX + wallWidth) { // bullet hits bottom or top of wall
    nRot = Math.PI - rot;

  } else { // bullet hits corner of wall
    nRot = Math.PI + rot;
  }

  bullet.dSprite.rotation = nRot;

  nRot = Math.PI + nRot; // account for weird coordinate space since [0, 1] is a downwards pointing vector
  bullet.dSprite.dx = -Math.sin(nRot);
  bullet.dSprite.dy = Math.cos(nRot);
  return false;
}

// override to never stop moving
export function step(bullet: Bullet, delta: number): void {
  const dSprite = bullet.dSprite;
  const sprite = dSprite.sprite;
  bullet.dSprite.sprite.x = sprite.x + dSprite.dx * delta * animationSpeed;
  bullet.dSprite.sprite.y = sprite.y + dSprite.dy * delta * animationSpeed;
}
