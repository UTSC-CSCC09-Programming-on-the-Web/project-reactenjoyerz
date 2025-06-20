import { Tank } from "./tank";

export class EnemyTank extends Tank {
  constructor(id: number) {
    super('redTank.png', id);
  }
}