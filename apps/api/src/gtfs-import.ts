/**
 * GTFS import CLI.
 *
 *   npm run gtfs:import -- <path-to-feed.zip | https://…/feed.zip>
 *
 * Imports a DELFI (or compatible) GTFS feed into the SQLite database at
 * GTFS_DB (default var/gtfs.sqlite). Once imported, set GTFS_STATIC_PATH (or
 * GTFS_STATIC_URL) so the transit provider activates and serves scheduled
 * departures. This is a real ingestion — see docs/data-sources.md for the
 * DELFI registration/license steps required for production use.
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadConfig, importGtfs } from '@invisible-city/providers';

async function main(): Promise<void> {
  const source = process.argv[2];
  if (!source) {
    console.error('Usage: npm run gtfs:import -- <path-or-url-to-gtfs.zip>');
    process.exit(1);
  }
  const config = loadConfig();
  mkdirSync(dirname(config.gtfsDbPath), { recursive: true });

  let input: string | Buffer = source;
  if (/^https?:\/\//.test(source)) {
    console.info(`Downloading GTFS feed from ${source} …`);
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    input = Buffer.from(await res.arrayBuffer());
  }

  console.info(`Importing GTFS into ${config.gtfsDbPath} …`);
  const result = importGtfs(input, config.gtfsDbPath);
  console.info('GTFS import complete:');
  console.info(
    `  stops=${result.stops} routes=${result.routes} trips=${result.trips} stop_times=${result.stopTimes}`,
  );
  console.info(
    `  feed: ${result.feedPublisher ?? 'unknown'} · version ${result.feedVersion ?? 'n/a'}`,
  );
  console.info(
    `Set GTFS_STATIC_PATH=${typeof input === 'string' ? input : '<downloaded>'} to activate the transit provider.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
