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

export function step(state: GameState, delta: number) {
  if (delta === 0) return;

  state.bullets = state.bullets.filter((b) => {
    bullet.step(b, delta);
    return walls.some((wall) => !bullet.testCollisionWall(b, wall));
  });

  walls.forEach((wall) => {
    state.tanks.forEach((t) => {
      tank.testCollisionWall(t, wall);
    });
  });

  state.tanks.forEach((t) => tank.step(t, delta));
  state.bullets.filter((b) => {
    return state.tanks.some((t) => !tank.testCollisionBullet(t, b));
  });
}

// shoot a bullet and catch it up to timestamp
export function shoot(state: GameState, tankIdx: number, x: number, y: number) {
  const b = tank.shootBullet(state.tanks[tankIdx], x, y);
  state.bullets.push(b);
}

export function move(state: GameState, tankIdx: number, x: number, y: number) {
  const t = state.tanks[tankIdx];
  tank.moveTo(t, x, y);
}

export function logState(state: GameState) {
  console.log(`TIME: ${state.timestamp}
  Tanks:`)
  state.tanks.forEach((t: tank.Tank) => {
    console.log(`    x: ${t.sprite.x} ---> ${t.newX}
    y: ${t.sprite.y} ---> ${t.newY}
    dx: ${t.dy}
    dx: ${t.dx}
    rot: ${t.rotation}
    `)
  })

  console.log(`
  Bullets:`)
  state.bullets.forEach((b) => {
    const t = b.dSprite;
    console.log(`    x: ${t.sprite.x} ---> ${t.newX}
    y: ${t.sprite.y} ---> ${t.newY}
    dx: ${t.dy}
    dx: ${t.dx}
    rot: ${t.rotation}
    nBounces: ${b.nBounces};
    `)
  })

  console.log(`
  Leaderboard:
    TBD
  `);
}
