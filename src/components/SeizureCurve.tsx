import { curvePoints, CLOSING_RHO, FORMING_RHO } from '../lib/operational';

const WIDTH = 320;
const HEIGHT = 176;
const PAD = { left: 36, right: 14, top: 16, bottom: 28 };
const MAX_MULTIPLE = 20;

export function SeizureCurve({
  rho,
  compareRho,
  variability,
  accent,
  caption = 'How long each item waits, compared with the time to handle the item. The curve is an illustration, not a measured delay.',
}: {
  rho: number | null;
  compareRho: number | null;
  variability: number;
  accent: string;
  caption?: string;
}) {
  const points = curvePoints(variability);
  const path = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${x(point.rho).toFixed(1)} ${y(point.multiple).toFixed(1)}`;
    })
    .join(' ');

  const label =
    rho === null
      ? "How full the team is isn't known yet."
      : rho >= 1
        ? 'This team is stalled, so the wait has no end.'
        : `This team is ${rho.toFixed(2)} full.`;

  return (
    <figure className="curve">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label}>
        <line className="axis" x1={PAD.left} y1={y(0)} x2={WIDTH - PAD.right} y2={y(0)} />
        <line className="axis" x1={x(1)} y1={PAD.top} x2={x(1)} y2={y(0)} />
        <line className="guide" x1={x(FORMING_RHO)} y1={PAD.top} x2={x(FORMING_RHO)} y2={y(0)} />
        <line className="guide" x1={x(CLOSING_RHO)} y1={PAD.top} x2={x(CLOSING_RHO)} y2={y(0)} />
        <path d={path} fill="none" stroke="#f4efe6" strokeWidth="1.6" />
        <text x={x(FORMING_RHO)} y={12} className="tick">
          forming
        </text>
        <text x={x(0)} y={HEIGHT - 8} className="tick">
          0
        </text>
        <text x={x(1) - 46} y={HEIGHT - 8} className="tick">
          stalled
        </text>
        {rho !== null ? <Point rho={rho} fill={accent} variability={variability} /> : null}
        {compareRho !== null ? (
          <Point rho={compareRho} fill="#f4efe6" variability={variability} ring />
        ) : null}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Point({
  rho,
  fill,
  variability,
  ring = false,
}: {
  rho: number;
  fill: string;
  variability: number;
  ring?: boolean;
}) {
  const seized = rho >= 1;
  const px = x(Math.min(rho, 0.985));
  const multiple = seized ? MAX_MULTIPLE : Math.min(MAX_MULTIPLE, variability * (rho / (1 - rho)));
  const py = y(multiple);
  return (
    <circle
      cx={px}
      cy={py}
      r={ring ? 4.5 : 5}
      fill={ring ? 'none' : fill}
      stroke={fill}
      strokeWidth={ring ? 1.6 : 0}
    />
  );
}

function x(rho: number): number {
  return PAD.left + Math.min(Math.max(rho, 0), 1) * (WIDTH - PAD.left - PAD.right);
}

function y(multiple: number): number {
  const clipped = Math.min(Math.max(multiple, 0), MAX_MULTIPLE);
  return PAD.top + (1 - clipped / MAX_MULTIPLE) * (HEIGHT - PAD.top - PAD.bottom);
}
