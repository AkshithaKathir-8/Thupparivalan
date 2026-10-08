import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Brain,
  Share2,
  GitMerge,
  ShieldCheck,
  FileText,
  LogOut,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeModule: number;
  setActiveModule: (mod: number) => void;
  currentUser: User | null;
  onLogout: () => void;
  alertCount?: number;
}

const MODULES = [
  { id: 1, name: 'Command Center', icon: LayoutDashboard },
  { id: 2, name: 'Intelligence Alerts', icon: AlertTriangle, badge: true },
  { id: 3, name: 'AI Investigation', icon: Brain },
  { id: 4, name: 'Network Graph', icon: Share2 },
  { id: 5, name: 'Cross-Case Intelligence', icon: GitMerge },
  { id: 6, name: 'Evidence & Integrity', icon: ShieldCheck },
  { id: 7, name: 'Intelligence Reports', icon: FileText },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  currentUser,
  onLogout,
  alertCount = 0
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shadow-sm">
            <img src="/logo.svg" alt="Thupparivalan Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-[#004E9B]">THUPPARIVALAN</span>
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Investigation Platform
            </p>
          </div>
        </div>

        {/* Navigation Items (Exactly 7 Modules) */}
        <nav className="p-3.5 space-y-1.5">
          {MODULES.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#BAE4F0] text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:bg-[#BAE4F0]/30 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-[#0091B9]' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && alertCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#FF6500] text-white">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Investigator Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#BAE4F0] flex items-center justify-center text-[#004E9B] font-bold text-sm shrink-0">
              <Shield className="w-4 h-4 text-[#0091B9]" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {currentUser?.full_name || 'Investigator'}
              </p>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {currentUser?.email || 'investigator@chaintrace.local'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-slate-600 hover:text-[#FF6500] hover:bg-white rounded-md border border-slate-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
