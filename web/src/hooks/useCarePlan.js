import { useCallback, useEffect, useState } from 'react';
import {
  isCarePlanComplete,
  loadCarePlan,
  nextIncompleteStep,
  saveCarePlan,
  toggleCarePlanStep,
} from '../lib/craneCarePlanUtils';

/**
 * Care plan state with step completion checkboxes (persisted per session).
 */
export function useCarePlan(sessionId, initialPlan = null) {
  const [carePlan, setCarePlan] = useState(() => {
    if (sessionId) {
      const cached = loadCarePlan(sessionId);
      if (cached) return cached;
    }
    return initialPlan;
  });

  useEffect(() => {
    if (!sessionId) return;
    const cached = loadCarePlan(sessionId);
    if (cached) setCarePlan(cached);
  }, [sessionId]);

  useEffect(() => {
    if (initialPlan && !carePlan) {
      setCarePlan(initialPlan);
      if (sessionId) saveCarePlan(sessionId, initialPlan);
    }
  }, [initialPlan, carePlan, sessionId]);

  const setPlan = useCallback(
    (plan) => {
      if (!plan) return;
      const existing = sessionId ? loadCarePlan(sessionId) : null;
      const merged = {
        ...plan,
        completedSteps: existing?.completedSteps ?? plan.completedSteps ?? [],
      };
      setCarePlan(merged);
      if (sessionId) saveCarePlan(sessionId, merged);
    },
    [sessionId],
  );

  const toggleStep = useCallback(
    (stepOrder) => {
      if (!sessionId) {
        setCarePlan((prev) => {
          if (!prev) return prev;
          const completed = new Set(prev.completedSteps ?? []);
          if (completed.has(stepOrder)) completed.delete(stepOrder);
          else completed.add(stepOrder);
          return { ...prev, completedSteps: [...completed].sort((a, b) => a - b) };
        });
        return;
      }
      const updated = toggleCarePlanStep(sessionId, stepOrder);
      if (updated) setCarePlan(updated);
    },
    [sessionId],
  );

  const isStepComplete = useCallback(
    (stepOrder) => (carePlan?.completedSteps ?? []).includes(stepOrder),
    [carePlan],
  );

  return {
    carePlan,
    setPlan,
    toggleStep,
    isStepComplete,
    isComplete: isCarePlanComplete(carePlan),
    nextStep: nextIncompleteStep(carePlan),
  };
}
