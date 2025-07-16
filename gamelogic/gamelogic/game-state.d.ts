export type Sprite = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export type DSprite = {
  dx: number,
  dy: number,
  rotation: number,
  sprite: Sprite,
};

export type Tank = DSprite;

export type Bullet = {
  nBounces: number,
  dSprite: DSprite,
};

export type GameState = {
  timestamp: number,
  tanks: tank.Tank[],
  bullets: bullet.Bullet[],
};

export function getWalls(): Sprite[];