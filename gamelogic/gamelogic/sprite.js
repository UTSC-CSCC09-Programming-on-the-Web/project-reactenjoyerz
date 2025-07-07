export function collidesWith(s1, s2) {
  return (s1.x < s2.x + s2.width && s2.x < s1.x+ s1.width) &&
         (s1.y < s2.y + s2.height && s2.y < s1.y + s1.height)
  }
