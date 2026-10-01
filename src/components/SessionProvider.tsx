'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { getDepartment, isDepartmentId } from '../lib/departments';
import { emptyAnswers } from '../lib/questionnaire';
import type { DepartmentId, EvidenceKind, ScenarioInputs } from '../lib/types';

const STORAGE_KEY = 'flow.visualizer.session.v1';

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
}

interface SessionApi {
  ready: boolean;
  session: SessionState;
  setSession: Dispatch<SetStateAction<SessionState>>;
  selectDepartment: (id: DepartmentId) => void;
  editInputs: (patch: Partial<ScenarioInputs>) => void;
  resetMap: () => void;
}

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(createDefaultSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = parseSession(raw);
        if (parsed) setSession(parsed);
      }
    } catch {
      // Keep the sample session if storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [ready, session]);

  const selectDepartment = useCallback((id: DepartmentId) => {
    setSession((current) => ({
      ...current,
      departmentId: id,
      evidenceKind: 'simulated',
      inputs: getDepartment(id).sample,
    }));
  }, []);

  const editInputs = useCallback((patch: Partial<ScenarioInputs>) => {
    setSession((current) => ({
      ...current,
      inputs: { ...current.inputs, ...patch },
      evidenceKind: current.evidenceKind === 'simulated' ? 'estimated' : current.evidenceKind,
    }));
  }, []);

  const resetMap = useCallback(() => {
    const blank = emptyAnswers();
    setSession((current) => ({
      ...current,
      values: blank.values,
      optionIds: blank.optionIds,
      mapCompleted: false,
    }));
  }, []);

  return (
    <SessionContext.Provider
      value={{ ready, session, setSession, selectDepartment, editInputs, resetMap }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionApi {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession requires SessionProvider');
  return value;
}

function createDefaultSession(): SessionState {
  const blank = emptyAnswers();
  return {
    values: blank.values,
    optionIds: blank.optionIds,
    teamSize: 1,
    departmentId: 'ACC',
    evidenceKind: 'simulated',
    inputs: getDepartment('ACC').sample,
    modifierOn: false,
    mapCompleted: false,
  };
}

function parseSession(raw: string): SessionState | null {
  const data = JSON.parse(raw) as Partial<SessionState>;
  if (!data || typeof data !== 'object') return null;
  if (!Array.isArray(data.values) || data.values.length !== 15) return null;
  if (!Array.isArray(data.optionIds) || data.optionIds.length !== 15) return null;
  if (!data.departmentId || !isDepartmentId(data.departmentId)) return null;
  if (!data.inputs || !isScenario(data.inputs)) return null;
  if (!data.evidenceKind || !EVIDENCE.includes(data.evidenceKind)) return null;
  const departmentId = data.departmentId;
  const evidenceKind = data.evidenceKind;

  const values = data.values.map((value) =>
    value === 0 || value === 1 || value === 2 ? value : null
  );
  const optionIds = data.optionIds.map((id) => (typeof id === 'string' ? id : null));

  return {
    values,
    optionIds,
    teamSize: typeof data.teamSize === 'number' ? data.teamSize : 1,
    departmentId,
    evidenceKind,
    inputs: data.inputs,
    modifierOn: Boolean(data.modifierOn),
    mapCompleted: Boolean(data.mapCompleted),
  };
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
