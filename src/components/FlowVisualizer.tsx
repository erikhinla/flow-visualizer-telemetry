"use client";

import { useMemo, useState } from "react";
import { buildFlowBlueprint, type FlowBlueprint } from "@/lib/blueprint";
import { DEPARTMENTS, DEPARTMENT_KEYS, type DepartmentKey } from "@/lib/departments";
import { PATHWAY } from "@/lib/pathway";
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
  bottleneckOperator: "Bottleneck operator",
  toolOverload: "Tool overload",
  executionStall: "Execution stall",
  fragmentedWorkflow: "Fragmented workflow",
};

function EvidenceTag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "red" | "green" }) {
  return <span className={`evidence-tag evidence-tag--${tone}`}>{children}</span>;
}

function BrandMark() {
  return (
    <div className="brand" aria-label="FLOW Blueprint">
      <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
      <span>FLOW <b>BLUEPRINT</b></span>
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
        <span className="topbar__note">Diagnostic workspace · P0</span>
      </header>

      <section className="intro__grid">
        <div className="intro__copy">
          <p className="eyebrow"><span /> TRACE THE HANDOFF</p>
          <h1>Make the work-between-the-work visible.</h1>
          <p className="intro__lede">
            Find where context, ownership, or proof disappears between tools. Then choose one connection to test.
          </p>
          <ol className="intro__steps" aria-label="FLOW diagnostic pathway">
            {PATHWAY.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <div><strong>{step.title}</strong><small>{step.summary}</small></div>
              </li>
            ))}
          </ol>
          <button className="primary-action" onClick={onStart}>Start with one handoff <span aria-hidden="true">→</span></button>
          <p className="privacy-note">15 questions. Answers stay in this browser session.</p>
        </div>

        <div className="intro__machine">
          <p className="machine-label">Diagnostic engine / waiting</p>
          <MachineCore />
          <div className="machine-caption">
            <span>INPUT</span><strong>Reported experience</strong>
            <span>OUTPUT</span><strong>A connection to test</strong>
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
          <p className="eyebrow"><span /> REPORTED EXPERIENCE</p>
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
          <button className="primary-action primary-action--small" onClick={onGenerate}>Generate Blueprint <span aria-hidden="true">→</span></button>
        </div>
      </header>

      <section className="workspace__grid">
        <aside className="department-rail" aria-label="Department views">
          <p className="panel-kicker">DEPARTMENT</p>
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
            <div><p className="panel-kicker">{department.code} / ACTIVE VIEW</p><h1>{department.moniker}</h1></div>
            <div className="signal"><i /> Diagnostic signal</div>
          </div>

          <div className="handoff-chain">
            <article>
              <EvidenceTag>ASSUMED</EvidenceTag>
              <h2>Reported gap</h2>
              <p>{department.gap}</p>
            </article>
            <span className="chain-arrow" aria-hidden="true">→</span>
            <article>
              <EvidenceTag tone="red">ASSUMED</EvidenceTag>
              <h2>Human repair</h2>
              <p>{department.repair}</p>
            </article>
            <span className="chain-arrow" aria-hidden="true">→</span>
            <article>
              <EvidenceTag tone="green">PROPOSED</EvidenceTag>
              <h2>Change the link</h2>
              <p>{department.connection}</p>
            </article>
          </div>

          <div className="instrument-row">
            <div className="instrument-copy">
              <p className="panel-kicker">QUESTIONNAIRE RESULT</p>
              <h2>{report.profile}</h2>
              <p>{report.description}</p>
              <dl>
                <div><dt>Pattern</dt><dd>{ARCHETYPE_COPY[report.archetype]}</dd></div>
                <div><dt>Suggested review</dt><dd>{hours[0]} to {hours[1]} hours</dd></div>
              </dl>
            </div>
            <div className="instrument-dial" style={{ "--dial-value": `${report.scoreIndex * 2.7}deg` } as React.CSSProperties}>
              <div><strong>{report.rawScore}</strong><span>/ 30</span></div>
              <small>ANSWER SCORE</small>
            </div>
          </div>

          <div className="pressure-list">
            <p className="panel-kicker">PLACES TO CHECK</p>
            <div>{report.pressures.map((pressure) => <span key={pressure.id}>{pressure.title}</span>)}</div>
          </div>
        </section>

        <aside className="evidence-panel">
          <div className="evidence-panel__head"><p className="panel-kicker">EVIDENCE INSPECTOR</p><span>REV 3</span></div>
          <section>
            <EvidenceTag>SURVEY-DERIVED</EvidenceTag>
            <h2>What the answers say</h2>
            <p>This score summarizes the selected answers. It is not a measured business result.</p>
            <dl>
              <div><dt>Answer score</dt><dd>{report.scoreIndex} / 100</dd></div>
              <div><dt>Profile</dt><dd>{report.profile}</dd></div>
              <div><dt>Band</dt><dd>{report.band}</dd></div>
            </dl>
          </section>
          <section>
            <EvidenceTag tone="red">ILLUSTRATIVE</EvidenceTag>
            <h2>Revision 3 scenario</h2>
            <p>A model comparison, not observed loss. Inputs remain visible so the assumption can be challenged.</p>
            <label className="flow-switch">
              <input type="checkbox" checked={flowActive} onChange={(event) => onFlow(event.target.checked)} />
              <span aria-hidden="true"><i /></span>
              FLOW connection scenario
            </label>
            <div className="scenario-number"><strong>{scenario.modelLossIndex.toFixed(2)}</strong><span>model loss index</span></div>
            <dl className="formula-grid">
              <div><dt>O proxy</dt><dd>{scenario.variables.outputVolumeProxy.toFixed(2)}</dd></div>
              <div><dt>I proxy</dt><dd>{scenario.variables.effectiveFragilityProxy.toFixed(2)}</dd></div>
              <div><dt>D factor</dt><dd>{scenario.variables.dependencyFactor.toFixed(2)}</dd></div>
              <div><dt>Height</dt><dd>{scenario.monsterHeightFeet.toFixed(2)} ft</dd></div>
            </dl>
          </section>
          <p className="model-note">Model: friction-fog-revision-3 · Perfect answers return zero.</p>
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
          <button className="text-action" onClick={onBack}>Back to workspace</button>
          <button className="primary-action primary-action--small" onClick={onRestart}>Run again</button>
        </div>
      </header>
      <section className="blueprint">
        <header className="blueprint__head">
          <div><p className="eyebrow"><span /> CONNECTION PLAN</p><h1>{blueprint.department.name}: {blueprint.department.moniker}</h1></div>
          <p>Generated {new Date(blueprint.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
        </header>
        <div className="blueprint__grid">
          <article><EvidenceTag>ASSUMED</EvidenceTag><span className="blueprint__number">01</span><h2>Reported gap</h2><p>{blueprint.reportedGap.text}</p></article>
          <article><EvidenceTag tone="red">ASSUMED</EvidenceTag><span className="blueprint__number">02</span><h2>Human repair</h2><p>{blueprint.humanRepair.text}</p></article>
          <article><EvidenceTag tone="green">PROPOSED</EvidenceTag><span className="blueprint__number">03</span><h2>Connection to test</h2><p>{blueprint.connectionToTest.text}</p></article>
        </div>
        <div className="blueprint__next">
          <div><p className="panel-kicker">NEXT ACTION</p><h2>{blueprint.nextAction}</h2></div>
          <div><p className="panel-kicker">EVIDENCE NEEDED</p><p>{blueprint.evidenceNeeded}</p></div>
        </div>
        <div className="blueprint__boundary">
          <EvidenceTag>SURVEY-DERIVED</EvidenceTag>
          <p>{blueprint.survey.profile} · {blueprint.survey.rawScore}/{blueprint.survey.maxScore} answer score</p>
          <EvidenceTag tone="red">ILLUSTRATIVE</EvidenceTag>
          <p>{blueprint.scenario.modelLossIndex.toFixed(2)} revision 3 model loss index</p>
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
