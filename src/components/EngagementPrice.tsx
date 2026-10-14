'use client';

import { useEffect, useState } from 'react';
import type { DepartmentId } from '../lib/types';
import type { EngagementPrice as Price } from '../lib/pricing';
import { QUESTIONS } from '../lib/questionnaire';

type Quote = Price & { score: number; departmentId: string; currency: string; version: string };
const money = (value: number, digits = 0) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits,
}).format(value);

export function EngagementPrice({ optionIds, departmentId, modifierOn }: {
  optionIds: Array<string | null>; departmentId: DepartmentId; modifierOn: boolean;
}) {
  const key = JSON.stringify({ optionIds, departmentId, modifierOn });
  const complete = optionIds.length === 15 && optionIds.every(Boolean);
  const [result, setResult] = useState<{ key: string; quote: Quote | null }>({ key: '', quote: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!complete) return;
    const controller = new AbortController();
    fetch('/api/engagement-price', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key,
      signal: controller.signal, cache: 'no-store',
    }).then(async (response) => {
      const body = await response.json();
      if (!controller.signal.aborted) setResult({ key, quote: response.ok && body.ok ? body : null });
    }).catch(() => { if (!controller.signal.aborted) setResult({ key, quote: null }); });
    return () => controller.abort();
  }, [complete, key, attempt]);

  const quote = result.key === key ? result.quote : null;
  const selections = QUESTIONS.map((question, index) =>
    question.choices.findIndex((choice) => choice.id === optionIds[index]));
  return (
    <section className="action-card" aria-labelledby="engagement-price-title" aria-live="polite">
      <p className="kicker">BizBlueprint · one-time engagement · USD</p>
      <h2 id="engagement-price-title">Indicative engagement price</h2>
      {!complete ? <p>Finish the 15 Answers to calculate a price for this department.</p> :
        result.key !== key ? <p>Calculating the indicative price.</p> : !quote ?
        <p>The price is unavailable. <button type="button" className="button ghost" onClick={() => {
          setResult({ key: '', quote: null }); setAttempt((value) => value + 1);
        }}>Try again</button></p> : <>
          <p className="index-figure">{money(quote.finalPrice)} <small>indicative</small></p>
          <p>Context-coordination scenario: {quote.score.toFixed(2)} / 100 · {departmentId}.</p>
          <details><summary>How the price is calculated</summary>
            <p>$95,000 × the scenario index ÷ 100 = {money(quote.annualLoad, 2)} modeled annual load.
              15% gives {money(quote.rawEngagementPrice, 2)} before the $1,500 minimum.</p>
            <p>I round the result to the nearest dollar, then apply the minimum.
              {quote.floorApplied ? ' The minimum applies here.' : ''}</p>
          </details>
          <p>Your PROOF score shows the degree of context coordination load. The indicative price is
            15% of the annual cost of that load, using a $95,000 basis for one full-time coordinator.
            This is not a measured business loss or a guaranteed ROI figure. Scope is agreed after
            we walk through the pattern.</p>
          <p className="note">The index and cost basis are model assumptions. The selected modifier is {modifierOn ? 'on (illustrative aligned scenario)' : 'off (current scenario)'}.</p>
          <form action="https://transformby10x.ai/api/proof-handoff" method="post">
            <input type="hidden" name="selections" value={JSON.stringify(selections)} />
            <input type="hidden" name="departmentId" value={departmentId} />
            <input type="hidden" name="modifierOn" value={String(modifierOn)} />
            <p>I’ll carry these answers and this department into booking. The price is recalculated there.</p>
            <button type="submit" className="button">Book a Call</button>
          </form>
        </>}
    </section>
  );
}
