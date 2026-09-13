type Fit = "roomy" | "snug" | "tight";

export interface DiagramInput {
  nicheW: number | null;
  nicheH: number | null;
  nicheD: number | null;
  product?: { name: string; w: number; h: number; d: number } | null;
}

const TIGHT_CM = 2;
const SNUG_CM = 5;

export function gapQuality(gap: number): Fit {
  if (gap < TIGHT_CM) return "tight";
  if (gap < SNUG_CM) return "snug";
  return "roomy";
}

const STROKE: Record<Fit, string> = {
  roomy: "var(--color-success)",
  snug: "var(--color-brand-gold)",
  tight: "var(--color-warning-text)",
};

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/**
 * A front elevation of the gap with the chosen model drawn inside it, to scale.
 *
 * The numbers alone under-sell the problem this page exists to solve: "3 ס״מ
 * clearance" reads as comfortable until you see it drawn. Rendering the niche
 * and the appliance against a shared scale turns an abstract subtraction into
 * something a person can judge at a glance, which is exactly the judgement the
 * tool is asking them to make.
 *
 * Pure SVG with no dependency, sized by viewBox so it scales to any column
 * width, and drawn from the same numbers the table reports so the two can never
 * disagree. It carries a text alternative because the drawing is information,
 * not decoration.
 */
export function NicheFitDiagram({ nicheW, nicheH, nicheD, product }: DiagramInput) {
  // Fall back to a teaching diagram until the first measurement arrives, so the
  // panel explains what to measure instead of sitting empty.
  const instructional = nicheW === null && nicheH === null && nicheD === null;

  // A box has to be drawn at some size, so an unentered axis still needs a
  // number for the geometry — but it must never be presented as a measurement.
  // Reporting "1 ס״מ מעל" against a height nobody typed is exactly the kind of
  // invented figure the rest of this page refuses to print, so an unconstrained
  // axis is drawn open, labelled as not entered, and left out of the clearances
  // and out of the text alternative.
  const W = nicheW ?? 60;
  const H = nicheH ?? 85;
  const D = nicheD ?? 60;
  const hasW = nicheW !== null;
  const hasH = nicheH !== null;
  const hasD = nicheD !== null;

  const BOX_W = 300;
  const BOX_H = 260;
  const PAD = 46;
  const scale = Math.min((BOX_W - PAD * 2) / W, (BOX_H - PAD * 2) / H);
  const nw = W * scale;
  const nh = H * scale;
  const nx = (BOX_W - nw) / 2;
  const ny = BOX_H - PAD - nh;

  const p = product && !instructional ? product : null;
  const pw = p ? Math.min(p.w, W) * scale : 0;
  const ph = p ? Math.min(p.h, H) * scale : 0;
  const px = nx + (nw - pw) / 2;
  const py = ny + nh - ph; // appliances stand on the floor

  const gapW = p && hasW ? W - p.w : null;
  const gapH = p && hasH ? H - p.h : null;
  const gapD = p && hasD ? D - p.d : null;
  const worst = [gapW, gapH, gapD].filter((g): g is number => g !== null);
  const fit: Fit = worst.length ? gapQuality(Math.min(...worst)) : "roomy";

  const entered = [
    hasW ? `רוחב ${round(W)}` : null,
    hasH ? `גובה ${round(H)}` : null,
    hasD ? `עומק ${round(D)}` : null,
  ].filter(Boolean).join(", ");
  const clearances = [
    gapW !== null ? `${round(gapW)} ס״מ ברוחב` : null,
    gapH !== null ? `${round(gapH)} ס״מ בגובה` : null,
    gapD !== null ? `${round(gapD)} ס״מ בעומק` : null,
  ].filter(Boolean).join(", ");
  const alt = instructional
    ? "תרשים הסבר: רוחב, גובה ועומק הנישה."
    : p
      ? `נמדד ${entered} ס״מ. הדגם ${p.name} הוא ${round(p.w)} על ${round(p.h)} ס״מ, ונשאר מרווח של ${clearances}.`
      : `המידות שהוזנו: ${entered}, בסנטימטרים.`;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${BOX_W} ${BOX_H}`}
        className="w-full"
        role="img"
        aria-label={alt}
        style={{ maxHeight: 280 }}
      >
        {/* floor line */}
        <line
          x1={nx - 18}
          y1={ny + nh}
          x2={nx + nw + 18}
          y2={ny + nh}
          stroke="var(--color-line)"
          strokeWidth="2"
        />

        {/* the niche; an unconstrained axis is drawn faint so it does not read
            as a measured edge */}
        <rect
          x={nx}
          y={ny}
          width={nw}
          height={nh}
          fill="none"
          stroke="var(--color-graphite-soft)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          rx="2"
          opacity={instructional || (hasW && hasH) ? 1 : 0.35}
        />

        {/* the appliance */}
        {p && (
          <>
            <rect
              x={px}
              y={py}
              width={pw}
              height={ph}
              fill="var(--color-brand-blue-light)"
              stroke={STROKE[fit]}
              strokeWidth="2"
              rx="3"
            />
            {/* door seam, so it reads as an appliance rather than a box */}
            <circle cx={px + pw / 2} cy={py + ph * 0.55} r={Math.min(pw, ph) * 0.22} fill="none" stroke={STROKE[fit]} strokeWidth="1.5" opacity="0.55" />
            <line x1={px + 6} y1={py + 10} x2={px + pw - 6} y2={py + 10} stroke={STROKE[fit]} strokeWidth="1.5" opacity="0.4" />
          </>
        )}

        {/* width dimension, under the floor */}
        <g stroke="var(--color-graphite-soft)" strokeWidth="1" opacity="0.75">
          <line x1={nx} y1={ny + nh + 16} x2={nx + nw} y2={ny + nh + 16} />
          <line x1={nx} y1={ny + nh + 11} x2={nx} y2={ny + nh + 21} />
          <line x1={nx + nw} y1={ny + nh + 11} x2={nx + nw} y2={ny + nh + 21} />
        </g>
        <text
          x={BOX_W / 2}
          y={ny + nh + 32}
          textAnchor="middle"
          fontSize="12"
          fill="var(--color-graphite-soft)"
        >
          {instructional ? "רוחב" : hasW ? `${round(W)} ס״מ` : "רוחב — לא הוזן"}
        </text>

        {/* height dimension, at the side */}
        <g stroke="var(--color-graphite-soft)" strokeWidth="1" opacity="0.75">
          <line x1={nx - 16} y1={ny} x2={nx - 16} y2={ny + nh} />
          <line x1={nx - 21} y1={ny} x2={nx - 11} y2={ny} />
          <line x1={nx - 21} y1={ny + nh} x2={nx - 11} y2={ny + nh} />
        </g>
        <text
          x={nx - 22}
          y={ny + nh / 2}
          textAnchor="middle"
          fontSize="12"
          fill="var(--color-graphite-soft)"
          transform={`rotate(-90 ${nx - 26} ${ny + nh / 2})`}
        >
          {instructional ? "גובה" : hasH ? `${round(H)} ס״מ` : "גובה — לא הוזן"}
        </text>

        {/* clearance call-outs */}
        {p && gapW !== null && gapW > 0 && (
          <text x={nx + 4} y={ny + 15} fontSize="10.5" fill={STROKE[fit]} fontWeight="600">
            {`${round(gapW / 2)} לכל צד`}
          </text>
        )}
        {p && gapH !== null && gapH > 0 && (
          <text x={BOX_W / 2} y={ny - 6} textAnchor="middle" fontSize="11" fill={STROKE[fit]} fontWeight="600">
            {`${round(gapH)} ס״מ מעל`}
          </text>
        )}
        {instructional && (
          <text x={BOX_W / 2} y={ny - 6} textAnchor="middle" fontSize="11" fill="var(--color-graphite-soft)" opacity="0.7">
            מדדו את הפתח, לא את המוצר
          </text>
        )}
      </svg>

      {/* depth is a separate axis; a front elevation cannot show it */}
      <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-graphite-soft/70">עומק</span>
          <span className="font-medium text-graphite" dir="ltr">
            {instructional ? "—" : hasD ? `${round(D)} cm` : "לא הוזן"}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-strong">
          <div
            className="h-full rounded-full"
            style={{
              width: p && hasD ? `${Math.min(100, (p.d / D) * 100)}%` : "0%",
              background: p ? STROKE[fit] : "var(--color-line)",
            }}
          />
        </div>
        {p && gapD !== null && (
          <p className="mt-1.5 text-[11px] text-graphite-soft/70">
            הדגם {round(p.d)} ס״מ — נשארים {round(gapD)} ס״מ לצנרת ולחשמל
          </p>
        )}
      </div>

      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
}
