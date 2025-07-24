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
}

export function updateClientIdx(token, newClientIdx) {
  const oldInfo = tokenMap.get(token);
  assert(oldInfo !== undefined);

  oldInfo.clientIdx = newClientIdx;
}

export function findToken(userId) {
  const info = playerMap.get(userId);
  if (info === undefined) return undefined;

  const token = playerMap.get(info.token);
  assert(info === undefined || token !== undefined);

  if (info !== undefined && token.expires <= Date.now()) {
    deleteUserToken(userId, info.token);
    return undefined;
  }

  return info;
}

export function findPlayerInfo(token) {
  const player = tokenMap.get(token)
  if (player !== undefined && player.expires <= Date.now()) {
    deleteUserToken(token.userId, token);
    return undefined;
  }

  return player;
}

export function deleteUserToken(userId, token) {
  assert(playerMap.delete(userId));
  assert(playerMap.delete(token));
}

export function deleteToken(token) {
  const t = tokenMap.get(token);
  assert(t !== undefined);
  deleteUserToken(t.userId, token);
}

export function refreshToken(token) {

}