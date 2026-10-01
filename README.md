# FLOW Visualizer

A standalone instrument for the repair work hiding inside a business workflow.

It follows one handoff, shows the hours people spend restoring missing context, and places that load on a waiting curve. The point is to see friction while the margin is still open — before required work exceeds the role and momentum is seized.

Digital Fog is the coordination people absorb. Digital Friction is the drag that follows. This app does not turn a questionnaire into a measured loss.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Map** — the saved 15-question Momentum Map. Scores, pressures, and archetypes follow the September 6 rules. Unanswered questions stay unknown.
- **Follow** — ten department workflows. Edit the sample, or keep it labeled as simulated. Compare one connection change.
- **Record** — a readable summary and a JSON download. Assumptions travel with the numbers.

## Models

| Model                      | What it is                                                    |
| -------------------------- | ------------------------------------------------------------- |
| `map-saved-2026-09-06`     | Answer index, profile, four pressures, archetype              |
| `operational-1.0`          | Repair hours, capacity pressure, Kingman waiting illustration |
| `manifestation-revision-3` | Recorded scenario index. Inspector only. Uncalibrated         |

The formulas and their limits are in `src/telemetry/VISUALIZER_MASTER.md`. `npm test` checks the published audit values, including the 120-package week and the revision-3 index.

## Telemetry

`POST /api/telemetry` accepts event batches and holds a short in-memory buffer for the life of the process. It is not a warehouse and it stores no secrets.
