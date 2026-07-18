/**
 * Runtime provider configuration (§5, §7).
 *
 * Endpoints have production-safe defaults (the documented public services) and
 * can be overridden via environment for self-hosted instances. Providers that
 * require credentials or a feed (CAMS, DELFI GTFS, GTFS-RT) become live ONLY
 * when their configuration is present; otherwise the app reports an honest
 * "configuration-required" state — never demo, never invented data.
 */

export interface ProviderConfig {
  // Keyless public services (overridable for self-hosting).
  brightskyUrl: string;
  dwdWfsUrl: string;
  ubaBaseUrl: string;
  overpassUrl: string;
  photonUrl: string;
  /** PEGELONLINE REST API base (WSV water levels). */
  pegelonlineUrl: string;
  /** BfS ODL open-data WFS endpoint (gamma dose rate). */
  odlUrl: string;
  /** DWD open-data health alerts base (pollen s31fg.json, UV uvi.json). */
  dwdHealthUrl: string;
  /** NINA civil-protection warnings API base (BBK, bund.dev-documented). */
  ninaUrl: string;
  /** BKG VG250 WFS (official territorial assignment, ARS). */
  bkgWfsUrl: string;
  /**
   * BKG VG250 feature type (Gemeinde layer) queried for the point assignment.
   * Overridable because the published typeName has varied across VG250 WFS
   * revisions (e.g. `vg250_gem`, `vg250:vg250_gem`). TO VERIFY live.
   */
  bkgWfsTypeName: string;
  /** Autobahn GmbH traffic API base (bund.dev-documented). */
  autobahnUrl: string;
  /** GFZ GEOFON FDSN event web service base. */
  geofonUrl: string;
  /** DWD CDC multi-annual climate normals (1991–2020) base. */
  dwdCdcNormalsUrl: string;

  // Tankerkönig fuel prices (official MTS-K data) — requires a free API key.
  tankerkoenigUrl: string;
  tankerkoenigApiKey?: string;

  // DB FaSta station facilities (elevator/escalator status) — requires free
  // DB API Marketplace credentials.
  dbFastaUrl: string;
  dbClientId?: string;
  dbApiKey?: string;

  // CAMS regional air-quality model (Copernicus ADS/CDS) — requires an API key.
  camsApiUrl: string;
  camsApiKey?: string;

  // DELFI GTFS static timetable — requires a local feed path or a download URL.
  gtfsStaticPath?: string;
  gtfsStaticUrl?: string;
  /** Where the imported GTFS SQLite database lives. */
  gtfsDbPath: string;

  // GTFS-Realtime (DELFI DEEZ / gtfs.de) — requires a stream URL.
  gtfsRtUrl?: string;
  gtfsRtApiKey?: string;

  /** Demo mode is a dev/offline feature, OFF by default (never in production). */
  enableDemo: boolean;
}

function str(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  const v = env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
}

function optional(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const v = env[key];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProviderConfig {
  const config: ProviderConfig = {
    brightskyUrl: str(env, 'BRIGHTSKY_URL', 'https://api.brightsky.dev'),
    dwdWfsUrl: str(env, 'DWD_WFS_URL', 'https://maps.dwd.de/geoserver/dwd/ows'),
    ubaBaseUrl: str(env, 'UBA_BASE_URL', 'https://www.umweltbundesamt.de/api/air_data/v3'),
    overpassUrl: str(env, 'OVERPASS_URL', 'https://overpass-api.de/api/interpreter'),
    photonUrl: str(env, 'PHOTON_URL', 'https://photon.komoot.io'),
    pegelonlineUrl: str(
      env,
      'PEGELONLINE_URL',
      'https://www.pegelonline.wsv.de/webservices/rest-api/v2',
    ),
    odlUrl: str(env, 'BFS_ODL_URL', 'https://www.imis.bfs.de/ogc/opendata/ows'),
    dwdHealthUrl: str(
      env,
      'DWD_HEALTH_URL',
      'https://opendata.dwd.de/climate_environment/health/alerts',
    ),
    camsApiUrl: str(env, 'CAMS_ADS_URL', 'https://ads.atmosphere.copernicus.eu/api'),
    ninaUrl: str(env, 'NINA_URL', 'https://warnung.bund.de/api31'),
    bkgWfsUrl: str(env, 'BKG_WFS_URL', 'https://sgx.geodatenzentrum.de/wfs_vg250'),
    bkgWfsTypeName: str(env, 'BKG_WFS_TYPENAME', 'vg250_gem'),
    autobahnUrl: str(env, 'AUTOBAHN_URL', 'https://verkehr.autobahn.de/o/autobahn'),
    geofonUrl: str(env, 'GEOFON_URL', 'https://geofon.gfz-potsdam.de/fdsnws/event/1'),
    dwdCdcNormalsUrl: str(
      env,
      'DWD_CDC_NORMALS_URL',
      'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/multi_annual/mean_91-20',
    ),
    tankerkoenigUrl: str(env, 'TANKERKOENIG_URL', 'https://creativecommons.tankerkoenig.de/json'),
    dbFastaUrl: str(
      env,
      'DB_FASTA_URL',
      'https://apis.deutschebahn.com/db-api-marketplace/apis/fasta/v2',
    ),
    gtfsDbPath: str(env, 'GTFS_DB', 'var/gtfs.sqlite'),
    enableDemo: env['ENABLE_DEMO'] === '1' || env['ENABLE_DEMO'] === 'true',
  };
  const camsApiKey = optional(env, 'CAMS_ADS_KEY');
  if (camsApiKey) config.camsApiKey = camsApiKey;
  const tankerkoenigApiKey = optional(env, 'TANKERKOENIG_API_KEY');
  if (tankerkoenigApiKey) config.tankerkoenigApiKey = tankerkoenigApiKey;
  const dbClientId = optional(env, 'DB_CLIENT_ID');
  if (dbClientId) config.dbClientId = dbClientId;
  const dbApiKey = optional(env, 'DB_API_KEY');
  if (dbApiKey) config.dbApiKey = dbApiKey;
  const gtfsStaticPath = optional(env, 'GTFS_STATIC_PATH');
  if (gtfsStaticPath) config.gtfsStaticPath = gtfsStaticPath;
  const gtfsStaticUrl = optional(env, 'GTFS_STATIC_URL');
  if (gtfsStaticUrl) config.gtfsStaticUrl = gtfsStaticUrl;
  const gtfsRtUrl = optional(env, 'GTFS_RT_URL');
  if (gtfsRtUrl) config.gtfsRtUrl = gtfsRtUrl;
  const gtfsRtApiKey = optional(env, 'GTFS_RT_KEY');
  if (gtfsRtApiKey) config.gtfsRtApiKey = gtfsRtApiKey;
  return config;
}

/**
 * Whether a provider's required configuration is present. Providers not listed
 * here need no configuration and are always active (keyless public services).
 */
const ACTIVATION: Record<string, (c: ProviderConfig) => boolean> = {
  'cams-eu-airquality': (c) => !!c.camsApiKey,
  'delfi-gtfs': (c) => !!(c.gtfsStaticPath || c.gtfsStaticUrl),
  'delfi-gtfs-rt': (c) => !!c.gtfsRtUrl,
  'tankerkoenig-mtsk': (c) => !!c.tankerkoenigApiKey,
  'db-fasta': (c) => !!(c.dbClientId && c.dbApiKey),
  // Vetted candidate, NOT integrated yet (auth semantics need live verification).
  'bvl-lebensmittelwarnung': () => false,
};

export function isConfigured(providerId: string, config: ProviderConfig): boolean {
  const check = ACTIVATION[providerId];
  return check ? check(config) : true;
}

/** Env var names a provider needs to go live (for honest UI/readiness messaging). */
export const REQUIRED_ENV: Record<string, string[]> = {
  'cams-eu-airquality': ['CAMS_ADS_KEY'],
  'delfi-gtfs': ['GTFS_STATIC_PATH or GTFS_STATIC_URL'],
  'delfi-gtfs-rt': ['GTFS_RT_URL'],
  'tankerkoenig-mtsk': ['TANKERKOENIG_API_KEY'],
  'db-fasta': ['DB_CLIENT_ID', 'DB_API_KEY'],
  'bvl-lebensmittelwarnung': ['(Kandidat — noch nicht integriert)'],
};

/** Config with all public defaults and demo enabled — used by the demo runtime and tests. */
export function demoConfig(): ProviderConfig {
  return loadConfig({ ENABLE_DEMO: '1' } as NodeJS.ProcessEnv);
}
