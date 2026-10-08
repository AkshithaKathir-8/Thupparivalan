import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Search,
  RefreshCw,
  Share2,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { CrossCaseLink } from '../types';
import { api } from '../services/api';

interface CrossCasePageProps {
  onNavigateToGraph: (entityId?: string) => void;
  onNavigateToAI: (query: string) => void;
  onNavigateToEvidence: (caseCode?: string) => void;
}

export const CrossCasePage: React.FC<CrossCasePageProps> = ({
  onNavigateToGraph,
  onNavigateToAI,
  onNavigateToEvidence
}) => {
  const [links, setLinks] = useState<CrossCaseLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLink, setSelectedLink] = useState<CrossCaseLink | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const data = await api.getCrossCaseLinks();
      setLinks(data);
      if (data.length > 0 && !selectedLink) {
        setSelectedLink(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.triggerCrossCaseScan();
      await fetchLinks();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const filteredLinks = links.filter((l) =>
    l.entity_name.toLowerCase().includes(search.toLowerCase()) ||
    l.case_a_code.toLowerCase().includes(search.toLowerCase()) ||
    l.case_b_code.toLowerCase().includes(search.toLowerCase()) ||
    l.match_reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center text-[#004E9B]">
              <GitMerge className="w-5 h-5 text-[#004E9B]" />
            </div>
            <h1 className="text-xl font-bold text-[#004E9B]">
              Cross-Case Intelligence Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic detection of common persons of interest, recurring phone identifiers, and overlapping vehicle logistics across separate jurisdictions.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>Execute Multi-Case Correlation Scan</span>
        </button>
      </div>

      {/* Main Grid: List of Links & Deep Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Linkage List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search common entities or cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Correlating cross-jurisdictional dockets...
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                No significant cross-case connection was identified from current data.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLinks.map((link) => {
                const isSelected = selectedLink?.id === link.id;
                return (
                  <div
                    key={link.id}
                    onClick={() => setSelectedLink(link)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#BAE4F0]/30 border-[#0091B9] shadow-xs ring-1 ring-[#0091B9]/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {link.entity_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          link.confidence >= 0.95
                            ? 'bg-[#0091B9]/15 text-[#0091B9]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(link.confidence * 100).toFixed(0)}% Match Confidence
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold text-slate-800">
                        {link.case_a_code}
                      </span>
                      <span className="text-slate-400 text-[10px]">⟷</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold text-slate-800">
                        {link.case_b_code}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                      {link.match_reason}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: In-Depth Comparison & Investigation Dossier (7 cols) */}
        <div className="lg:col-span-7">
          {selectedLink ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#BAE4F0]/60 text-[#004E9B]">
                    Potential Common Entity Identified
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedLink.entity_name}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-[#0091B9]">
                    {(selectedLink.confidence * 100).toFixed(0)}%
                  </span>
                  <p className="text-[10px] text-slate-400">Match Confidence</p>
                </div>
              </div>

              {/* Side-by-Side Docket Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    First Docket
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                    {selectedLink.case_a_code}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{selectedLink.case_a_title}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Second Docket
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                    {selectedLink.case_b_code}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{selectedLink.case_b_title}</p>
                </div>
              </div>

              {/* Match Mechanism & Intelligence Rationale */}
              <div className="p-4 bg-[#BAE4F0]/20 rounded-xl border border-[#BAE4F0]/60 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#004E9B] uppercase tracking-wider">
                    Correlation Rationale & Identifiers:
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {selectedLink.match_type}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedLink.match_reason}
                </p>
              </div>

              {/* Analytical Caveat */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start space-x-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Investigative Caution:</strong> This correlation indicates a potential common entity requiring field corroboration and warrant validation. Do not assume culpability based solely on automated heuristic matching.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() =>
                    onNavigateToAI(
                      `What evidence supports the connection between ${selectedLink.entity_name} and ${selectedLink.case_b_code}?`
                    )
                  }
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-xs transition-colors"
                >
                  <span>Query AI Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigateToGraph(selectedLink.entity_id)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-[#004E9B] bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#0091B9]" />
                  <span>Inspect in Network Graph</span>
                </button>

                <button
                  onClick={() => onNavigateToEvidence(selectedLink.case_a_code)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Case Evidence</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <p className="text-xs text-slate-400">
                Select a cross-case correlation on the left to examine matching identifiers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
