import React, { useState } from 'react';
import { PatientCase, AuthUser } from './types';
import { MOCK_PATIENTS } from './mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { UploadPage } from './components/UploadPage';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { DashboardOverview } from './components/DashboardOverview';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'upload' | 'analysis' | 'dashboard' | 'settings'>('landing');
  const [cases, setCases] = useState<PatientCase[]>(MOCK_PATIENTS);
  const [selectedCase, setSelectedCase] = useState<PatientCase>(MOCK_PATIENTS[0]);
  
  // Clinical Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'upload' | 'demo' | 'workstation' | null>(null);

  // Authenticated upload trigger
  const handleRequestUpload = () => {
    if (!currentUser) {
      setPendingAction('upload');
      setAuthModalOpen(true);
    } else {
      setCurrentTab('upload');
    }
  };

  // Authenticated demo case trigger
  const handleRequestDemo = () => {
    if (!currentUser) {
      setPendingAction('demo');
      setAuthModalOpen(true);
    } else {
      setSelectedCase(MOCK_PATIENTS[0]);
      setCurrentTab('analysis');
    }
  };

  // Auth Success Callback
  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setAuthModalOpen(false);

    if (pendingAction === 'upload') {
      setCurrentTab('upload');
    } else if (pendingAction === 'demo') {
      setSelectedCase(MOCK_PATIENTS[0]);
      setCurrentTab('analysis');
    }
    setPendingAction(null);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentTab('landing');
  };

  const handleAnalysisComplete = (patient: PatientCase) => {
    setSelectedCase(patient);
    setCurrentTab('analysis');
  };

  const handleUpdatePatient = (updated: PatientCase) => {
    setSelectedCase(updated);
    setCases(cases.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleSwitchCase = (caseId: string) => {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      setSelectedCase(found);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Universal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'upload' && !currentUser) {
            handleRequestUpload();
          } else if (tab === 'analysis' && !currentUser) {
            handleRequestDemo();
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenQuickDemo={handleRequestDemo}
        currentUser={currentUser}
        onOpenAuth={(action) => {
          setPendingAction(action || null);
          setAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigateToUpload={handleRequestUpload}
            onOpenQuickDemo={handleRequestDemo}
          />
        )}

        {currentTab === 'upload' && (
          <UploadPage
            onAnalysisComplete={handleAnalysisComplete}
            onSelectSampleCase={(p) => {
              setSelectedCase(p);
              setCurrentTab('analysis');
            }}
          />
        )}

        {currentTab === 'analysis' && (
          <AnalysisDashboard
            patient={selectedCase}
            onUpdatePatient={handleUpdatePatient}
            onSwitchCase={handleSwitchCase}
            allCases={cases}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardOverview
            cases={cases}
            onSelectCase={(c) => {
              setSelectedCase(c);
              setCurrentTab('analysis');
            }}
            onNavigateToUpload={handleRequestUpload}
          />
        )}

        {currentTab === 'settings' && <SettingsPage />}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
        targetAction={pendingAction}
      />

      {/* Footer */}
      {currentTab !== 'analysis' && <Footer />}
    </div>
  );
}

export default App;
