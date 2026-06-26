import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEYS = {
  token: 'surge.clinicalToken',
  heronUnlocked: 'surge.isHeronUnlocked',
};

const TOKEN_PATTERN = /^[A-Za-z0-9]{6}$/;
const VALIDATION_TIMEOUT_MS = 10_000;
const INVALID_TOKEN_MESSAGE = 'Invalid token.';

/** Edge Function name — used when direct table access is unavailable. */
const VALIDATE_FUNCTION = 'validate-clinical-token';

/**
 * B2B authentication hook for anonymous Clinical Tokens.
 *
 * Validates against Supabase (`clinical_tokens` table or Edge Function).
 * Network failures never block the crisis UI — cached unlock state is preserved.
 */
export function useTokenManager() {
  const [token, setToken] = useState('');
  const [isHeronUnlocked, setIsHeronUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent stale background validations from overwriting newer state
  const validationSeqRef = useRef(0);

  const persistToken = useCallback((value) => {
    setToken(value);
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEYS.token, value);
      } else {
        localStorage.removeItem(STORAGE_KEYS.token);
      }
    } catch {
      // Private browsing — in-memory only
    }
  }, []);

  const persistHeronUnlocked = useCallback((unlocked) => {
    setIsHeronUnlocked(unlocked);
    try {
      localStorage.setItem(STORAGE_KEYS.heronUnlocked, String(unlocked));
    } catch {
      // Non-fatal
    }
  }, []);

  const wipeCachedToken = useCallback(() => {
    persistToken('');
    persistHeronUnlocked(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.heronUnlocked);
    } catch {
      // Non-fatal
    }
  }, [persistToken, persistHeronUnlocked]);

  const readCachedUnlockState = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.heronUnlocked) === 'true';
    } catch {
      return isHeronUnlocked;
    }
  }, [isHeronUnlocked]);

  /**
   * Query Supabase for token validity.
   * Tries `clinical_tokens` table first, then Edge Function fallback.
   */
  const queryTokenValidity = useCallback(async (normalizedToken) => {
    if (!supabase) {
      throw new Error('offline');
    }

    const queryPromise = (async () => {
      const { data, error: tableError } = await supabase
        .from('clinical_tokens')
        .select('token')
        .eq('token', normalizedToken)
        .eq('active', true)
        .maybeSingle();

      if (tableError) {
        // RLS denial or schema unavailable — fall back to Edge Function
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          VALIDATE_FUNCTION,
          { body: { token: normalizedToken } },
        );

        if (fnError) {
          throw fnError;
        }

        return Boolean(fnData?.valid);
      }

      return Boolean(data);
    })();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), VALIDATION_TIMEOUT_MS);
    });

    return Promise.race([queryPromise, timeoutPromise]);
  }, []);

  /**
   * Validates a 6-character clinical token against Supabase.
   *
   * Never throws — returns `{ valid, offline }` for optional UI feedback.
   * `isLoading` is set but never gates the somatic engine.
   */
  const validateToken = useCallback(
    async (inputToken) => {
      const normalized = inputToken.toUpperCase().trim();
      const seq = ++validationSeqRef.current;

      if (!TOKEN_PATTERN.test(normalized)) {
        setError(INVALID_TOKEN_MESSAGE);
        wipeCachedToken();
        return { valid: false, offline: false };
      }

      setIsLoading(true);
      setError('');

      try {
        const valid = await queryTokenValidity(normalized);

        // Discard if a newer validation superseded this one
        if (seq !== validationSeqRef.current) {
          return { valid: false, offline: false };
        }

        if (valid) {
          persistToken(normalized);
          persistHeronUnlocked(true);
          setError('');
          return { valid: true, offline: false };
        }

        setError(INVALID_TOKEN_MESSAGE);
        wipeCachedToken();
        return { valid: false, offline: false };
      } catch {
        // Network timeout / offline — preserve last cached unlock state
        if (seq !== validationSeqRef.current) {
          return { valid: false, offline: true };
        }

        const cachedUnlock = readCachedUnlockState();
        persistHeronUnlocked(cachedUnlock);

        try {
          const cachedToken = localStorage.getItem(STORAGE_KEYS.token) ?? '';
          if (cachedToken && TOKEN_PATTERN.test(cachedToken)) {
            setToken(cachedToken);
          }
        } catch {
          // Non-fatal
        }

        // Do not surface network errors during a crisis — zero friction
        setError('');
        return { valid: cachedUnlock, offline: true };
      } finally {
        if (seq === validationSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [queryTokenValidity, persistToken, persistHeronUnlocked, wipeCachedToken, readCachedUnlockState],
  );

  // Hydrate from localStorage and silently re-validate in background (once on mount)
  useEffect(() => {
    try {
      const cachedToken = localStorage.getItem(STORAGE_KEYS.token) ?? '';
      const cachedUnlock = localStorage.getItem(STORAGE_KEYS.heronUnlocked) === 'true';

      if (cachedToken && TOKEN_PATTERN.test(cachedToken)) {
        setToken(cachedToken);
        setIsHeronUnlocked(cachedUnlock);
        validateToken(cachedToken);
      }
    } catch {
      // Private browsing — continue without persistence
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydration
  }, []);

  const clearToken = useCallback(() => {
    validationSeqRef.current += 1;
    setError('');
    setIsLoading(false);
    wipeCachedToken();
  }, [wipeCachedToken]);

  return {
    token,
    isHeronUnlocked,
    isLoading,
    error,
    validateToken,
    clearToken,
  };
}
