import React from 'react';
import {
  X,
  User,
  Phone,
  Truck,
  MapPin,
  Building,
  CreditCard,
  FileText,
  AlertTriangle,
  Brain,
  Network,
  ExternalLink
} from 'lucide-react';

interface EntityDossierDrawerProps {
  dossier: any | null;
  onClose: () => void;
  onInvestigateEntity: (entityName: string) => void;
}

export const EntityDossierDrawer: React.FC<EntityDossierDrawerProps> = ({
  dossier,
  onClose,
  onInvestigateEntity
}) => {
  if (!dossier) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Person': return <User className="w-5 h-5 text-[#0091B9]" />;
      case 'Phone': return <Phone className="w-5 h-5 text-[#004E9B]" />;
      case 'Vehicle': return <Truck className="w-5 h-5 text-[#FF6500]" />;
      case 'Location': return <MapPin className="w-5 h-5 text-amber-500" />;
      case 'Organization': return <Building className="w-5 h-5 text-[#0091B9]" />;
      case 'Transaction': return <CreditCard className="w-5 h-5 text-[#004E9B]" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      <div className="overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              {getTypeIcon(dossier.entity_type)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#BAE4F0]/60 text-[#004E9B]">
                  {dossier.entity_type}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {dossier.id}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">{dossier.name}</h2>
              {dossier.details && (
                <p className="text-xs text-slate-500 mt-0.5">{dossier.details}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Metrics Cards */}
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
            <Network className="w-3.5 h-3.5 text-[#0091B9]" />
            <span>Topological Centrality (NetworkX)</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="block text-xs text-slate-500">Degree</span>
              <span className="text-sm font-bold text-slate-800">
                {dossier.metrics?.degree || 0}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="block text-xs text-slate-500">Betweenness</span>
              <span className="text-sm font-bold text-[#004E9B]">
                {dossier.metrics?.betweenness || 0}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="block text-xs text-slate-500">Closeness</span>
              <span className="text-sm font-bold text-slate-800">
                {dossier.metrics?.closeness || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Intelligence Alerts */}
        {dossier.alerts && dossier.alerts.length > 0 && (
          <div className="p-5 border-b border-slate-100 bg-amber-50/30">
            <h3 className="text-xs font-bold text-[#FF6500] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF6500]" />
              <span>Flagged Intelligence Alerts ({dossier.alerts.length})</span>
            </h3>
            <div className="space-y-2">
              {dossier.alerts.map((alt: any) => (
                <div
                  key={alt.id}
                  className="p-2.5 rounded-lg bg-white border border-[#FF6500]/20 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{alt.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#FF6500]/10 text-[#FF6500]">
                      {alt.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Cases */}
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-xs font-bold text-[#004E9B] uppercase tracking-wider mb-2">
            Associated Case Dockets ({dossier.cases?.length || 0})
          </h3>
          <div className="space-y-1.5">
            {dossier.cases?.map((c: any) => (
              <div
                key={c.id}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800">{c.case_code}</span>
                <span className="text-slate-600 truncate ml-2 text-right">{c.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Immediate Neighbors / Connections */}
        <div className="p-5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Directly Linked Entities ({dossier.connected_entities?.length || 0})
          </h3>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {dossier.connected_entities?.map((ce: any) => (
              <div
                key={ce.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#0091B9]" />
                  <span className="font-medium text-slate-800 truncate">{ce.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{ce.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={() => {
            onInvestigateEntity(dossier.name);
            onClose();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#0091B9] hover:bg-[#007f9f] text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Brain className="w-4 h-4" />
          <span>Launch AI Investigation on {dossier.name}</span>
        </button>
      </div>
    </div>
  );
};
