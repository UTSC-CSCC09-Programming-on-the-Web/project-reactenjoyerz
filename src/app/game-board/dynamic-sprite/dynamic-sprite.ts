import { Component, input } from '@angular/core';

@Component({
  selector: 'dynamic-sprite',
  imports: [],
  templateUrl: './dynamic-sprite.html',
  styleUrl: './dynamic-sprite.css'
})
export class DynamicSprite {
  sprite = input<string>();
  width = input<number>(64);
  height = input<number>(64);

  protected xPos = -32;
  protected yPos = -32;
  protected rotation = 50;

  setPositionX(x: number) : void { this.xPos = x - this.width() / 2; }
  setPositionY(y: number) : void { this.yPos = y - this.height() / 2; }
  setRotation(deg: number) : void {this.rotation = deg; }
  getPositionX() : number { return this.xPos; }
  getPositionY() : number { return this.yPos; }
  getRotation() : number {return this.rotation; }
}
