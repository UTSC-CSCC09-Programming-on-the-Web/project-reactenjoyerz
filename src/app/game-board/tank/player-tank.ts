import { Tank } from './tank';
import { Bullet } from '../bullet/bullet';

export class PlayerTank extends Tank {
  render: boolean = true;
  
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

    // compute end of muzzle accounting for rotation of sprite
    const muzX = -Math.sin(Math.PI + angle) * height / 2;
    const muzY = Math.cos(Math.PI + angle) * height / 2;
    return new Bullet(px + width/2 + muzX, py + height/2 + muzY, x, y, angle, id);
  }

  override testCollisionBullet(bullet: Bullet): boolean{
    if (super.collidesWith(bullet)) {
      this.render = false;
      alert(":(");
      return true;
    }

    return false;
  }
}
