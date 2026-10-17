// Éléments graphiques partagés : galet peint du logo et des pages d'erreur
// Contour du galet
export const OUTLINE = 'M170 34 C235 38 280 78 270 128 C262 170 200 192 150 190 C100 188 66 165 60 120 C52 70 110 30 170 34 Z';

export const Gradient = ({ id, colors }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    {colors.map((c, i) => <stop key={`${c}${i}`} offset={i / (colors.length - 1)} stopColor={c} />)}
  </linearGradient>
);

// Couronne de points peints (clin d'œil aux mandalas)
export const ring = (cx, cy, r, n, size, fill, stroke, strokeWidth, offset = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + offset;
    return (
      <circle key={`${r}-${i}`} cx={(cx + r * Math.cos(a)).toFixed(1)} cy={(cy + r * Math.sin(a)).toFixed(1)} r={size}
        fill={typeof fill === 'function' ? fill(i) : fill} stroke={stroke} strokeWidth={strokeWidth} />
    );
  });
