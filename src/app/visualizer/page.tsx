'use client';

import React, { useState, useEffect } from 'react';
import { QUESTIONS, scoreMap } from '@/lib/questionnaire';
import { createHandoffPayload, parseHandoffPayload } from '@/lib/handoff';

export default function VisualizerPage() {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    QUESTIONS.forEach((q) => {
      initial[q.id] = `${q.id}-c1`;
    });
    return initial;
  });

  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#proof=', '');
      const parsedChoices = parseHandoffPayload(hash);
      if (parsedChoices && parsedChoices.length === QUESTIONS.length) {
        const newAnswers: Record<string, string> = {};
        parsedChoices.forEach((choiceId) => {
          const qId = choiceId.split('-')[0];
          newAnswers[qId] = choiceId;
        });
        setAnswers(newAnswers);
      }
    }
  }, []);

  const choiceList = QUESTIONS.map((q) => answers[q.id] || `${q.id}-c1`);
  const result = scoreMap(choiceList);

  useEffect(() => {
    try {
      const payload = createHandoffPayload(choiceList);
      setShareUrl(`/proof/screen/visualizer#proof=${payload}`);
    } catch (e) {
      console.error(e);
    }
  }, [answers]);

  const handleSelect = (questionId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToResults = () => {
    if (typeof window !== 'undefined') {
      const payload = shareUrl.split('#proof=')[1] || '';
      window.location.href = `/results#proof=${payload}`;
    }
  };

  const mailtoSubject = encodeURIComponent(`PROOF Telemetry Engagement Request [Score: ${result.score}/30]`);
  const mailtoBody = encodeURIComponent(
    `Hello PROOF Team,\n\nI have completed the Momentum Map Diagnostic:\n- Score: ${result.score}/30 (${result.band})\n- Top Pressures: ${result.pressures.join(', ') || 'None'}\n- Model Version: map-proof-2026-10-05\n\nI would like to discuss next steps for a diagnostic engagement.`
  );
  const mailtoHref = `mailto:hello@proof.example.com?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">PROOF · Business Diagnostic</span>
          <h2 className="text-2xl font-bold text-white mt-1">15-Question Momentum Map Engine</h2>
          <p className="text-slate-400 text-sm mt-1">Select choices to evaluate real-time diagnostic score and pressure indicators.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-right w-full md:w-auto">
            <span className="text-xs text-slate-400">Current Score: </span>
            <span className="text-xl font-bold text-indigo-400">{result.score} / 30</span>
            <span className="ml-3 px-2 py-0.5 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {result.band}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            >
              Book Engagement
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              {copied ? 'Copied URL!' : 'Share URL'}
            </button>
            <button
              onClick={handleGoToResults}
              className="px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-600/30"
            >
              Results →
            </button>
          </div>
        </div>
      </div>

      {/* Questions Form */}
      <div className="space-y-6">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Question {idx + 1}
              </span>
              <span className="text-xs font-mono text-indigo-400">ID: {q.id}</span>
            </div>
            
            <h3 className="text-lg font-medium text-slate-100">{q.prompt}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {q.choices.map((c) => {
                const isSelected = answers[q.id] === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(q.id, c.id)}
                    className={`text-left p-4 rounded-lg border transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-950/50'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-mono text-slate-400">{c.id}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        c.value === 2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                        c.value === 1 ? 'bg-amber-950 text-amber-400 border border-amber-800/50' :
                        'bg-rose-950 text-rose-400 border border-rose-800/50'
                      }`}>
                        +{c.value} pts
                      </span>
                    </div>
                    <p className="text-sm font-medium">{c.label}</p>
                    {c.pressure && (
                      <span className="text-xs text-amber-400/90 font-mono italic">
                        Pressure: {c.pressure}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Book PROOF Engagement</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-slate-300">
              Ready to address your top identified execution pressures? Click below to send your pre-populated telemetry diagnostic trace to our team.
            </p>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded text-xs font-mono text-slate-400 space-y-1">
              <div>Score: <span className="text-indigo-400 font-bold">{result.score}/30 ({result.band})</span></div>
              <div>Top Pressures: <span className="text-amber-400">{result.pressures.join(', ') || 'None'}</span></div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded border border-slate-800"
              >
                Cancel
              </button>
              <a
                href={mailtoHref}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
              >
                Send Diagnostic Email →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
