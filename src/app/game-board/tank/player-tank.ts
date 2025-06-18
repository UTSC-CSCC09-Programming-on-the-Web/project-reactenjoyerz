import { Tank } from './tank';

export class PlayerTank extends Tank {
  constructor(id: number) {
    super('greenTank.png', id);
  }

  shootBullet(x: number, y: number) : void {
    const [px, py] = super.getPosition();
    const vx = px - x;
    const vy = py - y

    // compute cosine
    const norm = Math.sqrt(vx**2 + vy**2);
    let angle = Math.acos(vy / norm);
    angle = vx > 0 ? 2*Math.PI - angle : angle;
    super.setRotation(angle);
  }
}
