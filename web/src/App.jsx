import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';
import CraneChat from './components/CraneChat';
import ProviderPortal from './components/ProviderPortal';
import TelemetryFlush from './components/TelemetryFlush';

export default function App() {
  return (
    <>
      <TelemetryFlush />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/surge" element={<SurgeInterface />} />
        <Route path="/crane" element={<CraneChat />} />
        <Route path="/heron" element={<Navigate to="/crane" replace />} />
        <Route path="/egret" element={<Navigate to="/crane" replace />} />
        <Route path="/portal" element={<ProviderPortal />} />
      </Routes>
    </>
  );
}
