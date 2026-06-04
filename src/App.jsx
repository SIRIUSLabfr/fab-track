import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import {
  Flame, Dumbbell, UtensilsCrossed, TrendingUp, Check, Plus, X, ArrowUp, Minus,
  Moon, Battery, Ruler, Scale, LogOut, Cloud, CloudOff, Camera, Sparkles, Footprints, Loader2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ============================== THEME ============================== */
const C = {
  bg: "#0F0F0E", surface: "#1A1A17", surface2: "#23231F", line: "#32322C",
  accent: "#C5F82A", accentDim: "#7C9A1B", text: "#EDEDE6", muted: "#8C8C82", warn: "#F5A623",
};

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Sora:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
::-webkit-scrollbar { width: 0; height: 0; }
@keyframes pop { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes slideUp { 0%{transform:translateY(8px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .8s linear infinite; }
`;

/* ============================== DATA ============================== */
const MEALS = [
  {
    id: "fruehstueck", label: "Frühstück", time: "7–8 Uhr",
    favorites: ["Protein-Shake: 1,5 Löffel Whey 360 + 400ml laktosefreie fettarme Milch + 1–2 EL Dinkelkleie + gefr. Blaubeeren"],
    alternatives: ["Skyr/Magerquark (250g) + Beeren + Handvoll Nüsse", "2–3 Eier + Gemüse (Rührei/Omelett)", "Haferflocken (reduziert) + Whey + Leinsamen"],
  },
  {
    id: "mittag", label: "Mittagessen", time: "12:30–13 Uhr",
    favorites: ["Mittagstisch – kleine Portion, Protein zuerst"],
    alternatives: ["Protein-Bowl: Hähnchen/Fisch + Gemüse", "Großer Salat + Ei/Thunfisch/Hähnchen", "Linsen- oder Bohnengericht"],
  },
  {
    id: "nachmittag", label: "Nachmittag-Bridge", time: "16–17 Uhr",
    favorites: ["Eiweißriegel (Barebells / Grenade)", "Protein-Trinkmahlzeit"],
    alternatives: ["Hüttenkäse / Skyr", "Handvoll Nüsse + etwas Protein"],
  },
  {
    id: "abend", label: "Abendessen", time: "spät / leicht",
    favorites: ["Leicht & wenig – was auf den Tisch kommt"],
    alternatives: ["Protein + Gemüse, kohlenhydratarm", "Süß-Craving: Magerquark + TK-Himbeeren + Süßungsmittel"],
  },
];

const EXERCISES = [
  { id: "kbswing", name: "KB-Swing einarmig", muscles: "Hintere Kette · Core", how: "16 kg Kettlebell, explosiv aus der Hüfte schwingen, Arm bleibt locker. 10 Wdh pro Arm." },
  { id: "gobletsquat", name: "Goblet Squat", muscles: "Quadrizeps · Po", how: "16 kg KB vor der Brust halten, tiefe Kniebeuge, kontrolliert hoch. 10–12 Wdh." },
  { id: "rudern", name: "Rudern V-Griff", muscles: "Rücken · Bizeps", how: "Bänder (~70 kg), Schulterblätter zusammenziehen, zum Bauch ziehen. 12–15 Wdh." },
  { id: "brustdruecken", name: "Brustdrücken Stange + Bänder", muscles: "Brust · Schulter · Trizeps", how: "Bänder in Wandhaken hinter dir, Schrittstellung, Stange komplett ausdrücken. 8–15 Wdh. Bänder vorher checken!" },
  { id: "hipthrust", name: "Hip Thrust / Glute Bridge", muscles: "Po · hintere Kette", how: "Schultern auf Couch/Bank, Becken heben, oben anspannen. 15–20 Wdh." },
  { id: "trizeps", name: "Trizepsdrücken am Seil", muscles: "Trizeps", how: "Bänder (~35 kg), Ellbogen fixiert am Körper, nach unten strecken. 12–15 Wdh." },
  { id: "bizeps", name: "Bizepscurl (normal/Obergriff)", muscles: "Bizeps · Unterarme", how: "Stange/SZ + Bänder, im Wechsel Untergriff und Obergriff. Widerstand so, dass 8–12 schwer sind." },
];

const TAB_IDS = ["heute", "training", "essen", "verlauf"];

/* ============================== HELPERS ============================== */
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const prettyDate = (k) => {
  const [y, m, d] = k.split("-");
  const wd = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date(+y, +m - 1, +d).getDay()];
  return `${wd}, ${d}.${m}.`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Foto verkleinern, damit der Upload klein bleibt
const resizeImage = (file) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    resolve(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    URL.revokeObjectURL(img.src);
  };
  img.onerror = reject;
  img.src = URL.createObjectURL(file);
});

async function callAnalyze(payload) {
  const res = await fetch("/.netlify/functions/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Fehler ${res.status}`);
  return data;
}

/* ============================== SMALL UI ============================== */
function Pill({ active, children, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 11px", fontSize: 11, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".02em", background: active ? (color || C.accent) : C.surface2,
      color: active ? "#111" : C.muted, transition: "all .15s",
    }}>{children}</button>
  );
}
function Card({ children, style }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, ...style }}>{children}</div>;
}
function StatCard({ icon, label, value, suffix, highlight }) {
  return (
    <Card style={{ flex: 1, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{icon} {label}</div>
      <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 30, fontWeight: 800, lineHeight: 1, color: highlight ? C.accent : C.text }}>
        {value}{suffix && <span style={{ fontSize: 16, color: C.muted, fontWeight: 500 }}>{suffix}</span>}
      </div>
    </Card>
  );
}

/* ============================== AUTH ============================== */
function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!email || !pw) { setMsg("E-Mail und Passwort eingeben."); return; }
    setBusy(true); setMsg("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) setMsg(error.message);
        else setMsg("Account erstellt. Falls E-Mail-Bestätigung aktiv ist: Postfach checken. Sonst direkt einloggen.");
      }
    } catch (e) { setMsg("Fehler: " + e.message); }
    setBusy(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{FONT_CSS}</style>
      <div style={{ width: "100%", maxWidth: 360, animation: "slideUp .4s ease" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 34, lineHeight: 1, marginBottom: 6 }}>System<span style={{ color: C.accent }}>.</span></div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 26, fontFamily: "'JetBrains Mono'" }}>{mode === "login" ? "Anmelden" : "Account anlegen"}</div>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" autoCapitalize="none" autoCorrect="off" type="email" style={inp} />
        <input value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Passwort" type="password" style={{ ...inp, marginTop: 10 }} />
        <button onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 16, background: C.accent, border: "none", borderRadius: 12, padding: "13px", color: "#111", fontWeight: 800, fontSize: 15, cursor: busy ? "default" : "pointer", fontFamily: "'Bricolage Grotesque'", opacity: busy ? .6 : 1 }}>{busy ? "…" : mode === "login" ? "Anmelden" : "Registrieren"}</button>
        {msg && <div style={{ marginTop: 14, fontSize: 12, color: C.warn, lineHeight: 1.45 }}>{msg}</div>}
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }} style={{ width: "100%", marginTop: 18, background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12.5, fontFamily: "'Sora'" }}>
          {mode === "login" ? "Noch kein Account? Registrieren" : "Schon registriert? Anmelden"}
        </button>
      </div>
    </div>
  );
}
const inp = { width: "100%", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 14px", color: C.text, fontSize: 15, fontFamily: "'Sora'", outline: "none" };

/* ============================== QUICK LOG ============================== */
function QuickLog({ day, setDay }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const logs = day.quickLogs || [];

  const addLog = (entry) => setDay((prev) => ({ ...prev, quickLogs: [...(prev.quickLogs || []), entry] }));
  const removeLog = (i) => setDay((prev) => ({ ...prev, quickLogs: (prev.quickLogs || []).filter((_, idx) => idx !== i) }));

  const logText = async () => {
    if (!txt.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await callAnalyze({ type: "meal-text", text: txt.trim() });
      addLog({ time: nowTime(), name: r.name, kcal: Math.round(r.kcal), protein: Math.round(r.protein_g), source: "text" });
      setTxt("");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const logPhoto = async (file) => {
    if (!file || busy) return;
    setBusy(true); setErr("");
    try {
      const b64 = await resizeImage(file);
      const r = await callAnalyze({ type: "meal-photo", image: b64, mediaType: "image/jpeg", text: txt.trim() });
      addLog({ time: nowTime(), name: r.name, kcal: Math.round(r.kcal), protein: Math.round(r.protein_g), source: "foto" });
      setTxt("");
    } catch (e) { setErr(e.message); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card style={{ padding: 14, marginBottom: 14, borderColor: C.accentDim, background: "rgba(197,248,42,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Sparkles size={15} color={C.accent} />
        <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16 }}>Quick-Log</span>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>KI schätzt kcal + Protein</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && logText()}
          placeholder='z.B. "Döner + Cola Zero"' disabled={busy}
          style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "'Sora'", outline: "none" }} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} title="Foto"
          style={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "0 12px", cursor: "pointer", color: C.text }}>
          <Camera size={17} />
        </button>
        <button onClick={logText} disabled={busy || !txt.trim()}
          style={{ background: C.accent, border: "none", borderRadius: 10, padding: "0 14px", cursor: "pointer", color: "#111", fontWeight: 800, fontSize: 13, fontFamily: "'Bricolage Grotesque'", opacity: busy || !txt.trim() ? .5 : 1 }}>
          {busy ? <Loader2 size={16} className="spin" /> : "Log"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => logPhoto(e.target.files?.[0])} />
      </div>
      {err && <div style={{ marginTop: 8, fontSize: 11.5, color: C.warn }}>{err}</div>}
      {logs.length > 0 && (
        <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 5 }}>
          {logs.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface2, borderRadius: 9, padding: "8px 10px", animation: "slideUp .2s" }}>
              <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{l.time}</span>
              <span style={{ fontSize: 12.5, flex: 1, lineHeight: 1.3 }}>{l.name}</span>
              <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", fontWeight: 700, whiteSpace: "nowrap" }}>{l.kcal}<span style={{ color: C.muted, fontWeight: 400 }}> kcal</span></span>
              <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.accent, whiteSpace: "nowrap" }}>{l.protein}g<span style={{ color: C.muted, fontWeight: 400 }}> P</span></span>
              <button onClick={() => removeLog(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================== TAGESANALYSE ============================== */
function DayAnalysis({ day }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(day.analysisResult || null);
  const [err, setErr] = useState("");

  const run = async () => {
    setBusy(true); setErr("");
    try {
      const mealsChecked = {};
      MEALS.forEach((m) => { const sel = day.meals?.[m.id] || []; if (sel.length) mealsChecked[m.label] = sel; });
      const exercisesDone = EXERCISES.filter((e) => day.exercises?.[e.id]?.done).map((e) => e.name);
      const payload = {
        type: "day-analysis",
        day: { abgehakteMahlzeiten: mealsChecked, quickLogs: day.quickLogs || [], training: exercisesDone, schritte: day.steps || null },
      };
      const r = await callAnalyze(payload);
      setResult(r);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Card style={{ padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={15} color={C.accent} />
        <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 15 }}>Tagesanalyse</span>
        <button onClick={run} disabled={busy} style={{ marginLeft: "auto", background: C.accent, border: "none", borderRadius: 9, padding: "7px 13px", cursor: "pointer", color: "#111", fontWeight: 800, fontSize: 12, fontFamily: "'Bricolage Grotesque'", opacity: busy ? .5 : 1, display: "flex", alignItems: "center", gap: 5 }}>
          {busy ? <Loader2 size={14} className="spin" /> : "Analysieren"}
        </button>
      </div>
      {err && <div style={{ marginTop: 9, fontSize: 11.5, color: C.warn }}>{err}</div>}
      {result && (
        <div style={{ marginTop: 11, animation: "slideUp .25s" }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 9 }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 15, fontWeight: 700 }}>~{result.kcal_estimate}<span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}> kcal</span></span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 15, fontWeight: 700, color: C.accent }}>~{result.protein_estimate}g<span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}> Protein</span></span>
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.text }}>{result.text}</div>
        </div>
      )}
      {!result && !err && <div style={{ marginTop: 9, fontSize: 11.5, color: C.muted }}>Einmal am Tag drücken — KI bilanziert kcal, Protein und gibt einen Hinweis für morgen.</div>}
    </Card>
  );
}

/* ============================== HEUTE ============================== */
function Heute({ day, setDay, measurements }) {
  const mealsDone = MEALS.filter((m) => (day.meals?.[m.id] || []).length > 0).length;
  const exDone = EXERCISES.filter((e) => day.exercises?.[e.id]?.done).length;
  const kcalToday = (day.quickLogs || []).reduce((s, l) => s + (l.kcal || 0), 0);
  const last = measurements[measurements.length - 1];
  const [stepsEdit, setStepsEdit] = useState(false);
  const [stepsVal, setStepsVal] = useState("");

  const toggleQuickMeal = (mealId, item) => setDay((prev) => {
    const cur = prev.meals?.[mealId] || []; const has = cur.includes(item);
    return { ...prev, meals: { ...prev.meals, [mealId]: has ? cur.filter((x) => x !== item) : [...cur, item] } };
  });
  const saveSteps = () => {
    const n = parseInt(stepsVal.replace(/\D/g, ""), 10);
    if (!isNaN(n)) setDay((prev) => ({ ...prev, steps: n }));
    setStepsEdit(false); setStepsVal("");
  };

  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <StatCard icon={<UtensilsCrossed size={13} />} label="ESSEN" value={mealsDone} suffix={`/${MEALS.length}`} highlight={mealsDone >= 3} />
        <StatCard icon={<Dumbbell size={13} />} label="TRAINING" value={exDone} suffix={`/${EXERCISES.length}`} highlight={exDone > 0} />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <StatCard icon={<Flame size={13} />} label="KCAL GELOGGT" value={kcalToday || "–"} highlight={false} />
        <Card style={{ flex: 1, padding: 16, cursor: "pointer" }} >
          <div onClick={() => !stepsEdit && setStepsEdit(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}><Footprints size={13} /> SCHRITTE</div>
            {stepsEdit ? (
              <div style={{ display: "flex", gap: 5 }}>
                <input autoFocus value={stepsVal} onChange={(e) => setStepsVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveSteps()} inputMode="numeric" placeholder={day.steps ? String(day.steps) : "0"}
                  style={{ width: "100%", background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 8px", color: C.text, fontSize: 17, fontWeight: 700, fontFamily: "'JetBrains Mono'", outline: "none" }} />
                <button onClick={saveSteps} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", color: "#111", fontWeight: 800 }}><Check size={15} /></button>
              </div>
            ) : (
              <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 30, fontWeight: 800, lineHeight: 1, color: (day.steps || 0) >= 8000 ? C.accent : C.text }}>
                {day.steps ? day.steps.toLocaleString("de-DE") : "–"}
              </div>
            )}
          </div>
        </Card>
      </div>

      <DayAnalysis day={day} />

      {last && (
        <Card style={{ padding: "13px 16px", marginBottom: 14, display: "flex", gap: 18 }}>
          <div><div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>GEWICHT</div><div style={{ fontFamily: "'JetBrains Mono'", fontSize: 17, fontWeight: 700 }}>{last.weight || "–"}<span style={{ fontSize: 11, color: C.muted }}> kg</span></div></div>
          <div><div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>BAUCH</div><div style={{ fontFamily: "'JetBrains Mono'", fontSize: 17, fontWeight: 700 }}>{last.waist || "–"}<span style={{ fontSize: 11, color: C.muted }}> cm</span></div></div>
          <div style={{ marginLeft: "auto", alignSelf: "center", fontSize: 10, color: C.muted }}>{prettyDate(last.date)}</div>
        </Card>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, margin: "4px 2px 10px", letterSpacing: ".04em" }}>SCHNELL ABHAKEN — FAVORITEN</div>
      {MEALS.map((m) => {
        const sel = day.meals?.[m.id] || [];
        return (
          <Card key={m.id} style={{ padding: 12, marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 14 }}>{m.label}</span>
              <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{m.time}</span>
            </div>
            {m.favorites.map((f) => {
              const on = sel.includes(f);
              return (
                <button key={f} onClick={() => toggleQuickMeal(m.id, f)} style={{
                  width: "100%", textAlign: "left", cursor: "pointer", display: "flex", gap: 9, alignItems: "flex-start",
                  background: on ? "rgba(197,248,42,.08)" : "transparent", border: `1px solid ${on ? C.accentDim : C.line}`,
                  borderRadius: 10, padding: "9px 10px", marginBottom: 5, transition: "all .15s",
                }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, background: on ? C.accent : "transparent", border: `1.5px solid ${on ? C.accent : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={13} color="#111" strokeWidth={3} />}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.35, color: on ? C.text : C.muted }}>{f}</span>
                </button>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}

/* ============================== TRAINING ============================== */
function Training({ day, setDay, config, setConfig }) {
  const setEx = (id, patch) => setDay((prev) => ({ ...prev, exercises: { ...prev.exercises, [id]: { ...(prev.exercises?.[id] || {}), ...patch } } }));
  const setProg = (id, patch) => setConfig((prev) => ({ ...prev, progression: { ...prev.progression, [id]: { ...(prev.progression?.[id] || { band: "mittel", target: 12 }), ...patch } } }));
  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      <Card style={{ padding: "12px 14px", marginBottom: 13, borderColor: C.accentDim, background: "rgba(197,248,42,.05)" }}>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: C.text }}><b style={{ color: C.accent }}>2 Durchgänge, früher Abend.</b> Nicht in der letzten Stunde vor dem Bett. Häkchen = heute gemacht. Wenn mehr als 15 Wdh easy sind → Last hoch.</div>
      </Card>
      {EXERCISES.map((e) => {
        const st = day.exercises?.[e.id] || {};
        const prog = config.progression?.[e.id] || { band: "mittel", target: 12 };
        const tooEasy = st.feel === "leicht";
        return (
          <Card key={e.id} style={{ padding: 13, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <button onClick={() => setEx(e.id, { done: !st.done })} style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, cursor: "pointer", marginTop: 1, background: st.done ? C.accent : "transparent", border: `2px solid ${st.done ? C.accent : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", animation: st.done ? "pop .2s" : "none" }}>{st.done && <Check size={17} color="#111" strokeWidth={3} />}</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 15, lineHeight: 1.15 }}>{e.name}</div>
                <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 600, fontFamily: "'JetBrains Mono'", margin: "2px 0 6px" }}>{e.muscles}</div>
                <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.4 }}>{e.how}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 11, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>LAST:</span>
              {["leicht", "mittel", "stark"].map((b) => <Pill key={b} active={prog.band === b} onClick={() => setProg(e.id, { band: b })}>{b}</Pill>)}
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginLeft: 6 }}>ZIEL:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.surface2, borderRadius: 8, padding: "2px 4px" }}>
                <button onClick={() => setProg(e.id, { target: Math.max(4, (prog.target || 12) - 1) })} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", padding: 2 }}><Minus size={13} /></button>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{prog.target || 12}</span>
                <button onClick={() => setProg(e.id, { target: (prog.target || 12) + 1 })} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", padding: 2 }}><Plus size={13} /></button>
              </div>
            </div>
            {st.done && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 9, animation: "slideUp .2s" }}>
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>WAR:</span>
                <Pill active={st.feel === "leicht"} onClick={() => setEx(e.id, { feel: "leicht" })} color={C.warn}>zu leicht</Pill>
                <Pill active={st.feel === "passt"} onClick={() => setEx(e.id, { feel: "passt" })}>passt</Pill>
                <Pill active={st.feel === "schwer"} onClick={() => setEx(e.id, { feel: "schwer" })}>schwer</Pill>
              </div>
            )}
            {tooEasy && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, color: C.warn, fontSize: 11.5, fontWeight: 600, animation: "slideUp .2s" }}><ArrowUp size={14} /> Steigern: mehr Widerstand oder Ziel +2 Wdh</div>}
          </Card>
        );
      })}
    </div>
  );
}

/* ============================== ESSEN ============================== */
function Essen({ day, setDay, config, setConfig }) {
  const [adding, setAdding] = useState(null);
  const [txt, setTxt] = useState("");
  const toggle = (mealId, item) => setDay((prev) => {
    const cur = prev.meals?.[mealId] || []; const has = cur.includes(item);
    return { ...prev, meals: { ...prev.meals, [mealId]: has ? cur.filter((x) => x !== item) : [...cur, item] } };
  });
  const addCustom = (mealId) => { if (!txt.trim()) return; setConfig((prev) => ({ ...prev, customFoods: { ...prev.customFoods, [mealId]: [...(prev.customFoods?.[mealId] || []), txt.trim()] } })); setTxt(""); setAdding(null); };
  const removeCustom = (mealId, item) => setConfig((prev) => ({ ...prev, customFoods: { ...prev.customFoods, [mealId]: (prev.customFoods?.[mealId] || []).filter((x) => x !== item) } }));

  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      <QuickLog day={day} setDay={setDay} />
      {MEALS.map((m) => {
        const sel = day.meals?.[m.id] || [];
        const custom = config.customFoods?.[m.id] || [];
        const row = (item, isFav, isCustom) => {
          const on = sel.includes(item);
          return (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => toggle(m.id, item)} style={{ flex: 1, textAlign: "left", cursor: "pointer", display: "flex", gap: 9, alignItems: "flex-start", background: on ? "rgba(197,248,42,.08)" : "transparent", border: `1px solid ${on ? C.accentDim : C.line}`, borderRadius: 10, padding: "9px 10px", transition: "all .15s" }}>
                <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1, background: on ? C.accent : "transparent", border: `1.5px solid ${on ? C.accent : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={12} color="#111" strokeWidth={3} />}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.35, color: on ? C.text : (isFav ? C.text : C.muted) }}>{isFav && <span style={{ color: C.accent, fontWeight: 700 }}>★ </span>}{item}</span>
              </button>
              {isCustom && <button onClick={() => removeCustom(m.id, item)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><X size={15} /></button>}
            </div>
          );
        };
        return (
          <Card key={m.id} style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 11 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 17 }}>{m.label}</span>
              <span style={{ fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{m.time}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {m.favorites.map((f) => row(f, true, false))}
              <div style={{ height: 1, background: C.line, margin: "5px 0" }} />
              {m.alternatives.map((a) => row(a, false, false))}
              {custom.map((c) => row(c, false, true))}
            </div>
            {adding === m.id ? (
              <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                <input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom(m.id)} placeholder="Eigene Mahlzeit…" style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", color: C.text, fontSize: 12.5, fontFamily: "'Sora'", outline: "none" }} />
                <button onClick={() => addCustom(m.id)} style={{ background: C.accent, border: "none", borderRadius: 9, padding: "0 13px", cursor: "pointer", color: "#111", fontWeight: 700, fontSize: 12 }}>OK</button>
              </div>
            ) : (
              <button onClick={() => { setAdding(m.id); setTxt(""); }} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 9, background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: "'Sora'" }}><Plus size={14} /> eigene Option</button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ============================== VERLAUF ============================== */
function Verlauf({ measurements, addMeasurement }) {
  const [w, setW] = useState(""); const [waist, setWaist] = useState("");
  const [sleep, setSleep] = useState(""); const [energy, setEnergy] = useState("");
  const save = () => {
    if (!w && !waist && !sleep && !energy) return;
    addMeasurement({ date: todayKey(), weight: w ? parseFloat(w.replace(",", ".")) : null, waist: waist ? parseFloat(waist.replace(",", ".")) : null, sleep: sleep ? parseFloat(sleep.replace(",", ".")) : null, energy: energy ? parseInt(energy) : null });
    setW(""); setWaist(""); setSleep(""); setEnergy("");
  };
  const chartData = measurements.filter((m) => m.weight || m.waist).map((m) => ({ d: prettyDate(m.date), Gewicht: m.weight, Bauch: m.waist }));
  const field = (icon, ph, val, set, unit) => (
    <div style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 11, padding: "9px 11px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 10, fontWeight: 600, marginBottom: 5 }}>{icon}{ph}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <input value={val} onChange={(e) => set(e.target.value)} inputMode="decimal" placeholder="–" style={{ width: "100%", background: "none", border: "none", color: C.text, fontSize: 19, fontWeight: 700, fontFamily: "'JetBrains Mono'", outline: "none" }} />
        <span style={{ fontSize: 11, color: C.muted }}>{unit}</span>
      </div>
    </div>
  );
  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      <Card style={{ padding: 14, marginBottom: 13 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Heute messen</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>1× / Woche reicht — morgens, nüchtern, gleicher Tag.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>{field(<Scale size={12} />, "GEWICHT", w, setW, "kg")}{field(<Ruler size={12} />, "BAUCH", waist, setWaist, "cm")}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>{field(<Moon size={12} />, "SCHLAF", sleep, setSleep, "h")}{field(<Battery size={12} />, "ENERGIE", energy, setEnergy, "/10")}</div>
        <button onClick={save} style={{ width: "100%", background: C.accent, border: "none", borderRadius: 11, padding: "12px", color: "#111", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Bricolage Grotesque'" }}>Speichern</button>
      </Card>
      {chartData.length >= 2 && (
        <Card style={{ padding: "16px 8px 8px", marginBottom: 13 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 13, marginLeft: 8, marginBottom: 10, color: C.muted }}>VERLAUF</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="d" tick={{ fill: C.muted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: C.muted }} />
              <Line type="monotone" dataKey="Gewicht" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} connectNulls />
              <Line type="monotone" dataKey="Bauch" stroke={C.warn} strokeWidth={2.5} dot={{ r: 3, fill: C.warn }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      {[...measurements].reverse().slice(0, 12).map((m, i) => (
        <Card key={i} style={{ padding: "11px 14px", marginBottom: 7, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono'", minWidth: 54 }}>{prettyDate(m.date)}</span>
          {m.weight && <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{m.weight}<span style={{ color: C.muted, fontWeight: 400 }}>kg</span></span>}
          {m.waist && <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{m.waist}<span style={{ color: C.muted, fontWeight: 400 }}>cm</span></span>}
          {m.sleep && <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono'", color: C.muted }}><Moon size={11} style={{ verticalAlign: -1 }} /> {m.sleep}h</span>}
          {m.energy && <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono'", color: C.muted, marginLeft: "auto" }}><Battery size={11} style={{ verticalAlign: -1 }} /> {m.energy}/10</span>}
        </Card>
      ))}
      {measurements.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 12.5, padding: 30 }}>Noch keine Messungen. Bauch &gt; Waage als Indikator.</div>}
    </div>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.replace("#", "");
    return TAB_IDS.includes(h) ? h : "heute";
  });
  const [dayKey] = useState(todayKey());
  const [data, setData] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const didLoad = useRef(false);

  // hash routing (für App-Shortcuts: /#essen, /#training, /#verlauf)
  useEffect(() => {
    const apply = () => { const h = window.location.hash.replace("#", ""); if (TAB_IDS.includes(h)) setTab(h); };
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  const go = (id) => { setTab(id); try { history.replaceState(null, "", "#" + id); } catch { /* ignore */ } };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setData(null); didLoad.current = false; return; }
    (async () => {
      const { data: row } = await supabase.from("app_data").select("*").eq("user_id", session.user.id).maybeSingle();
      setData({
        days: row?.days || {},
        config: row?.config || { progression: {}, customFoods: {} },
        measurements: row?.measurements || [],
      });
      didLoad.current = true;
    })();
  }, [session]);

  useEffect(() => {
    if (!session || data === null || !didLoad.current) return;
    let cancelled = false;
    setSyncState("saving");
    const t = setTimeout(async () => {
      const { error } = await supabase.from("app_data").upsert({
        user_id: session.user.id, days: data.days, config: data.config,
        measurements: data.measurements, updated_at: new Date().toISOString(),
      });
      if (!cancelled) setSyncState(error ? "error" : "idle");
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [data, session]);

  const day = data?.days?.[dayKey] || { meals: {}, exercises: {} };
  const setDay = useCallback((updater) => setData((prev) => {
    const cur = prev.days[dayKey] || { meals: {}, exercises: {} };
    const newDay = typeof updater === "function" ? updater(cur) : updater;
    return { ...prev, days: { ...prev.days, [dayKey]: newDay } };
  }), [dayKey]);
  const setConfig = useCallback((updater) => setData((prev) => ({ ...prev, config: typeof updater === "function" ? updater(prev.config) : updater })), []);
  const addMeasurement = useCallback((m) => setData((prev) => ({ ...prev, measurements: [...prev.measurements.filter((x) => x.date !== m.date), m].sort((a, b) => a.date.localeCompare(b.date)) })), []);

  if (session === undefined) return <Splash />;
  if (!session) return <Auth />;
  if (data === null) return <Splash />;

  const TABS = [
    { id: "heute", label: "Heute", icon: Flame },
    { id: "training", label: "Training", icon: Dumbbell },
    { id: "essen", label: "Essen", icon: UtensilsCrossed },
    { id: "verlauf", label: "Verlauf", icon: TrendingUp },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Sora', sans-serif" }}>
      <style>{FONT_CSS}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 88px" }}>
        <div style={{ padding: "22px 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 25, lineHeight: 1, letterSpacing: "-.02em" }}>System<span style={{ color: C.accent }}>.</span></div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "'JetBrains Mono'" }}>{prettyDate(dayKey)} · Insulin & Cortisol im Fokus</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span title={syncState === "error" ? "Sync-Fehler" : "Synchronisiert"}>
              {syncState === "error" ? <CloudOff size={16} color={C.warn} /> : <Cloud size={16} color={syncState === "saving" ? C.accent : C.muted} />}
            </span>
            <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }} title="Abmelden"><LogOut size={16} /></button>
          </div>
        </div>
        <div style={{ padding: "0 14px" }}>
          {tab === "heute" && <Heute day={day} setDay={setDay} measurements={data.measurements} />}
          {tab === "training" && <Training day={day} setDay={setDay} config={data.config} setConfig={setConfig} />}
          {tab === "essen" && <Essen day={day} setDay={setDay} config={data.config} setConfig={setConfig} />}
          {tab === "verlauf" && <Verlauf measurements={data.measurements} addMeasurement={addMeasurement} />}
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,15,14,.92)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center", padding: "8px 0 14px" }}>
        <div style={{ display: "flex", gap: 4, maxWidth: 480, width: "100%", padding: "0 14px" }}>
          {TABS.map((t) => {
            const on = tab === t.id; const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => go(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", color: on ? C.accent : C.muted, transition: "color .15s" }}>
                <Icon size={21} strokeWidth={on ? 2.5 : 2} />
                <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, fontFamily: "'Bricolage Grotesque'" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONT_CSS}</style>
      <div style={{ width: 26, height: 26, border: `3px solid ${C.line}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
    </div>
  );
}
