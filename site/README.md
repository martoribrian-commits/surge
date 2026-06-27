# Surge — Static Site

Vanilla HTML, CSS, and JS. No build step.

Deploy via Netlify with `publish = "site"` in `netlify.toml`.

## Environment variables (Netlify)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`

## Routes

| File | Route | Purpose |
|------|-------|---------|
| index.html | `/` | **Three-stage MVP flow** (Entry → Regulation → Aftermath) |
| about.html | `/about` | Marketing landing |
| how-it-works.html | `/how-it-works` | Science |
| for-providers.html | `/for-providers` | B2B + contact |
| clinical-token.html | `/clinical-token` | Token entry |
| crane.html | `/crane` | Post-cycle AI guide |
| portal.html | `/portal` | Provider dashboard |
| engine.html | `/engine` | Redirects to `/` (legacy) |

## User journey (`/`)

1. **Entry** — Press and hold (zero login, zero onboarding)
2. **Regulation** — 90-second sensory engine (canvas, audio, haptics)
3. **Aftermath** — Recovery grid, ephemeral brain dump (24h local TTL), optional Crane handoff

Scripts: `surge-session.js`, `engine.js`, `surge-flow.js`, `ephemeral-store.js`

## Provider portal setup

1. Create Auth user in Supabase Dashboard
2. Run `supabase/seed-providers.sql` with matching user UID as `providers.id`
3. Set `site/js/supabase-config.js` with public URL and anon key
4. Netlify env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
