import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import {
  Flame, Dumbbell, UtensilsCrossed, TrendingUp, Check, Plus, X, ArrowUp, Minus,
  Moon, Battery, Ruler, Scale, LogOut, Cloud, CloudOff, Camera, Sparkles, Footprints, Loader2,
  StickyNote, Activity, Waves, Bike, Clock,
  ListTodo, Mic, MicOff, CalendarClock, Trash2, ChevronDown, Droplet, Upload,
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ============================== THEME ============================== */
const C = {
  bg: "#0F0F0E", surface: "#1A1A17", surface2: "#23231F", line: "#32322C",
  accent: "#C5F82A", accentDim: "#7C9A1B", text: "#EDEDE6", muted: "#8C8C82", warn: "#F5A623", bad: "#F5564A",
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
    favorites: ["Protein-Shake: 600ml fettarme laktosefreie Milch + 4 Scoops Mammut Whey (Shake ≈52g Protein) + 150–200g gefr. Beeren + 2 EL Dinkelkleie · ≈57g Protein, ≈610 kcal"],
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

const ACTIVITY_PRESETS = [
  { label: "Spazieren", icon: Footprints },
  { label: "Laufen", icon: Activity },
  { label: "Schwimmen", icon: Waves },
  { label: "Radfahren", icon: Bike },
];

const TAB_IDS = ["heute", "todos", "training", "essen", "verlauf", "labor"];

// Todo-Kategorien (Reihenfolge = Anzeige) + Farben
const TODO_CATEGORIES = ["Mädchen", "Memyself&I", "Co Parenting", "Shopping", "Ideen"];
const TODO_CAT_COLOR = {
  "Mädchen": "#F58EC1", "Memyself&I": "#C5F82A", "Co Parenting": "#5BC8F5",
  "Shopping": "#F5A623", "Ideen": "#B98CF5",
};
// Shopping-Abteilungen (Reihenfolge = Anzeige)
const SHOP_DEPTS = ["Gemüse/Obst", "Getreideprodukte", "Milchprodukte", "Getränke", "TK", "Konserven", "Anderes", "Drogerie"];

// Mahlzeiten-Slots zum Zuordnen der Quick-Logs (zusätzlich "Snack")
const MEAL_SLOTS = [
  ...MEALS.map((m) => ({ id: m.id, label: m.label })),
  { id: "snack", label: "Snack" },
];
const MEAL_SLOT_SHORT = { fruehstueck: "Früh", mittag: "Mittag", nachmittag: "Nachm.", abend: "Abend", snack: "Snack" };

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
// Standard-Mahlzeit aus der Uhrzeit ableiten (für neue Quick-Logs)
const inferMeal = () => {
  const h = new Date().getHours();
  if (h < 11) return "fruehstueck";
  if (h < 14) return "mittag";
  if (h < 17) return "nachmittag";
  return "abend";
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

/* ============================== QUICK-LOG HELPERS + ROW ============================== */
// gemeinsame Mutatoren – funktionieren sowohl im Essen- als auch im Heute-Tab
const patchLog = (setDay, i, patch) => setDay((prev) => ({ ...prev, quickLogs: (prev.quickLogs || []).map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
const removeLogAt = (setDay, i) => setDay((prev) => ({ ...prev, quickLogs: (prev.quickLogs || []).filter((_, idx) => idx !== i) }));

// Todos liegen in config.todos (kein DB-Migrationsbedarf)
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const addTodoCfg = (setConfig, todo) => setConfig((prev) => ({ ...prev, todos: [...(prev.todos || []), todo] }));
const patchTodoCfg = (setConfig, id, patch) => setConfig((prev) => ({ ...prev, todos: (prev.todos || []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
const removeTodoCfg = (setConfig, id) => setConfig((prev) => ({ ...prev, todos: (prev.todos || []).filter((t) => t.id !== id) }));
const isValidDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
// Shopping: Artikel→Abteilung lernen (config.shopDeptMemory = { normKey: { dept, label } })
const normItem = (s) => (s || "").toLowerCase().trim();
const learnDept = (setConfig, title, dept) => setConfig((prev) => ({
  ...prev,
  shopDeptMemory: { ...(prev.shopDeptMemory || {}), [normItem(title)]: { dept, label: (title || "").trim() } },
}));
// Sortierung: offen vor erledigt, datierte vor undatierten, Datum aufsteigend, sonst Anlage-Reihenfolge
const todoSort = (a, b) => {
  if (!!a.done !== !!b.done) return a.done ? 1 : -1;
  const ad = a.date ? 0 : 1, bd = b.date ? 0 : 1;
  if (ad !== bd) return ad - bd;
  if (a.date && b.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (a.createdAt || "") < (b.createdAt || "") ? -1 : 1;
};

// Editierbare Log-Zeile: Uhrzeit ändern, Mahlzeit zuordnen, löschen
function LogRow({ log, onPatch, onDelete, showMeal = true }) {
  const [editTime, setEditTime] = useState(false);
  const [tVal, setTVal] = useState(log.time || "");
  const saveTime = () => { onPatch({ time: tVal.trim() || log.time }); setEditTime(false); };
  return (
    <div style={{ background: C.surface2, borderRadius: 9, padding: "8px 10px", animation: "slideUp .2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {editTime ? (
          <input autoFocus type="time" value={tVal} onChange={(e) => setTVal(e.target.value)} onBlur={saveTime} onKeyDown={(e) => e.key === "Enter" && saveTime()}
            style={{ width: 84, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 7, padding: "3px 6px", color: C.text, fontSize: 11, fontFamily: "'JetBrains Mono'", outline: "none" }} />
        ) : (
          <button onClick={() => { setTVal(log.time || ""); setEditTime(true); }} title="Uhrzeit ändern"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono'", padding: 0, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <Clock size={11} /> {log.time || "--:--"}
          </button>
        )}
        <span style={{ fontSize: 12.5, flex: 1, lineHeight: 1.3 }}>{log.name}</span>
        <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", fontWeight: 700, whiteSpace: "nowrap" }}>{log.kcal}<span style={{ color: C.muted, fontWeight: 400 }}> kcal</span></span>
        <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.accent, whiteSpace: "nowrap" }}>{log.protein}g<span style={{ color: C.muted, fontWeight: 400 }}> P</span></span>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><X size={14} /></button>
      </div>
      {showMeal && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 7 }}>
          {MEAL_SLOTS.map((s) => (
            <Pill key={s.id} active={(log.meal || "snack") === s.id} onClick={() => onPatch({ meal: s.id })}>{MEAL_SLOT_SHORT[s.id]}</Pill>
          ))}
        </div>
      )}
    </div>
  );
}

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
      addLog({ time: nowTime(), meal: inferMeal(), name: r.name, kcal: Math.round(r.kcal), protein: Math.round(r.protein_g), source: "text" });
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
      addLog({ time: nowTime(), meal: inferMeal(), name: r.name, kcal: Math.round(r.kcal), protein: Math.round(r.protein_g), source: "foto" });
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
            <LogRow key={i} log={l} onPatch={(p) => patchLog(setDay, i, p)} onDelete={() => removeLog(i)} />
          ))}
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>Tipp: Mahlzeit unten antippen zum Zuordnen · Uhrzeit über die Zeit-Anzeige ändern.</div>
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
      const mealNotes = {};
      MEALS.forEach((m) => { const n = day.mealNotes?.[m.id]; if (n && n.trim()) mealNotes[m.label] = n.trim(); });
      const exercisesDone = EXERCISES.filter((e) => day.exercises?.[e.id]?.done).map((e) => e.name);
      const payload = {
        type: "day-analysis",
        day: {
          abgehakteMahlzeiten: mealsChecked,
          mahlzeitNotizen: mealNotes,
          quickLogs: day.quickLogs || [],
          training: exercisesDone,
          aktivitaeten: day.activities || [],
          schritte: day.steps || null,
        },
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
const DEFAULT_GOALS = { protein: 150, kcalMax: 2600, steps: 8000 };
// Makro-Zahl aus einem Favoriten-Text ziehen (z.B. "≈57g Protein, ≈610 kcal")
const macroNum = (str, re) => { const m = (str || "").match(re); return m ? parseInt(m[1], 10) : 0; };
// Ampelfarbe – "mehr ist besser" (Protein, Schritte) bzw. Budget (Kalorien)
const colorMore = (v, goal) => (!v ? C.muted : v / goal >= 1 ? C.accent : v / goal >= 0.6 ? C.warn : C.bad);
const colorBudget = (v, max) => (!v ? C.muted : v <= max ? C.accent : v <= max * 1.12 ? C.warn : C.bad);

function GoalCard({ icon, label, value, goal, unit = "", color, hint }) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <Card style={{ flex: 1, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{icon} {label}</div>
      <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 26, fontWeight: 800, lineHeight: 1, color }}>
        {value}<span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}> / {goal}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: C.surface2, marginTop: 9, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width .3s" }} />
      </div>
      {hint && <div style={{ fontSize: 9.5, color: C.muted, marginTop: 6, fontFamily: "'JetBrains Mono'" }}>{hint}</div>}
    </Card>
  );
}

function Heute({ day, setDay, config, setConfig }) {
  const tk = todayKey();
  const dueTodos = (config.todos || []).filter((t) => !t.done && t.date && t.date <= tk).sort(todoSort);
  const goals = { ...DEFAULT_GOALS, ...(config.goals || {}) };
  const quickLogs = day.quickLogs || [];
  const checkedItems = MEALS.flatMap((m) => day.meals?.[m.id] || []);
  const proteinToday = Math.round(quickLogs.reduce((s, l) => s + (l.protein || 0), 0) + checkedItems.reduce((s, it) => s + macroNum(it, /(\d+)\s*g\s*Protein/i), 0));
  const kcalToday = Math.round(quickLogs.reduce((s, l) => s + (l.kcal || 0), 0) + checkedItems.reduce((s, it) => s + macroNum(it, /(\d+)\s*kcal/i), 0));
  const exDone = EXERCISES.filter((e) => day.exercises?.[e.id]?.done).length;
  const activities = day.activities || [];
  const steps = day.steps || 0;
  const [stepsEdit, setStepsEdit] = useState(false);
  const [stepsVal, setStepsVal] = useState("");
  const saveSteps = () => {
    const n = parseInt(stepsVal.replace(/\D/g, ""), 10);
    if (!isNaN(n)) setDay((prev) => ({ ...prev, steps: n }));
    setStepsEdit(false); setStepsVal("");
  };

  // Read-only Essens-Zusammenfassung je Mahlzeit (Favoriten + zugeordnete Logs)
  const mealSummary = (mealId) => {
    const items = day.meals?.[mealId] || [];
    const logs = quickLogs.filter((l) => (l.meal || "snack") === mealId).map((l) => l.name);
    return [...items, ...logs];
  };

  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      {dueTodos.length > 0 && (
        <Card style={{ padding: 12, marginBottom: 14, borderColor: C.accentDim }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
            <CalendarClock size={14} color={C.accent} />
            <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 14 }}>Anstehend</span>
            <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>{dueTodos.length} fällig</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dueTodos.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={() => patchTodoCfg(setConfig, t.id, { done: !t.done })} onDelete={() => removeTodoCfg(setConfig, t.id)} />
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <GoalCard icon={<Flame size={13} />} label="PROTEIN" value={proteinToday} goal={goals.protein} unit="g" color={colorMore(proteinToday, goals.protein)} hint={proteinToday >= goals.protein ? "Ziel erreicht" : `${Math.max(0, goals.protein - proteinToday)}g fehlen`} />
        <GoalCard icon={<UtensilsCrossed size={13} />} label="KALORIEN" value={kcalToday} goal={goals.kcalMax} unit="" color={colorBudget(kcalToday, goals.kcalMax)} hint={kcalToday > goals.kcalMax ? `${kcalToday - goals.kcalMax} über Budget` : `${Math.max(0, goals.kcalMax - kcalToday)} frei`} />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <Card style={{ flex: 1, padding: 14 }}>
          <div onClick={() => !stepsEdit && (setStepsVal(steps ? String(steps) : ""), setStepsEdit(true))} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}><Footprints size={13} /> SCHRITTE</div>
            {stepsEdit ? (
              <div style={{ display: "flex", gap: 5 }}>
                <input autoFocus value={stepsVal} onChange={(e) => setStepsVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveSteps()} onBlur={saveSteps} inputMode="numeric" placeholder="0"
                  style={{ width: "100%", background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "3px 8px", color: C.text, fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono'", outline: "none" }} />
                <button onClick={saveSteps} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", color: "#111", fontWeight: 800 }}><Check size={15} /></button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 26, fontWeight: 800, lineHeight: 1, color: colorMore(steps, goals.steps) }}>
                  {steps ? steps.toLocaleString("de-DE") : "–"}<span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}> / {(goals.steps / 1000)}k</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: C.surface2, marginTop: 9, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, Math.round((steps / goals.steps) * 100))}%`, height: "100%", background: colorMore(steps, goals.steps), borderRadius: 999, transition: "width .3s" }} />
                </div>
              </>
            )}
          </div>
        </Card>
        <GoalCard icon={<Dumbbell size={13} />} label="TRAINING" value={exDone} goal={EXERCISES.length} unit="" color={(exDone > 0 || activities.length > 0) ? C.accent : C.muted} hint={activities.length ? `+${activities.length} Aktivität` : "Übungen heute"} />
      </div>

      <DayAnalysis day={day} />

      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, margin: "4px 2px 10px", letterSpacing: ".04em" }}>HEUTE GEGESSEN</div>
      <Card style={{ padding: "6px 14px", marginBottom: 9 }}>
        {MEALS.map((m, idx) => {
          const names = mealSummary(m.id);
          const note = day.mealNotes?.[m.id];
          const done = names.length > 0;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, marginTop: 4, background: done ? C.accent : "transparent", border: `1.5px solid ${done ? C.accent : C.muted}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 13, color: done ? C.text : C.muted }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names.length ? names.join(" · ") : "–"}</div>
                {note && <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><StickyNote size={10} /> {note}</div>}
              </div>
            </div>
          );
        })}
      </Card>
      <div style={{ fontSize: 10, color: C.muted, textAlign: "center", fontFamily: "'JetBrains Mono'", marginBottom: 4 }}>Bearbeiten im Essen-Tab</div>
    </div>
  );
}

/* ============================== TRAINING ============================== */
function Training({ day, setDay, config, setConfig }) {
  const setEx = (id, patch) => setDay((prev) => ({ ...prev, exercises: { ...prev.exercises, [id]: { ...(prev.exercises?.[id] || {}), ...patch } } }));
  const setProg = (id, patch) => setConfig((prev) => ({ ...prev, progression: { ...prev.progression, [id]: { ...(prev.progression?.[id] || { band: "mittel", target: 12 }), ...patch } } }));
  const [actName, setActName] = useState("");
  const [actMin, setActMin] = useState("");
  const activities = day.activities || [];
  const addActivity = (name, minutes) => {
    if (!name.trim()) return;
    setDay((prev) => ({ ...prev, activities: [...(prev.activities || []), { time: nowTime(), name: name.trim(), minutes: minutes ? parseInt(minutes, 10) : null }] }));
    setActName(""); setActMin("");
  };
  const removeActivity = (i) => setDay((prev) => ({ ...prev, activities: (prev.activities || []).filter((_, idx) => idx !== i) }));
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

      <Card style={{ padding: 14, marginTop: 4, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
          <Activity size={15} color={C.accent} />
          <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16 }}>Aktivität / Cardio</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>Schwimmen, Spazieren …</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {ACTIVITY_PRESETS.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => setActName(a.label)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 11px", cursor: "pointer", color: C.text, fontSize: 12, fontFamily: "'Sora'" }}>
                <Icon size={13} /> {a.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={actName} onChange={(e) => setActName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addActivity(actName, actMin)}
            placeholder="Aktivität – z.B. Schwimmen"
            style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 11px", color: C.text, fontSize: 13, fontFamily: "'Sora'", outline: "none" }} />
          <input value={actMin} onChange={(e) => setActMin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && addActivity(actName, actMin)}
            inputMode="numeric" placeholder="Min"
            style={{ width: 64, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: "'JetBrains Mono'", outline: "none", textAlign: "center" }} />
          <button onClick={() => addActivity(actName, actMin)} disabled={!actName.trim()}
            style={{ background: C.accent, border: "none", borderRadius: 10, padding: "0 13px", cursor: "pointer", color: "#111", fontWeight: 800, display: "flex", alignItems: "center", opacity: actName.trim() ? 1 : .5 }}>
            <Plus size={18} />
          </button>
        </div>
        {activities.length > 0 && (
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 5 }}>
            {activities.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface2, borderRadius: 9, padding: "8px 10px", animation: "slideUp .2s" }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{a.time}</span>
                <span style={{ fontSize: 12.5, flex: 1 }}>{a.name}</span>
                {a.minutes ? <span style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.accent }}>{a.minutes}<span style={{ color: C.muted, fontWeight: 400 }}> min</span></span> : null}
                <button onClick={() => removeActivity(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
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
  const setMealNote = (mealId, text) => setDay((prev) => ({ ...prev, mealNotes: { ...prev.mealNotes, [mealId]: text } }));

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
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
              <StickyNote size={13} color={C.muted} style={{ flexShrink: 0 }} />
              <input
                value={day.mealNotes?.[m.id] || ""}
                onChange={(e) => setMealNote(m.id, e.target.value)}
                placeholder="Notiz – z.B. Erdnussbutter im Shake"
                style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 9, padding: "7px 10px", color: C.text, fontSize: 12, fontFamily: "'Sora'", outline: "none" }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================== VERLAUF ============================== */
const TIMEFRAMES = [{ label: "7T", days: 7 }, { label: "30T", days: 30 }, { label: "6M", days: 180 }, { label: "12M", days: 365 }];
const METRICS = [
  { key: "weight", label: "Gewicht", unit: "kg", color: C.accent, src: "m" },
  { key: "waist", label: "Bauch", unit: "cm", color: C.warn, src: "m" },
  { key: "sleep", label: "Schlaf", unit: "h", color: "#5BC8F5", src: "m" },
  { key: "energy", label: "Energie", unit: "/10", color: "#B98CF5", src: "m" },
  { key: "steps", label: "Schritte", unit: "", color: C.accent, src: "d" },
  { key: "kcal", label: "Kalorien", unit: "kcal", color: C.warn, src: "d" },
  { key: "protein", label: "Protein", unit: "g", color: C.accent, src: "d" },
];
const dayMacros = (dObj) => {
  if (!dObj) return { kcal: 0, protein: 0 };
  const logs = dObj.quickLogs || [];
  const checked = MEALS.flatMap((m) => dObj.meals?.[m.id] || []);
  const protein = Math.round(logs.reduce((s, l) => s + (l.protein || 0), 0) + checked.reduce((s, it) => s + macroNum(it, /(\d+)\s*g\s*Protein/i), 0));
  const kcal = Math.round(logs.reduce((s, l) => s + (l.kcal || 0), 0) + checked.reduce((s, it) => s + macroNum(it, /(\d+)\s*kcal/i), 0));
  return { kcal, protein };
};
const cutoffDate = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };

function Verlauf({ measurements, addMeasurement, days, patchDay }) {
  const [showMeasure, setShowMeasure] = useState(false);
  const [w, setW] = useState(""); const [waist, setWaist] = useState("");
  const [sleep, setSleep] = useState(""); const [energy, setEnergy] = useState("");
  const [sel, setSel] = useState(todayKey());
  const [metric, setMetric] = useState(null);
  const [tf, setTf] = useState(30);
  const [sumBusy, setSumBusy] = useState(false);
  const [sumErr, setSumErr] = useState("");

  const save = () => {
    if (!w && !waist && !sleep && !energy) return;
    addMeasurement({ date: todayKey(), weight: w ? parseFloat(w.replace(",", ".")) : null, waist: waist ? parseFloat(waist.replace(",", ".")) : null, sleep: sleep ? parseFloat(sleep.replace(",", ".")) : null, energy: energy ? parseInt(energy) : null });
    setW(""); setWaist(""); setSleep(""); setEnergy(""); setShowMeasure(false);
  };
  const field = (icon, ph, val, set, unit) => (
    <div style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 11, padding: "9px 11px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 10, fontWeight: 600, marginBottom: 5 }}>{icon}{ph}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <input value={val} onChange={(e) => set(e.target.value)} inputMode="decimal" placeholder="–" style={{ width: "100%", background: "none", border: "none", color: C.text, fontSize: 19, fontWeight: 700, fontFamily: "'JetBrains Mono'", outline: "none" }} />
        <span style={{ fontSize: 11, color: C.muted }}>{unit}</span>
      </div>
    </div>
  );

  const measByDate = Object.fromEntries(measurements.map((m) => [m.date, m]));
  const dayKeys = [...new Set([...Object.keys(days || {}), ...measurements.map((m) => m.date), todayKey()])].filter(Boolean).sort().reverse();

  const selDay = days?.[sel];
  const selMeas = measByDate[sel];
  const selMacros = dayMacros(selDay);
  const selExDone = EXERCISES.filter((e) => selDay?.exercises?.[e.id]?.done).length;
  const selSteps = selDay?.steps || 0;
  const selActs = selDay?.activities || [];

  const genSummary = async () => {
    if (sumBusy) return;
    setSumBusy(true); setSumErr("");
    try {
      const mealsChecked = {}; MEALS.forEach((m) => { const s = selDay?.meals?.[m.id] || []; if (s.length) mealsChecked[m.label] = s; });
      const r = await callAnalyze({ type: "day-summary", day: {
        datum: sel, abgehakteMahlzeiten: mealsChecked, quickLogs: selDay?.quickLogs || [],
        training: EXERCISES.filter((e) => selDay?.exercises?.[e.id]?.done).map((e) => e.name),
        aktivitaeten: selActs, schritte: selSteps || null, messwerte: selMeas || null, summe: selMacros,
      } });
      patchDay(sel, { summaryText: r.text });
    } catch (e) { setSumErr(e.message); }
    setSumBusy(false);
  };

  // Chart-Daten für gewählten Messwert + Zeitraum
  const metricDef = METRICS.find((m) => m.key === metric);
  const cutoff = cutoffDate(tf);
  let series = [];
  if (metricDef) {
    if (metricDef.src === "m") {
      series = measurements.filter((m) => m.date >= cutoff && m[metric] != null).map((m) => ({ d: prettyDate(m.date), v: m[metric] }));
    } else {
      series = dayKeys.slice().reverse().filter((k) => k >= cutoff).map((k) => {
        const dm = dayMacros(days?.[k]);
        const v = metric === "steps" ? (days?.[k]?.steps || 0) : metric === "kcal" ? dm.kcal : dm.protein;
        return { d: prettyDate(k), v };
      }).filter((x) => x.v > 0);
    }
  }

  const statTile = (label, value, unit) => (
    <div style={{ flex: 1, background: C.surface2, borderRadius: 10, padding: "8px 10px", minWidth: 0 }}>
      <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 15, fontWeight: 700 }}>{value}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>{unit}</span></div>
    </div>
  );

  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      {/* Heute messen – aufklappbar */}
      {!showMeasure ? (
        <button onClick={() => setShowMeasure(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.accent, border: "none", borderRadius: 12, padding: "13px", cursor: "pointer", color: "#111", fontWeight: 800, fontSize: 15, fontFamily: "'Bricolage Grotesque'", marginBottom: 14 }}>
          <Plus size={17} /> Heute messen
        </button>
      ) : (
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16 }}>Heute messen</span>
            <button onClick={() => setShowMeasure(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><X size={17} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>{field(<Scale size={12} />, "GEWICHT", w, setW, "kg")}{field(<Ruler size={12} />, "BAUCH", waist, setWaist, "cm")}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>{field(<Moon size={12} />, "SCHLAF", sleep, setSleep, "h")}{field(<Battery size={12} />, "ENERGIE", energy, setEnergy, "/10")}</div>
          <button onClick={save} style={{ width: "100%", background: C.accent, border: "none", borderRadius: 11, padding: "12px", color: "#111", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Bricolage Grotesque'" }}>Speichern</button>
        </Card>
      )}

      {/* Tag wählen */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
        {dayKeys.slice(0, 30).map((k) => {
          const on = k === sel;
          return (
            <button key={k} onClick={() => setSel(k)} style={{ flexShrink: 0, background: on ? C.accent : C.surface2, border: `1px solid ${on ? C.accent : C.line}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: on ? "#111" : C.muted, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>
              {k === todayKey() ? "Heute" : prettyDate(k)}
            </button>
          );
        })}
      </div>

      {/* Tagesdetail */}
      <Card style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{sel === todayKey() ? "Heute" : prettyDate(sel)}</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
          {statTile("KALORIEN", selMacros.kcal || "–", "")}
          {statTile("PROTEIN", selMacros.protein || "–", "g")}
          {statTile("SCHRITTE", selSteps ? selSteps.toLocaleString("de-DE") : "–", "")}
          {statTile("TRAINING", selExDone + (selActs.length ? "+" + selActs.length : ""), "")}
        </div>
        {selMeas && (
          <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
            {statTile("GEWICHT", selMeas.weight ?? "–", "kg")}
            {statTile("BAUCH", selMeas.waist ?? "–", "cm")}
            {statTile("SCHLAF", selMeas.sleep ?? "–", "h")}
            {statTile("ENERGIE", selMeas.energy ?? "–", "/10")}
          </div>
        )}
        {/* KI-Zusammenfassung – immer präsent */}
        <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Sparkles size={13} color={C.accent} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: ".03em" }}>KI-ZUSAMMENFASSUNG</span>
            <button onClick={genSummary} disabled={sumBusy} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "3px 9px", cursor: "pointer", color: C.muted, fontSize: 10.5, fontFamily: "'JetBrains Mono'", display: "flex", alignItems: "center", gap: 4 }}>
              {sumBusy ? <Loader2 size={12} className="spin" /> : (selDay?.summaryText ? "Aktualisieren" : "Erstellen")}
            </button>
          </div>
          {sumErr && <div style={{ fontSize: 11, color: C.warn, marginBottom: 4 }}>{sumErr}</div>}
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: selDay?.summaryText ? C.text : C.muted }}>
            {selDay?.summaryText || "Noch keine Zusammenfassung — oben auf Erstellen tippen."}
          </div>
        </div>
      </Card>

      {/* Messwerte – anklicken für Verlaufskurve */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, margin: "4px 2px 8px", letterSpacing: ".04em" }}>VERLAUFSKURVEN</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {METRICS.map((m) => <Pill key={m.key} active={metric === m.key} onClick={() => setMetric(metric === m.key ? null : m.key)} color={m.color}>{m.label}</Pill>)}
      </div>
      {metricDef && (
        <Card style={{ padding: "14px 8px 10px 12px", marginBottom: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingRight: 6 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 13 }}>{metricDef.label}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {TIMEFRAMES.map((t) => <Pill key={t.days} active={tf === t.days} onClick={() => setTf(t.days)}>{t.label}</Pill>)}
            </div>
          </div>
          {series.length >= 2 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={series} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: C.muted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fill: C.muted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: C.muted }} formatter={(v) => [`${v}${metricDef.unit}`, metricDef.label]} />
                <Line type="monotone" dataKey="v" name={metricDef.label} stroke={metricDef.color} strokeWidth={2.5} dot={{ r: 3, fill: metricDef.color }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 11.5, color: C.muted, padding: "6px 6px 10px" }}>Zu wenig Daten im Zeitraum (min. 2 Werte).</div>
          )}
        </Card>
      )}

      {measurements.length === 0 && dayKeys.length <= 1 && <div style={{ textAlign: "center", color: C.muted, fontSize: 12.5, padding: 20 }}>Noch keine Daten. Miss dich oben oder logge Essen/Training.</div>}
    </div>
  );
}

/* ============================== TODOS ============================== */
function TodoItem({ todo, onToggle, onDelete, onDept, showCategory = true }) {
  const col = TODO_CAT_COLOR[todo.category] || C.muted;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.surface2, borderRadius: 10, padding: "10px 11px", animation: "slideUp .2s" }}>
      <button onClick={onToggle} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, cursor: "pointer", background: todo.done ? C.accent : "transparent", border: `2px solid ${todo.done ? C.accent : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", animation: todo.done ? "pop .2s" : "none" }}>
        {todo.done && <Check size={13} color="#111" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.35, color: todo.done ? C.muted : C.text, textDecoration: todo.done ? "line-through" : "none" }}>{todo.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 5, flexWrap: "wrap" }}>
          {showCategory && (
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".02em", color: col, border: `1px solid ${col}`, borderRadius: 999, padding: "1px 7px", fontFamily: "'JetBrains Mono'" }}>{todo.category}</span>
          )}
          {onDept && (
            <select value={todo.dept || "Anderes"} onChange={(e) => onDept(e.target.value)}
              style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 7, color: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono'", padding: "2px 4px", outline: "none", cursor: "pointer" }}>
              {SHOP_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {todo.date && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono'" }}><CalendarClock size={11} /> {prettyDate(todo.date)}</span>
          )}
        </div>
      </div>
      <button onClick={onDelete} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><Trash2 size={15} /></button>
    </div>
  );
}

function Todos({ config, setConfig }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("Alle");
  const [listening, setListening] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const recRef = useRef(null);
  const todos = config.todos || [];
  const memory = config.shopDeptMemory || {};

  const submit = async () => {
    if (!txt.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await callAnalyze({ type: "todo", text: txt.trim(), day: { today: todayKey() } });
      const category = TODO_CATEGORIES.includes(r.category) ? r.category : "Ideen";
      const title = (r.title || txt.trim()).trim();
      let dept = null;
      if (category === "Shopping") {
        // gemerkte Zuordnung gewinnt, sonst KI-Vorschlag, sonst "Anderes"
        dept = memory[normItem(title)]?.dept || (SHOP_DEPTS.includes(r.dept) ? r.dept : "Anderes");
      }
      addTodoCfg(setConfig, { id: uid(), title, category, date: isValidDate(r.date) ? r.date : null, dept, done: false, createdAt: new Date().toISOString() });
      if (category === "Shopping") learnDept(setConfig, title, dept);
      setTxt("");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  // Abteilung eines Shopping-Todos ändern → merken
  const setTodoDept = (todo, dept) => { patchTodoCfg(setConfig, todo.id, { dept }); learnDept(setConfig, todo.title, dept); };
  // Vorschlag (gemerkter Artikel) als neues Shopping-Todo anlegen
  const addSuggestion = (label, dept) => addTodoCfg(setConfig, { id: uid(), title: label, category: "Shopping", date: null, dept, done: false, createdAt: new Date().toISOString() });

  const toggleVoice = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setErr("Spracheingabe wird von diesem Browser nicht unterstützt — bitte tippen."); return; }
    const rec = new SR();
    rec.lang = "de-DE"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setTxt((p) => (p ? p + " " : "") + t); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec; setErr(""); setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const shown = todos.filter((t) => filter === "Alle" || t.category === filter).slice().sort(todoSort);
  const openCount = todos.filter((t) => !t.done).length;

  // Shopping-Ansicht: gruppiert nach Abteilung + Vorschläge aus dem Gedächtnis
  const shopTodos = todos.filter((t) => t.category === "Shopping");
  const openShopKeys = new Set(shopTodos.filter((t) => !t.done).map((t) => normItem(t.title)));
  const suggestions = Object.entries(memory)
    .filter(([k]) => !openShopKeys.has(k))
    .map(([k, v]) => ({ key: k, label: v.label || k, dept: v.dept || "Anderes" }))
    .sort((a, b) => (a.dept === b.dept ? a.label.localeCompare(b.label, "de") : SHOP_DEPTS.indexOf(a.dept) - SHOP_DEPTS.indexOf(b.dept)));

  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      <Card style={{ padding: 14, marginBottom: 14, borderColor: C.accentDim, background: "rgba(197,248,42,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <Sparkles size={15} color={C.accent} />
          <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16 }}>Todo erfassen</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>Sprache oder Text → KI sortiert</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder='z.B. "Freitag Turnbeutel für die Kita packen"' disabled={busy}
            style={{ flex: 1, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "'Sora'", outline: "none" }} />
          <button onClick={toggleVoice} disabled={busy} title="Spracheingabe"
            style={{ background: listening ? C.warn : C.surface2, border: `1px solid ${listening ? C.warn : C.line}`, borderRadius: 10, padding: "0 12px", cursor: "pointer", color: listening ? "#111" : C.text }}>
            {listening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
          <button onClick={submit} disabled={busy || !txt.trim()}
            style={{ background: C.accent, border: "none", borderRadius: 10, padding: "0 14px", cursor: "pointer", color: "#111", fontWeight: 800, fontSize: 13, fontFamily: "'Bricolage Grotesque'", opacity: busy || !txt.trim() ? .5 : 1 }}>
            {busy ? <Loader2 size={16} className="spin" /> : "Add"}
          </button>
        </div>
        {listening && <div style={{ marginTop: 8, fontSize: 11.5, color: C.warn }}>Sprich jetzt … (nochmal aufs Mikro tippen zum Stoppen)</div>}
        {err && <div style={{ marginTop: 8, fontSize: 11.5, color: C.warn }}>{err}</div>}
      </Card>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <Pill active={filter === "Alle"} onClick={() => setFilter("Alle")}>Alle</Pill>
        {TODO_CATEGORIES.map((c) => <Pill key={c} active={filter === c} onClick={() => setFilter(c)} color={TODO_CAT_COLOR[c]}>{c}</Pill>)}
      </div>

      {filter === "Shopping" ? (
        <>
          {suggestions.length > 0 && (
            <Card style={{ padding: 0, marginBottom: 12, overflow: "hidden" }}>
              <button onClick={() => setShowSugg((s) => !s)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: C.text, padding: "11px 13px", fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 13 }}>
                <ChevronDown size={15} style={{ transform: showSugg ? "rotate(0)" : "rotate(-90deg)", transition: "transform .15s", color: C.muted }} />
                Vorschläge
                <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{suggestions.length}</span>
              </button>
              {showSugg && (
                <div style={{ padding: "0 13px 13px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {suggestions.map((s) => (
                    <button key={s.key} onClick={() => addSuggestion(s.label, s.dept)} title={s.dept}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 11px", cursor: "pointer", color: C.text, fontSize: 12, fontFamily: "'Sora'" }}>
                      <Plus size={12} color={C.muted} /> {s.label}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
          {SHOP_DEPTS.map((d) => {
            const items = shopTodos.filter((t) => (t.dept || "Anderes") === d).slice().sort(todoSort);
            if (items.length === 0) return null;
            return (
              <div key={d} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, margin: "0 2px 7px", letterSpacing: ".04em", textTransform: "uppercase" }}>{d}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((t) => (
                    <TodoItem key={t.id} todo={t} showCategory={false} onDept={(dep) => setTodoDept(t, dep)} onToggle={() => patchTodoCfg(setConfig, t.id, { done: !t.done })} onDelete={() => removeTodoCfg(setConfig, t.id)} />
                  ))}
                </div>
              </div>
            );
          })}
          {shopTodos.length === 0 && (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 12.5, padding: 30 }}>Noch keine Einkäufe. Tippe oben z.B. „Milch" oder „Klopapier".</div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {shown.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={() => patchTodoCfg(setConfig, t.id, { done: !t.done })} onDelete={() => removeTodoCfg(setConfig, t.id)} />
            ))}
          </div>
          {shown.length === 0 && (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 12.5, padding: 30 }}>
              {todos.length === 0 ? "Noch keine Todos. Tippe oben etwas ein oder nutze das Mikro." : "Keine Todos in dieser Kategorie."}
            </div>
          )}
        </>
      )}
      {todos.length > 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 10.5, marginTop: 12, fontFamily: "'JetBrains Mono'" }}>{openCount} offen · {todos.length} gesamt</div>}
    </div>
  );
}

/* ============================== LABOR / BLUTWERTE ============================== */
const bloodNum = (v) => parseFloat(((v ?? "") + "").replace(",", ".").replace(/[^0-9.\-]/g, ""));
const STATUS_COLOR = { gut: C.accent, grenzwertig: C.warn, kritisch: C.bad };

function Blut({ config, setConfig, measurements }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [aBusy, setABusy] = useState(false);
  const [analysis, setAnalysis] = useState(config.bloodAnalysis || null);
  const [chartMarker, setChartMarker] = useState("");
  const fileRef = useRef(null);

  const asc = (config.bloodTests || []).slice().sort((a, b) => ((a.date || "") < (b.date || "") ? -1 : 1)); // älteste zuerst
  const desc = asc.slice().reverse(); // neueste zuerst (Anzeige)

  const upload = async (file) => {
    if (!file || busy) return;
    setBusy(true); setErr("");
    try {
      const b64 = await resizeImage(file);
      const r = await callAnalyze({ type: "blood-extract", image: b64, mediaType: "image/jpeg" });
      const markers = Array.isArray(r.markers) ? r.markers : [];
      if (markers.length === 0) throw new Error("Keine Werte erkannt — schärferes Foto versuchen.");
      const entry = { id: uid(), date: isValidDate(r.date) ? r.date : todayKey(), markers, createdAt: new Date().toISOString() };
      setConfig((prev) => ({ ...prev, bloodTests: [...(prev.bloodTests || []), entry] }));
    } catch (e) { setErr(e.message); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeTest = (id) => setConfig((prev) => ({ ...prev, bloodTests: (prev.bloodTests || []).filter((t) => t.id !== id) }));
  const setTestDate = (id, date) => setConfig((prev) => ({ ...prev, bloodTests: (prev.bloodTests || []).map((t) => (t.id === id ? { ...t, date } : t)) }));
  const removeMarker = (id, idx) => setConfig((prev) => ({ ...prev, bloodTests: (prev.bloodTests || []).map((t) => (t.id === id ? { ...t, markers: t.markers.filter((_, i) => i !== idx) } : t)) }));

  const runAnalysis = async () => {
    if (aBusy || asc.length === 0) return;
    setABusy(true); setErr("");
    try {
      const r = await callAnalyze({ type: "blood-analysis", blood: asc.map((t) => ({ date: t.date, markers: t.markers })), context: { messungen: (measurements || []).slice(-6) } });
      setAnalysis(r);
      setConfig((prev) => ({ ...prev, bloodAnalysis: r }));
    } catch (e) { setErr(e.message); }
    setABusy(false);
  };

  const prevValue = (name, testDate) => {
    const earlier = asc.filter((t) => (t.date || "") < testDate);
    for (let i = earlier.length - 1; i >= 0; i--) {
      const mk = (earlier[i].markers || []).find((m) => m.name === name);
      if (mk) { const n = bloodNum(mk.value); if (!isNaN(n)) return n; }
    }
    return null;
  };

  const markerNames = [...new Set(asc.flatMap((t) => (t.markers || []).map((m) => m.name)))];
  const chartData = chartMarker
    ? asc.map((t) => { const mk = (t.markers || []).find((m) => m.name === chartMarker); const n = mk ? bloodNum(mk.value) : NaN; return { d: prettyDate(t.date || todayKey()), Wert: isNaN(n) ? null : n }; }).filter((x) => x.Wert != null)
    : [];

  return (
    <div style={{ animation: "slideUp .3s ease" }}>
      <Card style={{ padding: 14, marginBottom: 12, borderColor: C.accentDim, background: "rgba(197,248,42,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <Droplet size={15} color={C.accent} />
          <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 16 }}>Blutwerte</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'", marginLeft: "auto" }}>Befund-Foto → KI liest aus</span>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={busy}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.accent, border: "none", borderRadius: 11, padding: "12px", cursor: "pointer", color: "#111", fontWeight: 800, fontSize: 14, fontFamily: "'Bricolage Grotesque'", opacity: busy ? .6 : 1 }}>
          {busy ? <Loader2 size={17} className="spin" /> : <Upload size={17} />} {busy ? "Lese Werte aus…" : "Befund-Foto hochladen"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => upload(e.target.files?.[0])} />
        {err && <div style={{ marginTop: 8, fontSize: 11.5, color: C.warn }}>{err}</div>}
        <div style={{ marginTop: 9, fontSize: 10, color: C.muted, lineHeight: 1.45 }}>Hinweis: Werte und Analyse dienen nur der persönlichen Übersicht und ersetzen keine ärztliche Beratung.</div>
      </Card>

      {asc.length > 0 && (
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} color={C.accent} />
            <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 15 }}>Werte-Analyse</span>
            <button onClick={runAnalysis} disabled={aBusy} style={{ marginLeft: "auto", background: C.accent, border: "none", borderRadius: 9, padding: "7px 13px", cursor: "pointer", color: "#111", fontWeight: 800, fontSize: 12, fontFamily: "'Bricolage Grotesque'", opacity: aBusy ? .5 : 1, display: "flex", alignItems: "center", gap: 5 }}>
              {aBusy ? <Loader2 size={14} className="spin" /> : "Analysieren"}
            </button>
          </div>
          {analysis && (
            <div style={{ marginTop: 11, animation: "slideUp .25s" }}>
              {analysis.summary && <div style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 11 }}>{analysis.summary}</div>}
              {Array.isArray(analysis.markers) && analysis.markers.map((m, i) => (
                <div key={i} style={{ borderTop: `1px solid ${C.line}`, padding: "8px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>{m.name}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: STATUS_COLOR[m.status] || C.muted, border: `1px solid ${STATUS_COLOR[m.status] || C.muted}`, borderRadius: 999, padding: "1px 7px", fontFamily: "'JetBrains Mono'" }}>{m.status}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10.5, color: C.muted, fontFamily: "'JetBrains Mono'" }}>Trend: {m.trend}</span>
                  </div>
                  {m.outlook && <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45, marginTop: 3 }}>{m.outlook}</div>}
                </div>
              ))}
              {analysis.advice && <div style={{ marginTop: 11, fontSize: 12, lineHeight: 1.5, background: "rgba(197,248,42,.06)", border: `1px solid ${C.accentDim}`, borderRadius: 10, padding: "10px 12px" }}><b style={{ color: C.accent }}>Hebel:</b> {analysis.advice}</div>}
            </div>
          )}
          {!analysis && <div style={{ marginTop: 9, fontSize: 11.5, color: C.muted }}>Beurteilt deine wichtigen Werte und prognostiziert die Entwicklung, wenn du so weitermachst.</div>}
        </Card>
      )}

      {markerNames.length > 0 && (
        <Card style={{ padding: "14px 8px 8px 14px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingRight: 6 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 13, color: C.muted }}>VERLAUF</span>
            <select value={chartMarker} onChange={(e) => setChartMarker(e.target.value)}
              style={{ marginLeft: "auto", background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: "'Sora'", padding: "5px 8px", outline: "none", maxWidth: 200 }}>
              <option value="">Wert wählen…</option>
              {markerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: C.muted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: C.muted }} />
                <Line type="monotone" dataKey="Wert" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 11.5, color: C.muted, padding: "6px 6px 12px" }}>{chartMarker ? "Mindestens 2 Messungen für einen Verlauf nötig." : "Wert auswählen, um den Verlauf zu sehen."}</div>
          )}
        </Card>
      )}

      {desc.map((t) => (
        <Card key={t.id} style={{ padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <CalendarClock size={13} color={C.muted} />
            <input type="date" value={t.date || ""} onChange={(e) => setTestDate(t.id, e.target.value)}
              style={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono'", padding: "4px 8px", outline: "none" }} />
            <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono'", marginLeft: 4 }}>{(t.markers || []).length} Werte</span>
            <button onClick={() => removeTest(t.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><Trash2 size={15} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(t.markers || []).map((m, idx) => {
              const cur = bloodNum(m.value);
              const prev = prevValue(m.name, t.date || todayKey());
              const arrow = prev != null && !isNaN(cur) ? (cur > prev ? "↑" : cur < prev ? "↓" : "→") : "";
              return (
                <div key={idx} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0", borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  {arrow && <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{arrow}</span>}
                  <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>{m.value}<span style={{ color: C.muted, fontWeight: 400 }}>{m.unit ? " " + m.unit : ""}</span></span>
                  {m.ref && <span style={{ fontSize: 9.5, color: C.muted, fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>({m.ref})</span>}
                  <button onClick={() => removeMarker(t.id, idx)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2 }}><X size={13} /></button>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {asc.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 12.5, padding: 30 }}>Noch keine Blutwerte. Lade oben ein Foto deines Laborbefunds hoch.</div>}
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
  const patchDay = useCallback((dk, patch) => setData((prev) => {
    const cur = prev.days[dk] || { meals: {}, exercises: {} };
    return { ...prev, days: { ...prev.days, [dk]: { ...cur, ...patch } } };
  }), []);

  if (session === undefined) return <Splash />;
  if (!session) return <Auth />;
  if (data === null) return <Splash />;

  const TABS = [
    { id: "heute", label: "Heute", icon: Flame },
    { id: "todos", label: "Todos", icon: ListTodo },
    { id: "training", label: "Training", icon: Dumbbell },
    { id: "essen", label: "Essen", icon: UtensilsCrossed },
    { id: "verlauf", label: "Verlauf", icon: TrendingUp },
    { id: "labor", label: "Labor", icon: Droplet },
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
          {tab === "heute" && <Heute day={day} setDay={setDay} config={data.config} setConfig={setConfig} />}
          {tab === "todos" && <Todos config={data.config} setConfig={setConfig} />}
          {tab === "training" && <Training day={day} setDay={setDay} config={data.config} setConfig={setConfig} />}
          {tab === "essen" && <Essen day={day} setDay={setDay} config={data.config} setConfig={setConfig} />}
          {tab === "verlauf" && <Verlauf measurements={data.measurements} addMeasurement={addMeasurement} days={data.days} patchDay={patchDay} />}
          {tab === "labor" && <Blut config={data.config} setConfig={setConfig} measurements={data.measurements} />}
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
