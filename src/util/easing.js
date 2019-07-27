import UnitBezier from '@mapbox/unitbezier';

export function bezier(p1x, p1y, p2x, p2y) {
  const bezier = new UnitBezier(p1x, p1y, p2x, p2y);
  return function (t) {
    return bezier.solve(t);
  };
}

export const ease = bezier(0.25, 0.1, 0.25, 1);
