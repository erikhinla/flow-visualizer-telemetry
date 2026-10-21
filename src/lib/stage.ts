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
      return 'Starting the work';
    case 'handoff':
      return 'Handoffs';
    case 'next':
    case 'priorities':
      return 'Deciding what comes next';
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
      return 'Ownership';
    case 'decisions':
      return 'Decisions under pressure';
    case 'key-person':
      return 'When one person is out';
    case 'pipeline':
    case 'partial-pipe':
      return 'Seeing live work';
    case 'repeat':
    case 'sometimes-repeat':
      return 'Rework';
    case 'learning':
    case 'loop':
      return 'Learning from finished work';
    case 'ai':
    case 'tools':
      return 'AI in the work';
    case 'shape':
      return 'Day-to-day rhythm';
  }
}
