import type { BandId, Stage } from '../lib/types';

const TOKEN_OFFSETS: Record<BandId, number[]> = {
  seized: [34, 39, 43, 46, 49, 52, 56, 60],
  unavailable: [34, 39, 43, 46, 49, 52, 56, 60],
  closing: [16, 30, 42, 48, 54, 66, 78, 90],
  forming: [10, 24, 38, 48, 58, 70, 82, 93],
  fog: [8, 20, 34, 46, 58, 70, 82, 93],
  open: [6, 18, 30, 42, 54, 66, 78, 90],
  unknown: [8, 22, 36, 50, 64, 78, 88, 94],
};

export function FlowTrack({
  stages,
  band,
  accent,
}: {
  stages: readonly Stage[];
  band: BandId;
  accent: string;
}) {
  const moving = band === 'open' || band === 'fog' || band === 'forming';
  return (
    <div className={`flow band-${band}`}>
      <div className="flow-line" aria-hidden="true">
        {TOKEN_OFFSETS[band].map((offset, index) => (
          <span
            key={offset}
            className={moving ? 'token token-move' : 'token'}
            style={{ left: `${offset}%`, animationDelay: `${index * 0.35}s`, background: accent }}
          />
        ))}
      </div>
      <ol className="stages">
        {stages.map((stage) => (
          <li
            key={stage.id}
            className={stage.gap ? 'stage is-gap' : stage.repair ? 'stage is-repair' : 'stage'}
          >
            <span
              className="stage-node"
              style={
                stage.gap
                  ? {
                      borderColor: accent,
                      boxShadow: `0 0 0 4px color-mix(in srgb, ${accent} 22%, transparent)`,
                    }
                  : undefined
              }
            />
            {stage.gap ? (
              <span className="stage-fog" style={{ background: accent }} aria-hidden="true" />
            ) : null}
            <span className="stage-label">{stage.label}</span>
            <span className="stage-detail">{stage.detail}</span>
          </li>
        ))}
      </ol>
      <p className="schematic">
        Schematic. The marks show where this scenario holds the work. They are not a count of items.
      </p>
    </div>
  );
}
