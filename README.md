# PROOF

A trace for marketing agencies. It shows where a project is, what needs done, who has it, and by when. Digital fog hides those four facts. Digital friction stalls the desk that rebuilds them.

Once the Trace can see the desk, the path back is the four keystones: Folders, Markdown, Scripts, and Protocols. The waiting curve still marks when that load is forming and when it has seized the desk. If a fix costs more than it returns, the balance says so.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Scan** — fifteen questions about how the agency runs campaign work. Scores and routing follow the saved point values. Unanswered questions stay unknown.
- **Trace** — where, what, who, and when on one desk. The keystone actions stay dark until the scenario is known. A sample stays simulated until you say otherwise.
- **Record** — the four facts, the keystone path, the balance of the fix, and a JSON download.

## Models

| Model                      | What it is                                                    |
| -------------------------- | ------------------------------------------------------------- |
| `map-saved-2026-09-06`     | Answer index, profile, four pressures, archetype              |
| `operational-1.0`          | Repair hours, capacity pressure, Kingman waiting illustration |
| `manifestation-revision-3` | Recorded scenario index. Inspector only. Uncalibrated         |

The formulas and their limits are in `src/telemetry/VISUALIZER_MASTER.md`. `npm test` checks the published audit values, including the 120-package week and the revision-3 index.

## Telemetry

`POST /api/telemetry` accepts event batches and holds a short in-memory buffer for the life of the process. It is not a warehouse and it stores no secrets.

## Deploy

Production is [flow-visualizer-telemetry.vercel.app](https://flow-visualizer-telemetry.vercel.app), project `flow-visualizer-telemetry` on the Vercel team `erikhbush-8628s-projects`. `.vercel/project.json` holds the team and project ids. It holds no token.

Hermes Agent manages this project from a checkout of the repo. Point its terminal at the Vercel Sandbox backend, then give it the project token outside git:

```bash
hermes config set terminal.backend vercel_sandbox
hermes config set terminal.vercel_runtime node24
hermes config set terminal.container_cpu 2
hermes config set terminal.container_memory 4096
```

Set `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` in the Hermes environment. The ids are the `projectId` and `orgId` in `.vercel/project.json`. Do not commit the token. With those three values, Hermes can deploy, read logs, and change the project. `hermes setup terminal` reads the same project file when this directory is the working directory.
