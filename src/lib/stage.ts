import type { AudienceId } from './audiences';
import type { PressureId } from './types';

/**
 * Stage of work where the work stalls. PROOF never names a department:
 * 15 answers cannot place a stall in one. Each pressure maps to the stage it describes.
 */
const MEMORY: Record<AudienceId, string> = {
  agency: 'Briefs, approvals, and feedback',
  consulting: 'Scope and sign-off',
  service: 'Quotes and job notes',
};

export function stageFor(audienceId: AudienceId, id: PressureId): string {
  switch (id) {
    case 'start':
      return 'Getting work started';
    case 'handoff':
      return 'When work changes hands';
    case 'next':
    case 'priorities':
      return 'Knowing what’s next';
    case 'memory':
    case 'scattered':
      return MEMORY[audienceId];
    case 'followup':
    case 'loose-followup':
    case 'revenue':
    case 'some-manual':
      return 'Follow-up';
    case 'ownership':
    case 'informal-owner':
      return 'Knowing who has it';
    case 'decisions':
      return 'Last-minute calls';
    case 'key-person':
      return 'When someone’s out';
    case 'pipeline':
    case 'partial-pipe':
      return 'Seeing where jobs stand';
    case 'repeat':
    case 'sometimes-repeat':
      return 'Redoing work';
    case 'learning':
    case 'loop':
      return 'Learning from past jobs';
    case 'ai':
    case 'tools':
      return 'AI in the work';
    case 'shape':
      return 'Day to day';
  }
}
