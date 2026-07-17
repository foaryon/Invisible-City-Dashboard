# Privacy

The Invisible City is **local-first** and privacy-preserving by design (§3.1.K).

## No accounts, no tracking

- **No user accounts** in V1.
- **No advertising, no analytics trackers, no third-party tags.**
- **No location-history retention as a feature.** The response cache is keyed by provider
  request fingerprints (query parameters of source calls), not by a per-user movement log.
  Cache rows store provider payloads, retrieval time and schema version — not user identity.

## Geolocation

Browser geolocation is used **only after explicit user permission** and only to centre the
map / set an analysis point. It is not stored server-side as history.

## Secrets

- **No secrets in frontend code.** V1 activates no key-gated provider.
- If CAMS (Stage 4) is activated, its Copernicus API key stays **server-side only**
  (environment variable), never shipped to the browser.

## Third-party requests

The app talks to its own API. The API talks to the documented provider endpoints
(DWD/Bright Sky, UBA, Overpass, Photon) and the browser loads base-map tiles from
OpenFreeMap. Requests carry an identifying `User-Agent` and respect each provider's rate
and caching policy (see [`data-sources.md`](data-sources.md)). No user-identifying data is
sent to providers beyond the coordinates/queries needed to answer the request.

## Data retention

The SQLite cache (`var/cache.sqlite`) holds provider responses subject to per-provider TTLs.
It can be deleted at any time with no loss of user data (there is none). It is git-ignored.
