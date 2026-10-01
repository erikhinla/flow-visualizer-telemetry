import { getDepartment } from './departments';
import { manifestation } from './manifestation';
import { compareScenario } from './operational';
import {
  ARCHETYPE_LABEL,
  PRESSURE_LABEL,
  PROFILE_COPY,
  isComplete,
  scoreMap,
  teamHours,
  type MapAnswers,
} from './questionnaire';
import type { DepartmentId, EvidenceKind, ScenarioInputs } from './types';
import { MANIFESTATION_MODEL_VERSION, MAP_MODEL_VERSION, OPERATIONAL_MODEL_VERSION } from './types';

export interface PortableRecordInput {
  answers: MapAnswers;
  teamSize: number;
  departmentId: DepartmentId;
  evidenceKind: EvidenceKind;
  inputs: ScenarioInputs;
  modifierOn: boolean;
  reviewedOn: string;
}

export function buildRecord(input: PortableRecordInput) {
  const department = getDepartment(input.departmentId);
  const comparison = compareScenario(input.inputs);
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
    reviewedOn: input.reviewedOn,
    map: map
      ? {
          rawScore: map.raw,
          answerIndex: map.index,
          profile: map.profile,
          profileStatement: PROFILE_COPY[map.profile],
          pressures: map.pressures.map((id) => ({ id, label: PRESSURE_LABEL[id] })),
          archetype: { id: map.archetype, label: ARCHETYPE_LABEL[map.archetype] },
          savedSiteDestination: map.destination,
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
        'Repair hours equal item count × missing share × repair minutes ÷ 60.',
        'Required hours equal necessary handling + repair + other hours.',
        'Capacity pressure equals required hours ÷ available role-hours.',
        'Waiting uses a single-server Kingman approximation. Arrivals are treated as spread across the available role-hours.',
        'Variability of 1 matches exponential arrivals and service. It is not measured from timestamps.',
        'The changed column is the same workflow with one connection altered. It is not an observed improvement.',
        'Ongoing hours are the cost of keeping the new connection. Net hours can be negative.',
        'Necessary review is not counted as repair.',
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
    action: {
      change: department.action.change,
      ownerRole: department.action.ownerRole,
      evidence: department.action.evidence,
      reviewInDays: department.action.reviewInDays,
    },
  };
}
