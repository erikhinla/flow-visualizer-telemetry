export type DepartmentKey = "AM" | "FIN" | "LGL" | "PROD" | "STRAT" | "CRTV" | "PR" | "MEDIA" | "HR" | "OPS";

export type Department = {
  key: DepartmentKey;
  code: string;
  name: string;
  moniker: string;
  accent: string;
  upstreamWeight: number;
  dependencyWeight: number;
  gap: string;
  repair: string;
  connection: string;
  fogTakes: string;
  payoff: string;
  compare: string;
};

export const DEPARTMENTS: Record<DepartmentKey, Department> = {
  AM: {
    key: "AM", code: "ACC", name: "Account Management", moniker: "The Context Relay", accent: "#3b82f6", upstreamWeight: 1.2, dependencyWeight: 1.5,
    gap: "Approval history is scattered; someone reconstructs client choices and the current version.",
    repair: "Account Management rebuilds the decision trail and identifies the approved version.",
    connection: "Keep every approval, version, owner, and decision together so nobody has to rebuild the client's history.",
    fogTakes: "Confidence in the client relationship. Time meant for the client goes into proving what was already decided.",
    payoff: "The team can stay present with the client because the decision trail travels with the work.",
    compare: "Reconstruction minutes and approval cycle time.",
  },
  FIN: {
    key: "FIN", code: "FIN", name: "Finance", moniker: "The Reconciliation Loop", accent: "#10b981", upstreamWeight: 1.5, dependencyWeight: 1.1,
    gap: "Scope, authorization, vendor, charge, and invoice records do not reconcile.",
    repair: "Finance manually reconciles records across spreadsheets and systems.",
    connection: "Give each authorization, charge, and invoice one shared trail so the numbers explain themselves.",
    fogTakes: "Trust in the numbers. Every mismatch creates another round of checking before anyone can act with confidence.",
    payoff: "Finance can trust the trail behind each number without another reconciliation marathon.",
    compare: "Exception handling hours and unresolved age.",
  },
  LGL: {
    key: "LGL", code: "LGL", name: "Legal", moniker: "The Provenance Chain", accent: "#991b1b", upstreamWeight: 1.6, dependencyWeight: 1,
    gap: "The reviewed version lacks source, rights, or approval evidence.",
    repair: "Legal retrieves the missing provenance while downstream work waits.",
    connection: "Keep the source, rights, and approval with the exact version under review. If the work changes, reopen only the review that change requires.",
    fogTakes: "Confidence that the business can move safely. Missing proof turns review into a last-minute search for exposure.",
    payoff: "Legal can review the right work with the right proof already attached.",
    compare: "Retrieval effort and returns for missing evidence.",
  },
  PROD: {
    key: "PROD", code: "PRD", name: "Production", moniker: "The Version Stack", accent: "#f59e0b", upstreamWeight: 1.1, dependencyWeight: 1.7,
    gap: "Approved masters are difficult to distinguish from variants.",
    repair: "Production opens loose files one by one to find master outputs.",
    connection: "Give every approved asset one unmistakable record showing what is final, where it can be used, and how it must be delivered.",
    fogTakes: "Time to make and confidence in what ships. People search through versions instead of finishing the work.",
    payoff: "Production can ship the right master the first time and keep its attention on making.",
    compare: "Retrieval time and first-pass acceptance.",
  },
  STRAT: {
    key: "STRAT", code: "STR", name: "Strategy", moniker: "The Signal Filter", accent: "#7c3aed", upstreamWeight: 1, dependencyWeight: 1.4,
    gap: "Inputs multiply without a clear decision question or retained intent.",
    repair: "Strategy filters plausible output until the decision-ready signal is clear.",
    connection: "Put the decision, its purpose, the evidence behind it, and the person responsible in one place before more output is created.",
    fogTakes: "Room to think. The team spends its judgment separating signal from piles of plausible output.",
    payoff: "Strategy gets the space to make a decision instead of repeatedly rediscovering its purpose.",
    compare: "Validation effort and avoidable reopened decisions.",
  },
  CRTV: {
    key: "CRTV", code: "CRT", name: "Creative", moniker: "The Option Field", accent: "#db2777", upstreamWeight: 1.3, dependencyWeight: 1.3,
    gap: "Feedback and intent separate from the work; selection and revision require reconstruction.",
    repair: "Creative rebuilds iteration logic and consolidates scattered feedback.",
    connection: "Keep the brief, approved direction, and final feedback with the work so every revision has a reason.",
    fogTakes: "Creative energy. People excavate old feedback when they should be making the next strong idea.",
    payoff: "Creative can create with confidence because the intent and the approved direction stay with the work.",
    compare: "Avoidable revision effort and time available for creative work.",
  },
  PR: {
    key: "PR", code: "PR", name: "Public Relations", moniker: "The Approval Pulse", accent: "#06b6d4", upstreamWeight: 1.4, dependencyWeight: 1.2,
    gap: "A response waits for current facts or a known approver.",
    repair: "Public Relations coordinates confirmation across the people holding current facts.",
    connection: "Decide who can approve each kind of response and keep the current facts ready for them.",
    fogTakes: "The moment to respond. Confidence drains while the team waits to learn what it can safely say.",
    payoff: "Public Relations can answer while the moment still matters, without guessing.",
    compare: "Time to authorized response and missed response windows.",
  },
  MEDIA: {
    key: "MEDIA", code: "MED", name: "Media Buying / Planning", moniker: "The Attribution Maze", accent: "#84cc16", upstreamWeight: 1.2, dependencyWeight: 1.4,
    gap: "Platforms use conflicting objectives, taxonomies, and attribution records.",
    repair: "Media planners reconcile conflicting platform records and definitions.",
    connection: "Use the same definitions for the goal, the platform action, the spend, and the result so performance can be compared without translation.",
    fogTakes: "Trust in what worked. Analysis becomes spreadsheet archaeology instead of a confident next move.",
    payoff: "The team can see what earned attention and decide where the next dollar belongs.",
    compare: "Reconciliation effort and unexplained differences.",
  },
  HR: {
    key: "HR", code: "HR", name: "Human Resources", moniker: "The Human Context Check", accent: "#fb7185", upstreamWeight: 1, dependencyWeight: 1.1,
    gap: "Drafts depend on outdated policy or missing situational context.",
    repair: "Human Resources restores policy and situational context before approval.",
    connection: "Keep one current policy source and make the right human review obvious when a person's situation changes the answer.",
    fogTakes: "People's trust and dignity. A person can receive the wrong answer because the right context arrived late.",
    payoff: "People receive current, situation-aware guidance without HR rebuilding the facts each time.",
    compare: "Verification effort and preventable corrections.",
  },
  OPS: {
    key: "OPS", code: "OPS", name: "Operations", moniker: "The Missing Layer", accent: "#b45309", upstreamWeight: 1.8, dependencyWeight: 1.8,
    gap: "Ownership, handoff acceptance, and completion evidence are missing.",
    repair: "Operations pieces together unlinked systems and orphaned handoffs.",
    connection: "Make the owner accept the task, show who steps in when it stalls, and define what finished means before work begins.",
    fogTakes: "Momentum and peace of mind. Work stays alive only because someone keeps chasing it.",
    payoff: "Work reaches done without one person carrying the entire business in their head.",
    compare: "Orphaned work, handoff age, and verified completions.",
  },
};

export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS) as DepartmentKey[];
