import type { AudienceId } from './audiences';
import { QUESTIONS, type MapAnswers } from './questionnaire';

/**
 * Compact code for a finished PROOF: version, audience letter, one digit (1 to 4) per answer.
 * Sent to Stripe as client_reference_id so the paid report is re-scored server side.
 */
const TO: Record<AudienceId, string> = { agency: 'a', consulting: 'c', service: 's' };
const FROM: Record<string, AudienceId> = { a: 'agency', c: 'consulting', s: 'service' };

export function encodeProof(audienceId: AudienceId, answers: MapAnswers): string | null {
  const digits: string[] = [];
  for (let i = 0; i < QUESTIONS.length; i += 1) {
    const k = QUESTIONS[i].choices.findIndex((c) => c.id === answers.optionIds[i]);
    if (k < 0) return null;
    digits.push(String(k + 1));
  }
  return `p1_${TO[audienceId]}_${digits.join('')}`;
}

export function decodeProof(code: string | null | undefined): { audienceId: AudienceId; answers: MapAnswers } | null {
  if (!code) return null;
  const m = /^p1_([acs])_([1-4]+)$/.exec(code.trim());
  if (!m || m[2].length !== QUESTIONS.length) return null;
  const answers: MapAnswers = { values: [], optionIds: [] };
  QUESTIONS.forEach((q, i) => {
    const c = q.choices[Number(m[2][i]) - 1];
    answers.values.push(c.value);
    answers.optionIds.push(c.id);
  });
  return { audienceId: FROM[m[1]], answers };
}
