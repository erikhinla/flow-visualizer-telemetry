'use client';

import { useRouter } from 'next/navigation';
import { decodeHandoff, HANDOFF_PARAM } from '../lib/handoff';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
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
  const router = useRouter();
  const bootSession = useRef<SessionState | null>(null);
  const [session, setSession] = useState(createDefaultSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let restored = bootSession.current ?? createDefaultSession();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!bootSession.current && raw) restored = parseSession(raw) ?? restored;
    } catch {
      // Keep the sample session if storage is unavailable.
    }

    const receive = () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      if (!fragment.has(HANDOFF_PARAM)) return;
      const handoff = decodeHandoff(fragment.get(HANDOFF_PARAM) ?? '');
      fragment.delete(HANDOFF_PARAM);
      const cleanHash = fragment.size ? `#${fragment}` : '';
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${cleanHash}`);
      if (!handoff) {
        router.replace('/map');
        setSession(current => ({ ...current, ...emptyAnswers(), mapCompleted: false }));
        bootSession.current = { ...restored, ...emptyAnswers(), mapCompleted: false };
        return;
      }
      // Start from a simulated sample, never carry an old observed claim into a new Scan.
      const next = handoff.departmentId
        ? withDepartment(createDefaultSession(), handoff.departmentId)
        : createDefaultSession();
      router.replace(handoff.departmentId ? '/visualizer' : '/map');
      const received = { ...next, ...handoff.answers, mapCompleted: true };
      bootSession.current = received;
      setSession(received);
    };
    setSession(restored);
    receive();
    bootSession.current ??= restored;
    setReady(true);
    const onHashChange = () => receive();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [router]);

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
