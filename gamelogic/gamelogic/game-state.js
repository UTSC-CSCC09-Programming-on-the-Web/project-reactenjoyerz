import { createWall } from "./wall.js";
import { maxStepSize } from "../netcode/common.js";
import { isDef } from "../netcode/common.js";

import * as tank from "./tank.js";
import * as bullet from "./bullet.js";

const maps = [
  {
    walls: [],
    spawnPoints: [
      [ 1213, 377 ],	
      [ 1458, 900 ],
      [ 550, 180 ],
      [ 871, 845],
      [ 1134, 657 ],
      [ 1604, 363 ],
      [ 1447, 579 ],
      [ 636, 800 ],
      [ 500, 513 ],
    ]
  },
  {
    walls: [
      createWall(900, 250, 5, 10, 48)
    ],
    spawnPoints: [
      [ 500, 50 ],
      [ 500, 800 ],
      [ 1800, 50 ],
      [ 1800, 800 ],
    ]
  },
  {
    walls: [
      createWall(800, 900, 10, 2, 48),
      createWall(1600, 300, 15, 2, 48),
      createWall(500, 100, 7, 7, 48)
    ],
    spawnPoints: [
      [ 500, 50 ],
      [ 500, 800 ],
      [ 1800, 50 ],
      [ 1800, 800 ],
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

function step(state, delta, isClient) {
  if (delta === 0) return;

  let outOfSync = false;
  console.assert(isDef(isClient), "step: isClient not defined");
  const walls = structuredClone(maps[state.mapId].walls);
  
  walls.push({ x: 0, y: -50, width: 3000, height: 50 }); // top
  walls.push({ x: 0, y: 953, width: 3000, height: 50 }); // bottom
  walls.push({ x: 325, y: 0, width: 50, height: 3000 }); // left
  walls.push({ x: 1920, y: 0, width: 50, height: 3000 }); // right

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
    return state.tanks.every((t, idx) => {
      if (idx === b.ownerIdx) return true;
      if (!tank.testCollisionBullet(t, b)) return true;
      if (isClient) {
        // hide player and wait for server response to get new respawn point
        t.dSprite.sprite.x = -9001;
        t.dSprite.sprite.y = -9001;
        outOfSync =  true;
      } else {
        const spawnId = getRand(maps[state.mapId].spawnPoints.length);
        const [x, y] = maps[state.mapId].spawnPoints[spawnId];
        t.dSprite.sprite.x = x;
        t.dSprite.sprite.y = y;
        state.tanks[b.ownerIdx].score += 1;
      }

      return false;
    });
  });

  state.timestamp += delta;
  return outOfSync;
}

// shoot a bullet and catch it up to timestamp
export function shoot(state, tankIdx, x, y) {
  const b = tank.shootBullet(state.tanks[tankIdx], tankIdx, x, y);
  state.bullets.push(b);
}

export function moveVec(state, tankIdx, dx, dy) {
  if (Math.abs(dx ** 2 + dy ** 2 - 1) > 1e-5) return;
  state.tanks[tankIdx].dSprite.dx = dx;
  state.tanks[tankIdx].dSprite.dy = dy;
}

export function stopTank(state, tankIdx) {
  state.tanks[tankIdx].dSprite.dx = 0;
  state.tanks[tankIdx].dSprite.dy = 0;
}

export function removeTank(state, idx) {
  state.tanks.splice(idx, 1);
}

export function updateTimestamp(state, targetTime, isClient) {
  if (!isDef(state))
    return state;

  let outOfSync = false;
  let headTime = state.timestamp;
  while (targetTime !== headTime) {
    const delta = Math.min(maxStepSize, targetTime - headTime);

    outOfSync = outOfSync || step(state, delta, isClient);
    headTime += delta;
  }

  return outOfSync;
}

export function getScores(state, playerNames) {
  return state.tanks.map((t, idx) => {
    return {
      score: t.score,
      name: playerNames[idx],
      clientIdx: idx,
    }
  });
}