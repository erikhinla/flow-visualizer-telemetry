import { AGENCY_BALANCE } from './agency';
import { getDepartment } from './departments';
import { presentedEvidence } from './evidence';
import { manifestation } from './manifestation';
import { compareScenario, scenarioDirty } from './operational';
import {
  ARCHETYPE_LABEL,
  PRESSURE_LABEL,
  PROFILE_COPY,
  isComplete,
  scoreMap,
  teamHours,
  type MapAnswers,
} from './questionnaire';
import { deskTrace, factState } from './trace';
import type { DepartmentId, EvidenceKind, ScenarioInputs } from './types';
import { MANIFESTATION_MODEL_VERSION, MAP_MODEL_VERSION, OPERATIONAL_MODEL_VERSION } from './types';

export interface PortableRecordInput {
  answers: MapAnswers;
  teamSize: number;
  departmentId: DepartmentId;
  evidenceKind: EvidenceKind;
  attested: boolean;
  inputs: ScenarioInputs;
  modifierOn: boolean;
  reviewedOn: string;
}

export function buildRecord(input: PortableRecordInput) {
  const department = getDepartment(input.departmentId);
  const comparison = compareScenario(input.inputs);
  const provenance = presentedEvidence({
    evidenceKind: input.evidenceKind,
    attested: input.attested,
    dirty: scenarioDirty(input.inputs, department.sample),
    known: comparison.baseline.known,
  });
  const map = isComplete(input.answers) ? scoreMap(input.answers) : null;
  const hours = map ? teamHours(map.profile, input.teamSize) : null;
  const index =
    map === null
      ? null
      : manifestation({
          answers: input.answers.values as Array<0 | 1 | 2>,
          departmentId: input.departmentId,
          modifierOn: input.modifierOn,
        });

  return {
    model: {
      map: MAP_MODEL_VERSION,
      operational: OPERATIONAL_MODEL_VERSION,
      manifestation: MANIFESTATION_MODEL_VERSION,
    },
    evidenceKind: input.evidenceKind,
    provenance,
    reviewedOn: input.reviewedOn,
    map: map
      ? {
          rawScore: map.raw,
          answerIndex: map.index,
          profile: map.profile,
          profileStatement: PROFILE_COPY[map.profile],
          pressures: map.pressures.map((id) => ({ id, label: PRESSURE_LABEL[id] })),
          archetype: { id: map.archetype, label: ARCHETYPE_LABEL[map.archetype] },
          historicalCampaignReference: {
            path: map.destination,
            note: 'Not a route in this app.',
          },
          teamSize: input.teamSize,
          presetHoursPerWeek: hours,
          note: 'The answer index and the hour range come from the questionnaire. They are not measured workload.',
        }
      : null,
    workflow: {
      department: department.name,
      departmentCode: department.id,
      moniker: department.moniker,
      workItem: department.workItem,
      period: department.period,
      gap: department.gap,
      repair: department.repair,
      repairRole: department.repairRole,
      connection: department.connection,
      compare: department.compare,
    },
    scenario: {
      inputs: input.inputs,
      baseline: comparison.baseline,
      changed: comparison.changed,
      repairDeltaHours: comparison.repairDeltaHours,
      ongoingHours: input.inputs.ongoingHours,
      netReleasedHours: comparison.netReleasedHours,
      pressureWithOngoing: comparison.pressureWithOngoing,
      assumptions: [
        'Hours spent finding it equal the job count × the share still being searched for × the minutes to find one ÷ 60.',
        'Hours the desk needs equal the real work + the search + other hours.',
        'How full the desk is equals the hours it needs ÷ the hours it has.',
        'Waiting uses a single-desk approximation. Arrivals are treated as spread across the desk hours.',
        'A variability of 1 is an assumption. It is not measured from timestamps.',
        'The second column is the same week with one fix. It is not an observed improvement.',
        'The hours to keep the fix are its weekly cost. What comes back can be negative.',
        'The client’s review and the craft are not counted as time spent finding the work.',
      ],
    },
    manifestation: index
      ? {
          version: MANIFESTATION_MODEL_VERSION,
          modifierOn: input.modifierOn,
          score: index.score,
          heightFeet: index.height,
          capped: index.capped,
          note: 'Uncalibrated scenario index. Height is an artistic scale, not a physical or financial measurement.',
        }
      : null,
    foundation: {
      complete: comparison.baseline.known && comparison.baseline.band !== 'unknown',
      state: factState(comparison.baseline.band, comparison.baseline.repairHours),
      facts: deskTrace(input.departmentId).facts,
      keystones: deskTrace(input.departmentId).keystones,
      ownerRole: department.action.ownerRole,
      reviewInDays: department.action.reviewInDays,
      note: 'On screen, keystone actions stay hidden until the scenario is known. This record keeps the planned actions and marks whether the Trace was complete.',
    },
    balance: AGENCY_BALANCE[input.departmentId],
    action: {
      change: department.action.change,
      ownerRole: department.action.ownerRole,
      evidence: department.action.evidence,
      reviewInDays: department.action.reviewInDays,
    },
  };
}
