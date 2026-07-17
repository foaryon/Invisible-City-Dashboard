import { spawn } from 'node:child_process';

/**
 * Open a URL in the user's default browser (best-effort, cross-platform).
 * Used by the standalone launchers so double-clicking starts the dashboard and
 * pops the browser. Never throws — a headless/server run just skips it.
 */
export function openBrowser(url: string): void {
  const [cmd, args] =
    process.platform === 'win32'
      ? // `start` is a cmd builtin; the empty "" is the window-title arg.
        (['cmd', ['/c', 'start', '""', url]] as const)
      : process.platform === 'darwin'
        ? (['open', [url]] as const)
        : (['xdg-open', [url]] as const);
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    // A missing opener (e.g. headless Linux without xdg-open) surfaces as an
    // ASYNC 'error' event — swallow it so the server never crashes.
    child.on('error', () => {});
    child.unref();
  } catch {
    // Best-effort only.
  }
}
