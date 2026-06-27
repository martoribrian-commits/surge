import { Routes, Route, Navigate } from 'react-router-dom';
import SurgeFlow from './views/SurgeFlow';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';
import CraneChat from './components/CraneChat';
import ProviderPortal from './components/ProviderPortal';
import TelemetryFlush from './components/TelemetryFlush';

/**
 * MVP routing:
 *   /        → SurgeFlow (instant circuit breaker, zero gates)
 *   /about   → marketing landing (optional)
 *   /surge   → legacy engine route (redirects home)
 *   /crane   → AI guide chat
 *   /portal  → provider dashboard
 */
export default function App() {
  return (
    <>
      <TelemetryFlush />
      <Routes>
        <Route path="/" element={<SurgeFlow />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/surge" element={<Navigate to="/" replace />} />
        <Route path="/engine" element={<Navigate to="/" replace />} />
        <Route path="/crane" element={<CraneChat />} />
        <Route path="/heron" element={<Navigate to="/crane" replace />} />
        <Route path="/egret" element={<Navigate to="/crane" replace />} />
        <Route path="/portal" element={<ProviderPortal />} />
        {/* Legacy full-screen engine kept for comparison / dev */}
        <Route path="/dev/surge-classic" element={<SurgeInterface />} />
      </Routes>
    </>
  );
}
