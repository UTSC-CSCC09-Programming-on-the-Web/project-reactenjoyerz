import { Tank } from './tank';

export class PlayerTank extends Tank {
  constructor(id: number) {
    super('greenTank.png', id);
  }
}
