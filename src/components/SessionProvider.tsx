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
import {
  STORAGE_KEY,
  createDefaultSession,
  editSession,
  isUntouchedSession,
  parseSession,
  withDepartment,
  type SessionState,
} from '../lib/session';
import { emptyAnswers } from '../lib/questionnaire';
import type { DepartmentId, ScenarioInputs } from '../lib/types';

interface SessionApi {
  ready: boolean;
  session: SessionState;
  setSession: Dispatch<SetStateAction<SessionState>>;
  selectDepartment: (id: DepartmentId) => void;
  editInputs: (patch: Partial<ScenarioInputs>) => void;
  resetMap: () => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(createDefaultSession);
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
    try {
      if (isUntouchedSession(session)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage can be full or blocked. The desk still works for this visit.
    }
  }, [ready, session]);

  const selectDepartment = useCallback((id: DepartmentId) => {
    setSession((current) => withDepartment(current, id));
  }, []);

  const editInputs = useCallback((patch: Partial<ScenarioInputs>) => {
    setSession((current) => editSession(current, patch));
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

  const clearSession = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory desk still resets.
    }
    setSession(createDefaultSession());
  }, []);

  return (
    <SessionContext.Provider
      value={{ ready, session, setSession, selectDepartment, editInputs, resetMap, clearSession }}
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
