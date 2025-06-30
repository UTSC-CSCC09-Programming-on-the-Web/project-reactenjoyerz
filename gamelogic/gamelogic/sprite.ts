export type Sprite = {
  x: number,
  y: number,
  width: number,
  height: number,
}

export function collidesWith(s1: Sprite, s2: Sprite): boolean {
  return (s1.x < s2.x + s2.width && s2.x < s1.x+ s1.width) &&
         (s1.y < s2.y + s2.height && s2.y < s1.y + s1.height)
  }
