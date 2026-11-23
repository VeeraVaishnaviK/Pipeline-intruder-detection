import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PipelineProvider } from './context/PipelineContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AlertModal } from './components/alerts/AlertModal';
import { DashboardPage } from './pages/DashboardPage';
import { BatchStreamPage } from './pages/BatchStreamPage';
import { HitMissPage } from './pages/HitMissPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { LogsAlertsPage } from './pages/LogsAlertsPage';
import { RulesPage } from './pages/RulesPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { LoginPage } from './pages/LoginPage';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (!user) {
    return <LoginPage onSuccess={() => setCurrentTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 pipeline-grid-bg transition-colors duration-200">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && <DashboardPage />}
        {currentTab === 'batch' && <BatchStreamPage />}
        {currentTab === 'hitmiss' && <HitMissPage />}
        {currentTab === 'comparison' && <ComparisonPage />}
        {currentTab === 'logs' && <LogsAlertsPage />}
        {currentTab === 'rules' && <RulesPage />}
        {currentTab === 'architecture' && <ArchitecturePage />}
      </main>

      <Footer />
      <AlertModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PipelineProvider>
        <MainApp />
      </PipelineProvider>
    </AuthProvider>
  );
}

export default App;
