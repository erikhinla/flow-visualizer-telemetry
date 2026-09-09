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
  compare: string;
};

export const DEPARTMENTS: Record<DepartmentKey, Department> = {
  AM: {
    key: "AM", code: "ACC", name: "Account Management", moniker: "The Context Relay", accent: "#3b82f6", upstreamWeight: 1.2, dependencyWeight: 1.5,
    gap: "Approval history is scattered; someone reconstructs client choices and the current version.",
    repair: "Account Management rebuilds the decision trail and identifies the approved version.",
    connection: "One approval record linking version, owner, change history, and decision.",
    compare: "Reconstruction minutes and approval cycle time.",
  },
  FIN: {
    key: "FIN", code: "FIN", name: "Finance", moniker: "The Reconciliation Loop", accent: "#10b981", upstreamWeight: 1.5, dependencyWeight: 1.1,
    gap: "Scope, authorization, vendor, charge, and invoice records do not reconcile.",
    repair: "Finance manually reconciles records across spreadsheets and systems.",
    connection: "Shared identifiers and a traceable transaction trail.",
    compare: "Exception handling hours and unresolved age.",
  },
  LGL: {
    key: "LGL", code: "LGL", name: "Legal", moniker: "The Provenance Chain", accent: "#991b1b", upstreamWeight: 1.6, dependencyWeight: 1,
    gap: "The reviewed version lacks source, rights, or approval evidence.",
    repair: "Legal retrieves the missing provenance while downstream work waits.",
    connection: "Evidence attached to the reviewed version; material changes reopen the appropriate review.",
    compare: "Retrieval effort and returns for missing evidence.",
  },
  PROD: {
    key: "PROD", code: "PRD", name: "Production", moniker: "The Version Stack", accent: "#f59e0b", upstreamWeight: 1.1, dependencyWeight: 1.7,
    gap: "Approved masters are difficult to distinguish from variants.",
    repair: "Production opens loose files one by one to find master outputs.",
    connection: "An approved asset record with status, rights, naming, and delivery requirements.",
    compare: "Retrieval time and first-pass acceptance.",
  },
  STRAT: {
    key: "STRAT", code: "STR", name: "Strategy", moniker: "The Signal Filter", accent: "#7c3aed", upstreamWeight: 1, dependencyWeight: 1.4,
    gap: "Inputs multiply without a clear decision question or retained intent.",
    repair: "Strategy filters plausible output until the decision-ready signal is clear.",
    connection: "A decision brief with sources, assumptions, criteria, and accountable decision.",
    compare: "Validation effort and avoidable reopened decisions.",
  },
  CRTV: {
    key: "CRTV", code: "CRT", name: "Creative", moniker: "The Option Field", accent: "#db2777", upstreamWeight: 1.3, dependencyWeight: 1.3,
    gap: "Feedback and intent separate from the work; selection and revision require reconstruction.",
    repair: "Creative rebuilds iteration logic and consolidates scattered feedback.",
    connection: "Shared brief, approved direction, criteria, and consolidated feedback.",
    compare: "Avoidable revision effort and time available for creative work.",
  },
  PR: {
    key: "PR", code: "PR", name: "Public Relations", moniker: "The Approval Pulse", accent: "#06b6d4", upstreamWeight: 1.4, dependencyWeight: 1.2,
    gap: "A response waits for current facts or a known approver.",
    repair: "Public Relations coordinates confirmation across the people holding current facts.",
    connection: "Evidence and an explicit approval path by response type.",
    compare: "Time to authorized response and missed response windows.",
  },
  MEDIA: {
    key: "MEDIA", code: "MED", name: "Media Buying / Planning", moniker: "The Attribution Maze", accent: "#84cc16", upstreamWeight: 1.2, dependencyWeight: 1.4,
    gap: "Platforms use conflicting objectives, taxonomies, and attribution records.",
    repair: "Media planners reconcile conflicting platform records and definitions.",
    connection: "Shared definitions connecting intent, platform action, spend, and evidence.",
    compare: "Reconciliation effort and unexplained differences.",
  },
  HR: {
    key: "HR", code: "HR", name: "Human Resources", moniker: "The Human Context Check", accent: "#fb7185", upstreamWeight: 1, dependencyWeight: 1.1,
    gap: "Drafts depend on outdated policy or missing situational context.",
    repair: "Human Resources restores policy and situational context before approval.",
    connection: "Versioned policy authority and an appropriate human review path.",
    compare: "Verification effort and preventable corrections.",
  },
  OPS: {
    key: "OPS", code: "OPS", name: "Operations", moniker: "The Missing Layer", accent: "#b45309", upstreamWeight: 1.8, dependencyWeight: 1.8,
    gap: "Ownership, handoff acceptance, and completion evidence are missing.",
    repair: "Operations pieces together unlinked systems and orphaned handoffs.",
    connection: "Accepted ownership, escalation paths, and explicit completion criteria.",
    compare: "Orphaned work, handoff age, and verified completions.",
  },
};

export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS) as DepartmentKey[];
