# Surge — Static Site

Vanilla HTML, CSS, and JS. No build step.

Deploy via Netlify with `publish = "site"` in `netlify.toml`.

## Environment variables (Netlify)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`

## Pages

| File | Route |
|------|-------|
| index.html | / (cinematic landing) |
| engine.html | /engine |
| how-it-works.html | /how-it-works |
| for-providers.html | /for-providers |
| clinical-token.html | /clinical-token |
| crane.html | /crane |
| portal.html | /portal |

## Provider portal setup

1. Create Auth user in Supabase Dashboard
2. Run `supabase/seed-providers.sql` with matching user UID as `providers.id`
3. Set `site/js/supabase-config.js` with public URL and anon key
4. Netlify env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
