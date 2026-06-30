import { useCallback, useRef, useState } from 'react';

/**
 * Tracks advisor call budget across a Crane conversation session.
 */
export function useCraneSessionMeta() {
  const [advisorCallsTotal, setAdvisorCallsTotal] = useState(0);
  const turnCountRef = useRef(0);

  const nextTurn = useCallback(() => {
    turnCountRef.current += 1;
    return turnCountRef.current;
  }, []);

  const recordInferenceMeta = useCallback((inference) => {
    if (typeof inference?.advisorCallsTotal === 'number') {
      setAdvisorCallsTotal(inference.advisorCallsTotal);
    } else if (inference?.advisorCallsThisRequest) {
      setAdvisorCallsTotal((prev) => prev + inference.advisorCallsThisRequest);
    }
  }, []);

  const getSessionMeta = useCallback(
    () => ({
      advisorCallsTotal,
      turnCount: turnCountRef.current,
    }),
    [advisorCallsTotal],
  );

  const resetSessionMeta = useCallback(() => {
    setAdvisorCallsTotal(0);
    turnCountRef.current = 0;
  }, []);

  return {
    advisorCallsTotal,
    getSessionMeta,
    nextTurn,
    recordInferenceMeta,
    resetSessionMeta,
  };
}
