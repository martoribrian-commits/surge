import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SurgeInterface from './components/SurgeInterface';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/surge" element={<SurgeInterface />} />
    </Routes>
  );
}
