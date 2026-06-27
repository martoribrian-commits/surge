# Surge — Static Site

Vanilla HTML, CSS, and JS. No build step.

## User journey

| Step | Route | What happens |
|------|-------|----------------|
| 1. Discover | `/` | Compact landing: what Surge is, visual anchor preview, CTA |
| 2. Experience | `/engine` | Entry → 90s regulation → aftermath (brain dump, Crane) |
| 3. Providers | `/portal`, `/for-providers` | Unchanged |

## Routes

| File | Route |
|------|-------|
| index.html | `/` — Home landing |
| engine.html | `/engine` — Three-stage somatic flow |
| how-it-works.html | `/how-it-works` |
| for-providers.html | `/for-providers` |
| clinical-token.html | `/clinical-token` |
| crane.html | `/crane` |
| portal.html | `/portal` |

## Provider portal setup

1. Create Auth user in Supabase Dashboard
2. Run `supabase/seed-providers.sql`
3. Set `site/js/supabase-config.js`
4. Netlify env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
