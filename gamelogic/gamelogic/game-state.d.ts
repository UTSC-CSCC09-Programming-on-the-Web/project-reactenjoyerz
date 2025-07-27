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
  score: number,
};

export type Tank = {
  dSprite: DSprite,
  score: number
};

export type Bullet = {
  nBounces: number,
  dSprite: DSprite,
  ownerIdx: number,
};

export type GameState = {
  timestamp: number,
  tanks: Tank[],
  bullets: Bullet[],
};

export declare function getWalls(): Sprite[];
export declare function initialize(matchSize: number): GameState;
export declare function step(gameState: GameState, delta: number): void;
export declare function shoot(gameState: GameState, clientIdx: number, x: number, y: number): void;
export declare function move(gameState: GameState, clientIdx: number, x: number, y: number): void;
export declare function getWalls(state: GameState): Sprite[];
export declare function logState(gameState: GameState): void; // Assuming logState exists
export declare function removeTank(gameState: GameState, clientIdx: number): void;
