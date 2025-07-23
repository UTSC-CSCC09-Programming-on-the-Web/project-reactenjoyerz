import { createWall } from "./wall.js";
import { maxStepSize } from "../netcode/common.js";

import * as tank from "./tank.js";
import * as bullet from "./bullet.js";

let walls;

export function initialize(playerCount) {
  walls = [
    createWall(0, 0, 192, 1, 10),
    createWall(0, 950, 192, 1, 10),
    createWall(0, 0, 1, 108, 10),
    createWall(1910, 0, 1, 108, 10),
    createWall(1000, 500, 10, 2, 48),
    createWall(500, 50, 3, 15, 48),
  ];

  const tanks = [];
  for (let i = 0; i < playerCount; i++) {
    tanks.push(tank.createTank(960, 540));
  }
  return {
    timestamp: 0,
    tanks,
    bullets: [],
  };
}

export function getWalls() {
  return walls;
}

export function setWalls(_walls) {
  walls = _walls;
}

export function step(state, delta) {
  if (delta === 0) return;

  state.bullets = state.bullets.filter((b) => {
    bullet.step(b, delta);
    return walls.every((wall) => !bullet.testCollisionWall(b, wall));
  });

  walls.forEach((wall) => {
    state.tanks.forEach((t) => {
      tank.testCollisionWall(t, wall);
    });
  });

  state.tanks.forEach((t) => tank.step(t, delta));
  state.bullets = state.bullets.filter((b) => {
    return state.tanks.every((t) => !tank.testCollisionBullet(t, b));
  });

  state.timestamp += delta;
}

// shoot a bullet and catch it up to timestamp
export function shoot(state, tankIdx, x, y) {
  const b = tank.shootBullet(state.tanks[tankIdx], x, y);
  state.bullets.push(b);
}

export function move(state, tankIdx, x, y) {
  const t = state.tanks[tankIdx];
  tank.moveTo(t, x, y);
}

export function moveVec(state, tankIdx, dx, dy) {
  if (Math.abs(dx ** 2 + dy ** 2 - 1) > 1e-5) return;
  state.tanks[tankIdx].dx = dx;
  state.tanks[tankIdx].dy = dy;
}

export function stopTank(state, tankIdx) {
  state.tanks[tankIdx].dx = 0;
  state.tanks[tankIdx].dy = 0;
}

export function logState(state) {
  console.log(`TIME: ${state.timestamp}
  Tanks:`);
  state.tanks.forEach((t) => {
    console.log(`    x: ${t.sprite.x}
    y: ${t.sprite.y}
    dx: ${t.dy}
    dx: ${t.dx}
    rot: ${t.rotation}
    `);
  });

  console.log(`
  Bullets:`);
  state.bullets.forEach((b) => {
    const t = b.dSprite;
    console.log(`    x: ${t.sprite.x}
    y: ${t.sprite.y}
    dx: ${t.dy}
    dx: ${t.dx}
    rot: ${t.rotation}
    nBounces: ${b.nBounces};
    `);
  });

  console.log(`
  Leaderboard:
    TBD
  `);
}

export function removeTank(state, idx) {
  state.tanks.splice(idx, 1);
}

export function updateTimestamp(state, targetTime) {
  if (!state) {
    return { tanks: [], bullets: [] };
  }

  let headTime = state.timestamp;
  while (targetTime !== headTime) {
    const delta = Math.min(maxStepSize, targetTime - headTime);

    step(state, delta);
    headTime += delta;
  }

  return structuredClone(state);
}