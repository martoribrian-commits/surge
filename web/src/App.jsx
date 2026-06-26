import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';
import TelemetryFlush from './components/TelemetryFlush';

export default function App() {
  return (
    <>
      <TelemetryFlush />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/surge" element={<SurgeInterface />} />
      </Routes>
    </>
  );
}
