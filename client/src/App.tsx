import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { AppShell } from './components/AppShell';
import { DecisionListPage } from './pages/DecisionListPage';
import { NewDecisionPage } from './pages/NewDecisionPage';
import { DecisionContextPage } from './pages/DecisionContextPage';
import { AssessmentFormPage } from './pages/AssessmentFormPage';
import { WaitingPage } from './pages/WaitingPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { DashboardPage } from './pages/DashboardPage';
import { MetaConclusionsPage } from './pages/MetaConclusionsPage';

export function App() {
  return (
    <AuthGuard>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/decisions" replace />} />
          <Route path="/decisions" element={<DecisionListPage />} />
          <Route path="/decisions/new" element={<NewDecisionPage />} />
          <Route path="/decisions/:id" element={<DecisionContextPage />} />
          <Route path="/decisions/:id/assess" element={<AssessmentFormPage />} />
          <Route path="/decisions/:id/wait" element={<WaitingPage />} />
          <Route path="/decisions/:id/compare" element={<ComparisonPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meta" element={<MetaConclusionsPage />} />
        </Routes>
      </AppShell>
    </AuthGuard>
  );
}
