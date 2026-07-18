# QA checklist & Windows 11 run/test commands

## Automated gates (run after every meaningful change)

```powershell
cd C:\Users\sebas\Desktop\Invisible-City-Dashboard

npm run verify          # lint → format:check → typecheck → vitest (alle) → build
npx playwright test     # 13 E2E incl. axe accessibility (starts its own demo servers)
npm run build:server    # single-file production bundle smoke
npm run diagnose        # LIVE provider sweep, writes diagnostics-report.json
```

Dev servers: `npm run dev` → API :3001, Web :5173.
Browser-Suite: <http://localhost:5173/diagnose.html> („Diagnose ausführen";
Dauerlauf-Modus für Langzeitbeobachtung).
GTFS aktivieren: `npm run gtfs:import --workspace apps/api -- <absoluter Pfad\gtfs.zip>`,
dann `GTFS_STATIC_PATH` in `.env` setzen und den Server neu starten.

## Manual visual & interaction checklist (release-blocking)

**Karte & Auswahl**
- [ ] Suche „Trier" + Enter → Karte fliegt exakt auf Trier; Marker sitzt; Lens füllt sich
- [ ] Kartenklick (Stadt) → sofort „Punkt …", Label wertet per Reverse auf; KEIN Rücksprung
- [ ] Schnell: Klick → sofort Suche+Enter woanders → Auswahl bleibt die NEUE (Race-Guard)
- [ ] Zoom/Pan/Resize/Layerwechsel/Refresh bewegen Auswahl & Marker NICHT
- [ ] Doppelklick-Zoom vs. Auswahl-Klick eindeutig; Klick am Viewport-Rand trifft
- [ ] Offshore-Klick: ehrlicher Punkt ohne erfundenen Ortsnamen

**Module & Wahrhaftigkeit**
- [ ] Jede Karte zeigt Status-Pill; kein endloser Spinner; Konsole fehlerfrei
- [ ] Daten-Modus-Chips (beobachtet/prognose/kartiert/…) je Wert sichtbar
- [ ] „regionale Referenz" bei fernen Stationen; Distanz überall angegeben
- [ ] Ehrliche Absenzen klar unterscheidbar von Fehlern (gelb vs. rot)
- [ ] „Konfiguration erforderlich" nennt exakt die Env-Variable
- [ ] Evidence-Inspector: Quelle, Lizenz, Zeiten, Raumbezug, Grenzen je Wert
- [ ] Demo-Modus: permanent gebannert, mischt sich nie mit Live

**Layout (Desktop 1280+, Tablet 768, Mobil 375; Browser-Zoom 100/150 %)**
- [ ] Kein Overlap/Clipping/Overflow; Legende & Controls lesbar und erreichbar
- [ ] Mobile: Karte primär, Lens/Belege als Bottom-Sheets
- [ ] Fokus-Reihenfolge & sichtbarer Fokus (Tab durch Suche → Ergebnisse → Layer)
- [ ] prefers-reduced-motion respektiert (E2E-abgedeckt)

**Adversarial**
- [ ] Offline/Drossel (DevTools) → Module zeigen source-error, Rest lebt weiter
- [ ] Wiederholtes schnelles Umwählen (3 Städte < 5 s) → letzter Ort gewinnt überall
- [ ] Server-Neustart während Nutzung → UI erholt sich ohne Reload-Zwang

## Visual-regression status

Playwright-E2E prüft DOM-Zustände deterministisch im Demo-Modus (12+1 Tests,
inkl. axe). Pixel-Screenshot-Baselines sind bewusst NICHT im CI-Gate:
Font-Rendering ist plattformspezifisch (CI = Linux, Entwicklung = Windows),
und die Basiskarte lädt Netzwerk-Tiles — beides macht Pixelvergleiche im CI
unehrlich flaky. Stattdessen: obige manuelle Sichtprüfung pro Release auf dem
Zielsystem (Windows 11) + die deterministischen Zustands-Assertions im E2E.
