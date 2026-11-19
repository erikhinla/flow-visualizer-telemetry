import { QUESTIONS, emptyAnswers, isComplete, scoreMap, suggestDepartment, type MapAnswers } from './questionnaire';
import { MAP_MODEL_VERSION } from './types';
import type { DepartmentId } from './types';

export const HANDOFF_VERSION = 1;
export const HANDOFF_PARAM = 'proof';
const MAX_PAYLOAD_LENGTH = 1024;

/** Carries choices, never trusts a score from the caller, band, archetype, or function. */
export function encodeHandoff(answers: MapAnswers): string {
  if (!isComplete(answers)) throw new Error('A handoff requires 15 valid choices.');
  const json = JSON.stringify({ v: HANDOFF_VERSION, m: MAP_MODEL_VERSION, c: answers.optionIds });
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeHandoff(encoded: string): {
  answers: MapAnswers;
  score: NonNullable<ReturnType<typeof scoreMap>>;
  departmentId: DepartmentId | null;
} | null {
  if (!encoded || encoded.length > MAX_PAYLOAD_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const data: unknown = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const payload = data as Record<string, unknown>;
    if (Object.keys(payload).sort().join(',') !== 'c,m,v') return null;
    if (payload.v !== HANDOFF_VERSION || payload.m !== MAP_MODEL_VERSION) return null;
    if (!Array.isArray(payload.c) || payload.c.length !== QUESTIONS.length) return null;
    const choices = payload.c;
    const answers = emptyAnswers();
    for (let index = 0; index < QUESTIONS.length; index += 1) {
      const choice = QUESTIONS[index].choices.find(item => item.id === choices[index]);
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

/** Fragment is not sent in HTTP requests, access logs, or Referer headers. */
export function handoffPath(answers: MapAnswers, basePath = '/proof/screen'): string {
  return `${basePath}/visualizer#${HANDOFF_PARAM}=${encodeHandoff(answers)}`;
}
