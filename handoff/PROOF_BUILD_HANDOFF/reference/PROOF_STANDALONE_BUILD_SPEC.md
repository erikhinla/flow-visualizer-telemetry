# PROOF: standalone build specification

Version: proof-standalone-spec-1.1 | Date: 2026-09-27

## 1. Authority and scope

I am commissioning a standalone, browser-session PROOF app. This specification implements the bounded audit decisions approved in this task. It replaces the earlier provisional specification and the supplied build prompt where they conflict. It specifies the app to build; it does not claim that the app has been built or verified.

I use PROOF as the product name and “trace” as the method. I use the September 26 Global Guide's subtitle “Fog & Friction Forensics”, with “See where people are carrying what the system can't” and “Ambiguity Doesn't Automate.” PROOF means Process, Response, Output, Operating Capacity, Friction. The creative document and supplied prompt use “Fog & Friction Finder”; I record that conflict rather than silently rewriting either source. This task's approved decision selects Forensics for this app.

I ground this specification in the already inspected local engine at `/Users/test/PROJECTS/flow-visualizer-telemetry`, its tests and decision log, its `src/telemetry/VISUALIZER_MASTER.md`, the September 26 Global Guide and the PROOF Creative System. The inspected local checkout was at commit `e72f4b8fb5662c955c087d40fffb011d6fee0d95` with uncommitted changes, including the readout. That working tree, GitHub's default branch and a deployed website are distinct evidence states. I did not complete a fresh engine verification run or inspect the source PDFs directly.

I use the following method chain exactly:

Answers → Patterns → Pressure → Likely human repair → Friction risk → First investigation

I treat that chain as an investigation method, not an established causal relationship in a particular business. I follow one recurring task type through one or more explicitly identified work items, from request to accepted completion. One case has one workflow boundary. Departments are optional context within that workflow.

I keep Momentum Map optional. It can suggest where to look. Only documented Trace evidence supports observed findings. PROOF does not implement a fix. BizBlueprint remains out of scope. An action in Trace is a proposal or a record of a change made elsewhere.

### Build boundary

I include manual evidence entry, a workflow timeline with an equivalent accessible list, handoffs, repair records, source references, guarded metrics, comparison, a six-section readout, JSON import/export and a printable readable summary.

I exclude accounts, cloud storage, uploads of source files, integrations, payments, request delivery, email, collaboration, background collection, AI-generated findings, analytics and production service claims. This is a single-user session tool. A downloaded case can be reopened later. It is not a managed confidential investigation service.

I build with Next.js App Router, strict TypeScript and Vitest. I start from the inspected engine's package manifest and lockfile in a separate standalone project, preserving the existing checkout and its uncommitted changes. I record the copied baseline and any necessary dependency changes. The inspected manifest lists Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3 and Vitest 5.0.0; these are source observations, not a fresh installation or compatibility certification. Calculation modules are pure, typed and independently testable.

## 2. Decisions replacing the eight open gaps

| Gap | My decision for this build | Boundary |
| --- | --- | --- |
| Quantity / Speed / Flow | I use a flat set of 15 questions. | No invented five-question groups, vector scores or derived radar chart. |
| 0-3 versus 0/1/2 | I retain the supplied option values, 0/1/2, total 0-30, as `map-legacy-012-v1`. | Four options do not require four point values. This preserves compatibility, not measurement validity. No conversion from unknown 0-45 records. |
| h/200 versus h/300 | I retain h/200 only in a legacy reference module and tests. | Neither formula determines Trace findings. No h/300 implementation or silent substitution. |
| Monster height | I exclude the monster from the v1 interface and reports. I retain 30 feet only in legacy reference tests. | The creative sources specify 100 feet. A future creative display must use a separate version with V = 100 * M/100; historical revision-3 outputs retain 30. No monster appears in this release. |
| Preset hours and toggle | I remove both from the v1 product. | No preset hours, reduction slider or dormant feature flag capable of exposing these claims. Legacy 0.25 remains in compatibility tests only. |
| Known engine issues | I preserve the old engine behavior only as an explicitly named reference. I use option-specific investigation cues in the product. | I do not copy known misleading results into the public readout. No unvalidated replacement scalar model. |
| Trace governance | I use browser memory and explicit local export/import only. | No price, submission, supported-tool or server-retention claims. Hosted service governance remains separate future work. |
| Colors and type | I reuse the inspected implementation tokens and locally bundled Barlow fonts below. | These are implementation choices for review, not approved brand canon. |

I name the product rules `map-cues-v1`, the Trace formulas `trace-metrics-v1`, the schema `proof-case-1.0`, the readout rules `trace-readout-v1`, and the historical scenario `friction-fog-revision-3`.

## 3. Evidence and claims

I retain these evidence classes and labels:

| Class | Public label | Meaning |
| --- | --- | --- |
| SURVEY-DERIVED | From my answers | A pattern drawn from the answers I gave. |
| ASSUMED | To check | A possible explanation that has not been observed. |
| ILLUSTRATIVE | Illustrative | A model or example under stated assumptions. |
| PROPOSED | Proposed | A next action to consider. |
| OBSERVED | Observed | Documented in the work traced, within stated coverage. |

I give quantitative inputs an evidence kind: observed, self-reported, estimated or simulated. Classification and kind have different jobs. A self-reported duration stays self-reported even if I type it into a form. Clicking “confirmed” does not make it observed. A recorded recollection establishes that a report was made, not that the reported duration was measured.

I allow OBSERVED quantitative claims only when relevant inputs are observed and each has source references, work-item or workflow scope, period, coverage and collection method. A deterministic sum of observed logs may remain OBSERVED with derivation metadata. A queue prediction or extrapolation is ILLUSTRATIVE even when its inputs are observed. A mixed-input metric exposes each input kind and is labeled estimated or illustrative as appropriate. No automatic promotion to observed.

I represent value states as a tagged union: known(value), unknown(reason), not-applicable(reason). Zero is a known number. I use separate calculation outcomes: known, unknown, not-applicable, invalid, unavailable-capacity, no-finite-steady-state and not-comparable. NaN and Infinity never enter a case file or screen.

I do not infer hours, money, capacity, volume, revenue, probability, burnout or business performance from Map answers. I do not rank people. Required review, judgment and useful discussion remain necessary work unless evidence identifies an avoidable repeat or reconstruction component.

I do not use the claims “10X output”, “40-hour tax”, “75 percent reduction”, “execution drops to zero” or “enterprise freeze”. I do not label the answer index a health or readiness score.

## 4. Momentum Map

I preserve the supplied 15 questions, exact answer wording, option IDs and point values in Appendix A. No branching. A partial Map is a valid draft, but produces no Map report. It does not prevent an independent Trace.

I validate option IDs against the question catalog and derive point values from that catalog. An imported value that disagrees with its option ID is invalid. Exactly one answer per question is required for scoring. I reject duplicates and unknown question IDs.

I calculate S = sum(values), and h = Math.round(100 * S / 30), using JavaScript rounding. I keep both inside Show the Math as legacy answer-summary metadata. I state: “This index summarizes the supplied answer weights. It does not measure business performance.”

I preserve the historical band codes for compatibility, keyed on S only:

| S | Reachable rounded h values at band endpoints | Stored code |
| --- | --- | --- |
| 0-7 | 0-23 | FRAGMENTED |
| 8-14 | 27-47 | STALLED |
| 15-22 | 50-73 | SCALING |
| 23-30 | 77-100 | COMPOUNDING |

I do not present these codes as validated profiles or use their old narrative copy. The supplied h ranges were nominal thresholds, not the actual reachable endpoints. The flat sum also has a construct problem: Q1 describes location, not a better-to-worse scale. “Finishing” scores 2 but still reports a difficulty. I preserve the number for compatibility and let the selected option govern the investigation cue.

### Option-specific cue rules

I show at most four cue cards in question order, with an explicit “View all” control. I store all applicable cues and all triggered legacy pressures separately. Legacy pressure ordering remains zero-value pressures in question order, then one-value pressures in question order. I retain the complete list before any display slice, with question ID, selected option ID and pressure ID. The legacy reference in Appendix E fixes the pressure catalog and precedence; its original first-four result remains a separate compatibility snapshot. I do not call these the four largest problems or use score values to rank severity. The user chooses which task to follow. No cue automatically selects a department.

For Q1 I always retain the selected location as neutral task context, not an asserted pressure or cause: o1 starting, o2 switching tools, o3 waiting on others, o4 finishing. The context says “I selected {location} as where momentum is lost. I can follow one example.” Q1=o4 remains available as context but does not generate a causal headline. Context is displayed separately from concern cues. An all-2 response set has no asserted cause.

For Q2, Q3, Q5, Q6, Q7, Q9, Q10, Q11, Q12, Q13, Q14 and Q15, options o1-o3 create a cue using the exact selected option text: “I selected ‘{answer}’. I can check what this looks like in one recurring task.” Option o4 creates no concern cue. I do not treat automation itself as proof of effective follow-up or documented rules as proof they are followed.

For Q4: o1 creates no tool-overload or missing-path claim; o2 creates no tool-overload claim; o3 creates a cue to inspect connections between the tools in one task; o4 creates no concern cue. For Q8: o1-o3 create a cue quoting the selected answer and inviting inspection of its next handoff; o4 creates no concern cue. If Q4=o1 but Q8 names AI use, I flag a possible answer mismatch and allow review or retention with a note. I do not silently correct either answer or manufacture a combined inference.

I retain all answers regardless of cue eligibility. I derive no public archetype in v1. This removes the first-four selection bias, “None yet” tool-overload label, unsupported single-person diagnosis and perfect-score fallback. With no concern cues I say: “My answers do not identify a specific connection to investigate. I can still choose a recurring task.”

I keep historical archetype behavior in regression fixtures only. I do not use it to populate a public headline. In the inspected engine, the perfect-score body says no clear pressure while the headline still asserts fragmented information; both fields must be tested together. The current engine already uses `scoreIndex` and `answerScoreIndex`; I do not reintroduce `health`. I never recalculate historical records under a new version silently.

## 5. Case flow and minimum usable record

I start with three choices: Start a trace, Import a case, Take the Momentum Map. A sample case is separately labeled Illustrative and never mixed into real work.

1. I define a recurring task, the current work item, request/start boundary, accepted-completion definition, relevant stages and optional departments. I can add more instances of the same task type to the same case.
2. I record handoffs and required context. I mark each suspected connection confirmed, rejected or unknown, with support and a note. Confirmation is a review state, not an evidence upgrade.
3. I record events, repair and necessary work separately, with role labels and source references. I use no person-name field. I ask for redacted notes without personal identifiers or credentials.
4. I inspect metrics when the required inputs exist. I can save and export a useful qualitative case with every quantitative metric still unknown.
5. I propose one change and specify the evidence that would show whether it helped. When a change actually occurs, I record its date, scope and ongoing effort. A proposal does not create an after-period.
6. I compare only compatible records and write a readout with limitations beside the finding.
7. I export JSON and a readable summary. The interface warns before replacing a case or clearing unexported changes.

I require task name, scope and accepted-completion definition to mark a case scoped. I allow incomplete drafts. I require at least one documented work item, one evidence-supported finding or explicit insufficient-evidence statement, coverage and limitations to mark a readout reviewed. “Reviewed” never means independently verified. Export remains available for drafts.

I use internal IDs for records. Human roles describe responsibility, not performance. When overlap requires distinguishing simultaneous people with the same role, I use case-local anonymous labor-unit IDs, without names or cross-case identity tracking.

### Repair category vocabulary

I store one primary category: finding, clarifying, reconciling, re-entering, rerouting or verifying. I store searching, chasing, checking, remembering, reconnecting, translating and rebuilding as optional descriptive tags, not additional billable activities. Tags cannot duplicate a duration. “Verifying” alone does not establish avoidable work; each record has necessary, repair, mixed or unknown classification. Mixed records require a documented split before inclusion in repair totals.

### Request handling

I replace “Request a trace” with “Prepare my trace brief.” Fields remain task name, what keeps needing attention, and what I want to understand. The button creates a local brief for export. Confirmation says: “My trace brief is prepared in this session. Nothing has been sent. I can download it.” I do not display “received” without a real receiving service and verified delivery.

## 6. Record contract

I validate at runtime as well as in TypeScript. A case contains:

- Header: schemaVersion, caseId, caseRevision, createdAt, updatedAt, specificationVersion, modelVersions and datasetKind (real or illustrative).
- Scope: recurringTaskId, taskName, inclusion/exclusion rules, start and completion boundaries, timezone, calendar basis and coverage.
- Collections: surveyAnswers, workflows, workItems, handoffs, events, repairs, reviews, sourceRefs, metricInputs, scenarios, comparisons, actions and readout review notes.
- Provenance: source-file/model version when imported, migration records if any, and a session edit log. I do not call the editable log tamper-proof or independently audited.

Every record has an ID, revision, createdAt and updatedAt. References must resolve within the case. A work item has request/start timestamps, completion state, accepted-completion timestamp when known and version. An event has event type, occurredAt, recordedAt, sourceRef and work-item version. Reviews attach to the reviewed version, never automatically to a later revision.

A source reference has source type (direct observation, manual log, document reference, recollection or example), description, capturedAt, relevant time window, scope, coverage and optional safe reference URL. I do not fetch the URL or embed external content. Source files are not uploaded or embedded. An observed duration must specify its collection method. A label alone is insufficient provenance.

Each metric input has ID, quantity type, value-state, unit, evidence class, evidence kind, period, workflow boundary, sourceRefs, assumptions and collection coverage. Each computed result includes inputRefs, formula ID/version, unrounded result or explicit outcome, display precision and exclusions. Monetary inputs also include currency; rates include both count unit and time unit.

I keep scenarios separate from observations. A scenario references a baseline and explicit changed inputs. It cannot overwrite evidence. Editing an input invalidates affected derived results and the reviewed readout state. I recompute locally; imported cached outputs are never trusted as inputs.

## 7. Calculation rules

I implement the supplied Trace equations in Appendix C subject to these higher-priority guards. I do not implement queueing, ROI or artistic scenario outputs in the core readout. I place queueing and ROI in an explicitly opened advanced inspector, calculating only after all required fields and assumptions exist. These operational calculations are separate from the excluded survey scenario.

- Counts are nonnegative integers. Durations and ordinary rates are finite and nonnegative. Fractions are between 0 and 1. Missing/examined and missed/due numerators cannot exceed their denominator under the same cohort definition.
- Unknown numerator or denominator gives unknown. Known zero numerator with a positive denominator gives zero. Zero denominators give an explicit outcome with a reason, not a fabricated result.
- Empty repair logs give unknown unless coverage confirms an observed window with no repair. A partial log yields “documented repair hours in this coverage,” never a complete total.
- I normalize compatible units before calculation and reject incompatible units, scopes, periods and count definitions. Available capacity is explicitly entered or calculated from documented inputs, never preset from headcount.
- I retain full numeric precision through calculations, then round for display. Show the Math reveals both. I never round intermediate h differently from the legacy fixture.
- Person-minutes and elapsed minutes are separate dimensions. Different labor units can contribute concurrently. Overlapping intervals for the same labor unit require allocation; their allocated fractions cannot sum above 1. Aggregate group entries cannot duplicate their constituent logs. Unknown overlap makes a combined total unknown until reconciled.
- H_est uses mutually exclusive effort segments or an explicit allocation table. Observed and estimated segments cannot cover the same effort. A hybrid total displays its observed and estimated components and remains estimated overall.
- I sum blocked intervals as a union per work item, clipped to the reporting window. Open intervals end at the report cutoff and are labeled ongoing. I never add simultaneous waits for one item. Summing across items gives item-hours blocked, not elapsed time or labor hours.
- I use ISO timestamps with explicit offsets and an IANA timezone. Calendar time is the default. Business-time calculations require supplied working windows, holidays and exceptions. Otherwise business hours are unknown. I reject reversed intervals and handle daylight-saving transitions.
- I track unfinished items and their age separately from completed-item cycle times. Completed-only means are labeled as such and never presented as the whole population.
- Capacity and processing comparisons require documented, non-overlapping demand categories and the same pool/period. Positive demand with zero capacity gives unavailable-capacity. Zero demand and zero capacity gives unknown ratio, not 0%.
- Backlog includes transfer-in and transfer-out terms when the scope has transfers: B_next = B + A + R + T_in - C - X - T_out. These are distinct, documented lifecycle transitions. A negative result is invalid, not clamped to zero. Reopened items must previously have left unfinished inventory; accepted completions and cancellations cannot subtract the same transition twice.
- Graph nodes have a declared meaning: stages, not people. I store directed handoff edges. I report unique directed stage pairs separately from handoff-event count. The n(n-1)/2 comparison applies only to unordered pairs, so I compare it to an undirected projection; the directed no-self-loop maximum is n(n-1). Neither measures effort.
- Before/after records share task definition, scope, units, time basis and exposure. Different volumes require per-item values as well as totals. Different periods cannot be subtracted as if equal. Case-mix or staffing changes are disclosed. Incompatible records return not-comparable. A difference is not proof the change caused it.
- H_after excludes H_new_ongoing in the stated net formula. If after-period totals already include that effort, I use baseline minus inclusive after, and do not subtract it again. One-time implementation effort is shown separately from recurring capacity. Savings in person-hours do not automatically become cash savings or added margin.
- Queue models require explicit applicability confirmation and parameter sources. M/M/1 needs independent arrivals and service times, a stable single server and the stated distribution assumptions. Kingman additionally needs a compatible GI/G/1 interpretation; confirmed assumptions do not turn an approximation into a measurement. I reject lambda < 0, mu <= 0, negative coefficients of variation and mismatched time units. Lambda = 0 is allowed when all other inputs are valid. Rho >= 1 returns no-finite-steady-state for these models.
- Little's Law is not an automatic identity for an arbitrary short window or growing backlog. I require compatible population/boundary, stable long-run finite averages and effective throughput. A zero-throughput inversion yields unknown.
- ROI requires attributable monetary benefits and complete costs for the same currency and period, with positive cost. No default wage rate or extrapolated revenue. Attribution uncertainty remains visible.

I resolve the conflicting transparency rules for this release by excluding the proprietary survey scenario from public results, exports, browser bundles and public assets. Its coefficients, department weights and artistic formula remain developer-only regression material. The scenario is not merely hidden with CSS or a feature flag. User-entered operational metrics retain complete mathematical disclosure. Map answer normalization remains separately labeled as survey-derived; it is never interpreted as measured loss.

Every displayed operational metric has a reachable “Show the Math” control with raw inputs, source links, inclusion/exclusion rules, units, constants, formula version, assumptions, coverage, rounding and outcome reason. I render math from the same formula definitions used by calculation, not a separately typed approximation.

## 8. Readout

I retain six sections in this order. Each statement has its own evidence label and scope. A section does not acquire OBSERVED status because one unrelated field has evidence.

1. **What you're feeling.** With a Map, I quote the chosen answer or cue as survey-derived. Without a Map, I show the task concern as self-reported. Neither establishes measured burden.
2. **What's causing it.** I describe a specific handoff or missing context. A documented gap can be observed. The explanation for why it occurs remains assumed unless supported. The section label remains fixed; its dynamic headline says “I have not established a cause” when support is insufficient. A survey cue can name an investigation, not an observed cause.
3. **Where it's showing up.** I locate the work item, stage and handoff. Department examples are optional, assumed prompts. I do not paste a department narrative into a finding merely because the user selected that department.
4. **What it's taking away.** I show documented repair, waiting, unfinished work and coverage. Unknown values remain unknown. Necessary work is separate. I show no preset burden or person-level score.
5. **What matters first.** I propose one connection to examine or change, an owner role and the evidence needed. Payoffs are hypotheses, not promises.
6. **What happens next.** I name the next action, review date, comparison plan and unresolved evidence. If a change has been observed, I show compatible before/after values with limitations.

I preserve those established section labels exactly. I use first-person copy within them. I use “may” and “based on my answers” where an inference is made. I do not wrap categorical claims in a disclaimer and call that sufficient. When support is missing: “I don't have enough evidence to name a clear pattern. I can review my answers or follow one recurring task.”

I include a coverage and limitations block in the exported summary. The summary contains task/scope, six sections, sources, metric definitions and case/model versions. It omits detailed source notes unless explicitly included during export. Print styling removes controls and preserves evidence labels.

## 9. Session privacy and portability

I keep case content in browser memory only. I do not use cookies, localStorage, sessionStorage, IndexedDB, service workers, server actions, case APIs or URL parameters to store case content. Navigation within the app preserves memory; refresh, closing the tab or a crash may lose changes.

I display this before entry: “I keep this case in this browser session. I need to download it to keep a copy. Refreshing or closing this page may lose it.” I use dirty-state navigation guards and best-effort browser unload prompts, while stating they cannot guarantee recovery. An export creates a portable snapshot, not autosave.

I use no analytics, session replay, remote fonts, remote error reporting or third-party media. I keep answer text and evidence out of console output, errors and network requests. Hosting infrastructure can still receive ordinary connection metadata. I do not promise that visiting a hosted website discloses no IP address. Before public deployment I inspect actual hosting logs and terms; I cannot solve provider retention through frontend code.

I give JSON exports an explicit reminder that they are unencrypted and may contain sensitive case notes. I show included fields before export. I do not claim to erase downloaded files when clearing the session. I warn before exports and before destructive replacement, not before every ordinary edit.

I cap JSON import at 5 MiB, 10,000 total records, 10,000 characters per free-text field and 32 levels of nesting. These are adjustable engineering limits, not business facts. I enforce limits before creating a case. I accept only the declared schema, reject unknown executable or structural fields, invalid references, duplicate IDs, invalid values and unsafe object keys. I render all imported strings as text. I allow only explicit http/https source links with safe external-link handling; no HTML, script, data or javascript URLs. No automatic URL fetch.

I validate in a temporary object and show a case summary before replacing current memory. Failure leaves the current case untouched. Import replaces; it never silently merges. Unknown future schema/model versions are rejected with a specific message and leave the file unchanged. This release accepts only `proof-case-1.0`, including Map-only drafts in that schema. Existing Map files require an explicitly documented adapter in a later release; no unspecified legacy JSON format is promised. Unknown 0-45 inputs are not guessed into 0-30.

I export canonical inputs and provenance plus a clearly marked computed snapshot. On import I validate and recompute supported Map and operational results with their exact model versions. This schema does not accept legacy survey-scenario results or coefficients. Unsupported versions stop import rather than substituting current formulas. Export/import must preserve stable IDs, answer identity, explicit unknowns, timestamps and evidence labels.

## 10. Interface tokens and accessibility

I reuse these inspected implementation tokens as provisional values, not approved brand canon:

| Token | Value | Use |
| --- | --- | --- |
| --black | #090a0c | Canvas |
| --panel | #111318 | Panels |
| --panel-high | #171a20 | Raised panels |
| --ink | #f1eee8 | Main text |
| --muted | #9b9ca0 | Supporting text |
| --dim | #65676d | Decorative treatment only until contrast passes |
| --line | #30333a | Decorative separators |
| --line-hot | #7d2227 | Decorative emphasis |
| --red | #df3439 | Accent, subject to contrast checks |
| --red-dark | #8d1c22 | Decorative emphasis |
| --green | #68b691 | Confirmed-state accent plus text label |
| --chrome | #c1c3c6 | Neutral emphasis |
| --copper | #b77a58 | Warm accent |

I use the existing locally bundled Barlow 400/500/600 files for body text and Barlow Condensed 500/600/700 for display text. I copy the associated font licensing files with those assets. I load no external fonts. Body copy starts at 16px and supporting labels at 14px. I use `--ink` for required text when a dim or colored token fails contrast, and `--chrome` for required control boundaries when `--line` fails. I test every actual foreground/background pairing; existing CSS is not accessibility proof. I document any necessary contrast adjustment without claiming a brand change.

I target WCAG 2.2 AA. I check actual rendered contrast, keyboard access, focus visibility, screen-reader labels, errors, reflow and zoom. I use at least 44px primary touch targets as a design choice. I never convey evidence class or connection state by color alone. I provide text equivalents for the trace diagram and respect reduced motion. A token contrast check is not a full accessibility audit. Standard: https://www.w3.org/TR/WCAG22/

I make the story of the work the main view. No dial, score hero, dashboard card wall, decorative fog or generic SaaS illustration. I keep departments in contextual drill-downs. On narrow screens, the timeline becomes an ordered list with editable handoff details. No horizontal drag-only navigation.

I use contractions, short sentences and concrete actions. I use no em dashes or en dashes in app copy. I omit the supplied banned jargon and unrelated product/runtime names. Appendix source examples are reference content; public templates are rewritten into first person and checked for unsupported promises.

## 11. Implementation and acceptance

I organize pure modules under `src/lib`: survey.ts, map-cues.ts, departments.ts, readout.ts, trace.ts, evidence.ts, units.ts, intervals.ts and case-schema.ts. I put the legacy scenario in `src/lib/legacy/scenario.ts`, imported only by developer regression tests. No production import adapter, route, asset or export includes it. Public department data excludes the legacy weights; test-only fixtures retain them. The production readout does not import the legacy module. I use a client-owned case store with no persistent middleware. I keep rendering separate from calculation.

I supply README.md, DECISION_LOG.md, a schema document, a real-case blank template and a clearly labeled illustrative fixture. The decision log names each departure from the supplied prompt, its reason and affected model version. Every constant includes units, purpose and whether it is empirical, assumed or an engineering setting. A future formula change creates a new version and migration decision.

`npm run check` runs typecheck, tests and production build. Browser checks are separately recorded. I require these behavioral tests:

1. All 60 stable option IDs and values match Appendix A; equal-valued answers retain their identities; duplicate, missing and mismatched answers behave as specified.
2. Band boundaries use S=0,7,8,14,15,22,23,30 and h=0,23,27,47,50,73,77,100. No partial Map report.
3. Q1 finishing remains neutral location context; Q4 none creates no overload cue; Q4/Q8 disagreement is reviewable; all triggered legacy pressures and all public cues survive export even when only four are shown. First-four display never determines a diagnosis. All-2 answers produce no asserted cause in either headline or body. Public readouts name no archetype.
4. Legacy scenario fixtures in Appendix B pass at explicit tolerances: absolute error <= 1e-8 for M/V and <= 1e-10 for the modifier ratio. A validation wrapper rejects nonfinite, out-of-range and wrong-length inputs without changing the preserved revision-3 formula. Product reports, exports and browser bundles never contain its scenario values or coefficients. Historical preset-hour and modifier fixtures remain developer-only.
5. Trace worked examples in Appendix C pass. All zero-denominator states, invalid counts, absent data, nonfinite values, mixed units, periods and coverage are covered. Negative net change remains negative.
6. Blocked [09:00,10:00) and [09:30,10:30) for one item equal 90 elapsed minutes. Two distinct labor units working 30 minutes each equal 60 person-minutes and 30 elapsed minutes. Same-labor-unit overlap cannot produce inflated totals.
7. An empty unobserved log remains unknown. A documented fully observed no-repair window produces zero. Partial coverage never yields a complete-population claim.
8. Backlog B=10,A=5,R=1,C=4,X=2,T_in=3,T_out=1 gives 12. Double-counted transitions and negative inventory are invalid.
9. Baseline repair 9h, after repair 1h excluding 2h new ongoing effort gives 6h net. An inclusive after total of 3h also gives 6h, with no second deduction. A cost greater than the release can produce negative net change.
10. Observed evidence cannot be created by a confirmation toggle. Model output stays illustrative. Source edits invalidate dependent reviewed findings. Necessary review is not automatically repair.
11. JSON round-trip preserves IDs, options, explicit states and provenance. Import rejects oversized files, future schemas, unsafe strings/keys, broken references and unsupported models without changing the active case. Readable exports retain labels and limitations.
12. A user can start without a Map, scope a task, record a handoff and repair, inspect math, export, clear and re-import. A Map user can reach the same workspace. A qualitative case works without invented numbers.
13. Keyboard-only and narrow-screen flows work. Text equivalents expose the same content as graphics. Print output is legible. Reduced motion removes nonessential animation.
14. Browser network/storage inspection confirms no case content is transmitted or silently persisted during entry, edits, import, export and route changes. Explicit user-requested downloaded files are the sole persistence exception. The brief action sends nothing and claims nothing was received.
15. The six readout labels match Section 8 exactly. Local Barlow fonts load without remote requests. Rendered contrast, keyboard focus and control boundaries pass the required checks.
16. Legacy archetype fixtures remain reproducible: isolated Q14=0 gives executionStall; Q5=0 gives fragmentedWorkflow; Q7=0 gives bottleneckOperator; Q1=1 gives toolOverload, with other values at 2. These are historical compatibility results, never approved public diagnoses.

I report specification checks, implementation checks, browser checks, pushed state and deployment state separately, with the environment and date. Passing a formula fixture does not establish scientific validity. A specification document is not a built app.

### Future hosted-service boundary

I can complete this session prototype without inventing commercial policy. Before a hosted investigation service stores cases or receives requests, I need explicit decisions on operator responsibility, access/tenancy, authentication, encryption, audit access, retention/deletion including backups, source-file handling, permitted data, supported integrations and permissions, terms, scope, pricing, response process and verified receipt. Those decisions belong to that release. I do not conceal them behind a local prototype's “received” message.

## Appendix A. Fixed question catalog

Option IDs are q{n}-o{k}, where k is the position 1 to 4. There are 60 stable option IDs. Always store option ID plus value, because equal-valued options must keep their identity. Values are 0, 1 or 2.

Q1 Where does your business lose momentum most often?
   o1 Starting things=0 | o2 Switching between tools=1 | o3 Waiting on others=1 | o4 Finishing=2
Q2 How does your team know what to work on next?
   o1 We figure it out as we go=0 | o2 We have informal priorities=1 | o3 We've got a system, but it isn't always followed=1 | o4 We have a clear routing process=2
Q3 Where does your team keep the knowledge it needs?
   o1 In people's heads=0 | o2 In scattered docs and chats=0 | o3 In a loosely organized system=1 | o4 In a structured, accessible system=2
Q4 How many AI agents and tools do you use?
   o1 None yet=0 | o2 One or two, lightly=1 | o3 Several, but they aren't connected=1 | o4 Several, connected and producing consistent output=2
Q5 When a project ends, what happens to what was learned?
   o1 It disappears with the project=0 | o2 Some notes get saved somewhere=1 | o3 We debrief but nothing formal=1 | o4 We capture it and it improves future work=2
Q6 How does your business handle missed leads or unanswered inquiries?
   o1 They usually fall through the cracks=0 | o2 We follow up manually when we remember=0 | o3 We have a loose process=1 | o4 We have automated follow-up=2
Q7 How clear is ownership when something needs to get done?
   o1 Unclear - it often falls through=0 | o2 It depends on who is available=1 | o3 We have informal ownership=1 | o4 Every task has a clear owner and routing rule=2
Q8 How do AI agents and tools fit into your work?
   o1 Experimenting with no system=0 | o2 Using tools but results are inconsistent=1 | o3 Running workflows but they are fragmented=1 | o4 Using AI agents and tools with clear rules and oversight=2
Q9 How does your business make decisions under pressure?
   o1 Whoever speaks loudest=0 | o2 By whoever is available=0 | o3 Using loose guidelines=1 | o4 Using documented decision rules=2
Q10 How much of your revenue depends on manual follow-up or human memory?
   o1 Almost all of it=0 | o2 Most of it=0 | o3 Some of it=1 | o4 Very little - systems handle most of it=2
Q11 How often does your team repeat work that has already been done?
   o1 Frequently=0 | o2 Often=0 | o3 Sometimes=1 | o4 Rarely - we have reusable systems=2
Q12 What happens when a key person is unavailable?
   o1 Work stops=0 | o2 Things slow down significantly=0 | o3 We manage, but it's painful=1 | o4 The system continues without disruption=2
Q13 How visible is your pipeline or lead flow at any given moment?
   o1 Not visible at all=0 | o2 Partially visible=1 | o3 Mostly visible=1 | o4 Fully visible with real-time tracking=2
Q14 How does your business improve from what it executes?
   o1 It doesn't=0 | o2 Informally, through conversation=1 | o3 We review occasionally=1 | o4 We review results and update how we work=2
Q15 Which word best describes how work runs today?
   o1 Chaos=0 | o2 Reactive=0 | o3 Building=1 | o4 Compounding=2

Questions are asked in fixed order, with no branching. A partial questionnaire returns no report. Reject a selection whose option ID and value don't match.

## Appendix B. Historical scenario reference only

The following supplied formula and fixtures are preserved for comparison. Instructions inside this appendix to show a toggle, monster or number in the UI do not apply. Section 2 controls the product. The reference remains unchanged. Any future display-limit work must separately version a raw pre-cap M; capped M and artistic height are separate. I do not claim this model is calibrated or scientifically validated.

Label: ILLUSTRATIVE. Model version string: "friction-fog-revision-3". Reproduce it exactly.

a4 and a8 are the stored Q4 and Q8 values (index 3 and index 7).

O    = 0.2 + 0.15 × (a4 + a8)                  output proxy, range 0.2 to 0.8. Not an output count.
I    = 0 if h = 100, else 1 − h/100            fragility assumption
Ieff = 0.25 × I if the "Show the gap reduced" toggle is on, else I
D    = sqrt(u × d)                             department weights, see section 6
F    = O × Ieff × (1 − h/200)
M    = 0 if Ieff = 0, else min(100, (100/1.5) × (max(0, F × D))^1.8)
V    = 30 × M/100                              feet. An artistic display scale, not a measurement.

Disclose all of this in Show the Math:
- 0.2, 0.15, the department weights, 1.8, 1.5 and the 0.25 modifier are uncalibrated model choices.
- h = 100 gives M = 0. That's a model boundary, not proof a business is friction-free.
- Q4 and Q8 affect both the score and O, so a higher answer can raise M. The model doesn't guarantee that a better answer shrinks the picture.
- Reducing I to 0.25I multiplies uncapped M by 0.25^1.8 ≈ 0.08247. That's a model property, not a measured improvement.
- The toggle copy when on: "The formula now shows what it expects if the gap shrinks. It isn't a result you've achieved yet."

Regression fixtures (must pass):
- All 15 answers = 2, AM, toggle off or on → M = 0 and V = 0
- All answers = 0, AM, toggle off → M ≈ 6.244648356 and V ≈ 1.8733945068 (8 decimals)
- All answers = 0 except Q4 = 1, AM, toggle off → M ≈ 15.752548011
- All answers = 0, AM: M(toggle on) / M(toggle off) ≈ 0.25^1.8 (10 decimals)
- Any answer array whose length isn't 15 → throw "exactly 15"

## Appendix C. Supplied Trace equations

These equations are the baseline, qualified by Section 7. Illustrative fixtures remain separate from real cases. Advanced queue assumptions and ROI inputs must be complete before calculation. The worked fixture's unmentioned H_other is explicitly 0 for that example only. The Little fixture assumes compatible stable long-run averages.

All terms share one boundary, period and unit. Every denominator must be known and positive; otherwise return "unknown", not zero.

Volume ratio:
  R_volume = N_current / N_baseline
  Variants and accepted deliverables are counted separately. A zero or unknown baseline means no ratio.

Missing-context rate:
  p_missing = n_missing / n_examined
  Count each handoff once, even if several fields are missing. Track the missing-field categories separately. The result describes the sample only.

Repair effort, observed:
  H_obs = (1/60) × Σ t_j
  t_j = active repair person-minutes. Two people in one repair meeting count as two people's labor but one elapsed interval.

Repair effort, estimated:
  H_est = (1/60) × Σ_k N_k × p_k × t̄_k
  Per distinct activity k: N = item count, p = affected share (0 to 1), t̄ = mean active minutes per affected item. Reconcile overlaps. Never count the same effort from both logs and estimates.

Capacity:
  H_req = H_necessary + H_repair + H_other
  P     = H_req / H_available
  G_H   = max(0, H_req − H_available)
  Positive demand with zero available capacity is an "unavailable capacity" state, not a percentage. P > 1 means demand exceeds the specified capacity for that period.

Processing time:
  T_required = Σ_k N_k × t̄_k
  P_T        = T_required / T_available
  P_T > 1 means more required processing time than available. It says nothing about anyone's cognition or burnout.

Backlog:
  B_next = B + A + R − C − X
  B = unfinished, A = arrivals, R = reopened, C = accepted completions, X = cancellations. Transfers crossing the boundary need their own entries. Reopened is not the same as a new variant.

Throughput and misses:
  q_accepted = C_accepted / Δt
  r_miss     = N_missed / N_due

Coordination network:
  Model the actual handoffs as a graph G = (V, E) and count the real edges.
  C(n) = n(n − 1)/2 is shown only as an all-to-all comparison. It doesn't measure effort.

Queueing, only when the user confirms the assumptions fit:
  M/M/1 (Poisson arrivals, exponential service, one server, FIFO, unlimited queue):
    ρ = λ/μ, and must be < 1
    Wq = λ / (μ(μ − λ))
    W  = 1 / (μ − λ)
    Lq = ρ² / (1 − ρ)
    If λ ≥ μ, there is no finite steady state. Say so.
  Kingman (stable single-server queue, renewal, finite moments):
    Wq ≈ ((ca² + cs²)/2) × (ρ/(1 − ρ)) × τ
    ρ = λτ < 1
    ca = coefficient of variation of interarrival times; cs = coefficient of variation of service times
  Little's Law:
    L = λW (and Lq = λWq)
    Same boundary, population and units; long-run finite averages.
  Serial bottleneck:
    Throughput ≤ min_i(μ_i)
    Valid only when every item visits every stage once. Branching or shared capacity needs a richer model; flag it rather than compute.

Service time decomposition:
  s = s0 + J × s_r
  τ = E[s0] + p × E[s_r | J = 1]
  p = P(J = 1)

Intervention:
  ΔH_net = H_baseline − H_after − H_new_ongoing
  This may be negative. Allow it.
  ROI = (B_attributable − C_total) / C_total, only when C_total > 0 and both use the same currency and period. Otherwise show "not calculable". Released capacity, cash savings and added margin are different outcomes; never double-count the same hours.

Blocked elapsed time = the union of each item's blocked intervals.
Reports state business or calendar hours and include unfinished items and their age.

Worked fixture (ILLUSTRATIVE, must reproduce exactly):
  120 packages per week. 30% need 15 min of reconstruction. Necessary handling 20 h. Available 27 h.
  H0 = 120 × 0.30 × 15/60 = 9 h
  After the change: 10% need 5 min → H1 = 1 h
  ΔH = 8 h
  P0 = (20 + 9)/27 ≈ 1.074, and G_H = 2 h
  P1 = (20 + 1)/27 ≈ 0.778, and G_H = 0
  If the new connection needs 2 ongoing hours, ΔH_net = 6 h.
Queue fixture: μ = 6/h, M/M/1. λ = 3 → Wq 10 min; λ = 4.8 → 40 min; λ = 5.4 → 90 min; λ = 5.7 → 190 min.
Little fixture: L = 24 items, 12 completed per day → W = 2 days.

## Appendix D. Department reference catalog

I retain the supplied keys, codes, weights and example descriptions below for traceability. Weights are unused in production Trace math. Descriptions are prompts, never case findings. Connection and payoff lines are proposed ideas, not guaranteed effects. Public templates use first person and uncertainty appropriate to their evidence.

Weights are preset assumptions, not a measured dependency graph. There's no approved rule for rolling them into a company-wide number, so don't make one.

AM, ACC, Account Management, The Context Relay, u 1.2, d 1.5
  gap: Approval history is scattered; someone reconstructs client choices and the current version.
  repair: Account Management rebuilds the decision trail and identifies the approved version.
  connection: Keep every approval, version, owner, and decision together so nobody has to rebuild the client's history.
  fogTakes: Confidence in the client relationship. Time meant for the client goes into proving what was already decided.
  payoff: The team can stay present with the client because the decision trail travels with the work.
  compare: Reconstruction minutes and approval cycle time.

FIN, FIN, Finance, The Reconciliation Loop, u 1.5, d 1.1
  gap: Scope, authorization, vendor, charge, and invoice records do not reconcile.
  repair: Finance manually reconciles records across spreadsheets and systems.
  connection: Give each authorization, charge, and invoice one shared trail so the numbers explain themselves.
  fogTakes: Trust in the numbers. Every mismatch creates another round of checking before anyone can act with confidence.
  payoff: Finance can trust the trail behind each number without another reconciliation marathon.
  compare: Exception handling hours and unresolved age.

LGL, LGL, Legal, The Provenance Chain, u 1.6, d 1.0
  gap: The reviewed version lacks source, rights, or approval evidence.
  repair: Legal retrieves the missing provenance while downstream work waits.
  connection: Keep the source, rights, and approval with the exact version under review. If the work changes, reopen only the review that change requires.
  fogTakes: Confidence that the business can move safely. Missing proof turns review into a last-minute search for exposure.
  payoff: Legal can review the right work with the right proof already attached.
  compare: Retrieval effort and returns for missing evidence.

PROD, PRD, Production, The Version Stack, u 1.1, d 1.7
  gap: Approved masters are difficult to distinguish from variants.
  repair: Production opens loose files one by one to find master outputs.
  connection: Give every approved asset one unmistakable record showing what is final, where it can be used, and how it must be delivered.
  fogTakes: Time to make and confidence in what ships. People search through versions instead of finishing the work.
  payoff: Production can ship the right master the first time and keep its attention on making.
  compare: Retrieval time and first-pass acceptance.

STRAT, STR, Strategy, The Signal Filter, u 1.0, d 1.4
  gap: Inputs multiply without a clear decision question or retained intent.
  repair: Strategy filters plausible output until the decision-ready signal is clear.
  connection: Put the decision, its purpose, the evidence behind it, and the person responsible in one place before more output is created.
  fogTakes: Room to think. The team spends its judgment separating signal from piles of plausible output.
  payoff: Strategy gets the space to make a decision instead of repeatedly rediscovering its purpose.
  compare: Validation effort and avoidable reopened decisions.

CRTV, CRT, Creative, The Option Field, u 1.3, d 1.3
  gap: Feedback and intent separate from the work; selection and revision require reconstruction.
  repair: Creative rebuilds iteration logic and consolidates scattered feedback.
  connection: Keep the brief, approved direction, and final feedback with the work so every revision has a reason.
  fogTakes: Creative energy. People excavate old feedback when they should be making the next strong idea.
  payoff: Creative can create with confidence because the intent and the approved direction stay with the work.
  compare: Avoidable revision effort and time available for creative work.

PR, PR, Public Relations, The Approval Pulse, u 1.4, d 1.2
  gap: A response waits for current facts or a known approver.
  repair: Public Relations coordinates confirmation across the people holding current facts.
  connection: Decide who can approve each kind of response and keep the current facts ready for them.
  fogTakes: The moment to respond. Confidence drains while the team waits to learn what it can safely say.
  payoff: Public Relations can answer while the moment still matters, without guessing.
  compare: Time to authorized response and missed response windows.

MEDIA, MED, Media Buying / Planning, The Attribution Maze, u 1.2, d 1.4
  gap: Platforms use conflicting objectives, taxonomies, and attribution records.
  repair: Media planners reconcile conflicting platform records and definitions.
  connection: Use the same definitions for the goal, the platform action, the spend, and the result so performance can be compared without translation.
  fogTakes: Trust in what worked. Analysis becomes spreadsheet archaeology instead of a confident next move.
  payoff: The team can see what earned attention and decide where the next dollar belongs.
  compare: Reconciliation effort and unexplained differences.

HR, HR, Human Resources, The Human Context Check, u 1.0, d 1.1
  gap: Drafts depend on outdated policy or missing situational context.
  repair: Human Resources restores policy and situational context before approval.
  connection: Keep one current policy source and make the right human review obvious when a person's situation changes the answer.
  fogTakes: People's trust and dignity. A person can receive the wrong answer because the right context arrived late.
  payoff: People receive current, situation-aware guidance without HR rebuilding the facts each time.
  compare: Verification effort and preventable corrections.

OPS, OPS, Operations, The Missing Layer, u 1.8, d 1.8
  gap: Ownership, handoff acceptance, and completion evidence are missing.
  repair: Operations pieces together unlinked systems and orphaned handoffs.
  connection: Make the owner accept the task, show who steps in when it stalls, and define what finished means before work begins.
  fogTakes: Momentum and peace of mind. Work stays alive only because someone keeps chasing it.
  payoff: Work reaches done without one person carrying the entire business in their head.
  compare: Orphaned work, handoff age, and verified completions.

Department text remains ASSUMED (a place to look). An observed case finding must be a separate claim with its own source and coverage; selecting or confirming a department does not upgrade this catalog. Departments open as drill-downs, never as the main view. A workflow includes only its relevant departments, not all ten.

## Appendix E. Legacy survey catalog and regression behavior

This is developer-only compatibility reference from the supplied prompt, checked against the inspected engine. Its instructions to display profile or archetype copy do not apply to this release. Sections 4 and 8 govern public presentation. I preserve the pressure IDs, mappings and legacy precedence, retain the full triggered list before truncation, and do not portray historical archetypes as evidence-supported diagnoses. The supplied nominal h bands remain legacy labels; Section 4 gives reachable endpoints.

S = sum of the 15 values   (range 0 to 30)
h = round(100 × S / 30)    (the answer score index)
Never call h "health score" or "readiness score" in the UI.

Bands, keyed on S:
- S 0 to 7   → h 0 to 24   → FRAGMENTED
- S 8 to 14  → h 25 to 49  → STALLED
- S 15 to 22 → h 50 to 74  → SCALING
- S 23 to 30 → h 75 to 100 → COMPOUNDING

Profile copy:
- FRAGMENTED: "People are keeping work alive by hunting for information, remembering follow-up, and reconnecting decisions that should travel with the work."
- STALLED: "The business has a process, but people still bridge its weak points. When they are unavailable, momentum slows or stops."
- SCALING: "The business is moving, but repeated repair is taking time from better work. Growth will multiply that burden unless the gaps close."
- COMPOUNDING: "Work is moving with fewer manual repairs. The priority is protecting that confidence as AI creates more work, faster."

Pressure selection:
1. For every answer worth 0, collect its 0-map pressure, in question order.
2. Then, for every answer worth 1, collect its 1-map pressure, in question order.
3. Concatenate the two lists and show the first 4. Answers worth 2 add no pressure.
4. Store ALL triggered pressures in the record, even though the screen shows 4.

0-map (question: id | title | implication)
1 start | Work struggles to get moving | The first step is unclear, so energy is spent beginning instead of progressing.
2 next | Priorities are rebuilt in the moment | People decide what comes next as they go, which makes attention easy to pull off course.
3 memory | Information is scattered | People have to search messages or ask around before they can move with confidence.
4 tools | The work needs a path before another tool | A new tool can add output. It can't decide where that output belongs or who finishes it.
5 learning | Lessons disappear when the work ends | The next project pays again for knowledge the business already earned.
6 followup | Follow-up depends on memory | A lead or promise can disappear when the person remembering it gets pulled elsewhere.
7 ownership | Work can wait without an owner | People spend time finding someone to act while the task loses momentum.
8 ai | AI output arrives without a clear next step | People have to judge, route, and recover the output by hand before it becomes useful.
9 decisions | Pressure changes who gets heard | Decisions depend on presence or volume instead of the facts the work requires.
10 revenue | Revenue depends on remembering | Income stays exposed to the availability and memory of the people holding the follow-up.
11 repeat | Good work is being paid for twice | People repeat work because the useful answer didn't stay findable or reusable.
12 key-person | One absence can stop the work | The business loses momentum when the person carrying the missing context is unavailable.
13 pipeline | Leads can disappear from view | People can't act with confidence because the current status is hard to see.
14 loop | The business keeps relearning the same lesson | Completed work doesn't improve the next attempt, so avoidable problems return.
15 shape | Incoming work controls the day | People react to what arrives instead of protecting time for what matters most.

1-map (only these questions have one)
1 handoff | Momentum fades between tools and people | Waiting and switching interrupt the work before it reaches done.
2 priorities | Priorities live in conversation | The next move can change depending on who is present to explain it.
3 scattered | The current answer takes work to find | People can usually locate it, but the search steals focus from the task itself.
6 loose-followup | Follow-up is easy to lose | The next contact exists, but it isn't protected from distraction or absence.
7 informal-owner | Ownership depends on who is free | The most available person carries the work, whether or not they should.
10 some-manual | Some revenue still depends on memory | A busy week or missed reminder can still cost the business an earned opportunity.
11 sometimes-repeat | Some work has to be done again | Useful effort is lost when the answer can't travel into the next task.
13 partial-pipe | Part of the pipeline is hidden | A lead can sit still because the person who could move it can't see its status.

Archetype. Derive it from the 4 shown pressures, applying the rules in this order:
1. Any of key-person, ownership or informal-owner → bottleneckOperator
2. Else any of tools or handoff → toolOverload
3. Else any of start, loop or next → executionStall
4. Else → fragmentedWorkflow

The cause section must explain the pressure that actually resolved the archetype. That's the first shown pressure whose ID is in that archetype's driver list; if none, fall back to the first shown pressure. If no pressure was triggered, state no cause.

Archetype cause lines:
- bottleneckOperator: "Too much of the business depends on one person."
- toolOverload: "Every new tool adds more work between the work."
- executionStall: "Starting is easier than finishing."
- fragmentedWorkflow: "The information people need doesn't move with the work."

No-pressure copy: "Your answers didn't point to one clear pressure. The department view below is a place to look, not a finding."

## Source record and verification status

- [Global TBTX_BBAI_BBM Guide](https://docs.google.com/document/d/1oPSj3vSRot8KIgMdXTFDMKRiiZWYQ4ySPd0jWEmnjEo/edit), September 26: product naming, readout order, evidence boundaries, monster creative scale and proprietary-weight restriction.
- [PROOF Creative System](https://docs.google.com/document/d/1vA_8oasfpaM9ryR6QS6hmG2wfySiw-yeAv8aQFYR2D4/edit), retrieved copy modified September 23 with September 14 decisions: Finder naming, scoped tracing, mathematical disclosure and creative boundaries. The naming and disclosure conflicts are explicitly resolved for this release above.
- Local engine working tree: `/Users/test/PROJECTS/flow-visualizer-telemetry`; inspected commit and dirty-state boundary in Section 1. Source files inspected included survey, scenario, readout, departments, tests, decision log, Visualizer master, layout and CSS. Source snapshots and hashes were collected during the audit. I did not modify that source engine for this specification deliverable.
- Supplied build prompt: all 15 questions and 60 option texts/values matched the inspected survey catalog. Appendices preserve the question set, operational equations and historical fixtures. Legacy instructions are subordinate to the release rules in the main specification.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) supplies the accessibility acceptance standard. [GI/G/1 approximation reference](https://rossetti.github.io/RossettiArenaBook/app-qts1sb3.html) supplies context for the optional operational queueing model; neither validates the survey scoring.

I checked this corrected specification for consistency with the approved bounded audit, preservation of the fixed question catalog and historical fixture values, and removal of superseded naming, readout and typography instructions. This is document verification only. App implementation, fresh engine test completion, browser verification, pushing and deployment are not delivered or claimed by this document.
