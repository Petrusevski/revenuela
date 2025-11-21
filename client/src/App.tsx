import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import AccountsPage from "./pages/AccountsPage";
import DealsPage from "./pages/DealsPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import SequencesPage from "./pages/SequencesPage";
import ActivityPage from "./pages/ActivityPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SettingsPage from "./pages/SettingsPage";
import JourneysPage from "./pages/JourneysPage";
import PerformancePage from "./pages/PerformancePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import CareersPage from "./pages/CareersPage";
import BlogPage from "./pages/BlogPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import DashboardsKpisPage from "./pages/DashboardsKpisPage";
import UseCasesPage from "./pages/UseCasesPage";
import WhyRevenuelaVsSheetsPage from "./pages/WhyRevenuelaVsSheetsPage";
import HowItWorksPage from './pages/HowItWorksPage';
import GTMStackPage from './pages/GTMStackPage';
import PricingPage from './pages/PricingPage';



function App() {
  const token = localStorage.getItem("revenuela_token");

  // ── Public routes (no token) ────────────────────────────────
  if (!token) {
    return (
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="*" element={<Navigate to="/" replace />} />
  <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/gtm-stack" element={<GTMStackPage />} />
        <Route path="/pricing" element={<PricingPage />} />

        <Route path="/dashboards-kpis" element={<DashboardsKpisPage />} />
        <Route path="/use-cases" element={<UseCasesPage />} />
        <Route
          path="/why-revenuela-vs-sheets"
          element={<WhyRevenuelaVsSheetsPage />}
        />

</Routes>
    );
  }

  // ── Authenticated app (token present) ───────────────────────
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/sequences" element={<SequencesPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* If logged in and hit /login or /signup, bounce to dashboard */}
        <Route
          path="/login"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/signup"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </AppLayout>
  );
}

export default App;
