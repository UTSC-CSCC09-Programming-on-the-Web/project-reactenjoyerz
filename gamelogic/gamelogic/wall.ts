export const sprite = "wall.png";

export function createWall(x: number, y: number, nTilesX: number, nTilesY: number, tileSize: number) {
  return {
    x,
    y,
    width: nTilesX * tileSize,
    height: nTilesY * tileSize,
  }
}
