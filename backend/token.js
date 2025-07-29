import crypto from "node:crypto";
import assert from "node:assert";

// mini token db to replace express-session since that doesn't seem to work

const tokenMap = new Map([]);
const playerMap = new Map([]);

const TOKEN_SIZE = 32;
const TOKEN_LIFETIME = 1000 * 60 * 60 * 24;

export function bindToken(userId, name) {
  assert(userId);
  assert(name);

  const player = playerMap.get(userId);
  if (player !== undefined) {
    assert(name === player.name);
    assert(tokenMap.get(player.token) !== undefined);
    return player.token;
  }

  const rawToken = new Uint8Array(TOKEN_SIZE);
  let token;

  while (true) {
    token = "";
    crypto.getRandomValues(rawToken);
    rawToken.forEach((v) => {
      v = v % 62;
      if (v < 10) v += 48;
      else if (v < 36) v += 55;
      else v += 61;

      token += String.fromCharCode(v);
    })

    if (tokenMap.get(token) === undefined) break;
  }

  playerMap.set(userId, {
    token,
    name,
  });

  tokenMap.set(token, {
    expires: Date.now() + TOKEN_LIFETIME,
    userId,
    name
  });

  return token;
}

export function updateClientInfo(token, clientInfo) {
  const oldInfo = tokenMap.get(token);
  assert(oldInfo !== undefined);

  clientInfo.expires = oldInfo.expires;
  clientInfo.userId = oldInfo.userId;
  clientInfo.name = oldInfo.name;
  tokenMap.set(token, clientInfo);
  return clientInfo;
}

export function findToken(userId) {
  const info = playerMap.get(userId);
  if (info === undefined) return undefined;

  const playerInfo = tokenMap.get(info.token);
  assert(info === undefined || playerInfo !== undefined);

  if (isExpired(playerInfo)) {
    deleteUserToken(userId, info.token);
    return undefined;
  }

  return info;
}

export function findPlayerInfo(token) {
  const playerInfo = tokenMap.get(token)
  if (isExpired(playerInfo)) deleteToken(token);
  return playerInfo;
}

export function deleteUserToken(userId, token) {
  if (!playerMap.delete(userId) || !tokenMap.delete(token)) {
    // for some reason assert fails to fire
    console.error("FATAL ERROR: UNABLE TO DELETE TOKEN");
    process.exit(1);
  }
}

export function deleteToken(token) {
  const t = tokenMap.get(token);
  if (t !== undefined) deleteUserToken(t.userId, token);
}

// Find player info and delete if expired. Return it otherwise
function isExpired(player) {
  return player !== undefined && player.expires <= Date.now() && player.gameId === undefined;
}

setInterval(() => {
  assert(tokenMap.size === playerMap.size);

  tokenMap.forEach((playerInfo, token) => {
    const tokenInfo = playerMap.get(playerInfo.userId);
    assert(token === tokenInfo.token);
    assert(tokenInfo.name === playerInfo.name);
    assert(!isExpired(playerInfo));
  });
}, 1000);