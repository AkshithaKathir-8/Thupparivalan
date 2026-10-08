import React, { useState, useEffect } from 'react';
import {
  Brain,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Case, AIResponse } from '../types';
import { api } from '../services/api';

interface InvestigationPageProps {
  cases: Case[];
  activeCaseId: string;
  initialQuery?: string;
  onNavigateToEvidence: (evidenceId: string) => void;
  onNavigateToGraph: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Why was Ravi Kumar flagged?",
  "What cases is Ravi Kumar connected to?",
  "What evidence supports the connection between Ravi Kumar and CASE-006?",
  "Which entities appear across multiple cases?",
  "Who has the highest network influence in CASE-002?",
  "What suspicious transaction relationships exist?",
  "Summarize CASE-001.",
  "What evidence supports the alert for Manoj K?",
  "Are there potential common entities between CASE-005 and CASE-008?",
  "What evidence has an integrity issue?"
];

export const InvestigationPage: React.FC<InvestigationPageProps> = ({
  cases,
  activeCaseId,
  initialQuery = '',
  onNavigateToEvidence,
  onNavigateToGraph
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCaseId, setSelectedCaseId] = useState(activeCaseId || '');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; res: AIResponse }>>([]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleExecuteQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleExecuteQuery = async (questionText: string) => {
    if (!questionText.trim()) return;
    setLoading(true);
    try {
      const res = await api.queryAI(questionText, selectedCaseId || undefined);
      setCurrentResponse(res);
      setHistory((prev) => [{ q: questionText, res }, ...prev]);
      setQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (classification: string) => {
    switch (classification) {
      case 'FACT':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'INFERENCE':
        return 'bg-[#BAE4F0]/60 text-[#004E9B] border-[#BAE4F0]';
      case 'INSUFFICIENT EVIDENCE':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center text-[#004E9B]">
              <Brain className="w-5 h-5 text-[#0091B9]" />
            </div>
            <h1 className="text-xl font-bold text-[#004E9B]">
              AI Investigation Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded Retrieval-Augmented Investigation Engine strictly bounded by validated case evidence.
          </p>
        </div>

        {/* Scope Context */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500">Target Docket:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
          >
            <option value="">Global Multi-Case Scope</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_code} — {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Questions Quick Launcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-[#0091B9]" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Investigative Inquiries & Verification Tests:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                handleExecuteQuery(q);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#BAE4F0]/40 text-slate-700 hover:text-[#004E9B] border border-slate-200 hover:border-[#BAE4F0] transition-colors text-left font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteQuery(query);
          }}
          className="flex items-center space-x-2.5"
        >
          <input
            type="text"
            placeholder="Ask any natural-language question regarding uploaded case evidence, suspects, or transactions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0091B9]/30"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Analyze</span>
          </button>
        </form>
      </div>

      {/* Main Grounded Result Display */}
      {currentResponse && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Investigator Query
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                "{currentResponse.question}"
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getBadgeStyle(
                  currentResponse.classification
                )}`}
              >
                {currentResponse.classification}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Confidence: {(currentResponse.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Primary Answer Block */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
            <h3 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider mb-2">
              Investigative Finding
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {currentResponse.answer}
            </p>
          </div>

          {/* Reasoning & Corroboration */}
          <div className="p-4 rounded-xl bg-[#BAE4F0]/20 border border-[#BAE4F0]/60 space-y-2">
            <h4 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider">
              Analytical Grounding Basis
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {currentResponse.reasoning_summary}
            </p>
          </div>

          {/* Supporting Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Supporting Entities */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                Supporting Entities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentResponse.supporting_entities.length > 0 ? (
                  currentResponse.supporting_entities.map((ent, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-[#BAE4F0]/50 text-[#004E9B] font-medium"
                    >
                      {ent}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None detected</span>
                )}
              </div>
            </div>

            {/* Supporting Cases */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                Corroborating Cases
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentResponse.supporting_cases.length > 0 ? (
                  currentResponse.supporting_cases.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-medium"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">System-wide</span>
                )}
              </div>
            </div>

            {/* Supporting Evidence Artifacts */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                Evidence Artifacts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentResponse.supporting_evidence.length > 0 ? (
                  currentResponse.supporting_evidence.map((ev, i) => (
                    <button
                      key={i}
                      onClick={() => onNavigateToEvidence(ev)}
                      className="text-xs px-2 py-0.5 rounded bg-[#0091B9]/10 hover:bg-[#0091B9]/20 text-[#0091B9] font-mono font-semibold transition-colors"
                    >
                      {ev}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No primary files</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation / Query History */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Prior Inquiry Ledger ({history.length})
          </h3>
          <div className="space-y-3">
            {history.slice(1).map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">"{item.q}"</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${getBadgeStyle(
                      item.res.classification
                    )}`}
                  >
                    {item.res.classification}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {item.res.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
