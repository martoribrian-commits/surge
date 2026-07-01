import { useCallback, useEffect, useState } from 'react';
import { fetchCraneContext, requestPostSessionCarePlan } from '../lib/craneClient';
import {
  loadBodyInsight,
  loadCarePlan,
  processCraneInferenceResult,
  saveBodyInsight,
  saveCarePlan,
} from '../lib/craneCarePlanUtils';

/**
 * Shared post-session care plan + body debrief fetch for aftermath and decompression.
 */
export function usePostSessionCarePlan({ sessionId, variantId, isCraneUnlocked, enabled = true }) {
  const [carePlan, setCarePlan] = useState(null);
  const [bodyInsight, setBodyInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyInference = useCallback(
    (inference) => {
      if (!inference || inference.requiresClinicalToken) return;
      processCraneInferenceResult(inference, { sessionId, variantId });
      if (inference.carePlan) {
        saveCarePlan(sessionId, inference.carePlan);
        setCarePlan(inference.carePlan);
      }
      if (inference.bodyInsight) {
        saveBodyInsight(sessionId, inference.bodyInsight);
        setBodyInsight(inference.bodyInsight);
      }
    },
    [sessionId, variantId],
  );

  const refetch = useCallback(async () => {
    if (!sessionId || !isCraneUnlocked) return;
    setLoading(true);
    setError(null);
    try {
      const context = await fetchCraneContext(sessionId);
      const inference = await requestPostSessionCarePlan({
        supabaseContext: context,
        sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
        clinicalAccess: true,
      });
      applyInference(inference);
    } catch {
      setError('Could not load recovery plan. Try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, isCraneUnlocked, applyInference]);

  useEffect(() => {
    if (!enabled || !sessionId) return undefined;

    const cachedPlan = loadCarePlan(sessionId);
    const cachedInsight = loadBodyInsight(sessionId);
    if (cachedPlan?.steps?.length) setCarePlan(cachedPlan);
    if (cachedInsight) setBodyInsight(cachedInsight);
    if (cachedPlan && cachedInsight) return undefined;

    if (!isCraneUnlocked) return undefined;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const context = await fetchCraneContext(sessionId);
        const inference = await requestPostSessionCarePlan({
          supabaseContext: context,
          sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
          clinicalAccess: true,
        });
        if (!cancelled) applyInference(inference);
      } catch {
        if (!cancelled) setError('Could not load recovery plan.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, variantId, isCraneUnlocked, enabled, applyInference]);

  return {
    carePlan,
    bodyInsight,
    loading,
    error,
    refetch,
    setCarePlan,
    setBodyInsight,
  };
}
