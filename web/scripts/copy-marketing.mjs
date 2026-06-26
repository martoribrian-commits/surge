import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const marketingDir = join(root, 'marketing');
const distDir = join(__dirname, '..', 'dist');

const htmlPages = [
  'home.html',
  'for-providers.html',
  'how-it-works.html',
  'clinical-token.html',
];

function copyMarketing() {
  if (!existsSync(distDir)) {
    console.error('[copy-marketing] dist/ not found — run vite build first');
    process.exit(1);
  }

  for (const page of htmlPages) {
    cpSync(join(marketingDir, page), join(distDir, page));
  }

  cpSync(join(marketingDir, 'css'), join(distDir, 'css'), { recursive: true });
  cpSync(join(marketingDir, 'js'), join(distDir, 'js'), { recursive: true });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';

  writeFileSync(
    join(distDir, 'js', 'config.js'),
    `window.SURGE_CONFIG = ${JSON.stringify({ supabaseUrl, supabaseAnonKey }, null, 2)};\n`,
  );

  console.log('[copy-marketing] Marketing pages copied to dist/');
}

copyMarketing();
