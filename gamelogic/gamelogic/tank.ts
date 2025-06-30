import { Bullet } from './bullet.ts';
import { DSprite } from './dynamic-sprite.ts';
import { Sprite, collidesWith } from "./sprite.ts";

export const animationSpeed = 0.5;
export const enemySprite = "redTank.png";
export const playerSprite = "blueTank.png";

export type Tank = DSprite;

export function createTank(x: number, y: number): Tank {
  return {
    dx: 0,
    dy: 0,
    newX: 0,
    newY: 0,
    rotation: 0,

    sprite: {
      x,
      y,
      width: 40,
      height: 64,
    }
  }
}

export function shootBullet(tank: Tank, x: number, y: number): Bullet {
  const sprite = tank.sprite;

  const px = sprite.x;
  const py = sprite.y;
  const vx = px - x;
  const vy = py - y;

  const width = sprite.width;
  const height = sprite.height;

  // compute cosine
  const norm = Math.sqrt(vx ** 2 + vy ** 2);
  let angle = Math.acos(vy / norm);
  angle = vx > 0 ? 2 * Math.PI - angle : angle;
  tank.rotation = angle;

  // compute end of muzzle accounting for rotation of sprite
  const muzX = -Math.sin(Math.PI + angle) * (width/ 2 + 5);
  const muzY = Math.cos(Math.PI + angle) * (height / 2 + 5);
  return {
    nBounces: 0,

    dSprite: {
      dx: Math.sin(angle),
      dy: -Math.cos(angle),
      newX: Number.POSITIVE_INFINITY,
      newY: Number.POSITIVE_INFINITY,
      rotation: angle,

      sprite: {
        x: px + muzX,
        y: py + muzY,
        width: 17,
        height: 32,
      }
    }
  }
}

export function testCollisionWall(tank: Tank, wall: Sprite): void {
  const dx = tank.dx;
  const dy = tank.dy;
  const tankSprite = tank.sprite;

  if (!collidesWith(tankSprite, wall) || (dx === 0 && dy === 0)) return;

  const wallX = wall.x;
  const wallY = wall.y;
  const wallWidth = wall.width;
  const wallHeight = wall.height;

  const x = tankSprite.x;
  const y = tankSprite.y;
  const width = tankSprite.width;
  const height = tankSprite.height;

  let cx = x;
  let cy = y;

  // if it collides it either hits the top or bottom or the left or right sides
  if (wallY < y && y + height < wallY + wallHeight) { // tank hits side of wall
    if (x < wallX)
      cx = wallX - width;
    else
      cx = wallWidth + wallX;

  } else if (wallX < x && x + width < wallX + wallWidth) { // tank hits top or bottom of wall
    if (y < wallY)
      cy = wallY - height;
    else
      cy = wallHeight + wallY;

  } else { // tank hits corner of wall
    let cx = x < wallX ? wallX - width : wallWidth + wallX;
    let cy = y < wallY ? wallY - height: wallHeight + wallY;

    // if tank hits corner move tank by the smallest amount
    if (Math.abs(x - cx) < Math.abs(y - cy)) // move in x direction
      cy = y;

    else // move in y direction
      cx = x;
  }

  tank.sprite.x = cx;
  tank.sprite.y = cy;
}

export function testCollisionBullet(tank: Tank, bullet: Bullet) {
  if (collidesWith(tank.sprite, bullet.dSprite.sprite)) {
    tank.sprite.x = 960;
    tank.sprite.y = 540;
    return true;
  }

  return false;
}

export function moveTo(tank: Tank, newX: number, newY: number): void {
  const sprite = tank.sprite;

  const x = sprite.x;
  const y = sprite.y;
  const width = sprite.width;
  const height = sprite.height;

  newX -= width / 2;
  newY -= height / 2;
  tank.newX = newX;
  tank.newY = newY;

  const norm = Math.sqrt(
    Math.pow(newX - x, 2) + Math.pow(newY - y, 2),
  );

  tank.dx = (newX - x) / norm;
  tank.dy = (newY - y) / norm;
}

// COPILOT USED: autocomplete
export function step(tank: Tank, delta: number): void {
  if (tank.dx === 0 && tank.dy === 0) return;

  const x = tank.sprite.x;
  const y = tank.sprite.y;

  const distance = animationSpeed * delta;
  const dx = tank.dx * distance;
  const dy = tank.dy * distance;

  let newX = x + dx;
  let newY = y + dy;

  let flag = 0;
  if (Math.abs(x - tank.newX) < Math.abs(dx)) {
    newX = tank.newX;
    flag += 1;
  }

  if (Math.abs(y - tank.newY) < Math.abs(dy)) {
    newY = tank.newY;
    flag += 1;
  }

  tank.sprite.x = newX;
  tank.sprite.y = newY;
  if (flag === 2) {
    tank.dx = 0;
    tank.dy = 0;
  }
}
