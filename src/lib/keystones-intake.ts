import { decodeProof } from './proof-code';
import { QUESTIONS } from './questionnaire';
import { safeList, safeLong, safeText } from './keystones-server';

export type Json = Record<string, unknown>;
export const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown, n: number): unknown[] => (Array.isArray(v) ? v.slice(0, n) : []);

function values(v: unknown, keys: string[]): Record<string, string> {
  const o = obj(v);
  const out: Record<string, string> = {};
  for (const k of keys) if (typeof o[k] === 'string' && o[k]) out[k] = safeLong(o[k], 600);
  return out;
}

/** Keep only the fields the generator reads, each cleaned and size-capped, so nothing else reaches the file system. */
export function cleanIntake(raw: Json): Json | string {
  const agency = safeText(raw.agency_name, 80);
  if (!agency) return "The agency's name is missing, or it's a name a computer can't use for a folder. Try a different spelling.";
  const departments = arr(raw.departments, 20).map((d) => {
    const o = obj(d);
    return { name: safeText(o.name, 60), lead: safeText(o.lead, 80), roles: safeList(o.roles, 20, 80) ?? [] };
  }).filter((d) => d.name);
  if (!departments.length) return 'At least one department is needed.';
  const rounds = arr(raw.rounds, 20).map((r, i) => {
    const o = obj(r);
    return { id: `R${i + 1}`, name: safeText(o.name, 60), reviewers: safeList(o.reviewers, 20, 80) ?? [], business_affairs: o.business_affairs === true, client_sees: o.client_sees === true, purpose: safeLong(o.purpose, 300) };
  }).filter((r) => r.name);
  if (!rounds.length) return 'At least one review round is needed.';
  const names = departments.map((d) => d.name);
  const handoffs = arr(raw.handoffs, 40).map((h) => {
    const o = obj(h);
    return { from: safeText(o.from, 60), to: safeText(o.to, 60), items: arr(o.items, 30).map((x) => safeLong(x, 200)).filter(Boolean) };
  }).filter((h) => names.includes(h.from) && names.includes(h.to) && h.items.length);
  const mandatory_types = safeList(raw.mandatory_types) ?? [];
  const legal_line_types = safeList(raw.legal_line_types) ?? [];
  const out: Json = {
    agency_name: agency, departments, rounds, handoffs,
    stages: safeList(raw.stages, 20, 60), deliverables: safeList(raw.deliverables), mandatory_types, legal_line_types,
    rights_types: safeList(raw.rights_types), usual_media: safeList(raw.usual_media), usual_territories: safeList(raw.usual_territories),
    change_channels: safeList(raw.change_channels),
    mandatory_values: values(raw.mandatory_values, mandatory_types), legal_values: values(raw.legal_values, legal_line_types),
    storage: safeText(raw.storage, 80) || undefined, version_style: safeText(raw.version_style, 80) || undefined,
    record_owner: safeText(raw.record_owner, 80) || undefined, rights_owner: safeText(raw.rights_owner, 80) || undefined,
  };
  const fp = obj(raw.first_project);
  if (safeText(fp.client) && safeText(fp.project)) {
    out.first_project = {
      client: safeText(fp.client, 80), project: safeText(fp.project, 80), code: safeText(fp.code, 40),
      due: safeText(fp.due, 20), flight_start: safeText(fp.flight_start, 20), flight_end: safeText(fp.flight_end, 20),
    };
  }
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

/** PROOF answers from the browser, or from the code carried through checkout when the browser has none. */
export function proofAnswers(raw: unknown, code: string | null): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(raw))) if (/^q\d{1,2}$/.test(k) && typeof v === 'string' && /^q\d{1,2}-c\d$/.test(v)) answers[k] = v;
  if (Object.keys(answers).length === 0 && code) {
    const d = decodeProof(code);
    if (d) QUESTIONS.forEach((q, i) => { if (d.answers.optionIds[i]) answers[q.id] = d.answers.optionIds[i]; });
  }
  return answers;
}

