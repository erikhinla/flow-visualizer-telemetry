# Film to instrument contract

This change is in the instrument only. The film has not been connected. Deployment, rewrite, and shared production scoring are not verified.

## Source and release

`src/lib/questionnaire.ts` owns the 15 question IDs, 60 choice IDs and point values, pressure order, raw-score bands, and archetype precedence. `npm run export:scan` packages this same source as `public/proof-scan.mjs` and exports the question data as `public/proof-scan-contract.json`. Build and dev regenerate both.

The film should import `QUESTIONS`, `emptyAnswers`, `scoreMap`, and `handoffPath` from the generated module rather than keep another scoring implementation. The film can map the unchanged option IDs to its own approved lines; it must not change points or reorder question IDs. A pinned copy of the module can be used, but the model version must match the instrument.

Model: `map-proof-2026-10-05`. Raw bands remain 0–7 FRAGMENTED, 8–14 STALLED, 15–22 SCALING, 23–30 COMPOUNDING. Internal band IDs are distinct from visible names. Visible wording, including Ssssstalled and 15 Answers, waits for Erik's approved line list. The supplied copy-decisions.md contains no approved selections.

Archetype precedence is unchanged, but it now examines every prioritized pressure rather than the first four. The Scan still displays the first four. No pressures means `archetype: null`; this includes a perfect score. Function suggestion remains the first prioritized pressure's existing department mapping. If there are no pressures, there is no suggested function.

## Payload

The completed film sends this relative path:

`/proof/screen/visualizer#proof=<base64url(JSON)>`

Decoded JSON:

```json
{"v":1,"m":"map-proof-2026-10-05","c":["q1-c2","q2-c4","q3-c4","q4-c4","q5-c4","q6-c4","q7-c4","q8-c4","q9-c4","q10-c4","q11-c4","q12-c4","q13-c4","q14-c4","q15-c4"]}
```

`v` is the handoff format version, `m` is the Scan model version, and `c` is exactly 15 canonical choice IDs in question order. The payload must contain exactly these three fields and be at most 1,024 encoded characters. The module's `handoffPath(answers)` builds it.

The instrument rejects unknown versions, missing or wrong-question choice IDs, incomplete data, and supplied score/band/department fields. It derives the points from its own choices and recomputes the score, bands, pressures, archetype, and suggested function. Encoding is not encryption or authentication; these remain self-selected answers.

A valid handoff replaces the previous Scan session, opens the suggested function's simulated sample directly, and removes the payload from the address. It does not turn a sample into observed counts. If there is no pressure or suggested function, it opens the completed Scan reading without asking again. An invalid handoff opens a fresh Scan without applying its result.

The fragment avoids putting answer choices in ordinary HTTP request URLs or Referer headers. The app's existing browser-local session behavior remains; there is no new server answer store.

Example film integration, for a future company-site change:

```js
const { QUESTIONS, emptyAnswers, scoreMap, handoffPath } =
  await import('/proof/screen/proof-scan.mjs');
const answers = emptyAnswers();
// For each selection, use the choice from QUESTIONS in canonical question order.
// answers.optionIds[index] = choice.id;
// answers.values[index] = choice.value;
const result = scoreMap(answers);
if (result) window.location.assign(handoffPath(answers));
```

## Subpath hosting

Build the instrument with:

```sh
PROOF_BASE_PATH=/proof/screen npm run build
```

This sets Next.js `basePath` to `/proof/screen` and supplies the same prefix to raw API fetches. Leave `assetPrefix` unset. Next.js handles links and bundled assets under basePath. This is a build-time setting; changing it requires a rebuild. Local root-mode remains available with PROOF_BASE_PATH unset.

Next.js references: https://nextjs.org/docs/14/app/api-reference/next-config-js/basePath and https://nextjs.org/docs/14/app/api-reference/next-config-js/assetPrefix.

The company site's future external rewrite must preserve the full path, including the prefix:

```js
{
  source: '/proof/screen/:path*',
  destination: 'https://<instrument-deployment-origin>/proof/screen/:path*'
}
```

Place this rule before a broad company-site catch-all. Do not strip `/proof/screen` at the destination. It must forward page routes, `_next` assets, API requests, the shared module, and the contract JSON. The public link is `https://transformby10x.ai/proof/screen`. The deployment origin is an internal rewrite destination, not a posting link.

## Outstanding release decisions

The separate manifestation-revision-3 illustration still has Q4/Q8-derived assumed volume and the documented non-monotonic counterexample. Scan raw points and bands are monotonic. No approved replacement manifestation formula was supplied. I have not invented one or called that defect fixed.

PR #5 still includes recovered local source whose exact production provenance is unverified. Vercel project-scope access and preview deployment are blocked. Company-site consumption and the public rewrite are not implemented. Public copy has no further approved changes.
