/**
 * Build a standalone, no-Node-required executable of The Invisible City.
 *
 *   npm run build:standalone            → executable for THIS machine's OS
 *   npm run build:standalone -- win     → InvisibleCity.exe (Windows x64)
 *   npm run build:standalone -- linux   → InvisibleCity (Linux x64)
 *
 * Output: dist-standalone/<target>/ containing the executable plus a `web/`
 * folder (the SPA) and a README. Copy that folder anywhere and double-click
 * the executable — no Node.js installation needed.
 *
 * How it works: the server is first bundled to one pure-JS file (esbuild;
 * possible because the SQLite engine is Node's built-in node:sqlite — no
 * native modules), then @yao-pkg/pkg injects it into a prebuilt Node binary.
 * pkg downloads that base binary from GitHub on first run, so this command
 * needs normal internet access (it cannot run inside egress-restricted CI).
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (process.argv[2] ?? '').toLowerCase();

const target =
  arg === 'win' || arg === 'windows'
    ? { pkg: 'node22-win-x64', dir: 'windows-x64', bin: 'InvisibleCity.exe' }
    : arg === 'linux'
      ? { pkg: 'node22-linux-x64', dir: 'linux-x64', bin: 'InvisibleCity' }
      : arg === 'mac' || arg === 'macos'
        ? { pkg: 'node22-macos-x64', dir: 'macos-x64', bin: 'InvisibleCity' }
        : process.platform === 'win32'
          ? { pkg: 'node22-win-x64', dir: 'windows-x64', bin: 'InvisibleCity.exe' }
          : process.platform === 'darwin'
            ? { pkg: 'node22-macos-x64', dir: 'macos-x64', bin: 'InvisibleCity' }
            : { pkg: 'node22-linux-x64', dir: 'linux-x64', bin: 'InvisibleCity' };

const outDir = resolve(root, 'dist-standalone', target.dir);
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });

console.log('1/4  Building the web app …');
run('npm run build --workspace apps/web');

console.log('2/4  Bundling the server (esbuild) …');
run('node scripts/build-server.mjs');

console.log(`3/4  Packaging ${target.bin} (${target.pkg}) …`);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
run(
  `npx pkg apps/api/dist/server.mjs --targets ${target.pkg} --output "${resolve(outDir, target.bin)}"`,
);

console.log('4/4  Assembling the portable folder …');
cpSync(resolve(root, 'apps/web/dist'), resolve(outDir, 'web'), { recursive: true });
writeFileSync(
  resolve(outDir, 'README.txt'),
  [
    'The Invisible City — standalone',
    '',
    `Start:   double-click ${target.bin}   (keep the "web" folder next to it)`,
    'Open:    http://localhost:3001  (opens automatically with OPEN_BROWSER=1)',
    'Phone:   the console prints an http://<lan-ip>:3001 address for same-Wi-Fi use',
    'Config:  set environment variables or place a .env-style launcher; see',
    '         https://github.com/foaryon/Invisible-City-Dashboard docs/desktop.md',
    '',
    'Data stays local: a var/ folder (cache) is created next to the executable.',
  ].join('\n'),
);

if (!existsSync(resolve(outDir, target.bin))) {
  console.error('Packaging finished but the executable is missing — check pkg output above.');
  process.exit(1);
}
console.log(`\nDone → ${outDir}`);
