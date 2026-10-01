"use client";

import { useMemo, useState } from "react";
import { buildFlowBlueprint, type FlowBlueprint } from "@/lib/blueprint";
import { DEPARTMENTS, DEPARTMENT_KEYS, type DepartmentKey } from "@/lib/departments";
import { PATHWAY } from "@/lib/pathway";
import type { EvidenceClass } from "@/lib/readout";
import { evaluateScenarioRevision3 } from "@/lib/scenario";
import {
  QUESTIONS,
  deriveSurveyReport,
  presetHours,
  selectedValues,
  type SurveyReport,
  type SurveySelection,
} from "@/lib/survey";

type Stage = "intro" | "survey" | "report" | "blueprint";

const ARCHETYPE_COPY: Record<SurveyReport["archetype"], string> = {
  bottleneckOperator: "Work depends on one person",
  toolOverload: "Tools create more coordination",
  executionStall: "Work starts but doesn't finish",
  fragmentedWorkflow: "People rebuild missing context",
};

const EVIDENCE_TONE: Record<EvidenceClass, "neutral" | "red" | "green"> = {
  "SURVEY-DERIVED": "neutral",
  ASSUMED: "neutral",
  ILLUSTRATIVE: "red",
  PROPOSED: "green",
};

const EVIDENCE_LABEL: Record<EvidenceClass, string> = {
  "SURVEY-DERIVED": "FROM YOUR ANSWERS",
  ASSUMED: "CONFIRM THIS",
  ILLUSTRATIVE: "SCENARIO, NOT MEASURED",
  PROPOSED: "CHANGE TO TEST",
};

function EvidenceTag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "red" | "green" }) {
  return <span className={`evidence-tag evidence-tag--${tone}`}>{children}</span>;
}

function BrandMark() {
  return (
    <div className="brand" aria-label="FLOW Fog and Friction Diagnostic">
      <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
      <span>FLOW <b>FOG &amp; FRICTION</b></span>
    </div>
  );
}

function MachineCore({ active = false }: { active?: boolean }) {
  return (
    <div className={`machine ${active ? "machine--active" : ""}`} aria-hidden="true">
      <div className="machine__orbit machine__orbit--outer" />
      <div className="machine__orbit machine__orbit--middle" />
      <div className="machine__orbit machine__orbit--inner" />
      <div className="machine__core">
        <span>15</span>
        <small>QUESTIONS</small>
      </div>
      <div className="machine__pipe machine__pipe--one" />
      <div className="machine__pipe machine__pipe--two" />
      <div className="machine__pipe machine__pipe--three" />
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <main className="intro">
      <header className="topbar">
        <BrandMark />
        <span className="topbar__note">15-question business diagnostic</span>
      </header>

      <section className="intro__grid">
        <div className="intro__copy">
          <p className="eyebrow"><span /> FIND WHERE THE FOG IS FORMING</p>
          <h1>Who's carrying the gaps in your business?</h1>
          <p className="intro__lede">
            AI creates more work, faster. The business can't always keep up, so people fill the gaps. That's Digital Fog. When they can't keep up either, work stalls. That's Digital Friction.
          </p>
          <ol className="intro__steps" aria-label="FLOW diagnostic pathway">
            {PATHWAY.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <div><strong>{step.title}</strong><small>{step.summary}</small></div>
              </li>
            ))}
          </ol>
          <button className="primary-action" onClick={onStart}>Find my fog <span aria-hidden="true">→</span></button>
          <p className="privacy-note">15 questions. Answers stay in this browser session.</p>
        </div>

        <div className="intro__machine">
          <p className="machine-label">Fog detector / waiting</p>
          <MachineCore />
          <div className="machine-caption">
            <span>WHAT YOU SHARE</span><strong>How work gets done now</strong>
            <span>WHAT YOU GET</span><strong>Where pressure is building</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

function Survey({
  selections,
  questionIndex,
  onAnswer,
  onBack,
}: {
  selections: SurveySelection[];
  questionIndex: number;
  onAnswer: (selection: SurveySelection) => void;
  onBack: () => void;
}) {
  const question = QUESTIONS[questionIndex];
  const currentSelection = selections.find((selection) => selection.questionId === question.id);

  return (
    <main className="survey-shell">
      <header className="topbar">
        <BrandMark />
        <span className="topbar__note">Question {String(questionIndex + 1).padStart(2, "0")} / 15</span>
      </header>
      <section className="survey">
        <div className="survey__index" aria-hidden="true">{String(questionIndex + 1).padStart(2, "0")}</div>
        <div className="survey__content">
          <p className="eyebrow"><span /> HOW WORK REALLY MOVES</p>
          <h1>{question.text}</h1>
          <div className="answer-grid" role="radiogroup" aria-label={question.text}>
            {question.options.map((answer, index) => (
              <button
                key={answer.id}
                className={currentSelection?.optionId === answer.id ? "answer answer--selected" : "answer"}
                role="radio"
                aria-checked={currentSelection?.optionId === answer.id}
                onClick={() => onAnswer({ questionId: question.id, optionId: answer.id, value: answer.value })}
              >
                <span>0{index + 1}</span>
                <strong>{answer.text}</strong>
                <i aria-hidden="true">→</i>
              </button>
            ))}
          </div>
          <button className="back-action" onClick={onBack} disabled={questionIndex === 0}>← Previous question</button>
        </div>
        <div className="survey__rail" aria-hidden="true">
          {QUESTIONS.map((item, index) => <i key={item.id} className={index <= questionIndex ? "is-reached" : ""} />)}
        </div>
      </section>
    </main>
  );
}

function PathwayStrip() {
  return (
    <ol className="pathway-strip">
      {PATHWAY.map((step, index) => (
        <li key={step.title}>
          <span>0{index + 1}</span>
          <div><strong>{step.title}</strong><small>{step.summary}</small></div>
        </li>
      ))}
    </ol>
  );
}

function Report({
  report,
  answers,
  departmentKey,
  flowActive,
  onDepartment,
  onFlow,
  onGenerate,
  onRestart,
}: {
  report: SurveyReport;
  answers: SurveySelection[];
  departmentKey: DepartmentKey;
  flowActive: boolean;
  onDepartment: (department: DepartmentKey) => void;
  onFlow: (active: boolean) => void;
  onGenerate: () => void;
  onRestart: () => void;
}) {
  const department = DEPARTMENTS[departmentKey];
  const scenario = evaluateScenarioRevision3(selectedValues(answers), departmentKey, flowActive);
  const hours = presetHours(report.profile);

  return (
    <main className="workspace">
      <header className="topbar workspace__topbar">
        <BrandMark />
        <div className="workspace__actions">
          <button className="text-action" onClick={onRestart}>Restart</button>
          <button className="primary-action primary-action--small" onClick={onGenerate}>See my full fog report <span aria-hidden="true">→</span></button>
        </div>
      </header>

      <section className="workspace__grid">
        <aside className="department-rail" aria-label="Department views">
          <p className="panel-kicker">WHERE IT HURTS</p>
          {DEPARTMENT_KEYS.map((key) => {
            const item = DEPARTMENTS[key];
            return (
              <button key={key} className={key === departmentKey ? "department-button is-active" : "department-button"} onClick={() => onDepartment(key)}>
                <span>{item.code}</span><strong>{item.name}</strong>
              </button>
            );
          })}
        </aside>

        <section className="diagnostic-panel">
          <div className="diagnostic-panel__head">
            <div><p className="panel-kicker">{department.code} / WHERE THIS SHOWS UP</p><h1>{department.name}</h1></div>
            <div className="signal"><i /> Warning found in your answers</div>
          </div>

          <div className="instrument-row">
            <div className="instrument-copy">
              <p className="panel-kicker">WHAT YOUR ANSWERS REVEAL ACROSS THE BUSINESS</p>
              <h2>{report.profile}</h2>
              <p>{report.description}</p>
              <dl>
                <div><dt>What is happening</dt><dd>{report.pressures.length === 0 ? "No strong pressure pattern" : ARCHETYPE_COPY[report.archetype]}</dd></div>
                <div><dt>Illustrative repair burden</dt><dd>{hours[0]} to {hours[1]} hours per person each week</dd></div>
              </dl>
            </div>
            <div className="instrument-dial" style={{ "--dial-value": `${report.scoreIndex * 2.7}deg` } as React.CSSProperties}>
              <div><strong>{report.rawScore}</strong><span>/ 30</span></div>
              <small>ANSWER SCORE</small>
            </div>
          </div>

          <div className="handoff-chain">
            <article>
              <EvidenceTag>CONFIRM THIS</EvidenceTag>
              <h2>Where fog is forming</h2>
              <p>{department.gap}</p>
            </article>
            <span className="chain-arrow" aria-hidden="true">→</span>
            <article>
              <EvidenceTag tone="red">CHECK THIS</EvidenceTag>
              <h2>What people are carrying</h2>
              <p>{department.repair}</p>
            </article>
            <span className="chain-arrow" aria-hidden="true">→</span>
            <article>
              <EvidenceTag tone="red">HUMAN COST</EvidenceTag>
              <h2>What the fog is taking</h2>
              <p>{department.fogTakes}</p>
            </article>
          </div>

          <div className="payoff-row">
            <div><p className="panel-kicker">WHAT RETURNS WHEN THE GAP CLOSES</p><h2>{department.payoff}</h2></div>
            <div><p className="panel-kicker">WHAT TO FIX FIRST</p><p>{department.connection}</p></div>
          </div>

          <div className="pressure-list">
            <p className="panel-kicker">OTHER WARNING SIGNS IN YOUR ANSWERS</p>
            {report.pressures.length > 0
              ? <div>{report.pressures.map((pressure) => <span key={pressure.id}>{pressure.title}</span>)}</div>
              : <p>No additional warning signs were triggered by these answers.</p>}
          </div>
        </section>

        <aside className="evidence-panel">
          <div className="evidence-panel__head"><p className="panel-kicker">HOW WE FOUND THE FOG</p><span>MODEL 3</span></div>
          <section>
            <EvidenceTag>FROM YOUR ANSWERS</EvidenceTag>
            <h2>Your answers</h2>
            <p>This score comes from your answers. It hasn't measured lost time or money.</p>
            <dl>
              <div><dt>Answer score</dt><dd>{report.scoreIndex} / 100</dd></div>
              <div><dt>Fog pattern</dt><dd>{report.profile}</dd></div>
              <div><dt>Answer range</dt><dd>{report.band}</dd></div>
            </dl>
          </section>
          <section>
            <EvidenceTag tone="red">FORMULA DEMO</EvidenceTag>
            <h2>Fog pressure scenario</h2>
            <p>This shows how the formula changes when one gap gets smaller. It's an example, not lost time or money we've measured.</p>
            <label className="flow-switch">
              <input type="checkbox" checked={flowActive} onChange={(event) => onFlow(event.target.checked)} />
              <span aria-hidden="true"><i /></span>
              Show the gap reduced
            </label>
            <div className="scenario-number"><strong>{scenario.modelLossIndex.toFixed(2)}</strong><span>fog pressure index</span></div>
            <dl className="formula-grid">
              <div><dt>AI-output proxy</dt><dd>{scenario.variables.outputVolumeProxy.toFixed(2)}</dd></div>
              <div><dt>Repair-pressure proxy</dt><dd>{scenario.variables.effectiveFragilityProxy.toFixed(2)}</dd></div>
              <div><dt>Department factor</dt><dd>{scenario.variables.dependencyFactor.toFixed(2)}</dd></div>
              <div><dt>Fog manifestation</dt><dd>{scenario.monsterHeightFeet.toFixed(2)} ft</dd></div>
            </dl>
          </section>
          <p className="model-note">Formula: friction-fog-revision-3 · Perfect answers return zero.</p>
        </aside>
      </section>
      <PathwayStrip />
    </main>
  );
}

function Blueprint({ blueprint, onBack, onRestart }: { blueprint: FlowBlueprint; onBack: () => void; onRestart: () => void }) {
  return (
    <main className="blueprint-shell">
      <header className="topbar">
        <BrandMark />
        <div className="workspace__actions">
          <button className="text-action" onClick={onBack}>Back to findings</button>
          <button className="primary-action primary-action--small" onClick={onRestart}>Run again</button>
        </div>
      </header>
      <section className="blueprint">
        <header className="blueprint__head">
          <div>
            <p className="eyebrow"><span /> YOUR FLOW FOG REPORT</p>
            <h1>{blueprint.readout.sections[0].headline}</h1>
            <p className="blueprint__subhead">{blueprint.department.name} is where this is showing up first.</p>
          </div>
          <p>Created {new Date(blueprint.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
        </header>

        <ol className="readout" aria-label="Fog and friction readout">
          {blueprint.readout.sections.map((section, index) => (
            <li key={section.key} className={`readout__item readout__item--${section.key}`}>
              <div className="readout__meta">
                <span className="readout__number" aria-hidden="true">0{index + 1}</span>
                <p className="panel-kicker">{section.label}</p>
                <EvidenceTag tone={EVIDENCE_TONE[section.evidence]}>{EVIDENCE_LABEL[section.evidence]}</EvidenceTag>
              </div>
              <div className="readout__body">
                <h2>{section.headline}</h2>
                <p>{section.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="blueprint__boundary">
          <div>
            <EvidenceTag>FROM YOUR ANSWERS</EvidenceTag>
            <p>Answer profile {blueprint.survey.profile} · {blueprint.survey.rawScore}/{blueprint.survey.maxScore} answer score. This came from your answers. It hasn't measured lost time or money.</p>
          </div>
          <div>
            <EvidenceTag tone="red">SCENARIO, NOT MEASURED</EvidenceTag>
            <p>{blueprint.scenario.modelLossIndex.toFixed(2)} fog pressure index from model {blueprint.scenario.modelVersion}. It shows what the formula does with the assumptions above.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function FlowVisualizer() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selections, setSelections] = useState<SurveySelection[]>([]);
  const [departmentKey, setDepartmentKey] = useState<DepartmentKey>("AM");
  const [flowActive, setFlowActive] = useState(false);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<FlowBlueprint | null>(null);

  const report = useMemo(() => deriveSurveyReport(selections), [selections]);
  const scenario = report ? evaluateScenarioRevision3(selectedValues(selections), departmentKey, flowActive) : null;

  function restart() {
    setSelections([]);
    setQuestionIndex(0);
    setDepartmentKey("AM");
    setFlowActive(false);
    setGeneratedBlueprint(null);
    setStage("intro");
  }

  function generateBlueprint() {
    if (!report || !scenario) return;
    setGeneratedBlueprint(buildFlowBlueprint(report, DEPARTMENTS[departmentKey], scenario));
    setStage("blueprint");
  }

  function answer(selection: SurveySelection) {
    const next = [...selections.filter((item) => item.questionId !== selection.questionId), selection];
    setSelections(next);
    if (questionIndex === QUESTIONS.length - 1) {
      setStage("report");
      return;
    }
    setQuestionIndex((current) => current + 1);
  }

  if (stage === "intro") return <Intro onStart={() => setStage("survey")} />;
  if (stage === "survey") {
    return <Survey selections={selections} questionIndex={questionIndex} onAnswer={answer} onBack={() => setQuestionIndex((current) => Math.max(0, current - 1))} />;
  }
  if (!report || !scenario) return <Intro onStart={restart} />;
  if (stage === "blueprint" && generatedBlueprint) {
    return <Blueprint blueprint={generatedBlueprint} onBack={() => setStage("report")} onRestart={restart} />;
  }
  return (
    <Report
      report={report}
      answers={selections}
      departmentKey={departmentKey}
      flowActive={flowActive}
      onDepartment={setDepartmentKey}
      onFlow={setFlowActive}
      onGenerate={generateBlueprint}
      onRestart={restart}
    />
  );
}
