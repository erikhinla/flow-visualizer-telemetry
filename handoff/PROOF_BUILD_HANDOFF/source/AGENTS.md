# Agent instructions

Read `src/telemetry/VISUALIZER_MASTER.md`, `DECISION_LOG.md`, and the current tests before editing.

- Preserve all 15 Momentum Map questions, 60 option identities, values, pressure IDs, and archetype precedence.
- Keep survey-derived results, illustrative scenarios, and operational observations separate in code and UI.
- Never call a survey score a measured business result.
- Do not persist questionnaire answers or add a telemetry backend without an approved governance decision.
- Record formula changes in `DECISION_LOG.md` with model version and regression fixtures.
- Run `npm run check` before claiming local verification.
- Report local, pushed, merged, deployed, and browser-verified states separately.
