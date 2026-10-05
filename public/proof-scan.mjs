// Generated from src/lib/scan-contract.ts. Run npm run export:scan; do not edit.

// src/lib/types.ts
var MAP_MODEL_VERSION = "map-proof-2026-10-05";

// src/lib/questionnaire.ts
var q = (number, text, choices) => ({
  id: `q${number}`,
  number,
  text,
  choices: choices.map(([choiceText, value, pressure], index) => ({
    id: `q${number}-c${index + 1}`,
    text: choiceText,
    value,
    pressure
  }))
});
var QUESTIONS = [
  q(1, "Where does campaign work lose momentum most often?", [
    ["Getting the work started", 0, "start"],
    ["Switching tools or desks", 1, "handoff"],
    ["Waiting on the client or another desk", 1, "handoff"],
    ["Finishing and getting it live", 2, null]
  ]),
  q(2, "How does the team know the next deliverable?", [
    ["We figure it out as we go", 0, "next"],
    ["We have informal priorities", 1, "priorities"],
    ["We have a system, but it is not always followed", 1, "priorities"],
    ["Every job has a clear next step", 2, null]
  ]),
  q(3, "Where do the brief, the approval, and the feedback live?", [
    ["In people's heads", 0, "memory"],
    ["In scattered docs, decks, and chats", 0, "memory"],
    ["In a loose folder or project", 1, "scattered"],
    ["In one record the next desk can open", 2, null]
  ]),
  q(4, "How many AI tools are in the making, the media, or the reporting?", [
    ["None yet", 0, "tools"],
    ["One or two, lightly", 1, null],
    ["Several, and they are not connected", 1, null],
    ["Several, connected, with consistent output", 2, null]
  ]),
  q(5, "When a campaign ends, what happens to what the team learned?", [
    ["It leaves with the campaign", 0, "learning"],
    ["Some notes are saved somewhere", 1, null],
    ["We debrief, but nothing is formal", 1, null],
    ["We capture it, and the next campaign is better", 2, null]
  ]),
  q(6, "How does the agency handle a missed lead, RFP, or client ask?", [
    ["It usually falls through", 0, "followup"],
    ["Someone follows up when they remember", 0, "followup"],
    ["We have a loose process", 1, "loose-followup"],
    ["Follow-up runs without relying on memory", 2, null]
  ]),
  q(7, "How clear is ownership when a deliverable must move?", [
    ["Unclear \u2014 it often falls through", 0, "ownership"],
    ["It depends on who is free", 1, "informal-owner"],
    ["Ownership is informal", 1, "informal-owner"],
    ["Every deliverable has an owner and a routing rule", 2, null]
  ]),
  q(8, "How do AI tools sit inside the work?", [
    ["Experiments, with no operating rules", 0, "ai"],
    ["In use, but the output is inconsistent", 1, null],
    ["Workflows run, but they are fragmented", 1, null],
    ["In use, with rules and a person accountable", 2, null]
  ]),
  q(9, "How are decisions made when a client or a flight is pressing?", [
    ["Whoever speaks loudest", 0, "decisions"],
    ["Whoever is available", 0, "decisions"],
    ["By loose guidelines", 1, null],
    ["By a written decision rule", 2, null]
  ]),
  q(10, "How much revenue still depends on someone remembering to follow up?", [
    ["Almost all of it", 0, "revenue"],
    ["Most of it", 0, "revenue"],
    ["Some of it", 1, "some-manual"],
    ["Very little \u2014 the system carries most of it", 2, null]
  ]),
  q(11, "How often does a desk remake or re-find work that already existed?", [
    ["Frequently", 0, "repeat"],
    ["Often", 0, "repeat"],
    ["Sometimes", 1, "sometimes-repeat"],
    ["Rarely \u2014 masters and decisions are reusable", 2, null]
  ]),
  q(12, "What happens when the person who holds the client or the craft is out?", [
    ["The work stops", 0, "key-person"],
    ["It slows sharply", 0, "key-person"],
    ["The team copes, painfully", 1, null],
    ["The work continues", 2, null]
  ]),
  q(13, "How visible are live jobs, flights, and approvals right now?", [
    ["Not visible", 0, "pipeline"],
    ["Partly visible", 1, "partial-pipe"],
    ["Mostly visible", 1, "partial-pipe"],
    ["Visible as they change", 2, null]
  ]),
  q(14, "How does the agency get better at the work it ships?", [
    ["It doesn't", 0, "loop"],
    ["Informally, in conversation", 1, null],
    ["We review sometimes", 1, null],
    ["We review results and change how the next job runs", 2, null]
  ]),
  q(15, "Which word best describes the studio today?", [
    ["Chaos", 0, "shape"],
    ["Reactive", 0, "shape"],
    ["Building", 1, null],
    ["Compounding", 2, null]
  ])
];
function savedDestination(profile) {
  if (profile === "FRAGMENTED" || profile === "STALLED") {
    return "/tbtx/blueprint";
  }
  return "/bbai";
}
function emptyAnswers() {
  return {
    values: Array.from({ length: QUESTIONS.length }, () => null),
    optionIds: Array.from({ length: QUESTIONS.length }, () => null)
  };
}
function isComplete(answers) {
  return answers.values.length === QUESTIONS.length && answers.optionIds.length === QUESTIONS.length && QUESTIONS.every(
    (question, index) => question.choices.some(
      (choice) => choice.id === answers.optionIds[index] && choice.value === answers.values[index]
    )
  );
}
function scoreMap(answers) {
  if (!isComplete(answers)) return null;
  let raw = 0;
  const zeros = [];
  const ones = [];
  QUESTIONS.forEach((question, index2) => {
    const value = answers.values[index2];
    if (value === null) return;
    raw += value;
    const choice = question.choices.find((item) => item.id === answers.optionIds[index2]);
    const pressure = choice?.pressure ?? null;
    if (value === 0 && pressure) zeros.push(pressure);
    if (value === 1 && pressure) ones.push(pressure);
  });
  const allPressures = [...zeros, ...ones];
  const pressures = allPressures.slice(0, 4);
  const index = Math.round(100 * raw / 30);
  return {
    raw,
    index,
    profile: profileFor(raw),
    pressures,
    allPressures,
    archetype: archetypeFor(allPressures),
    destination: savedDestination(profileFor(raw))
  };
}
function profileFor(raw) {
  if (raw <= 7) return "FRAGMENTED";
  if (raw <= 14) return "STALLED";
  if (raw <= 22) return "SCALING";
  return "COMPOUNDING";
}
function archetypeFor(pressures) {
  if (pressures.length === 0) return null;
  const has = (ids) => ids.some((id) => pressures.includes(id));
  if (has(["key-person", "ownership", "informal-owner"])) return "bottleneckOperator";
  if (has(["tools", "handoff"])) return "toolOverload";
  if (has(["start", "loop", "next"])) return "executionStall";
  return "fragmentedWorkflow";
}
var PRESSURE_DEPARTMENT = {
  start: "OPS",
  handoff: "ACC",
  next: "OPS",
  priorities: "OPS",
  memory: "ACC",
  scattered: "ACC",
  tools: "STR",
  learning: "STR",
  followup: "ACC",
  "loose-followup": "ACC",
  ownership: "OPS",
  "informal-owner": "OPS",
  ai: "STR",
  decisions: "STR",
  revenue: "FIN",
  "some-manual": "FIN",
  repeat: "PRD",
  "sometimes-repeat": "PRD",
  "key-person": "HR",
  pipeline: "MED",
  "partial-pipe": "MED",
  loop: "STR",
  shape: "OPS"
};
function suggestDepartment(pressures) {
  const first = pressures[0];
  if (!first) return null;
  return PRESSURE_DEPARTMENT[first];
}

// src/lib/handoff.ts
var HANDOFF_VERSION = 1;
var HANDOFF_PARAM = "proof";
var MAX_PAYLOAD_LENGTH = 1024;
function encodeHandoff(answers) {
  if (!isComplete(answers)) throw new Error("A handoff requires 15 valid choices.");
  const json = JSON.stringify({ v: HANDOFF_VERSION, m: MAP_MODEL_VERSION, c: answers.optionIds });
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeHandoff(encoded) {
  if (!encoded || encoded.length > MAX_PAYLOAD_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const data = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const payload = data;
    if (Object.keys(payload).sort().join(",") !== "c,m,v") return null;
    if (payload.v !== HANDOFF_VERSION || payload.m !== MAP_MODEL_VERSION) return null;
    if (!Array.isArray(payload.c) || payload.c.length !== QUESTIONS.length) return null;
    const choices = payload.c;
    const answers = emptyAnswers();
    for (let index = 0; index < QUESTIONS.length; index += 1) {
      const choice = QUESTIONS[index].choices.find((item) => item.id === choices[index]);
      if (!choice) return null;
      answers.values[index] = choice.value;
      answers.optionIds[index] = choice.id;
    }
    const score = scoreMap(answers);
    if (!score) return null;
    return { answers, score, departmentId: score.allPressures.length ? suggestDepartment(score.allPressures) : null };
  } catch {
    return null;
  }
}
function handoffPath(answers, basePath = "/proof/screen") {
  return `${basePath}/visualizer#${HANDOFF_PARAM}=${encodeHandoff(answers)}`;
}
export {
  HANDOFF_VERSION,
  MAP_MODEL_VERSION,
  QUESTIONS,
  archetypeFor,
  decodeHandoff,
  emptyAnswers,
  encodeHandoff,
  handoffPath,
  isComplete,
  profileFor,
  scoreMap,
  suggestDepartment
};
