// Netlify Function: Claude-Proxy für Mahlzeiten-Erkennung & Tagesanalyse
// Braucht Netlify-Env-Variable: ANTHROPIC_API_KEY

const API = "https://api.anthropic.com/v1/messages";

const PROFILE = `Nutzerprofil: Mann, 37 Jahre, 2,00 m, ~140 kg, Insulinresistenz (HOMA-IR 3,6), Cortisol leicht erhöht, ADHS (Lisdexamfetamin 50mg morgens, Appetit tagsüber unterdrückt).
Ziele: ca. 2.300–2.600 kcal/Tag, Protein mindestens 150 g, Kohlenhydrate moderat und insulinfreundlich (wenig Zucker/Weißmehl), abends leicht. Krafttraining im Keller, Schrittziel ~8.000/Tag.
Wichtig: keine Moralpredigten, kein Lob-Gesäusel, direkt und sachlich auf Deutsch.`;

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
    const { type, text, image, mediaType, day } = await req.json();

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
