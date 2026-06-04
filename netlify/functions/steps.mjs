// Netlify Function: Schritte-Endpoint für MacroDroid (oder andere Automationen)
// POST { "secret": "...", "steps": 8234 } → schreibt Schritte in den heutigen Tag
//
// Braucht Netlify-Env-Variablen:
//   STEPS_SECRET              – frei gewähltes Geheimnis (gleicher Wert in MacroDroid)
//   SUPABASE_SERVICE_ROLE_KEY – Supabase Dashboard → Settings → API → service_role
//   STEPS_USER_ID             – deine User-UUID (Supabase → Authentication → Users)
//   VITE_SUPABASE_URL         – ist schon gesetzt (vom Frontend)

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const { secret, steps, date } = await req.json();
    if (!secret || secret !== process.env.STEPS_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const uid = process.env.STEPS_USER_ID;
    if (!url || !key || !uid) return Response.json({ error: "Server nicht konfiguriert" }, { status: 500 });

    const d = date || new Date().toISOString().slice(0, 10);
    const headers = { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" };

    const r = await fetch(`${url}/rest/v1/app_data?user_id=eq.${uid}&select=days`, { headers });
    const rows = await r.json();
    const days = rows[0]?.days || {};
    days[d] = { ...(days[d] || { meals: {}, exercises: {} }), steps: Number(steps) };

    const patch = await fetch(`${url}/rest/v1/app_data?user_id=eq.${uid}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ days, updated_at: new Date().toISOString() }),
    });
    if (!patch.ok) throw new Error(`Supabase ${patch.status}`);

    return Response.json({ ok: true, date: d, steps: Number(steps) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
