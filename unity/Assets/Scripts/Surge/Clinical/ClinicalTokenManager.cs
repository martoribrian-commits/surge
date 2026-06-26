using System;
using System.Collections;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.Networking;

namespace Surge.Clinical
{
    /// <summary>
    /// Owns the anonymous Clinical Token used by the B2B Clinical Referral model.
    ///
    /// There are NO Apple In-App Purchases and NO identity logins. A clinic
    /// purchases enterprise seats and hands a patient a short, anonymous token
    /// (a 6-character alphanumeric string). That token — and nothing about the
    /// person — unlocks the premium procedural recovery AI (Heron).
    ///
    /// Design principles (Slow Tech, crisis-safe):
    ///   * <see cref="IsHeronUnlocked"/> is a purely local, instant check. It
    ///     never touches the network, so it is safe to call at the peak of a
    ///     dysregulated episode and works fully offline / in airplane mode.
    ///   * Backend verification is always best-effort and runs in the
    ///     background. Being offline, timing out, or hitting a server error
    ///     NEVER re-locks or interrupts a vulnerable user.
    ///   * The only thing that revokes access locally is an explicit "this token
    ///     is invalid" response from a reachable backend (e.g. a revoked seat),
    ///     and even then it happens quietly with no alarming pop-up.
    /// </summary>
    [DisallowMultipleComponent]
    public class ClinicalTokenManager : MonoBehaviour
    {
        #region Configuration (Supabase)

        [Header("Supabase — Clinical Referral backend")]
        [Tooltip("Base project URL, e.g. https://abcd1234.supabase.co")]
        [SerializeField] private string supabaseUrl = "https://YOUR-PROJECT.supabase.co";

        [Tooltip("Public anon key. Safe to ship; verification is enforced server-side.")]
        [SerializeField] private string supabaseAnonKey = "YOUR-SUPABASE-ANON-KEY";

        [Tooltip("Edge Function that validates a clinical token against active seats.")]
        [SerializeField] private string verifyFunctionPath = "/functions/v1/verify-clinical-token";

        [Tooltip("Network timeout in seconds. Kept short — we never make the user wait.")]
        [SerializeField] private int requestTimeoutSeconds = 10;

        [Tooltip("How often (hours) to silently re-confirm a cached token in the background.")]
        [SerializeField] private float reverifyIntervalHours = 24f;

        #endregion

        #region Keys & constants

        private const string TokenKey = "surge.clinical.token";
        private const string VerifiedKey = "surge.clinical.verified";          // 1 once a backend has confirmed it
        private const string LastVerifiedKey = "surge.clinical.lastVerifiedUtc"; // ISO-8601 (round-trip)

        /// <summary>Tokens are exactly 6 uppercase alphanumeric characters.</summary>
        public const int TokenLength = 6;

        private static readonly Regex TokenFormat =
            new Regex("^[A-Z0-9]{6}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

        #endregion

        /// <summary>Outcome of a background verification attempt.</summary>
        public enum VerificationResult
        {
            /// <summary>Backend confirmed the token maps to an active clinic seat.</summary>
            Valid,
            /// <summary>Backend was reachable and explicitly rejected the token.</summary>
            Invalid,
            /// <summary>No connectivity. The cached token is kept and stays unlocked.</summary>
            Offline,
            /// <summary>Transport/server error. The cached token is kept and stays unlocked.</summary>
            Error,
            /// <summary>The supplied string is not a well-formed 6-char token.</summary>
            Malformed,
        }

        /// <summary>
        /// Raised whenever the unlocked state flips (token cached/cleared). UI can
        /// quietly update an affordance; it must not be used to throw a modal.
        /// </summary>
        public static event Action OnUnlockChanged;

        public static ClinicalTokenManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            // Opportunistically re-confirm any cached token in the background.
            // Purely silent; never gates startup or the crisis trigger.
            VerifyCachedTokenInBackground();
        }

        #region Public API

        /// <summary>
        /// TRUE if a well-formed clinical token is cached locally. Local-only and
        /// instant: no network, no awaits. This is the single source of truth the
        /// rest of the app (e.g. <c>HeronBridge</c>) should consult.
        /// </summary>
        public static bool IsHeronUnlocked()
        {
            string token = GetCachedToken();
            return IsWellFormed(token);
        }

        /// <summary>The normalized token currently cached, or empty string.</summary>
        public static string GetCachedToken()
        {
            return PlayerPrefs.GetString(TokenKey, string.Empty);
        }

        /// <summary>TRUE once a reachable backend has confirmed the cached token at least once.</summary>
        public static bool IsServerConfirmed()
        {
            return PlayerPrefs.GetInt(VerifiedKey, 0) == 1;
        }

        /// <summary>Format-only validity check (length + charset). Does not hit the network.</summary>
        public static bool IsWellFormed(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            return TokenFormat.IsMatch(Normalize(token));
        }

        /// <summary>Trim + upper-case so user entry ("ab12cd ") matches the canonical form.</summary>
        public static string Normalize(string raw)
        {
            return string.IsNullOrEmpty(raw) ? string.Empty : raw.Trim().ToUpperInvariant();
        }

        /// <summary>
        /// Cache a token entered by the user (e.g. from the minimalist "Enter
        /// Clinical Token" hook on the standard cooldown screen).
        ///
        /// The user is unlocked OPTIMISTICALLY the moment a well-formed token is
        /// stored — they should never wait on a server during a crisis. A
        /// background verification then confirms (or, only if a reachable server
        /// explicitly rejects it, quietly clears) the token. The optional
        /// <paramref name="onResult"/> callback reports the eventual outcome for
        /// non-intrusive UI feedback.
        /// </summary>
        public void CacheToken(string rawToken, Action<VerificationResult> onResult = null)
        {
            string token = Normalize(rawToken);
            if (!IsWellFormed(token))
            {
                onResult?.Invoke(VerificationResult.Malformed);
                return;
            }

            bool wasUnlocked = IsHeronUnlocked();
            PlayerPrefs.SetString(TokenKey, token);
            PlayerPrefs.SetInt(VerifiedKey, 0);
            PlayerPrefs.DeleteKey(LastVerifiedKey);
            PlayerPrefs.Save();

            if (!wasUnlocked)
            {
                OnUnlockChanged?.Invoke();
            }

            StartCoroutine(VerifyRoutine(token, onResult));
        }

        /// <summary>Quietly remove the cached token (e.g. seat returned). Relocks Heron.</summary>
        public void ClearToken()
        {
            bool wasUnlocked = IsHeronUnlocked();

            PlayerPrefs.DeleteKey(TokenKey);
            PlayerPrefs.DeleteKey(VerifiedKey);
            PlayerPrefs.DeleteKey(LastVerifiedKey);
            PlayerPrefs.Save();

            if (wasUnlocked)
            {
                OnUnlockChanged?.Invoke();
            }
        }

        /// <summary>
        /// Re-confirm the cached token against the backend, but only if it is due
        /// for a refresh. Completely silent and non-blocking; safe to call on
        /// launch or when connectivity returns.
        /// </summary>
        public void VerifyCachedTokenInBackground()
        {
            string token = GetCachedToken();
            if (!IsWellFormed(token) || !NeedsReverify())
            {
                return;
            }

            StartCoroutine(VerifyRoutine(token, null));
        }

        #endregion

        #region Backend verification (template)

        private IEnumerator VerifyRoutine(string token, Action<VerificationResult> onResult)
        {
            // Offline is a first-class, expected state — not an error. Keep the
            // user unlocked and bail out without touching the network.
            if (Application.internetReachability == NetworkReachability.NotReachable)
            {
                onResult?.Invoke(VerificationResult.Offline);
                yield break;
            }

            string url = supabaseUrl.TrimEnd('/') + verifyFunctionPath;
            byte[] body = Encoding.UTF8.GetBytes("{\"token\":\"" + token + "\"}");

            using (UnityWebRequest request = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST))
            {
                request.uploadHandler = new UploadHandlerRaw(body);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("apikey", supabaseAnonKey);
                request.SetRequestHeader("Authorization", "Bearer " + supabaseAnonKey);
                request.timeout = requestTimeoutSeconds;

                yield return request.SendWebRequest();

                if (HasTransportError(request))
                {
                    // Could not reach a verdict. Never punish a vulnerable user for
                    // our infrastructure; keep them unlocked and try again later.
                    onResult?.Invoke(VerificationResult.Error);
                    yield break;
                }

                TokenVerifyResponse parsed = SafeParse(request.downloadHandler.text);
                if (parsed != null && parsed.valid)
                {
                    PlayerPrefs.SetInt(VerifiedKey, 1);
                    PlayerPrefs.SetString(LastVerifiedKey, DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture));
                    PlayerPrefs.Save();
                    onResult?.Invoke(VerificationResult.Valid);
                }
                else
                {
                    // A reachable backend explicitly rejected this token (e.g. the
                    // clinic seat was revoked). Quietly downgrade to the free tier.
                    ClearToken();
                    onResult?.Invoke(VerificationResult.Invalid);
                }
            }
        }

        private bool NeedsReverify()
        {
            string last = PlayerPrefs.GetString(LastVerifiedKey, string.Empty);
            if (string.IsNullOrEmpty(last))
            {
                return true;
            }

            if (DateTime.TryParse(last, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime stamp))
            {
                return (DateTime.UtcNow - stamp).TotalHours >= reverifyIntervalHours;
            }

            return true;
        }

        private static bool HasTransportError(UnityWebRequest request)
        {
#if UNITY_2020_1_OR_NEWER
            return request.result != UnityWebRequest.Result.Success;
#else
            return request.isNetworkError || request.isHttpError;
#endif
        }

        private static TokenVerifyResponse SafeParse(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return null;
            }

            try
            {
                return JsonUtility.FromJson<TokenVerifyResponse>(json);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Expected JSON shape from the verify Edge Function, e.g.
        /// <c>{ "valid": true, "clinicId": "…", "message": "…" }</c>.
        /// </summary>
        // Fields are populated by JsonUtility via reflection, not in code.
#pragma warning disable 0649
        [Serializable]
        private class TokenVerifyResponse
        {
            public bool valid;
            public string clinicId;
            public string message;
        }
#pragma warning restore 0649

        #endregion
    }
}
