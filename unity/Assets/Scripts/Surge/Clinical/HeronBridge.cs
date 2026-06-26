using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace Surge.Clinical
{
    /// <summary>
    /// Immutable record of a single Surge session, handed off to Heron and/or
    /// synced to the backend. It carries no personal identity — only what the
    /// session itself was.
    /// </summary>
    [Serializable]
    public struct SurgeSessionPayload
    {
        /// <summary>Anonymous, per-session id (not tied to a person).</summary>
        public string sessionId;

        /// <summary>Seconds the user actually held through the curve.</summary>
        public float duration;

        /// <summary>True if the 90-second curve reached 0.0 (a full reset).</summary>
        public bool completedFullCycle;

        /// <summary>UTC ISO-8601 capture time, so late syncs keep their real timestamp.</summary>
        public string completedAtUtc;

        public static SurgeSessionPayload Create(string sessionId, float duration, bool completedFullCycle)
        {
            return new SurgeSessionPayload
            {
                sessionId = string.IsNullOrEmpty(sessionId) ? Guid.NewGuid().ToString("N") : sessionId,
                duration = duration,
                completedFullCycle = completedFullCycle,
                completedAtUtc = DateTime.UtcNow.ToString("o"),
            };
        }
    }

    /// <summary>
    /// The API Handoff Layer.
    ///
    /// Listens for the end of a Surge cycle and decides — instantly and locally —
    /// where the vulnerable user goes next:
    ///   * Clinical token present  -> <see cref="OnTransitionToHeron"/> (premium recovery AI).
    ///   * No token                -> <see cref="OnTransitionToStandardCooldown"/> (free,
    ///     offline grounding text, with a quiet "Enter Clinical Token" affordance).
    ///
    /// The UI transition is decided with a purely local check and fires the SAME
    /// frame the session completes. Networking (logging / syncing the session to
    /// Supabase) is strictly fire-and-forget and can NEVER make the transition
    /// hang. If the device is offline, the payload is durably queued to disk and
    /// synced opportunistically later.
    /// </summary>
    [DisallowMultipleComponent]
    public class HeronBridge : MonoBehaviour
    {
        #region Public transition events

        /// <summary>Unlocked: package is ready — load the Heron procedural recovery AI.</summary>
        public static event Action<SurgeSessionPayload> OnTransitionToHeron;

        /// <summary>
        /// Locked (no clinical token): show the free, offline grounding cooldown
        /// screen. That screen should render a highly minimalist, non-intrusive
        /// hook to "Enter Clinical Token" (route the entered string to
        /// <see cref="ClinicalTokenManager.CacheToken"/>). No aggressive upsell.
        /// </summary>
        public static event Action<SurgeSessionPayload> OnTransitionToStandardCooldown;

        #endregion

        #region Configuration (Supabase sync)

        [Header("Supabase — Clinical Referral backend")]
        [SerializeField] private string supabaseUrl = "https://YOUR-PROJECT.supabase.co";
        [SerializeField] private string supabaseAnonKey = "YOUR-SUPABASE-ANON-KEY";

        [Tooltip("Edge Function (or PostgREST endpoint) that records a completed session.")]
        [SerializeField] private string sessionsFunctionPath = "/functions/v1/log-surge-session";

        [SerializeField] private int requestTimeoutSeconds = 10;

        #endregion

        private const string QueueFileName = "surge_session_queue.json";

        private bool _flushing;

        private string QueuePath => Path.Combine(Application.persistentDataPath, QueueFileName);

        #region Wiring

        private void OnEnable()
        {
            // Expected SurgeManager contract:
            //
            //     public static event Action<string, float, bool> OnSurgeComplete;
            //         // (sessionId, duration, completedFullCycle)
            //
            // If your SurgeManager raises completion differently (e.g. a
            // parameterless event, or one that already carries a payload), simply
            // adapt this one line and call the public HandleSurgeComplete(...)
            // entry point below — the rest of the bridge is decoupled from it.
            SurgeManager.OnSurgeComplete += HandleSurgeComplete;
        }

        private void OnDisable()
        {
            SurgeManager.OnSurgeComplete -= HandleSurgeComplete;
        }

        private void Start()
        {
            // Flush anything stranded by a previous offline session.
            TrySyncQueuedSessions();
        }

        #endregion

        #region Completion handling

        /// <summary>Adapter for the <c>SurgeManager.OnSurgeComplete</c> primitive signature.</summary>
        private void HandleSurgeComplete(string sessionId, float duration, bool completedFullCycle)
        {
            HandleSurgeComplete(SurgeSessionPayload.Create(sessionId, duration, completedFullCycle));
        }

        /// <summary>
        /// Core handoff. Public so the session can also be routed directly by any
        /// other completion source. Decides the next screen synchronously; all
        /// network work is dispatched fire-and-forget afterwards.
        /// </summary>
        public void HandleSurgeComplete(SurgeSessionPayload payload)
        {
            // 1) Durably record the session FIRST (so a crash or a kill during sync
            //    never loses it), then kick off a non-blocking upload attempt.
            PersistAndSync(payload);

            // 2) Route the user immediately using a local, instant check. This must
            //    not depend on — or wait for — any network response.
            if (ClinicalTokenManager.IsHeronUnlocked())
            {
                OnTransitionToHeron?.Invoke(payload);
            }
            else
            {
                OnTransitionToStandardCooldown?.Invoke(payload);
            }
        }

        #endregion

        #region Offline-resilient persistence & sync

        private void PersistAndSync(SurgeSessionPayload payload)
        {
            EnqueueLocally(payload);

            // Only attempt the network when we actually have connectivity; either
            // way the transition above has already happened.
            if (Application.internetReachability != NetworkReachability.NotReachable)
            {
                StartCoroutine(FlushQueueRoutine());
            }
        }

        /// <summary>
        /// Attempt to push any locally-queued sessions to Supabase. Safe to call
        /// on launch or whenever connectivity is regained. No-op while offline or
        /// if a flush is already running.
        /// </summary>
        public void TrySyncQueuedSessions()
        {
            if (Application.internetReachability == NetworkReachability.NotReachable)
            {
                return;
            }

            StartCoroutine(FlushQueueRoutine());
        }

        private IEnumerator FlushQueueRoutine()
        {
            if (_flushing)
            {
                yield break;
            }

            _flushing = true;

            SessionQueue queue = LoadQueue();
            while (queue.items.Count > 0)
            {
                if (Application.internetReachability == NetworkReachability.NotReachable)
                {
                    break;
                }

                bool uploaded = false;
                yield return StartCoroutine(UploadRoutine(queue.items[0], success => uploaded = success));

                if (!uploaded)
                {
                    // Leave the queue intact and stop; we'll retry next opportunity
                    // rather than spin and drain the battery of someone in crisis.
                    break;
                }

                queue.items.RemoveAt(0);
                SaveQueue(queue); // checkpoint after each success
            }

            _flushing = false;
        }

        private IEnumerator UploadRoutine(SurgeSessionPayload payload, Action<bool> done)
        {
            string url = supabaseUrl.TrimEnd('/') + sessionsFunctionPath;
            byte[] body = Encoding.UTF8.GetBytes(JsonUtility.ToJson(payload));

            using (UnityWebRequest request = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST))
            {
                request.uploadHandler = new UploadHandlerRaw(body);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("apikey", supabaseAnonKey);
                request.SetRequestHeader("Authorization", "Bearer " + supabaseAnonKey);

                // Attach the anonymous clinical token (if any) so the backend can
                // attribute the session to a clinic seat — still no personal identity.
                string token = ClinicalTokenManager.GetCachedToken();
                if (!string.IsNullOrEmpty(token))
                {
                    request.SetRequestHeader("x-clinical-token", token);
                }

                request.timeout = requestTimeoutSeconds;

                yield return request.SendWebRequest();

                done?.Invoke(!HasTransportError(request));
            }
        }

        #endregion

        #region Local JSON queue

        private void EnqueueLocally(SurgeSessionPayload payload)
        {
            SessionQueue queue = LoadQueue();
            queue.items.Add(payload);
            SaveQueue(queue);
        }

        private SessionQueue LoadQueue()
        {
            try
            {
                if (!File.Exists(QueuePath))
                {
                    return new SessionQueue();
                }

                string json = File.ReadAllText(QueuePath);
                return JsonUtility.FromJson<SessionQueue>(json) ?? new SessionQueue();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[HeronBridge] Could not read session queue: {e.Message}");
                return new SessionQueue();
            }
        }

        private void SaveQueue(SessionQueue queue)
        {
            try
            {
                File.WriteAllText(QueuePath, JsonUtility.ToJson(queue));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[HeronBridge] Could not persist session queue: {e.Message}");
            }
        }

        private static bool HasTransportError(UnityWebRequest request)
        {
#if UNITY_2020_1_OR_NEWER
            return request.result != UnityWebRequest.Result.Success;
#else
            return request.isNetworkError || request.isHttpError;
#endif
        }

        /// <summary>JsonUtility-friendly wrapper (it cannot serialize a bare List).</summary>
        [Serializable]
        private class SessionQueue
        {
            public List<SurgeSessionPayload> items = new List<SurgeSessionPayload>();
        }

        #endregion
    }
}
