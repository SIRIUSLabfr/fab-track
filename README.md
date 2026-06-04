# System. — Health Tracker

Persönliche Tracking-App: Training, Ernährung, Messwerte. Daten liegen in **Supabase** — geräteübergreifend synchron, sicher hinter Login, nichts geht beim Cache-Löschen verloren.

## Tech-Stack
- React 18 + Vite
- Supabase (Auth + Postgres-Datenbank)
- recharts (Verlaufs-Charts), lucide-react (Icons)

---

## Setup in 4 Schritten

### 1. Supabase-Datenbank einrichten
Im Supabase-Dashboard → **SQL Editor** → New query → Inhalt von `supabase/schema.sql` einfügen → **Run**.
Das legt die Tabelle `app_data` mit Row-Level-Security an (jeder Nutzer sieht nur seine eigenen Daten).

Optional, für sofortiges Login ohne Bestätigungsmail: **Authentication → Providers → Email → "Confirm email"** deaktivieren.

### 2. Zugangsdaten eintragen
Im Supabase-Dashboard unter **Project Settings → API** findest du:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

`.env.example` nach `.env` kopieren und beide Werte eintragen.

### 3. Lokal testen
```bash
npm install
npm run dev
```
URL öffnen (meist http://localhost:5173), registrieren, einloggen, loslegen.

### 4. Auf Netlify deployen (über Claude Code)
Projekt in Claude Code öffnen und sagen:

> "Deploye dieses Vite-React-Projekt auf Netlify. Installier die Dependencies, baue es und deploye `dist` als neue Site. Setz die Umgebungsvariablen VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in den Netlify-Site-Settings."

Oder manuell:
```bash
npm install
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod        # Publish directory: dist
```

**Wichtig:** Die beiden `VITE_SUPABASE_*`-Variablen müssen auch in Netlify gesetzt werden
(**Site settings → Environment variables**), sonst findet die deployte App die Datenbank nicht.
Danach einmal neu builden lassen.

---

## Aufs Handy
Netlify-URL am Handy öffnen → Browser-Menü → **"Zum Home-Bildschirm hinzufügen"**. Läuft dann im Vollbild wie eine native App. Auf jedem Gerät mit demselben Login sind die Daten synchron.

---

## Datenmodell
Eine Zeile pro Nutzer in `app_data`:
- `days` — `{ "2026-06-04": { meals, exercises }, … }`
- `config` — `{ progression, customFoods }`
- `measurements` — `[ { date, weight, waist, sleep, energy }, … ]`

Änderungen werden automatisch (debounced) nach Supabase gesynct. Das Cloud-Icon oben rechts zeigt den Sync-Status.
