import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import SequenceFlow from './views/SequenceFlow';
import SurgeFlow from './views/SurgeFlow';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';
import CraneChat from './components/CraneChat';
import ProviderPortal from './components/ProviderPortal';
import TelemetryFlush from './components/TelemetryFlush';
import { PrivacyPage, TermsPage, SupportPage } from './pages';
import { resolveVariantId } from './sequences';

function EngineRoute() {
  const { variantId } = useParams();
  return <SequenceFlow initialVariantId={resolveVariantId(variantId)} />;
}

/**
 * Release 1.33 routing:
 *   /              → SequenceFlow (picker → engine → aftermath)
 *   /engine/:id    → deep-link a variant (instant-reset | orienting-anchor | coherence-ripple)
 *   /crane         → AI guide (Crane; /heron redirects here)
 *   /portal        → provider dashboard
 *   /privacy       → privacy policy
 *   /terms         → terms and medical disclaimer
 *   /support       → support portal
 */
export default function App() {
  return (
    <>
      <TelemetryFlush />
      <Routes>
        <Route path="/" element={<SequenceFlow />} />
        <Route path="/engine" element={<Navigate to="/" replace />} />
        <Route path="/engine/:variantId" element={<EngineRoute />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/surge" element={<Navigate to="/" replace />} />
        <Route path="/crane" element={<CraneChat />} />
        <Route path="/heron" element={<Navigate to="/crane" replace />} />
        <Route path="/egret" element={<Navigate to="/crane" replace />} />
        <Route path="/portal" element={<ProviderPortal />} />
        <Route path="/dev/surge-classic" element={<SurgeInterface />} />
        <Route path="/dev/surge-flow-legacy" element={<SurgeFlow />} />
      </Routes>
    </>
  );
}
