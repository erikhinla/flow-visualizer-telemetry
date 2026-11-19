import type { EvidenceKind } from './types';

export interface Presentation {
  kind: EvidenceKind;
  sentence: string;
  /** A sample, or an unknown desk, cannot be marked observed. */
  locked: boolean;
}

/**
 * The combobox may select Observed or Self-reported early.
 * Those kinds are presented only after `attested` is true.
 * The next edit clears both.
 */
export function presentedEvidence(input: {
  evidenceKind: EvidenceKind;
  attested: boolean;
  dirty: boolean;
  known: boolean;
}): Presentation {
  if (!input.dirty || !input.known) {
    return {
      kind: 'simulated',
      sentence: 'Simulated sample. Not a measured agency.',
      locked: true,
    };
  }
  if (
    input.attested &&
    (input.evidenceKind === 'observed' || input.evidenceKind === 'self-reported')
  ) {
    const sentence =
      input.evidenceKind === 'observed'
        ? "Marked as observed. PROOF didn't check these figures."
        : "Marked as self-reported. PROOF didn't check these figures.";
    return { kind: input.evidenceKind, sentence, locked: false };
  }
  return {
    kind: 'estimated',
    sentence: 'Estimated. Not an observation.',
    locked: false,
  };
}
