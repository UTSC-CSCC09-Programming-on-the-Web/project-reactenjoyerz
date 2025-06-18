import { Tank } from './tank';
import { Bullet } from '../bullet/bullet';

export class PlayerTank extends Tank {
  constructor(id: number) {
    super('blueTank.png', id);
  }

  shootBullet(x: number, y: number, id: number): Bullet {
    const [px, py] = super.getPosition();
    const vx = px - x;
    const vy = py - y;


    // compute cosine
    const norm = Math.sqrt(vx ** 2 + vy ** 2);
    let angle = Math.acos(vy / norm);
    angle = vx > 0 ? 2 * Math.PI - angle : angle;
    super.setRotation(angle);

    const width = super.getWidth();
    const height = super.getHeight();

    return new Bullet(px + width/2, py + height/2, x, y, angle, id);
  }
}
