/**
 * Screen size from diagonal alone — geometry, not catalog data.
 *
 * The single largest source of impressions on this site is Russian-language
 * unit conversion: "65 дюймов в см" takes 731 impressions in 28 days,
 * "диагональ 65 сколько см" 264, and nearly all of it sits around position 9
 * with no clicks, because the result shown answers only the diagonal. What the
 * searcher needs next — how wide and how tall the thing actually is — is a
 * calculation anyone can check, so it can be published for every common size
 * without a single catalog record behind it.
 *
 * A 16:9 panel of diagonal D has width D·16/√337 and height D·9/√337. These
 * are panel dimensions: a real set adds a frame of roughly one to two
 * centimetres, which the measured catalog table shows model by model.
 */
const CM_PER_INCH = 2.54;
const HYPOT = Math.sqrt(16 * 16 + 9 * 9); // √337 ≈ 18.3576

export interface ScreenGeometry {
  inches: number;
  diagonalCm: number;
  widthCm: number;
  heightCm: number;
}

export function screenGeometry(inches: number): ScreenGeometry {
  const diagonalCm = inches * CM_PER_INCH;
  return {
    inches,
    diagonalCm,
    widthCm: (diagonalCm * 16) / HYPOT,
    heightCm: (diagonalCm * 9) / HYPOT,
  };
}

export function oneDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}
