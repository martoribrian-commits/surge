import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  clinicalToken: 'surge.clinicalToken',
  heronUnlocked: 'surge.isHeronUnlocked',
};

const TOKEN_PATTERN = /^[A-Za-z0-9]{6}$/;

const VALIDATION_ENDPOINT =
  import.meta.env.VITE_SUPABASE_VALIDATE_URL ??
  'https://YOUR_PROJECT.supabase.co/functions/v1/validate-clinical-token';

/**
 * B2B authentication hook for anonymous Clinical Tokens.
 *
 * Tokens unlock premium features (Heron AI guide). Validation is
 * fire-and-forget — network failures never block the crisis UI.
 */
export function useTokenManager() {
  const [clinicalToken, setClinicalTokenState] = useState(null);
  const [isHeronUnlocked, setIsHeronUnlocked] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const setHeronUnlocked = useCallback((unlocked) => {
    setIsHeronUnlocked(unlocked);
    try {
      localStorage.setItem(STORAGE_KEYS.heronUnlocked, String(unlocked));
    } catch {
      // localStorage unavailable — continue in-memory
    }
  }, []);

  /**
   * Validates token against Supabase Edge Function.
   * Never throws — all errors fail gracefully.
   */
  const validateTokenRemotely = useCallback(
    async (token) => {
      setIsValidating(true);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        const response = await fetch(VALIDATION_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setHeronUnlocked(Boolean(data.valid));

          if (!data.valid) {
            setClinicalTokenState(null);
            localStorage.removeItem(STORAGE_KEYS.clinicalToken);
          }
        } else if (response.status === 401 || response.status === 403) {
          setClinicalTokenState(null);
          setHeronUnlocked(false);
          localStorage.removeItem(STORAGE_KEYS.clinicalToken);
          localStorage.removeItem(STORAGE_KEYS.heronUnlocked);
        }
      } catch {
        // Network unreachable, timeout — crisis flow unaffected
      } finally {
        setIsValidating(false);
      }
    },
    [setHeronUnlocked],
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.clinicalToken);
      const unlocked = localStorage.getItem(STORAGE_KEYS.heronUnlocked) === 'true';

      if (cached && TOKEN_PATTERN.test(cached)) {
        setClinicalTokenState(cached);
        setIsHeronUnlocked(unlocked);
        validateTokenRemotely(cached);
      }
    } catch {
      // Private browsing — continue offline
    }
  }, [validateTokenRemotely]);

  /**
   * Persists token locally and kicks off async validation.
   * Returns immediately — never blocks the UI.
   */
  const submitToken = useCallback(
    (rawToken) => {
      const normalized = rawToken.toUpperCase().trim();

      if (!TOKEN_PATTERN.test(normalized)) {
        return false;
      }

      setClinicalTokenState(normalized);

      try {
        localStorage.setItem(STORAGE_KEYS.clinicalToken, normalized);
      } catch {
        // Continue with in-memory token
      }

      setHeronUnlocked(true);
      validateTokenRemotely(normalized);
      return true;
    },
    [setHeronUnlocked, validateTokenRemotely],
  );

  const clearToken = useCallback(() => {
    setClinicalTokenState(null);
    setHeronUnlocked(false);

    try {
      localStorage.removeItem(STORAGE_KEYS.clinicalToken);
      localStorage.removeItem(STORAGE_KEYS.heronUnlocked);
    } catch {
      // Non-fatal
    }
  }, [setHeronUnlocked]);

  return {
    clinicalToken,
    isHeronUnlocked,
    isValidating,
    submitToken,
    clearToken,
  };
}
