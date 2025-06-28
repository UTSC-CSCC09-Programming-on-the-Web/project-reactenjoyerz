import { Tank } from "./tank.ts";

export class EnemyTank extends Tank {
  constructor(id: number) {
    super('redTank.png', id);
  }
}
