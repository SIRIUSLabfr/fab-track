// Netlify Function: Claude-Proxy für Mahlzeiten-Erkennung & Tagesanalyse
// Braucht Netlify-Env-Variable: ANTHROPIC_API_KEY

const API = "https://api.anthropic.com/v1/messages";

const PROFILE = `Nutzerprofil: Mann, 37 Jahre, 2,00 m, ~140 kg, Insulinresistenz (HOMA-IR 3,6), Cortisol leicht erhöht, ADHS (Lisdexamfetamin 50mg morgens, Appetit tagsüber unterdrückt).
Ziele: ca. 2.300–2.600 kcal/Tag, Protein mindestens 150 g, Kohlenhydrate moderat und insulinfreundlich (wenig Zucker/Weißmehl), abends leicht. Krafttraining im Keller, Schrittziel ~8.000/Tag.
Ton: direkt und sachlich auf Deutsch, keine Moralpredigten und keine leere Schmeichelei. Aber: erreichte Ziele klar als Erfolg benennen und ehrlich bestätigen — Anerkennung ist verdient, wenn die Zahlen stimmen, und wirkt motivierender als reines Defizit-Aufzählen.`;

async function claude(messages, maxTokens = 600) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function jsonFrom(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Keine JSON-Antwort erhalten");
  return JSON.parse(clean.slice(start, end + 1));
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const { type, text, image, mediaType, day, blood, context } = await req.json();

    if (type === "meal-text") {
      const out = await claude([
        {
          role: "user",
          content: `Schätze für diese Mahlzeit realistische deutsche Portionsgrößen: "${text}".
Antworte NUR mit JSON, ohne Markdown: {"name": "kurzer Name", "kcal": Zahl, "protein_g": Zahl}`,
        },
      ]);
      return Response.json(jsonFrom(out));
    }

    if (type === "meal-photo") {
      const content = [
        { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
        {
          type: "text",
          text: `Was ist auf diesem Foto zu essen? Schätze Portionsgröße, Kalorien und Protein realistisch (deutsche Portionen).${text ? ` Zusatzinfo vom Nutzer: ${text}.` : ""}
Antworte NUR mit JSON, ohne Markdown: {"name": "kurze Beschreibung", "kcal": Zahl, "protein_g": Zahl}`,
        },
      ];
      const out = await claude([{ role: "user", content }]);
      return Response.json(jsonFrom(out));
    }

    if (type === "day-summary") {
      const prompt = `${PROFILE}

Tagesdaten des Nutzers:
${JSON.stringify(day, null, 2)}

Schreibe eine kurze, differenzierte Tageszusammenfassung in 3-4 Sätzen zu Ernährung/Protein, Bewegung/Training/Schritte und ggf. Messwerten.
Gleiche die Werte mit den Zielen ab (kcal 2.300–2.600, Protein ≥150 g, Schritte ~8.000, Krafttraining).
Wichtig — differenziert sein: Erreichte oder fast erreichte Ziele zuerst klar als Erfolg benennen und ehrlich bestätigen, dann offene Punkte sachlich anmerken. Wenn die meisten Ziele erreicht sind, mach das deutlich ("starker Tag" o.ä.) und motiviere; reiß keinen guten Tag durch Defizit-Fokus klein. Wenn wenig erreicht wurde, bleib sachlich-konstruktiv ohne Vorwurf. Keine Aufzählung, kein Markdown.
Antworte NUR mit JSON: {"text": "die 3-4 Sätze"}`;
      const out = await claude([{ role: "user", content: prompt }], 350);
      return Response.json(jsonFrom(out));
    }

    if (type === "blood-extract") {
      const content = [
        { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
        {
          type: "text",
          text: `Das ist ein Laborbefund (Blutwerte). Lies ALLE Messwerte sauber aus.
Gib NUR JSON zurück, ohne Markdown:
{"date": "YYYY-MM-DD oder null", "markers": [{"name": "Markername wie im Befund", "value": "Wert als String", "unit": "Einheit oder null", "ref": "Referenzbereich oder null"}]}
Zahlen mit Punkt als Dezimaltrenner. Wenn ein Entnahmedatum erkennbar ist, gib es zurück, sonst null.`,
        },
      ];
      const out = await claude([{ role: "user", content }], 1500);
      return Response.json(jsonFrom(out));
    }

    if (type === "blood-analysis") {
      const prompt = `${PROFILE}

Bisherige Laborwerte des Nutzers (chronologisch, älteste zuerst):
${JSON.stringify(blood, null, 2)}

Lebensstil-Kontext (Tracking: Gewicht/Bauch-Verlauf, Ziele):
${JSON.stringify(context || {}, null, 2)}

Aufgabe: Beurteile die wichtigsten Werte mit Fokus auf den Stoffwechsel (HbA1c, Nüchternglukose, Insulin/HOMA-IR, Triglyceride, HDL, LDL, Cortisol, Leberwerte wie GGT/ALT, CRP/Entzündung). Prognostiziere, wie sie sich vermutlich entwickeln, WENN der Nutzer so weitermacht.
- Pro wichtigem Wert: aktueller Stand, Trend (falls mehrere Messungen vorliegen), erwartete Richtung, kurze Begründung.
- Ehrlich, sachlich, deutsch, kein Lob-Gesäusel. Keine Diagnose. Dies ersetzt keine ärztliche Beratung.
Antworte NUR mit JSON, ohne Markdown: {"summary": "2-3 Sätze Gesamtbild", "markers": [{"name": "Wert", "status": "gut|grenzwertig|kritisch", "trend": "fallend|stabil|steigend|unklar", "outlook": "kurze Prognose wenn so weiter"}], "advice": "1-3 konkrete Hebel"}`;
      const out = await claude([{ role: "user", content: prompt }], 1300);
      return Response.json(jsonFrom(out));
    }

    if (type === "todo") {
      const today = (day && day.today) || new Date().toISOString().slice(0, 10);
      const prompt = `Heutiges Datum: ${today}.
Interpretiere die folgende Notiz des Nutzers und mache daraus GENAU EIN Todo.
Notiz: "${text}"

Wähle genau eine Kategorie, exakt so geschrieben: "Mädchen", "Memyself&I", "Co Parenting", "Shopping", "Ideen".
- "Mädchen": alles rund um Tochter/Töchter, Kita/Schule, Kindertermine
- "Co Parenting": Absprachen mit Ex-Partner:in, Übergaben, gemeinsame Kinder-Orga
- "Memyself&I": eigene Termine, Gesundheit, Job, Privates
- "Shopping": Einkaufen, Besorgungen
- "Ideen": Gedanken/Ideen ohne klare Aufgabe
Wenn ein Zeitpunkt genannt wird (z.B. "morgen", "Freitag", "am 12."), berechne das konkrete Datum relativ zum heutigen Datum und gib es als "date" im Format YYYY-MM-DD zurück. Wenn kein Datum genannt wird, gib null zurück.
Wenn die Kategorie "Shopping" ist: gib als "title" NUR den reinen Artikel zurück (z.B. "Milch", nicht "Milch kaufen") und ordne eine Abteilung zu – exakt eine von: "Gemüse/Obst", "Getreideprodukte", "Milchprodukte", "Getränke", "TK", "Konserven", "Drogerie", "Anderes". Bei anderen Kategorien gib "dept": null zurück.
Antworte NUR mit JSON, ohne Markdown: {"title": "kurzer Todo-Text", "category": "eine der Kategorien", "date": "YYYY-MM-DD oder null", "dept": "Abteilung oder null"}`;
      const out = await claude([{ role: "user", content: prompt }], 300);
      return Response.json(jsonFrom(out));
    }

    if (type === "day-analysis") {
      const prompt = `${PROFILE}

Heutige Tracking-Daten des Nutzers (abgehakte Mahlzeiten-Favoriten, Quick-Logs mit kcal-Schätzungen, erledigte Übungen, Schritte):
${JSON.stringify(day, null, 2)}

Aufgabe: Kurze Tagesanalyse.
1. Gesamtkalorien schätzen (Quick-Logs haben kcal; abgehakte Mahlzeiten ohne kcal selbst realistisch schätzen)
2. Protein-Bilanz gegen das 150g-Ziel
3. Ein konkreter, umsetzbarer Hinweis für morgen
Maximal 5 Sätze, direkt und ehrlich.
Antworte NUR mit JSON, ohne Markdown: {"kcal_estimate": Zahl, "protein_estimate": Zahl, "text": "die Analyse"}`;
      const out = await claude([{ role: "user", content: prompt }], 800);
      return Response.json(jsonFrom(out));
    }

    return new Response("Unknown type", { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
