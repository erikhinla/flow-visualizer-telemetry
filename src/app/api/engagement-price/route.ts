import { NextResponse } from 'next/server';
import { manifestation } from '../../../lib/manifestation';
import { calculateEngagementPrice, PRICING_MODEL_VERSION } from '../../../lib/pricing';
import { QUESTIONS } from '../../../lib/questionnaire';
import { isDepartmentId } from '../../../lib/departments';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  if (!input || !isDepartmentId(input.departmentId) || !Array.isArray(input.optionIds) ||
      input.optionIds.length !== QUESTIONS.length || (input.modifierOn !== undefined && typeof input.modifierOn !== 'boolean')) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const choices = QUESTIONS.map((question, index) =>
    question.choices.find((choice) => choice.id === input.optionIds[index]));
  if (choices.some((choice) => !choice)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const result = manifestation({
    answers: choices.map((choice) => choice!.value),
    departmentId: input.departmentId,
    modifierOn: input.modifierOn ?? false,
  });
  return NextResponse.json({
    ok: true, currency: 'USD', version: PRICING_MODEL_VERSION,
    departmentId: input.departmentId, modifierOn: input.modifierOn ?? false, score: result.score,
    ...calculateEngagementPrice(result.score),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
