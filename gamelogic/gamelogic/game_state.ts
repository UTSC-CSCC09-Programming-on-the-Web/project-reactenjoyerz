import { Sprite } from "./sprite.ts";
import { createWall } from "./wall.ts";

import * as tank from "./tank.ts";
import * as bullet from "./bullet.ts";

let walls: Sprite[];

export type GameState = {
  timestamp: number,
  tanks: tank.Tank[],
  bullets: bullet.Bullet[],
};

export function initialize(): GameState {
  walls = [
    createWall(0, 0, 192, 1, 10),
    createWall(0, 950, 192, 1, 10),
    createWall(0, 0, 1, 108, 10),
    createWall(1910, 0, 1, 108, 10),
    createWall(1000, 500, 10, 2, 48),
    createWall(500, 50, 3, 15, 48),
  ];

  return {
    timestamp: 0,
    tanks: [
      tank.createTank(960, 540),
      tank.createTank(960, 540),
    ],
    bullets: [],
  }
}

export function step(state: GameState, delta: number): GameState {
  const newState = structuredClone(state);
  newState.bullets = newState.bullets.filter((b) => {
    bullet.step(b, delta);
    return walls.some((wall) => !bullet.testCollisionWall(b, wall));
  });

  walls.forEach((wall) => {
    newState.tanks.forEach((t) => {
      tank.testCollisionWall(t, wall);
    });
  });

  newState.tanks.forEach((t) => tank.step(t, delta));
  newState.bullets.filter((b) => {
    return newState.tanks.some((t) => !tank.testCollisionBullet(t, b));
  });

  return newState;
}

// shoot a bullet and catch it up to timestamp
export function shoot(state: GameState, tankIdx: number, x: number, y: number, timestamp: number) {
  const delta = timestamp - state.timestamp;
  const b = tank.shootBullet(state.tanks[tankIdx], x, y);

  // catch bullet up to timestamp
  bullet.step(b, delta);
  walls.some((wall) => !bullet.testCollisionWall(b, wall));
}

export function move(state: GameState, tankIdx: number, x: number, y: number, timestamp: number) {
  const delta = timestamp - state.timestamp;
  const t = state.tanks[tankIdx];
  tank.moveTo(t, x, y);

  // catch tank pos up to timestamp
  tank.step(t, delta);
  walls.forEach((wall) => {
    tank.testCollisionWall(t, wall);
  })
}
