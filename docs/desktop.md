# Running it as an app — Windows 11 & Android 16

The Invisible City is a web app with a small local server (the server does the
provider integration — weather, air, transit, geocoding). The simplest setup is:

> **Run the server on your Windows 11 PC. Use it in the browser on the PC, and on your
> Android phone over the same Wi‑Fi.** Both can "install" it as an app icon.

There is no separate Android `.exe` — Android can't run a Windows/Node binary. Instead
the phone opens the dashboard the PC is serving, and can install it as a PWA.

---

## Windows 11 (64-bit) — run the dashboard

### One-click launcher (recommended)

1. Install **Node.js 22 LTS or newer** once, from <https://nodejs.org> (the "LTS" installer).
2. Double-click **`run.bat`** in the project folder.
   - First run installs dependencies and builds the app (a few minutes). Later runs start
     in a couple of seconds.
   - It starts the server and opens your browser at `http://localhost:3001` automatically.
   - Windows may ask to allow **Node.js** on **Private networks** — say **yes** (that's what
     lets your phone connect).
3. Leave that window open while you use the dashboard. Close it to stop.

### Install it as a desktop app (optional)

In Edge or Chrome, open the ⋯ menu → **Apps → Install this site as an app**. You get a
desktop/Start-menu icon that opens the dashboard in its own window (no browser chrome).

---

## Android 16 — use the dashboard on your phone

1. On the PC, start the dashboard with **`run.bat`** (as above). The window prints a line like:

   ```
   • On your phone/LAN: http://192.168.1.42:3001   (same Wi-Fi)
   ```

2. Make sure the **phone and PC are on the same Wi‑Fi**.
3. Open that `http://192.168.x.x:3001` address in **Chrome on Android**.
4. Chrome menu (⋮) → **Add to Home screen** / **Install app**. You get an app icon that
   opens the dashboard full-screen, like a native app.

The PC must be running (the `run.bat` window open) for the phone to connect. If the phone
can't reach it, check the PC's firewall allowed Node.js on private networks.

---

## Notes

- **Data honesty offline.** The installed app caches only its own screen (HTML/JS/CSS/icons)
  so it opens instantly. It **never** caches live weather/air/transit data — those always go
  to the network, and offline they show the app's honest "nicht verfügbar" states rather than
  stale values.
- **Demo mode.** To explore every feature without network/keys, start with `ENABLE_DEMO=1`
  set (e.g. in a `.env` file) and toggle **Demo-Modus** in the top bar.
- **Live data** needs outbound internet (and, for CAMS/DELFI, their credentials — see
  [`data-sources.md`](data-sources.md)).

---

## A true single-file `.exe` (no Node required)

`run.bat` is the standalone launcher, but it does need Node.js installed once. A genuine
dependency-free single `.exe` is also possible and is a worthwhile addition — it requires a
small bundling pipeline (esbuild → [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg), with the
web assets embedded) plus one platform caveat: the app's SQLite engine is a **native**
module, so a *trustworthy* Windows binary must be **built and tested on Windows** — a binary
cross-built from this Linux environment couldn't be verified and might not run.

This isn't wired up yet by default. If you want the real `.exe`, say so and it can be added
and validated on a Windows machine.
