import { useState, useEffect, useCallback, useRef } from 'react';
import { validateClinicalToken } from '../lib/egretClient';

const STORAGE_KEYS = {
  token: 'surge.clinicalToken',
  egretUnlocked: 'surge.isEgretUnlocked',
};

const TOKEN_PATTERN = /^[A-Za-z0-9]{6}$/;
const VALIDATION_TIMEOUT_MS = 10_000;
const INVALID_TOKEN_MESSAGE = 'Invalid token.';

/**
 * B2B authentication hook for anonymous Clinical Tokens.
 * Validates via Netlify /api/validate-token — no PII returned.
 */
export function useTokenManager() {
  const [token, setToken] = useState('');
  const [isEgretUnlocked, setIsEgretUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Private browsing
    }
  }, []);

  const persistEgretUnlocked = useCallback((unlocked) => {
    setIsEgretUnlocked(unlocked);
    try {
      localStorage.setItem(STORAGE_KEYS.egretUnlocked, String(unlocked));
    } catch {
      // Non-fatal
    }
  }, []);

  const wipeCachedToken = useCallback(() => {
    persistToken('');
    persistEgretUnlocked(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.egretUnlocked);
    } catch {
      // Non-fatal
    }
  }, [persistToken, persistEgretUnlocked]);

  const readCachedUnlockState = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.egretUnlocked) === 'true';
    } catch {
      return isEgretUnlocked;
    }
  }, [isEgretUnlocked]);

  const queryTokenValidity = useCallback(async (normalizedToken) => {
    const queryPromise = validateClinicalToken(normalizedToken).then((r) => r.valid);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), VALIDATION_TIMEOUT_MS);
    });
    return Promise.race([queryPromise, timeoutPromise]);
  }, []);

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

        if (seq !== validationSeqRef.current) {
          return { valid: false, offline: false };
        }

        if (valid) {
          persistToken(normalized);
          persistEgretUnlocked(true);
          setError('');
          return { valid: true, offline: false };
        }

        setError(INVALID_TOKEN_MESSAGE);
        wipeCachedToken();
        return { valid: false, offline: false };
      } catch {
        if (seq !== validationSeqRef.current) {
          return { valid: false, offline: true };
        }

        const cachedUnlock = readCachedUnlockState();
        persistEgretUnlocked(cachedUnlock);

        try {
          const cachedToken = localStorage.getItem(STORAGE_KEYS.token) ?? '';
          if (cachedToken && TOKEN_PATTERN.test(cachedToken)) {
            setToken(cachedToken);
          }
        } catch {
          // Non-fatal
        }

        setError('');
        return { valid: cachedUnlock, offline: true };
      } finally {
        if (seq === validationSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [queryTokenValidity, persistToken, persistEgretUnlocked, wipeCachedToken, readCachedUnlockState],
  );

  useEffect(() => {
    try {
      const cachedToken = localStorage.getItem(STORAGE_KEYS.token) ?? '';
      const cachedUnlock = localStorage.getItem(STORAGE_KEYS.egretUnlocked) === 'true';

      if (cachedToken && TOKEN_PATTERN.test(cachedToken)) {
        setToken(cachedToken);
        setIsEgretUnlocked(cachedUnlock);
        validateToken(cachedToken);
      }
    } catch {
      // Private browsing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearToken = useCallback(() => {
    validationSeqRef.current += 1;
    setError('');
    setIsLoading(false);
    wipeCachedToken();
  }, [wipeCachedToken]);

  return {
    token,
    isEgretUnlocked,
    isLoading,
    error,
    validateToken,
    clearToken,
  };
}
