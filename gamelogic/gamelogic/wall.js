export function createWall(x, y, nTilesX, nTilesY, tileSize) {
  return {
    x,
    y,
    width: nTilesX * tileSize,
    height: nTilesY * tileSize,
  }
}
