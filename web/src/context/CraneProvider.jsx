import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SurgePhase } from '../state/surgeSessionMachine';

const CraneContext = createContext(null);

/**
 * Site-wide Crane panel state — available on every page except in-flow decompression.
 */
export function CraneProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sequencePhase, setSequencePhase] = useState(null);
  const location = useLocation();

  const hideFab =
    sequencePhase === SurgePhase.DECOMPRESSION ||
    location.pathname === '/crane';

  const openCrane = useCallback(() => setIsOpen(true), []);
  const closeCrane = useCallback(() => setIsOpen(false), []);
  const toggleCrane = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      isOpen,
      hideFab,
      openCrane,
      closeCrane,
      toggleCrane,
      setSequencePhase,
    }),
    [isOpen, hideFab, openCrane, closeCrane, toggleCrane],
  );

  return <CraneContext.Provider value={value}>{children}</CraneContext.Provider>;
}

export function useCrane() {
  const ctx = useContext(CraneContext);
  if (!ctx) {
    throw new Error('useCrane must be used within CraneProvider');
  }
  return ctx;
}

/** Safe hook for components that may render outside provider (returns null actions). */
export function useCraneOptional() {
  return useContext(CraneContext);
}
