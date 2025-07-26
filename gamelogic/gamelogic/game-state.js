import { createWall } from "./wall.js";
import { maxStepSize } from "../netcode/common.js";

import * as tank from "./tank.js";
import * as bullet from "./bullet.js";

const maps = [
  {
    walls: [
      createWall(1000, 500, 10, 2, 48),
      createWall(500, 50, 3, 15, 48),
    ],
    spawnPoints: [
      [ 960, 540 ],
    ]
  }
]

function getRand(max) {
  return Math.floor(Math.random() * max);
}

export function initialize(playerCount) {
  const tanks = [];
  const mapId = getRand(maps.length);

  for (let i = 0; i < playerCount; i++) {
    const t = getRand(maps[mapId].spawnPoints.length);
    tanks.push(
      tank.createTank(
        maps[mapId].spawnPoints[t][0],
        maps[mapId].spawnPoints[t][1]
      )
    );
  }

  return {
    timestamp: 0,
    tanks,
    bullets: [],
    mapId,
  };
}

export function getWalls(state) {
  return maps[state.mapId].walls;
}

function step(state, delta) {
  if (delta === 0) return;

  walls = structuredClone(maps[state.mapId].walls);
  walls.push(createWall(0, 0, 192, 1, 10));
  walls.push(createWall(0, 950, 192, 1, 10));
  walls.push(createWall(0, 0, 1, 108, 10));
  walls.push(createWall(1910, 0, 1, 108, 10));

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

export function moveVec(state, tankIdx, dx, dy) {
  if (Math.abs(dx ** 2 + dy ** 2 - 1) > 1e-5) return;
  state.tanks[tankIdx].dx = dx;
  state.tanks[tankIdx].dy = dy;
}

export function stopTank(state, tankIdx) {
  state.tanks[tankIdx].dx = 0;
  state.tanks[tankIdx].dy = 0;
}

export function removeTank(state, idx) {
  state.tanks.splice(idx, 1);
}

export function updateTimestamp(state, targetTime) {
  if (!isDef(state))
    return state;

  let headTime = state.timestamp;
  while (targetTime !== headTime) {
    const delta = Math.min(maxStepSize, targetTime - headTime);

    step(state, delta, walls);
    headTime += delta;
  }

  return structuredClone(state);
}