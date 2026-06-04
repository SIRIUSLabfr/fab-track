# Setup v2 — KI-Features, Schritte, App auf dem Fold

## 1. Neue Netlify-Umgebungsvariablen

Zusätzlich zu den beiden `VITE_SUPABASE_*`-Variablen brauchst du jetzt (Netlify → Site settings → Environment variables, danach einmal neu deployen):

| Variable | Woher |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys → Create Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (geheim halten!) |
| `STEPS_USER_ID` | Supabase → Authentication → Users → deine User-UUID kopieren |
| `STEPS_SECRET` | Selbst ausdenken (z.B. langes Zufallspasswort) — gleicher Wert kommt in MacroDroid |

Der Anthropic-Key kostet Pay-as-you-go: eine Foto-Analyse ≈ 1–2 Cent, Tagesanalyse < 1 Cent. Bei täglicher Nutzung wenige Euro pro Monat.

## 2. Was neu ist in der App

- **Quick-Log** (oben im Essen-Tab): Mahlzeit als Text eintippen („Döner + Cola Zero") oder **Foto** machen → Claude erkennt das Essen und schätzt kcal + Protein → wird gespeichert und in der Tagessumme gezählt
- **Tagesanalyse** (Heute-Tab): einmal am Tag drücken → KI bilanziert Kalorien + Protein über alles (Quick-Logs + abgehakte Favoriten + Training + Schritte) und gibt einen konkreten Hinweis für morgen
- **Schritte** (Heute-Tab): Kachel antippen → Zahl eintragen. Oder automatisch per MacroDroid (siehe unten). Ab 8.000 leuchtet sie grün
- **Direkt-Sprünge**: Die App reagiert auf `/#essen`, `/#training`, `/#verlauf`

## 3. App auf dem Galaxy Fold installieren („Widget-Ersatz")

1. Netlify-URL in **Chrome** öffnen
2. Menü (⋮) → **„App installieren"** (oder „Zum Startbildschirm hinzufügen")
3. Die App läuft jetzt im Vollbild wie eine native App — auch auf dem großen Innendisplay

**Schnellzugriffe:** **Long-Press auf das App-Icon** → es erscheinen die Shortcuts „Essen loggen", „Training", „Verlauf & Messen". Die kannst du auch einzeln als eigene Icons auf den Startbildschirm ziehen — dann hast du z.B. einen „Essen loggen"-Button, der direkt im richtigen Tab landet.

**Fold-Tipp für „immer offen und groß":** App öffnen → in der Übersicht der letzten Apps das App-Icon oben antippen → **„Im Pop-up öffnen"** oder als **Splitscreen-Paar** mit deiner meistgenutzten App festlegen. Auf dem Inner-Display kannst du sie auch an die **Taskleiste anpinnen**.

## 4. Schritte automatisch (MacroDroid)

Einmalig ~10 Minuten:

1. **MacroDroid** aus dem Play Store installieren (Free reicht)
2. Neues Makro anlegen:
   - **Trigger:** Tag/Uhrzeit → täglich **21:45**
   - **Aktion:** „HTTP-Anfrage (POST)"
     - URL: `https://DEINE-SITE.netlify.app/.netlify/functions/steps`
     - Content-Type: `application/json`
     - Body:
       ```json
       {"secret": "DEIN_STEPS_SECRET", "steps": {step_count}}
       ```
       → `{step_count}` über den Variablen-Button einfügen (MacroDroid-Schrittzähler, nutzt den Hardware-Sensor des Fold)
3. MacroDroid beim ersten Mal die Berechtigung **„Körperliche Aktivität"** geben
4. Testen: Makro manuell ausführen → in der App sollte die Schritte-Kachel den Wert zeigen (App neu öffnen)

Hinweis: MacroDroids Schrittzähler zählt ab Geräteneustart bzw. eigenem Tageszähler — die Zahl kann minimal von Samsung Health abweichen. Für deinen Zweck (Trend, NEAT-Bewusstsein) völlig egal. Alternativ: Schritte abends in 5 Sekunden manuell in die Kachel tippen.

## 5. Update deployen

Über Claude Code:
> „Übernimm die neuen Dateien (netlify/functions, public/, geänderte App.jsx, index.html, netlify.toml), committe und pushe. Setze danach die vier neuen Umgebungsvariablen in Netlify (ich gebe dir die Werte) und triggere einen neuen Deploy."
