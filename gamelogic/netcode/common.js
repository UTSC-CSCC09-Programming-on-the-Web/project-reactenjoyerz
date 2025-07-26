export const serverStepSize = 100;
export const maxStepSize = 20;
export const inputCooldown = 100;
export const matchSize = 2;
export const MAX_PROXIMITY_DISTANCE = 500;
export const MIN_AUDIBLE_DISTANCE = 50;

export function isDef(x) {
  return x !== undefined && x !== null;
}

export const ErrorCode = {
  Success: 0,
  InvalidToken: 1,
  GameStarted: 2,
  InvalidRoom: 3,
  RoomExists: 4,
  SimJoin: 6, // joining two rooms at once
  WrongPassword: 7, // wrong room password
  NotInGame: 8,
}