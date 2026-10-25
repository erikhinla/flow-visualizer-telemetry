import { QUESTIONS, profileFor, type MapAnswers } from './questionnaire';
import type { ProfileId } from './types';

/**
 * The PROOF arithmetic, read straight from the scoring contract (map-proof-2026-10-05).
 * Nothing here scores. It explains scoreMap: every answer is worth 0, 1 or 2 points,
 * each question carries the same weight (1), raw is the sum (0 to 30),
 * index = round(100 x raw / 30), and the profile band comes from profileFor(raw).
 */
export const WEIGHT = 1;
export const POINTS_MAX = 2;
export const RAW_MAX = QUESTIONS.length * POINTS_MAX * WEIGHT; // 30

export const DIMENSIONS = [
  { letter: 'P', name: 'Process', questions: [0, 1, 2] },
  { letter: 'R', name: 'Response', questions: [3, 4, 5] },
  { letter: 'O', name: 'Output', questions: [6, 7, 8] },
  { letter: 'O', name: 'Operating capacity', questions: [9, 10, 11] },
  { letter: 'F', name: 'Friction', questions: [12, 13, 14] },
] as const;

/** Profile bands on raw points, as profileFor draws them. */
export const BANDS: ReadonlyArray<{ id: ProfileId; from: number; to: number }> = [
  { id: 'FRAGMENTED', from: 0, to: 7 },
  { id: 'STALLED', from: 8, to: 14 },
  { id: 'SCALING', from: 15, to: 22 },
  { id: 'COMPOUNDING', from: 23, to: 30 },
];

export interface DimensionMath {
  letter: string;
  name: string;
  points: number;
  answered: number;
  max: number;
  values: Array<0 | 1 | 2 | null>;
}

export interface LiveMath {
  answered: number;
  raw: number;
  /** Lowest and highest raw still possible with the open questions. */
  floor: number;
  ceiling: number;
  index: number | null;
  profile: ProfileId | null;
  dimensions: DimensionMath[];
  /** Answers that flag a pressure at 0 points (ranked first) and at 1 point. */
  pressureAtZero: number;
  pressureAtOne: number;
}

export function liveMath(answers: MapAnswers): LiveMath {
  let raw = 0;
  let answered = 0;
  let pressureAtZero = 0;
  let pressureAtOne = 0;
  QUESTIONS.forEach((question, index) => {
    const value = answers.values[index];
    if (value === null || value === undefined) return;
    answered += 1;
    raw += value * WEIGHT;
    const choice = question.choices.find((item) => item.id === answers.optionIds[index]);
    if (choice?.pressure && value === 0) pressureAtZero += 1;
    if (choice?.pressure && value === 1) pressureAtOne += 1;
  });
  const open = QUESTIONS.length - answered;
  const done = open === 0;
  return {
    answered,
    raw,
    floor: raw,
    ceiling: raw + open * POINTS_MAX * WEIGHT,
    index: done ? Math.round((100 * raw) / RAW_MAX) : null,
    profile: done ? profileFor(raw) : null,
    pressureAtZero,
    pressureAtOne,
    dimensions: DIMENSIONS.map((dimension) => {
      const values = dimension.questions.map((index) => answers.values[index] ?? null);
      return {
        letter: dimension.letter,
        name: dimension.name,
        values,
        points: values.reduce<number>((sum, value) => sum + (value ?? 0) * WEIGHT, 0),
        answered: values.filter((value) => value !== null).length,
        max: dimension.questions.length * POINTS_MAX * WEIGHT,
      };
    }),
  };
}

/**
 * Capacity-cost equivalent. Equations 08 + 09 (Context repair cost) of the nine Friction Model
 * equations; with 01 Map score above, PROOF runs 3 of the 9:
 * C_hour = salary / 2,080 and annual = hours x team x C_hour x 52.
 * This prices time, it is not cash savings or ROI.
 */
export const HOURS_PER_YEAR = 2080;
export const WEEKS_PER_YEAR = 52;
export const DEFAULT_SALARY = 90000;

export interface Estimate {
  hourly: number;
  weekly: number;
  annual: number;
  salaryShare: number;
}

export function estimate(team: number, salary: number, hours: number): Estimate {
  const t = Math.max(0, team || 0);
  const s = Math.max(0, salary || 0);
  const h = Math.max(0, hours || 0);
  const hourly = s / HOURS_PER_YEAR;
  const weekly = h * t * hourly;
  const annual = weekly * WEEKS_PER_YEAR;
  return { hourly, weekly, annual, salaryShare: s > 0 ? annual / s : 0 };
}
