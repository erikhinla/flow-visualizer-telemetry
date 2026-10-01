# PROOF

A scan for marketing agencies. It shows the reconstruction inside one campaign workflow — approvals, versions, feedback, spend — and a connection that returns hours without cutting the review that protects the work.

The waiting curve marks when that load is still forming and when it has seized the desk. If a fix costs more than it returns, the balance says so.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Scan** — fifteen questions about how the agency runs campaign work. Scores and routing follow the saved point values. Unanswered questions stay unknown.
- **Desk** — account, creative, production, media, and the other desks a job crosses. Edit the sample, or keep it labeled simulated. Compare one connection.
- **Record** — reconstruction, the balance of the fix, the review that stays, and a JSON download.

## Models

| Model                      | What it is                                                    |
| -------------------------- | ------------------------------------------------------------- |
| `map-saved-2026-09-06`     | Answer index, profile, four pressures, archetype              |
| `operational-1.0`          | Repair hours, capacity pressure, Kingman waiting illustration |
| `manifestation-revision-3` | Recorded scenario index. Inspector only. Uncalibrated         |

The formulas and their limits are in `src/telemetry/VISUALIZER_MASTER.md`. `npm test` checks the published audit values, including the 120-package week and the revision-3 index.

## Telemetry

`POST /api/telemetry` accepts event batches and holds a short in-memory buffer for the life of the process. It is not a warehouse and it stores no secrets.
