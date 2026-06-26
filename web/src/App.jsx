import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';
import EgretChat from './components/EgretChat';
import ProviderPortal from './components/ProviderPortal';
import TelemetryFlush from './components/TelemetryFlush';

export default function App() {
  return (
    <>
      <TelemetryFlush />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/surge" element={<SurgeInterface />} />
        <Route path="/egret" element={<EgretChat />} />
        <Route path="/heron" element={<Navigate to="/egret" replace />} />
        <Route path="/portal" element={<ProviderPortal />} />
      </Routes>
    </>
  );
}
