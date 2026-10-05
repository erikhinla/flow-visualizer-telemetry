import { getDepartment, isDepartmentId } from './departments';
import { scenarioDirty } from './operational';
import { clampTeam, emptyAnswers } from './questionnaire';
import type { DepartmentId, EvidenceKind, ScenarioInputs } from './types';

export const STORAGE_KEY = 'flow.visualizer.session.v1';

const EVIDENCE: readonly EvidenceKind[] = ['observed', 'self-reported', 'estimated', 'simulated'];

export interface SessionState {
  values: Array<0 | 1 | 2 | null>;
  optionIds: Array<string | null>;
  teamSize: number;
  departmentId: DepartmentId;
  evidenceKind: EvidenceKind;
  inputs: ScenarioInputs;
  modifierOn: boolean;
  mapCompleted: boolean;
  /** True only after the visitor checks the attestation box. */
  attested: boolean;
}

export function createDefaultSession(): SessionState {
  const blank = emptyAnswers();
  return {
    values: blank.values,
    optionIds: blank.optionIds,
    teamSize: 1,
    departmentId: 'PR',
    evidenceKind: 'simulated',
    inputs: getDepartment('PR').sample,
    modifierOn: false,
    mapCompleted: false,
    attested: false,
  };
}

/** A session still equal to the unsaved Public Relations sample. */
export function isUntouchedSession(session: SessionState): boolean {
  const blank = emptyAnswers();
  return (
    session.departmentId === 'PR' &&
    !scenarioDirty(session.inputs, getDepartment('PR').sample) &&
    session.evidenceKind === 'simulated' &&
    session.teamSize === 1 &&
    session.modifierOn === false &&
    session.mapCompleted === false &&
    session.attested === false &&
    session.values.every((value, index) => value === blank.values[index]) &&
    session.optionIds.every((id, index) => id === blank.optionIds[index])
  );
}

export function withDepartment(session: SessionState, id: DepartmentId): SessionState {
  return {
    ...session,
    departmentId: id,
    evidenceKind: 'simulated',
    inputs: getDepartment(id).sample,
    attested: false,
  };
}

/** Editing clears a released claim. It does not promote a simulated sample to estimated. */
export function editSession(session: SessionState, patch: Partial<ScenarioInputs>): SessionState {
  const released = session.evidenceKind === 'observed' || session.evidenceKind === 'self-reported';
  return {
    ...session,
    inputs: { ...session.inputs, ...patch },
    evidenceKind: released ? 'estimated' : session.evidenceKind,
    attested: false,
  };
}

export function parseSession(raw: string): SessionState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const data = parsed as Record<string, unknown>;
  if (!Array.isArray(data.values) || data.values.length !== 15) return null;
  if (!Array.isArray(data.optionIds) || data.optionIds.length !== 15) return null;
  if (typeof data.departmentId !== 'string' || !isDepartmentId(data.departmentId)) return null;
  if (!data.inputs || typeof data.inputs !== 'object' || !isScenario(data.inputs)) return null;
  if (typeof data.evidenceKind !== 'string' || !isEvidence(data.evidenceKind)) return null;

  const hasAttested = Object.prototype.hasOwnProperty.call(data, 'attested');
  if (isLegacyAccountDefault(data, hasAttested)) return null;

  const values = data.values.map((value) =>
    value === 0 || value === 1 || value === 2 ? value : null
  );
  const optionIds = data.optionIds.map((id) => (typeof id === 'string' ? id : null));
  const departmentId = data.departmentId;
  let evidenceKind: EvidenceKind = data.evidenceKind;
  let attested = hasAttested ? Boolean(data.attested) : false;
  const inputs = data.inputs;

  if (!scenarioDirty(inputs, getDepartment(departmentId).sample)) {
    evidenceKind = 'simulated';
    attested = false;
  }

  return {
    values,
    optionIds,
    teamSize: clampTeam(typeof data.teamSize === 'number' ? data.teamSize : 1),
    departmentId,
    evidenceKind,
    inputs,
    modifierOn: Boolean(data.modifierOn),
    mapCompleted: Boolean(data.mapCompleted),
    attested,
  };
}

function isLegacyAccountDefault(data: Record<string, unknown>, hasAttested: boolean): boolean {
  if (hasAttested) return false;
  if (data.departmentId !== 'ACC') return false;
  if (data.evidenceKind !== 'simulated') return false;
  if (data.teamSize !== 1) return false;
  if (data.modifierOn) return false;
  if (data.mapCompleted) return false;
  if (!Array.isArray(data.values) || data.values.some((value) => value !== null)) return false;
  if (!Array.isArray(data.optionIds) || data.optionIds.some((id) => id !== null)) return false;
  if (!data.inputs || typeof data.inputs !== 'object' || !isScenario(data.inputs)) return false;
  return !scenarioDirty(data.inputs, getDepartment('ACC').sample);
}

function isEvidence(value: string): value is EvidenceKind {
  return EVIDENCE.includes(value as EvidenceKind);
}

function isScenario(value: object): value is ScenarioInputs {
  const record = value as ScenarioInputs;
  return (
    isNum(record.itemCount) &&
    isNum(record.missingShare) &&
    isNum(record.repairMinutes) &&
    isNum(record.necessaryHours) &&
    isNum(record.otherHours) &&
    isNum(record.availableHours) &&
    isNum(record.variability) &&
    isNum(record.nextMissingShare) &&
    isNum(record.nextRepairMinutes) &&
    isNum(record.ongoingHours)
  );
}

function isNum(value: number | null): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}
