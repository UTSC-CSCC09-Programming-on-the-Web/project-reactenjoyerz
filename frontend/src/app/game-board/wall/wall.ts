import { Sprite } from "../sprite";

export class Wall extends Sprite {
  private tileSize: number;

  // creates a wall where the top left corner is (x, y) 
  // and with a width/height of nTilesX*tileSize and nTilesY*tileSize respectively
  constructor(x: number, y: number, nTilesX: number, nTilesY: number, tileSize: number, id: number) {
    // since we calculate the position based on the width and length, we have to set the width and length to 0
    // if we want to set the position correctly
    super("wall.png", 0, 0, x, y, id); 
    super.setWidth(nTilesX*tileSize);
    super.setHeight(nTilesY*tileSize);
    this.tileSize = tileSize;
  }

  getTileSize() : number { return this.tileSize; }
}