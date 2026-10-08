import React from 'react';
import {
  FolderKanban,
  Search,
  Bell,
  ShieldAlert,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Case } from '../types';

interface HeaderProps {
  cases: Case[];
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  integrityViolations: number;
  alertCount: number;
  onNavigateToAlerts: () => void;
  onNavigateToIntegrity: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cases,
  activeCaseId,
  setActiveCaseId,
  integrityViolations,
  alertCount,
  onNavigateToAlerts,
  onNavigateToIntegrity
}) => {
  const currentCase = cases.find((c) => c.id === activeCaseId || c.case_code === activeCaseId);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Active Case Context */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-slate-500">
          <FolderKanban className="w-4 h-4 text-[#0091B9]" />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Active Docket:
          </span>
        </div>

        <div className="relative">
          <select
            value={activeCaseId}
            onChange={(e) => setActiveCaseId(e.target.value)}
            className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9] transition-colors cursor-pointer"
          >
            <option value="">All Cases (Global Matrix)</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_code} — {c.title}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {currentCase && (
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded bg-[#BAE4F0]/50 text-[#004E9B] font-medium border border-[#BAE4F0]">
              {currentCase.district}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                currentCase.priority === 'CRITICAL'
                  ? 'bg-[#FF6500]/10 text-[#FF6500] border border-[#FF6500]/30'
                  : currentCase.priority === 'HIGH'
                  ? 'bg-amber-50 text-[#FF6500] border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {currentCase.priority} PRIORITY
            </span>
          </div>
        )}
      </div>

      {/* Right: Quick Indicators & Notifications */}
      <div className="flex items-center space-x-3.5">
        {/* Integrity Status Pill */}
        <button
          onClick={onNavigateToIntegrity}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            integrityViolations > 0
              ? 'bg-[#FF6500]/10 text-[#FF6500] border-[#FF6500]/30 hover:bg-[#FF6500]/20'
              : 'bg-[#BAE4F0]/30 text-[#004E9B] border-[#BAE4F0] hover:bg-[#BAE4F0]/50'
          }`}
          title="Tamper-Evident Evidence Ledger Status"
        >
          {integrityViolations > 0 ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF6500]" />
              <span className="font-semibold">{integrityViolations} Tamper Alert</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#0091B9]" />
              <span>Ledger Verified</span>
            </>
          )}
        </button>

        {/* Intelligence Alerts Button */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Active Intelligence Leads"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6500]" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-200" />

      </div>
    </header>
  );
};
