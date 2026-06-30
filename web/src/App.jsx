import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import SequenceFlow from './views/SequenceFlow';
import SurgeFlow from './views/SurgeFlow';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';
import CraneChat from './components/CraneChat';
import ProviderPortal from './components/ProviderPortal';
import TelemetryFlush from './components/TelemetryFlush';
import DevPerformanceOverlay from './components/dev/DevPerformanceOverlay';
import {
  PrivacyPage,
  TermsPage,
  SupportPage,
  SciencePage,
  ProvidersPage,
  ClinicalTokenPage,
  MarketingHome,
  FaqPage,
} from './pages';
import { resolveVariantId } from './sequences';
import { CraneProvider } from './context/CraneProvider';
import CraneFab from './components/crane/CraneFab';
import CranePanel from './components/crane/CranePanel';

function EngineRoute() {
  const { variantId } = useParams();
  return <SequenceFlow initialVariantId={resolveVariantId(variantId)} />;
}

function StartRoute() {
  const [search] = useSearchParams();
  const variant = search.get('variant');
  return <SequenceFlow initialVariantId={variant ? resolveVariantId(variant) : null} />;
}

/**
 * Release 1.33 routing:
 *   /                    → Marketing home (science-backed landing)
 *   /start               → SequenceFlow (30/60/90 picker → engine → aftermath)
 *   /engine/:variantId   → deep-link a variant
 *   /how-it-works        → Science page
 *   /for-providers       → Provider marketing
 *   /clinical-token      → Patient token entry
 *   /crane               → AI guide
 *   /portal              → Provider dashboard
 */
export default function App() {
  return (
    <CraneProvider>
      <TelemetryFlush />
      <DevPerformanceOverlay />
      <CraneFab />
      <CranePanel />
      <Routes>
        <Route path="/" element={<MarketingHome />} />
        <Route path="/start" element={<StartRoute />} />
        <Route path="/engine" element={<Navigate to="/start" replace />} />
        <Route path="/engine/:variantId" element={<EngineRoute />} />
        <Route path="/how-it-works" element={<SciencePage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/for-providers" element={<ProvidersPage />} />
        <Route path="/clinical-token" element={<ClinicalTokenPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/surge" element={<Navigate to="/start" replace />} />
        <Route path="/crane" element={<CraneChat />} />
        <Route path="/heron" element={<Navigate to="/crane" replace />} />
        <Route path="/egret" element={<Navigate to="/crane" replace />} />
        <Route path="/portal" element={<ProviderPortal />} />
        <Route path="/dev/surge-classic" element={<SurgeInterface />} />
        <Route path="/dev/surge-flow-legacy" element={<SurgeFlow />} />
        {/* Legacy static HTML paths */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/engine.html" element={<Navigate to="/start" replace />} />
        <Route path="/how-it-works.html" element={<Navigate to="/how-it-works" replace />} />
        <Route path="/for-providers.html" element={<Navigate to="/for-providers" replace />} />
        <Route path="/clinical-token.html" element={<Navigate to="/clinical-token" replace />} />
      </Routes>
    </CraneProvider>
  );
}
