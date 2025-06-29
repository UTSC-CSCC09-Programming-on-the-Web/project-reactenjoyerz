import { Tank } from "./tank.ts";
import { DSpriteDump} from "./dynamic-sprite.ts";

export class EnemyTank extends Tank {
  constructor(id: number, clone?: DSpriteDump) {
    super('redTank.png', id, clone);
  }
}
