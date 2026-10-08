import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CreateCaseModal } from './components/CreateCaseModal';
import { UploadEvidenceModal } from './components/UploadEvidenceModal';
import { EntityDossierDrawer } from './components/EntityDossierDrawer';
import { LoginPage } from './pages/LoginPage';
import { CommandCenter } from './pages/CommandCenter';
import { AlertsPage } from './pages/AlertsPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { CrossCasePage } from './pages/CrossCasePage';
import { EvidenceIntegrityPage } from './pages/EvidenceIntegrityPage';
import { ReportsPage } from './pages/ReportsPage';
import { User, Case, DashboardStats } from './types';
import { api } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('thupparivalan_token')
  );

  const [activeModule, setActiveModule] = useState<number>(1);
  const [cases, setCases] = useState<Case[]>([]);

  // Restore the previously selected case after browser refresh.
  const [activeCaseId, setActiveCaseId] = useState<string>(
    localStorage.getItem('thupparivalan_active_case') || ''
  );

  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Modals & Drawers
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [uploadEvidenceOpen, setUploadEvidenceOpen] = useState(false);
  const [dossierEntityId, setDossierEntityId] = useState<string | null>(null);
  const [dossierData, setDossierData] = useState<any | null>(null);

  // Cross-module query transfer
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [evidenceTargetId, setEvidenceTargetId] = useState<string | undefined>(
    undefined
  );

  // Check auth
  useEffect(() => {
    const savedUser = localStorage.getItem('thupparivalan_user');

    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, [token]);

  // Persist selected case so it survives browser refresh.
  useEffect(() => {
    if (activeCaseId) {
      localStorage.setItem('thupparivalan_active_case', activeCaseId);
    } else {
      localStorage.removeItem('thupparivalan_active_case');
    }
  }, [activeCaseId]);

  // Load cases and dashboard stats
  const refreshGlobalData = async () => {
    if (!token) return;

    try {
      const [caseList, dashboardStats] = await Promise.all([
        api.getCases(),
        api.getDashboardStats(activeCaseId || undefined)
      ]);

      setCases(caseList);
      setStats(dashboardStats);

      // Make sure the restored case still exists.
      if (activeCaseId) {
        const selectedCaseExists = caseList.some(
          (c) => c.id === activeCaseId || c.case_code === activeCaseId
        );

        if (!selectedCaseExists) {
          setActiveCaseId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      refreshGlobalData();
    }
  }, [token, activeCaseId]);

  // Load entity dossier on drawer trigger
  const handleSelectEntityDossier = async (entityId: string) => {
    setDossierEntityId(entityId);

    try {
      const data = await api.getEntityDossier(entityId);
      setDossierData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('thupparivalan_token');
    localStorage.removeItem('thupparivalan_user');
    localStorage.removeItem('thupparivalan_active_case');

    setToken(null);
    setCurrentUser(null);
    setActiveCaseId('');
  };

  // Cross-module navigations
  const handleNavigateToAI = (queryText: string) => {
    setAiInitialQuery(queryText);
    setActiveModule(3);
  };

  const handleNavigateToGraph = (entityId?: string) => {
    if (entityId) {
      handleSelectEntityDossier(entityId);
    }

    setActiveModule(4);
  };

  const handleNavigateToEvidence = (evidenceId?: string) => {
    setEvidenceTargetId(evidenceId);
    setActiveModule(6);
  };

  if (!token || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-white flex">

      {/* Module Navigation Sidebar */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        currentUser={currentUser}
        onLogout={handleLogout}
        alertCount={stats?.counts.high_alerts ?? 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FCFCFD]">

        <Header
          cases={cases}
          activeCaseId={activeCaseId}
          setActiveCaseId={setActiveCaseId}
          integrityViolations={stats?.counts.integrity_violations ?? 0}
          alertCount={stats?.counts.alerts ?? 0}
          onNavigateToAlerts={() => setActiveModule(2)}
          onNavigateToIntegrity={() => setActiveModule(6)}
        />

        <main className="flex-1 p-6 overflow-y-auto">

          {activeModule === 1 && (
            <CommandCenter
              stats={stats}
              cases={cases}
              activeCaseId={activeCaseId}
              setActiveCaseId={setActiveCaseId}
              onOpenCreateCase={() => setCreateCaseOpen(true)}
              onOpenUploadEvidence={() => setUploadEvidenceOpen(true)}
              onDataRefresh={refreshGlobalData}
              onNavigateToModule={(mod, param) => {
                if (mod === 3 && param) {
                  handleNavigateToAI(param);
                } else {
                  setActiveModule(mod);
                }
              }}
              onVerifyEvidence={(evdId) =>
                handleNavigateToEvidence(evdId)
              }
            />
          )}

          {activeModule === 2 && (
            <AlertsPage
              onNavigateToAI={handleNavigateToAI}
              onNavigateToGraph={handleNavigateToGraph}
              onNavigateToEvidence={handleNavigateToEvidence}
            />
          )}

          {activeModule === 3 && (
            <InvestigationPage
              cases={cases}
              activeCaseId={activeCaseId}
              initialQuery={aiInitialQuery}
              onNavigateToEvidence={handleNavigateToEvidence}
              onNavigateToGraph={() => setActiveModule(4)}
            />
          )}

          {activeModule === 4 && (
            <NetworkGraphPage
              cases={cases}
              activeCaseId={activeCaseId}
              onSelectEntityDossier={handleSelectEntityDossier}
              selectedEntityId={dossierEntityId || undefined}
            />
          )}

          {activeModule === 5 && (
            <CrossCasePage
              onNavigateToGraph={handleNavigateToGraph}
              onNavigateToAI={handleNavigateToAI}
              onNavigateToEvidence={handleNavigateToEvidence}
            />
          )}

          {activeModule === 6 && (
            <EvidenceIntegrityPage
              onOpenUploadModal={() => setUploadEvidenceOpen(true)}
              targetEvidenceId={evidenceTargetId}
            />
          )}

          {activeModule === 7 && (
            <ReportsPage
              cases={cases}
              activeCaseId={activeCaseId}
            />
          )}

        </main>
      </div>

      {/* Slide-out Entity Dossier Drawer */}
      <EntityDossierDrawer
        dossier={dossierData}
        onClose={() => {
          setDossierData(null);
          setDossierEntityId(null);
        }}
        onInvestigateEntity={(name) =>
          handleNavigateToAI(`Why was ${name} flagged?`)
        }
      />

      {/* Case Creation Modal */}
      <CreateCaseModal
        isOpen={createCaseOpen}
        onClose={() => setCreateCaseOpen(false)}
        onCaseCreated={(newCaseId) => {
          setActiveCaseId(newCaseId);
          refreshGlobalData();
        }}
      />

      {/* Evidence Upload Modal */}
      <UploadEvidenceModal
        isOpen={uploadEvidenceOpen}
        onClose={() => setUploadEvidenceOpen(false)}
        cases={cases}
        activeCaseId={activeCaseId}
        onEvidenceUploaded={() => refreshGlobalData()}
      />

    </div>
  );
}

export default App;