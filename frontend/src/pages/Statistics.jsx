import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const Icon = {
  chart: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  pie: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  line: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  donut: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>,
  hbar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="7" x2="14" y2="7"/><line x1="2" y1="12" x2="20" y2="12"/><line x1="2" y1="17" x2="11" y2="17"/><line x1="2" y1="2" x2="2" y2="22"/></svg>,
  area: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 20 L7 12 L11 15 L15 7 L19 10 L21 6" fill="none"/></svg>,
  filter: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  stats: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>,
  cancer: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>,
  gender: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="8" r="4"/><path d="M14 4h6m0 0v6m0-6-6 6"/><path d="M2 20c0-4 2.7-7 6-7"/></svg>,
  age: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  map: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>,
  stethoscope: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  kpi: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  chevron: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  back: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  check: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  download: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  print: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  reset: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  syringe: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  hospital: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  import: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  mapPin: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>,
};

// ── DATA ──────────────────────────────────────────────────────────────────────
const CANCERS = [
  { id: "sein", label: "Sein", color: "#e05c4b" },
  { id: "colorectal", label: "Colorectal", color: "#f0a070" },
  { id: "poumon", label: "Poumon", color: "#2563eb" },
  { id: "col_uterus", label: "Col de l'utérus", color: "#7c3aed" },
  { id: "prostate", label: "Prostate", color: "#0891b2" },
  { id: "estomac", label: "Estomac", color: "#059669" },
  { id: "thyroide", label: "Thyroïde", color: "#d97706" },
  { id: "leucemie", label: "Leucémie", color: "#db2777" },
];
const AGE_GROUPS = ["0–14", "15–29", "30–44", "45–59", "60+"];
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DAIRAS = [
  "Tlemcen","Nedroma","Ghazaouet","Maghnia","Bab El Assa",
  "Remchi","Sebdou","Bensekrane","Aïn Tallout","Ouled Mimoun",
  "Hennaya","Mansourah","Chetouane","Zenata","Sidi Djillali",
  "Fellaoucene","Aïn Fezza","Souahlia","Dar Yaghmoracen"
];

const WILAYAS = [
  { id: "Tlemcen", name: "Tlemcen", center: [34.8809, -1.3157], bounds: [[34.65, -1.75], [35.25, -0.90]] },
  { id: "Oran", name: "Oran", center: [35.6971, -0.6308], bounds: [[35.4, -1.2], [36.1, -0.15]] },
  { id: "Alger", name: "Alger", center: [36.7538, 3.0588], bounds: [[36.5, 2.4], [37.0, 3.7]] },
];

const DAIRA_COORDS = {
  "Tlemcen": [34.8809, -1.3157],
  "Nedroma": [35.0710, -1.3870],
  "Ghazaouet": [35.1630, -1.5590],
  "Maghnia": [35.1880, -1.4220],
  "Bab El Assa": [35.1120, -1.5600],
  "Remchi": [35.0650, -1.4600],
  "Sebdou": [35.1860, -1.9000],
  "Bensekrane": [35.1600, -1.6300],
  "Aïn Tallout": [35.0950, -1.3000],
  "Ouled Mimoun": [35.0150, -1.1450],
  "Hennaya": [35.2490, -1.4470],
  "Mansourah": [34.9690, -1.3420],
  "Chetouane": [35.0300, -1.1370],
  "Zenata": [35.1080, -1.2390],
  "Sidi Djillali": [35.1050, -1.6700],
  "Fellaoucene": [35.0570, -1.1040],
  "Aïn Fezza": [35.1150, -1.4550],
  "Souahlia": [35.0500, -1.6300],
  "Dar Yaghmoracen": [35.1120, -1.5400],
};

const ALGERIA_CENTER = [28.0, 2.5];

const STADES = ["Stade I","Stade II","Stade III","Stade IV"];
const MODES_DIAG = ["Dépistage","Symptômes","Urgence","Bilan de routine"];
const TRAITEMENTS = ["Chirurgie","Chimiothérapie","Radiothérapie","Thérapie ciblée","Immunothérapie"];
const PALETTE = ["#2563eb","#e05c4b","#059669","#d97706","#7c3aed","#0891b2","#db2777","#f0a070","#6366f1","#84cc16"];

function seededRand(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const rng = seededRand(42);
const RAW_DATA = [];
CANCERS.forEach(c => AGE_GROUPS.forEach(ag => ["M","F"].forEach(sex => YEARS.forEach(year => MONTHS.forEach((month) => DAIRAS.forEach(daira => STADES.forEach(stade => {
  let base = 0.5 + rng() * 3;
  if (c.id === "sein" && sex === "F") base = 3 + rng() * 6;
  if (c.id === "sein" && sex === "M") base = rng() * 0.3;
  if (c.id === "prostate" && sex === "M") base = 2 + rng() * 5;
  if (c.id === "prostate" && sex === "F") base = 0;
  if (c.id === "col_uterus" && sex === "F") base = 1.5 + rng() * 4;
  if (c.id === "col_uterus" && sex === "M") base = 0;
  if (ag === "0–14") base *= 0.08;
  if (ag === "60+") base *= 1.6;
  const cases = Math.max(0, Math.round(base * (1 + (year - 2018) * 0.04) * (stade === "Stade I" ? 1.2 : stade === "Stade II" ? 1 : stade === "Stade III" ? 0.7 : 0.4)));
  if (cases > 0) RAW_DATA.push({ cancer: c.id, age: ag, sex, year, month, daira, stade, mode: MODES_DIAG[Math.floor(rng() * 4)], traitement: TRAITEMENTS[Math.floor(rng() * 5)], cases });
})))))));

function aggBy(data, key, labelMap = null) {
  const map = {};
  data.forEach(d => { map[d[key]] = (map[d[key]] || 0) + d.cases; });
  return Object.entries(map).map(([k, v]) => ({ id: k, label: labelMap ? (labelMap[k] || k) : k, value: v })).sort((a, b) => b.value - a.value);
}

// ── TLEMCEN DAÏRA SVG SHAPES ──────────────────────────────────────────────────
// 19 daïras positioned on a 520×300 canvas (geographically inspired layout)
const DAIRA_SHAPES = [
  { id: "Bab El Assa",      path: "M 18,18 L 88,18 L 90,72 L 55,88 L 18,76 Z",                        lx: 54,  ly: 50  },
  { id: "Ghazaouet",        path: "M 88,18 L 162,18 L 164,68 L 125,86 L 90,72 Z",                     lx: 127, ly: 46  },
  { id: "Nedroma",          path: "M 162,18 L 240,18 L 244,63 L 205,82 L 164,68 Z",                   lx: 203, ly: 46  },
  { id: "Zenata",           path: "M 240,18 L 302,20 L 302,62 L 260,76 L 244,63 Z",                   lx: 273, ly: 45  },
  { id: "Aïn Tallout",      path: "M 302,20 L 365,22 L 366,66 L 324,80 L 302,62 Z",                   lx: 334, ly: 48  },
  { id: "Bensekrane",       path: "M 365,22 L 450,24 L 452,70 L 400,78 L 366,66 Z",                   lx: 408, ly: 48  },
  { id: "Souahlia",         path: "M 18,76 L 55,88 L 58,138 L 25,150 L 18,118 Z",                     lx: 38,  ly: 112 },
  { id: "Remchi",           path: "M 55,88 L 125,86 L 135,142 L 90,158 L 58,138 Z",                   lx: 97,  ly: 118 },
  { id: "Mansourah",        path: "M 205,82 L 260,76 L 265,128 L 225,145 L 190,128 Z",               lx: 228, ly: 110 },
  { id: "Chetouane",        path: "M 260,76 L 302,62 L 316,106 L 278,128 L 265,128 Z",               lx: 290, ly: 100 },
  { id: "Hennaya",          path: "M 278,128 L 324,80 L 366,66 L 364,98 L 362,145 L 316,155 Z",      lx: 336, ly: 118 },
  { id: "Aïn Fezza",        path: "M 364,98 L 400,78 L 452,70 L 452,128 L 404,130 L 362,145 Z",      lx: 407, ly: 105 },
  { id: "Tlemcen",          path: "M 125,86 L 205,82 L 225,145 L 190,172 L 135,168 L 135,142 Z",     lx: 178, ly: 128 },
  { id: "Sidi Djillali",    path: "M 18,118 L 25,150 L 58,138 L 55,198 L 18,208 Z",                  lx: 38,  ly: 168 },
  { id: "Sebdou",           path: "M 58,138 L 90,158 L 105,218 L 65,238 L 55,198 Z",                 lx: 80,  ly: 190 },
  { id: "Maghnia",          path: "M 90,158 L 135,168 L 138,238 L 105,268 L 65,238 L 105,218 Z",     lx: 110, ly: 212 },
  { id: "Dar Yaghmoracen",  path: "M 135,168 L 190,172 L 195,242 L 152,258 L 138,238 Z",             lx: 165, ly: 210 },
  { id: "Ouled Mimoun",     path: "M 316,155 L 362,145 L 404,130 L 406,178 L 365,195 L 322,208 Z",   lx: 364, ly: 175 },
  { id: "Fellaoucene",      path: "M 404,130 L 452,128 L 454,180 L 406,178 Z",                       lx: 429, ly: 153 },
];

// ── COLOR SCALE (light rose → deep crimson) ───────────────────────────────────
function getMapColor(value, min, max) {
  if (max === min || value === 0) return "#f1f5f9";
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const stops = [[254,205,211],[253,164,175],[251,113,133],[244,63,94],[225,29,72],[159,18,57]];
  const seg = t * (stops.length - 1);
  const i = Math.min(Math.floor(seg), stops.length - 2);
  const f = seg - i;
  const [r1,g1,b1] = stops[i], [r2,g2,b2] = stops[i+1];
  return `rgb(${Math.round(r1+(r2-r1)*f)},${Math.round(g1+(g2-g1)*f)},${Math.round(b1+(b2-b1)*f)})`;
}

// ── MAP LEGEND ────────────────────────────────────────────────────────────────
function MapLegend({ min, max }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Cas enregistrés</div>
      {Array.from({length:6},(_,i)=>{
        const t = i / 5;
        const val = Math.round(min + t * (max - min));
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:getMapColor(val,min,max), border:"1px solid rgba(0,0,0,0.08)", flexShrink:0 }}/>
            <span style={{ fontSize:10, color:"#475569", fontWeight:500 }}>{val.toLocaleString("fr-FR")}</span>
          </div>
        );
      }).reverse()}
    </div>
  );
}

// ── TLEMCEN INTERACTIVE MAP ───────────────────────────────────────────────────
function TlemcenMap({ filters }) {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x:0, y:0 });

  const dairaStats = useMemo(() => {
    const filtered = RAW_DATA.filter(d =>
      (!filters.sex  || d.sex  === filters.sex)  &&
      (!filters.age  || d.age  === filters.age)  &&
      (!filters.year || String(d.year) === String(filters.year)) &&
      (!filters.daira || d.daira === filters.daira) &&
      (filters.cancer.length === 0 || filters.cancer.includes(d.cancer)) &&
      (filters.stade.length  === 0 || filters.stade.includes(d.stade))
    );
    const map = {};
    filtered.forEach(d => { map[d.daira] = (map[d.daira]||0) + d.cases; });
    return map;
  }, [filters]);

  const vals = Object.values(dairaStats).filter(v => v > 0);
  const totalCases = vals.reduce((a,v) => a+v, 0);
  const minVal = vals.length ? Math.min(...vals) : 0;
  const maxVal = vals.length ? Math.max(...vals) : 1;

  const ranked = [...DAIRA_SHAPES]
    .map(d => ({ id:d.id, cases:dairaStats[d.id]||0 }))
    .sort((a,b) => b.cases - a.cases);

  const hovData = hovered ? { cases: dairaStats[hovered]||0, pct: totalCases > 0 ? ((dairaStats[hovered]||0)/totalCases*100).toFixed(1) : "0.0" } : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {/* Map Stats Bar */}
      <div style={{ display:"flex", alignItems:"center", gap:20, padding:"12px 20px", background:"linear-gradient(to right,#fff1f2,white)", borderBottom:"1px solid #ffe4e6" }}>
        {[
          { label:"Total cas", value: totalCases.toLocaleString("fr-FR"), color:"#e11d48" },
          { label:"Daïra dominante", value: ranked[0]?.id||"—", color:"#0f172a" },
          { label:"Daïras actives", value: vals.length, color:"#0891b2" },
          { label:"Moy. / daïra", value: Math.round(totalCases/Math.max(DAIRA_SHAPES.length,1)).toLocaleString("fr-FR"), color:"#d97706" },
        ].map((k,i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:k.color, letterSpacing:"-0.02em" }}>{k.value}</div>
            <div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{k.label}</div>
          </div>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ color:"#e11d48" }}>{Icon.mapPin}</span>
          Survolez une daïra pour les détails
        </div>
      </div>

      {/* Map + Sidebar */}
      <div style={{ display:"flex" }}>
        {/* SVG Map */}
        <div
          style={{ flex:1, position:"relative", padding:"16px", background:"#fafbfc" }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          <svg viewBox="0 0 480 290" width="100%" style={{ display:"block", maxHeight:360 }}>
            <defs>
              <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#e11d48" floodOpacity="0.3"/>
              </filter>
            </defs>

            {/* Background */}
            <rect x="0" y="0" width="480" height="290" rx="10" fill="#f0f4f8"/>

            {/* Subtle dots grid */}
            {Array.from({length:10},(_,row) => Array.from({length:16},(_,col) => (
              <circle key={`${row}-${col}`} cx={col*32+16} cy={row*32+10} r="1" fill="#dde3ea" opacity="0.6"/>
            )))}

            {/* Wilaya outer glow */}
            <rect x="8" y="8" width="464" height="274" rx="8" fill="none" stroke="#fecdd3" strokeWidth="2" strokeDasharray="6,4" opacity="0.5"/>

            {/* Daïra shapes */}
            {DAIRA_SHAPES.map((daira) => {
              const cases = dairaStats[daira.id] || 0;
              const isHov = hovered === daira.id;
              const fillColor = cases > 0 ? getMapColor(cases, minVal, maxVal) : "#e8edf2";
              const textDark = cases > maxVal * 0.55;
              return (
                <g key={daira.id}
                  onMouseEnter={() => setHovered(daira.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor:"pointer" }}
                >
                  <path
                    d={daira.path}
                    fill={fillColor}
                    stroke={isHov ? "#0f172a" : "white"}
                    strokeWidth={isHov ? 2.2 : 1.2}
                    style={{
                      filter: isHov ? "url(#mapShadow)" : "none",
                      transition: "all 0.18s",
                    }}
                  />
                  <text x={daira.lx} y={daira.ly-3} textAnchor="middle"
                    fontSize={isHov ? 7.5 : 6.5} fontWeight={isHov ? "800":"600"}
                    fill={textDark ? "rgba(255,255,255,0.95)" : "#334155"}
                    style={{ pointerEvents:"none", transition:"font-size 0.15s" }}>
                    {daira.id.length > 11 ? daira.id.slice(0,10)+"…" : daira.id}
                  </text>
                  {cases > 0 && (
                    <text x={daira.lx} y={daira.ly+8} textAnchor="middle"
                      fontSize={5.8} fontWeight="700"
                      fill={textDark ? "rgba(255,255,255,0.8)" : "#64748b"}
                      style={{ pointerEvents:"none" }}>
                      {cases >= 1000 ? (cases/1000).toFixed(1)+"k" : cases}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Compass */}
            <g transform="translate(455,268)">
              <circle cx="0" cy="0" r="12" fill="white" stroke="#e2e8f0" strokeWidth="1" opacity="0.9"/>
              <text x="0" y="-4" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#64748b">N</text>
              <polygon points="0,-2 1.5,2 0,1 -1.5,2" fill="#e11d48" opacity="0.8"/>
            </g>

            {/* Scale */}
            <g transform="translate(16,278)">
              <line x1="0" y1="0" x2="44" y2="0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="44" y1="-3" x2="44" y2="3" stroke="#94a3b8" strokeWidth="1.5"/>
              <text x="22" y="-5" textAnchor="middle" fontSize="6.5" fill="#94a3b8" fontWeight="600">≈50 km</text>
            </g>

            {/* Wilaya label */}
            <text x="240" y="286" textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8" letterSpacing="0.12em">WILAYA DE TLEMCEN</text>
          </svg>

          {/* Floating Tooltip */}
          {hovered && hovData && (
            <div style={{
              position:"absolute", left: mousePos.x + 14, top: mousePos.y - 14,
              background:"#0f172a", color:"white", borderRadius:10,
              padding:"10px 14px", fontSize:12, pointerEvents:"none", zIndex:100,
              boxShadow:"0 8px 28px rgba(0,0,0,0.35)", minWidth:164,
              border:"1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontWeight:800, fontSize:13, marginBottom:6, color:"#f1f5f9", display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ color:"#fb7185" }}>📍</span> {hovered}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:18 }}>
                  <span style={{ color:"#94a3b8" }}>Total cas</span>
                  <span style={{ fontWeight:800, color:"#fda4af" }}>{hovData.cases.toLocaleString("fr-FR")}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:18 }}>
                  <span style={{ color:"#94a3b8" }}>Part wilaya</span>
                  <span style={{ fontWeight:700, color:"#fb7185" }}>{hovData.pct}%</span>
                </div>
                <div style={{ marginTop:4, background:"rgba(251,113,133,0.15)", borderRadius:4, height:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:4, background:"#fb7185", width:`${hovData.pct}%`, maxWidth:"100%" }}/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ width:192, borderLeft:"1.5px solid #ffe4e6", padding:"16px 14px", background:"#fffbfb", display:"flex", flexDirection:"column", gap:16 }}>
          <MapLegend min={minVal} max={maxVal}/>

          <div style={{ borderTop:"1px solid #fee2e6" }}/>

          {/* Top 5 */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              Classement
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {ranked.slice(0,5).map((d,i) => {
                const barW = ranked[0].cases > 0 ? (d.cases / ranked[0].cases) * 100 : 0;
                const medals = ["🥇","🥈","🥉"];
                return (
                  <div key={d.id}
                    onMouseEnter={() => setHovered(d.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor:"pointer" }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:10.5, fontWeight:hovered===d.id?800:600, color:hovered===d.id?"#e11d48":"#1e293b", transition:"color 0.15s", display:"flex", alignItems:"center", gap:3 }}>
                        <span style={{ fontSize:9 }}>{medals[i]||`${i+1}.`}</span>
                        {d.id.length > 13 ? d.id.slice(0,12)+"…" : d.id}
                      </span>
                      <span style={{ fontSize:10, fontWeight:700, color:"#e11d48", flexShrink:0 }}>
                        {d.cases.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div style={{ background:"#fee2e6", borderRadius:3, height:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:3, background:getMapColor(d.cases,minVal,maxVal), width:`${barW}%`, transition:"width 0.5s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop:"1px solid #fee2e6" }}/>

          {/* Bottom 3 */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              Moins touchées
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {ranked.slice(-3).reverse().map((d,i) => (
                <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:"#64748b" }}>{d.id.length>13?d.id.slice(0,12)+"…":d.id}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:"#94a3b8" }}>{d.cases.toLocaleString("fr-FR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LEAFLET INTERACTIVE MAP (Algérie → Wilaya → Daïra) ─────────────────────────
function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.flyToBounds(bounds, { maxZoom: 10, duration: 0.75 });
  }, [bounds, map]);
  return null;
}

function HeatLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 30,
      blur: 22,
      maxZoom: 10,
      gradient: { 0.2: "blue", 0.5: "cyan", 0.7: "lime", 0.9: "orange", 1: "red" },
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [points, map]);
  return null;
}

function TlemcenMapLeaflet({ filters }) {
  const [level, setLevel] = useState("wilaya");
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [selectedDaira, setSelectedDaira] = useState(null);
  const [bounds, setBounds] = useState(null);

  const filtered = useMemo(() => RAW_DATA.filter(d =>
    (!filters.sex  || d.sex  === filters.sex) &&
    (!filters.age  || d.age  === filters.age) &&
    (!filters.year || String(d.year) === String(filters.year)) &&
    (!filters.daira || d.daira === filters.daira) &&
    (filters.cancer.length === 0 || filters.cancer.includes(d.cancer)) &&
    (filters.stade.length  === 0 || filters.stade.includes(d.stade))
  ), [filters]);

  const wilayaStats = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      const w = "Tlemcen";
      map[w] = (map[w] || 0) + d.cases;
    });
    return map;
  }, [filtered]);

  const dairaStats = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      map[d.daira] = (map[d.daira] || 0) + d.cases;
    });
    return map;
  }, [filtered]);

  const totalCases = Object.values(wilayaStats).reduce((a,v) => a + v, 0);
  const wilayaVals = Object.values(wilayaStats).filter(v => v > 0);
  const wilayaMin = wilayaVals.length ? Math.min(...wilayaVals) : 0;
  const wilayaMax = wilayaVals.length ? Math.max(...wilayaVals) : 1;
  const dairaVals = Object.values(dairaStats).filter(v => v > 0);
  const dairaMin = dairaVals.length ? Math.min(...dairaVals) : 0;
  const dairaMax = dairaVals.length ? Math.max(...dairaVals) : 1;

  const heatPoints = useMemo(() => {
    return Object.entries(dairaStats).reduce((acc, [daira, cases]) => {
      const coord = DAIRA_COORDS[daira];
      if (!coord) return acc;
      acc.push([coord[0], coord[1], Math.max(1, cases)]);
      return acc;
    }, []);
  }, [dairaStats]);

  const wilayaList = WILAYAS.map(w => ({ ...w, cases: wilayaStats[w.id] || 0 }));
  const selWilaya = useMemo(() => WILAYAS.find(w => w.id === selectedWilaya), [selectedWilaya]);

  useEffect(() => {
    if (!selWilaya) {
      setBounds(null);
      setLevel("wilaya");
      return;
    }
    if (selWilaya.bounds) {
      setBounds(selWilaya.bounds);
    } else if (selWilaya.center) {
      const [lat, lng] = selWilaya.center;
      setBounds([[lat - 0.2, lng - 0.2], [lat + 0.2, lng + 0.2]]);
    }
  }, [selWilaya]);

  const onWilayaClick = useCallback((wilaya) => {
    setSelectedWilaya(wilaya.id);
    setSelectedDaira(null);
    setLevel("daira");
  }, []);

  const onDairaClick = useCallback((daira) => {
    setSelectedDaira(daira.id);
    const coord = DAIRA_COORDS[daira.id];
    if (coord) {
      const [lat, lng] = coord;
      setBounds([[lat - 0.05, lng - 0.05], [lat + 0.05, lng + 0.05]]);
    }
  }, []);

  const dairaDetails = useMemo(() => {
    if (!selectedDaira) return null;
    const cases = dairaStats[selectedDaira] || 0;
    const breakdown = aggBy(
      filtered.filter(d => d.daira === selectedDaira),
      "cancer",
      Object.fromEntries(CANCERS.map(c => [c.id, c.label]))
    );
    const patients = filtered.filter(d => d.daira === selectedDaira).slice(0, 12);
    return { daira: selectedDaira, cases, breakdown, patients };
  }, [selectedDaira, dairaStats, filtered]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", gap:22, padding:"12px 20px", background:"linear-gradient(to right,#fff1f2,white)", borderBottom:"1px solid #ffe4e6" }}>
        {[
          { label:"Total cas", value: totalCases.toLocaleString("fr-FR"), color:"#e11d48" },
          { label:"Niveau", value: level === "wilaya" ? "Algérie" : "Daïras", color: "#0f172a" },
          { label:"Wilaya sélectionnée", value: selWilaya?.name || "—", color: "#0891b2" },
          { label:"Daïra sélectionnée", value: selectedDaira || "—", color: "#d97706" },
        ].map((k,i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:k.color, letterSpacing:"-0.02em" }}>{k.value}</div>
            <div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{k.label}</div>
          </div>
        ))}
        {level === "daira" && (
          <button
            onClick={() => { setSelectedDaira(null); setBounds(selWilaya?.bounds || null); }}
            style={{
              padding: "6px 12px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            {Icon.back} Retour
          </button>
        )}
        <div style={{ flex:1 }} />
        <div style={{ fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ color:"#e11d48" }}>{Icon.mapPin}</span>
          {level === "wilaya"
            ? "Cliquez sur un cercle pour zoomer vers la wilaya"
            : "Cliquez sur un point pour voir les détails de la daïra"}
        </div>
      </div>

      <div style={{ display:"flex", flex:1, minHeight:320 }}>
        <div style={{ flex:1, position:"relative" }}>
          <MapContainer center={ALGERIA_CENTER} zoom={5} style={{ height:"100%", width:"100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBounds bounds={bounds} />
            {level === "wilaya" && <HeatLayer points={heatPoints} />}

            {level === "wilaya" && wilayaList.map(w => (
              <CircleMarker
                key={w.id}
                center={w.center}
                radius={Math.max(6, (w.cases / Math.max(wilayaMax, 1)) * 30)}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: getMapColor(w.cases, wilayaMin, wilayaMax),
                  fillOpacity: 0.65,
                }}
                eventHandlers={{ click: () => onWilayaClick(w) }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <div style={{ fontSize:12 }}>
                    <strong>{w.name}</strong><br />
                    Cas : {w.cases.toLocaleString("fr-FR")}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

            {level === "daira" && selectedWilaya && Object.entries(dairaStats).map(([daira, cases]) => {
              const coord = DAIRA_COORDS[daira];
              if (!coord) return null;
              const radius = Math.max(8, (cases / Math.max(dairaMax, 1)) * 30);
              return (
                <CircleMarker
                  key={daira}
                  center={coord}
                  radius={radius}
                  pathOptions={{
                    color: "#0f172a",
                    fillColor: getMapColor(cases, dairaMin, dairaMax),
                    fillOpacity: 0.75,
                  }}
                  eventHandlers={{ click: () => onDairaClick({ id: daira }) }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <div style={{ fontSize:12 }}>
                      <strong>{daira}</strong><br />
                      Cas : {cases.toLocaleString("fr-FR")}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth:220 }}>
                      <h3 style={{ margin:"0 0 6px" }}>{daira}</h3>
                      <p style={{ margin:"0 0 8px" }}><strong>Cas :</strong> {cases.toLocaleString("fr-FR")}</p>
                      <div style={{ fontSize:12, marginBottom:8 }}><strong>Top types</strong></div>
                      {aggBy(filtered.filter(d => d.daira === daira), "cancer", Object.fromEntries(CANCERS.map(c => [c.id, c.label]))).slice(0, 4).map(c => (
                        <div key={c.id} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                          <span>{c.label}</span>
                          <span style={{ fontWeight:700 }}>{c.value.toLocaleString("fr-FR")}</span>
                        </div>
                      ))}
                      <div style={{ fontSize:10, color:"#64748b", marginTop:8 }}>Détails des patients disponibles via l'API.</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div style={{ width:220, borderLeft:"1.5px solid #ffe4e6", padding:"16px 14px", background:"#fffbfb", display:"flex", flexDirection:"column", gap:16 }}>
          <MapLegend min={level === "wilaya" ? wilayaMin : dairaMin} max={level === "wilaya" ? wilayaMax : dairaMax} />
          <div style={{ borderTop:"1px solid #fee2e6" }} />
          {dairaDetails && (
            <div style={{ fontSize:12, color:"#334155" }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Détails - {dairaDetails.daira}</div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>
                Cas totaux : <strong>{dairaDetails.cases.toLocaleString("fr-FR")}</strong>
              </div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Top cancers</div>
              {dairaDetails.breakdown.slice(0, 4).map(t => (
                <div key={t.id} style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                  <span>{t.label}</span>
                  <span style={{ fontWeight:700 }}>{t.value.toLocaleString("fr-FR")}</span>
                </div>
              ))}
              <div style={{ marginTop:10, fontSize:11, color:"#64748b" }}>Patients (extrait)</div>
              <div style={{ maxHeight:120, overflowY:"auto", fontSize:10, marginTop:6 }}>
                {dairaDetails.patients.map((p,i) => (
                  <div key={`${p.cancer}-${i}`} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span>{p.cancer}</span>
                    <span>{p.cases}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CHART COMPONENTS ──────────────────────────────────────────────────────────
function PieChart({ data, donut=false, size=240 }) {
  const [hov, setHov] = useState(null);
  const total = data.reduce((a,d)=>a+d.value,0);
  if (!total) return null;
  let startAngle = -Math.PI/2;
  const cx=size/2, cy=size/2, R=size*0.39, inner=donut?R*0.54:0;
  const slices = data.map((d,idx)=>{
    const angle=(d.value/total)*2*Math.PI; const ea=startAngle+angle;
    const col=d.color||PALETTE[idx%PALETTE.length];
    const path=donut
      ?`M${cx+R*Math.cos(startAngle)},${cy+R*Math.sin(startAngle)} A${R},${R},0,${angle>Math.PI?1:0},1,${cx+R*Math.cos(ea)},${cy+R*Math.sin(ea)} L${cx+inner*Math.cos(ea)},${cy+inner*Math.sin(ea)} A${inner},${inner},0,${angle>Math.PI?1:0},0,${cx+inner*Math.cos(startAngle)},${cy+inner*Math.sin(startAngle)} Z`
      :`M${cx},${cy} L${cx+R*Math.cos(startAngle)},${cy+R*Math.sin(startAngle)} A${R},${R},0,${angle>Math.PI?1:0},1,${cx+R*Math.cos(ea)},${cy+R*Math.sin(ea)} Z`;
    const mid=startAngle+angle/2;
    const slice={path,color:col,label:d.label,pct:((d.value/total)*100).toFixed(1),lx:cx+R*0.68*Math.cos(mid),ly:cy+R*0.68*Math.sin(mid),value:d.value};
    startAngle=ea; return slice;
  });
  return (
    <svg width={size} height={size} style={{overflow:"visible"}}>
      {slices.map((s,i)=>(
        <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={hov===i?2.5:1.5}
          style={{transform:hov===i?"scale(1.04)":"scale(1)",transformOrigin:`${cx}px ${cy}px`,transition:"transform 0.18s",cursor:"pointer"}}
          onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
          <title>{s.label}: {s.value.toLocaleString("fr-FR")} ({s.pct}%)</title>
        </path>
      ))}
      {slices.map((s,i)=>parseFloat(s.pct)>5&&(
        <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight="700" fill="white" style={{pointerEvents:"none"}}>{s.pct}%</text>
      ))}
      {donut&&<><text x={cx} y={cy-8} textAnchor="middle" fontSize={18} fontWeight="700" fill="#0f172a">{total.toLocaleString("fr-FR")}</text><text x={cx} y={cy+12} textAnchor="middle" fontSize={9.5} fill="#94a3b8">total</text></>}
    </svg>
  );
}

function BarChart({ data, horizontal=false, size={w:510,h:275} }) {
  const [hov,setHov]=useState(null);
  const {w,h}=size;
  const pad={top:18,right:16,bottom:horizontal?28:65,left:horizontal?128:40};
  const iw=w-pad.left-pad.right, ih=h-pad.top-pad.bottom;
  const maxVal=Math.max(...data.map(d=>d.value),1);
  const ticks=5,step=Math.ceil(maxVal/ticks/10)*10||1;
  return (
    <svg width={w} height={h}>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {Array.from({length:ticks+1},(_,i)=>{ const val=i*step; if(val>maxVal*1.15)return null;
          if(horizontal){const x=(val/maxVal)*iw;return<g key={i}><line x1={x} y1={0} x2={x} y2={ih} stroke="#e2e8f0" strokeWidth={1}/><text x={x} y={ih+14} textAnchor="middle" fontSize={8.5} fill="#94a3b8">{val>=1000?(val/1000).toFixed(0)+"k":val}</text></g>;}
          const y=ih-(val/maxVal)*ih;return<g key={i}><line x1={0} y1={y} x2={iw} y2={y} stroke="#e2e8f0" strokeWidth={1}/><text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8.5} fill="#94a3b8">{val>=1000?(val/1000).toFixed(0)+"k":val}</text></g>;
        })}
        {data.map((d,i)=>{ const col=d.color||PALETTE[i%PALETTE.length]; const isHov=hov===i;
          if(horizontal){const bh=Math.max(8,ih/data.length*0.56);const y=(i/data.length)*ih+(ih/data.length*0.22);const bw=Math.max(0,(d.value/maxVal)*iw);
            return<g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
              <rect x={0} y={y} width={bw} height={bh} rx={3} fill={col} opacity={isHov?1:0.85} style={{filter:isHov?`drop-shadow(0 2px 6px ${col}55)`:"none",transition:"all 0.18s"}}><title>{d.label}: {d.value.toLocaleString("fr-FR")}</title></rect>
              <text x={-6} y={y+bh/2} textAnchor="end" dominantBaseline="middle" fontSize={10.5} fill="#334155" fontWeight="500">{d.label.length>15?d.label.slice(0,13)+"…":d.label}</text>
              {bw>32&&<text x={bw-7} y={y+bh/2} textAnchor="end" dominantBaseline="middle" fontSize={8.5} fill="white" fontWeight="700">{d.value.toLocaleString("fr-FR")}</text>}
            </g>;}
          const bw=Math.max(4,iw/data.length*0.62);const x=(i/data.length)*iw+(iw/data.length*0.19);const bh=Math.max(0,(d.value/maxVal)*ih);
          return<g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
            <rect x={x} y={ih-bh} width={bw} height={bh} rx={3} fill={col} opacity={isHov?1:0.85} style={{filter:isHov?`drop-shadow(0 -2px 8px ${col}55)`:"none",transition:"all 0.18s"}}><title>{d.label}: {d.value.toLocaleString("fr-FR")}</title></rect>
            <text x={x+bw/2} y={ih+14} textAnchor="middle" fontSize={8.5} fill="#64748b" transform={data.length>6?`rotate(-38,${x+bw/2},${ih+14})`:""}>{d.label.length>7?d.label.slice(0,6)+"…":d.label}</text>
            {bh>16&&<text x={x+bw/2} y={ih-bh+11} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">{d.value>=1000?(d.value/1000).toFixed(1)+"k":d.value}</text>}
          </g>;
        })}
        {!horizontal&&<line x1={0} y1={ih} x2={iw} y2={ih} stroke="#cbd5e1" strokeWidth={1.5}/>}
        {horizontal&&<line x1={0} y1={0} x2={0} y2={ih} stroke="#cbd5e1" strokeWidth={1.5}/>}
      </g>
    </svg>
  );
}

function LineChart({ data, area=false, size={w:510,h:275} }) {
  const [hov,setHov]=useState(null);
  const {w,h}=size;
  const pad={top:22,right:20,bottom:52,left:44};
  const iw=w-pad.left-pad.right,ih=h-pad.top-pad.bottom;
  const maxVal=Math.max(...data.map(d=>d.value),1);
  const ts=Math.ceil(maxVal/5/10)*10||1;
  const pts=data.map((d,i)=>({x:data.length>1?(i/(data.length-1))*iw:iw/2,y:ih-(d.value/maxVal)*ih,...d}));
  const pathD=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD=pts.length?`M${pts[0].x},${ih} ${pts.map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} L${pts[pts.length-1].x},${ih} Z`:"";
  const lc=data[0]?.color||"#2563eb";
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id="aG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lc} stopOpacity="0.18"/><stop offset="100%" stopColor={lc} stopOpacity="0.01"/></linearGradient></defs>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {Array.from({length:6},(_,i)=>{const val=i*ts;const y=ih-(val/maxVal)*ih;return<g key={i}><line x1={0} y1={y} x2={iw} y2={y} stroke="#e2e8f0" strokeWidth={1}/><text x={-7} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8.5} fill="#94a3b8">{val>=1000?(val/1000).toFixed(0)+"k":val}</text></g>;})}
        {area&&<path d={areaD} fill="url(#aG2)"/>}
        <path d={pathD} fill="none" stroke={lc} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" style={{filter:`drop-shadow(0 2px 4px ${lc}33)`}}/>
        {pts.map((p,i)=>(
          <g key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{cursor:"pointer"}}>
            <circle cx={p.x} cy={p.y} r={hov===i?6:4} fill="white" stroke={lc} strokeWidth={2} style={{transition:"r 0.15s"}}/>
            {hov===i&&<><rect x={p.x-38} y={p.y-30} width={76} height={20} rx={5} fill="#0f172a" opacity={0.88}/><text x={p.x} y={p.y-17} textAnchor="middle" fontSize={9} fill="white" fontWeight="600">{p.label}: {p.value.toLocaleString("fr-FR")}</text></>}
            <text x={p.x} y={ih+15} textAnchor="middle" fontSize={8.5} fill="#64748b" transform={data.length>6?`rotate(-38,${p.x},${ih+15})`:""}>{String(p.label).length>8?String(p.label).slice(0,7)+"…":p.label}</text>
          </g>
        ))}
        <line x1={0} y1={ih} x2={iw} y2={ih} stroke="#cbd5e1" strokeWidth={1.5}/>
      </g>
    </svg>
  );
}

function Legend({ data, total }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:136,maxWidth:188,maxHeight:250,overflowY:"auto"}}>
      {data.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:7,height:7,borderRadius:2,background:d.color||PALETTE[i%PALETTE.length],flexShrink:0}}/>
          <span style={{fontSize:11,color:"#334155",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
          {total>0&&<span style={{fontSize:10,color:"#64748b",fontWeight:600,flexShrink:0}}>{((d.value/total)*100).toFixed(0)}%</span>}
        </div>
      ))}
    </div>
  );
}

function KPIBoard({ filters }) {
  const fd=RAW_DATA.filter(d=>(!filters.sex||d.sex===filters.sex)&&(!filters.age||d.age===filters.age)&&(!filters.year||String(d.year)===String(filters.year))&&(!filters.daira||d.daira===filters.daira));
  const total=fd.reduce((a,d)=>a+d.cases,0);
  const male=fd.filter(d=>d.sex==="M").reduce((a,d)=>a+d.cases,0);
  const fem=fd.filter(d=>d.sex==="F").reduce((a,d)=>a+d.cases,0);
  const y24=fd.filter(d=>d.year===2024).reduce((a,d)=>a+d.cases,0);
  const y23=fd.filter(d=>d.year===2023).reduce((a,d)=>a+d.cases,0);
  const growth=y23>0?(((y24-y23)/y23)*100).toFixed(1):"—";
  const dom=aggBy(fd,"cancer",Object.fromEntries(CANCERS.map(c=>[c.id,c.label])))[0]?.label||"—";
  const survMap={"Stade I":95,"Stade II":78,"Stade III":55,"Stade IV":25};
  const avgSurv=Math.round(fd.reduce((a,d)=>a+(survMap[d.stade]||0)*d.cases,0)/Math.max(total,1));
  const kpis=[
    {label:"Total cas enregistrés",value:total.toLocaleString("fr-FR"),sub:"tous types confondus",icon:Icon.cancer,color:"#2563eb",bg:"#eff6ff"},
    {label:"Nouveaux cas (2024)",value:y24.toLocaleString("fr-FR"),sub:`${growth!=="—"?(parseFloat(growth)>0?"+":"")+growth+"%":""} vs 2023`,icon:Icon.calendar,color:"#059669",bg:"#f0fdf4"},
    {label:"Ratio H/F",value:fem>0?(male/fem).toFixed(2):"—",sub:`H: ${male.toLocaleString("fr-FR")} · F: ${fem.toLocaleString("fr-FR")}`,icon:Icon.gender,color:"#7c3aed",bg:"#f5f3ff"},
    {label:"Survie moyenne (1 an)",value:avgSurv+"%",sub:"pondéré par stade",icon:Icon.kpi,color:"#059669",bg:"#f0fdf4"},
    {label:"Cancer dominant",value:dom,sub:"type le plus fréquent",icon:Icon.stethoscope,color:"#d97706",bg:"#fffbeb"},
    {label:"Part féminine",value:Math.round((fem/Math.max(total,1))*100)+"%",sub:"du total des cas",icon:Icon.hospital,color:"#0891b2",bg:"#ecfeff"},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {kpis.map((k,i)=>(
        <div key={i} style={{background:k.bg,borderRadius:10,padding:"15px 17px",border:`1px solid ${k.color}22`}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
            <div style={{color:k.color,opacity:0.8}}>{k.icon}</div>
            <span style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.06em"}}>{k.label}</span>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:k.color,letterSpacing:"-0.02em"}}>{k.value}</div>
          <div style={{fontSize:10.5,color:"#94a3b8",marginTop:3}}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── CUSTOM BUILDER ────────────────────────────────────────────────────────────
function CustomBuilder({ onGenerate }) {
  const [title,setTitle]=useState(""); const [xLabel,setXLabel]=useState(""); const [yLabel,setYLabel]=useState("");
  const [chartType,setChartType]=useState("bar");
  const [rows,setRows]=useState([{id:Date.now()+1,x:"",y:""},{id:Date.now()+2,x:"",y:""},{id:Date.now()+3,x:"",y:""}]);
  const [csvText,setCsvText]=useState(""); const [importMode,setImportMode]=useState(false); const [error,setError]=useState("");
  const addRow=()=>setRows(r=>[...r,{id:Date.now(),x:"",y:""}]);
  const removeRow=id=>setRows(r=>r.filter(row=>row.id!==id));
  const updateRow=(id,field,val)=>setRows(r=>r.map(row=>row.id===id?{...row,[field]:val}:row));
  function parseCSV(){const lines=csvText.trim().split("\n").filter(l=>l.trim());const parsed=[];for(const line of lines){const parts=line.split(/[,;\t]/).map(p=>p.trim());if(parts.length<2)continue;const xVal=parts[0];const yVal=parseFloat(parts[1]);if(xVal&&!isNaN(yVal))parsed.push({id:Date.now()+Math.random(),x:xVal,y:String(yVal)});}if(parsed.length===0){setError("Format invalide. Utilisez : étiquette, valeur");return;}setRows(parsed);setError("");setImportMode(false);}
  function handleGenerate(){const validRows=rows.filter(r=>r.x.trim()&&r.y.trim()&&!isNaN(parseFloat(r.y)));if(validRows.length<2){setError("Ajoutez au moins 2 points valides.");return;}setError("");const data=validRows.map((r,i)=>({id:r.x.trim(),label:r.x.trim(),value:parseFloat(r.y),color:PALETTE[i%PALETTE.length]}));onGenerate({data,chartType,title,xLabel,yLabel});}
  const inputS={width:"100%",padding:"7px 10px",borderRadius:7,border:"1.5px solid #fbcfe8",fontFamily:"inherit",fontSize:12,color:"#1e293b",background:"white",outline:"none",transition:"border 0.15s"};
  const focus=e=>e.target.style.borderColor="#db2777"; const blur=e=>e.target.style.borderColor="#fbcfe8";
  const CHART_TYPES=[{id:"bar",label:"Histogramme",icon:Icon.chart},{id:"line",label:"Courbe",icon:Icon.line},{id:"pie",label:"Camembert",icon:Icon.pie},{id:"donut",label:"Anneau",icon:Icon.donut},{id:"horizontal",label:"Barres H.",icon:Icon.hbar},{id:"area",label:"Aire",icon:Icon.area}];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"white",borderRadius:11,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",background:"#fdf2f8"}}><div style={{fontSize:10,fontWeight:700,color:"#db2777",textTransform:"uppercase",letterSpacing:"0.07em"}}>📝 Informations du graphique</div></div>
        <div style={{padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:11,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Titre</label><input type="text" placeholder="Ex : Évolution des cas 2018–2024" value={title} onChange={e=>setTitle(e.target.value)} style={inputS} onFocus={focus} onBlur={blur}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Axe X</label><input type="text" placeholder="Ex : Année, Daïra…" value={xLabel} onChange={e=>setXLabel(e.target.value)} style={inputS} onFocus={focus} onBlur={blur}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Axe Y</label><input type="text" placeholder="Ex : Nombre de cas" value={yLabel} onChange={e=>setYLabel(e.target.value)} style={inputS} onFocus={focus} onBlur={blur}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Type</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{CHART_TYPES.map(ct=><button key={ct.id} onClick={()=>setChartType(ct.id)} title={ct.label} style={{width:32,height:32,borderRadius:7,border:`1.5px solid ${chartType===ct.id?"#db2777":"#e2e8f0"}`,background:chartType===ct.id?"#fdf2f8":"white",color:chartType===ct.id?"#db2777":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.13s"}}>{ct.icon}</button>)}</div></div>
        </div>
      </div>
      <div style={{background:"white",borderRadius:11,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",background:"#fdf2f8",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#db2777",textTransform:"uppercase",letterSpacing:"0.07em"}}>📊 Saisie des données</div>
          <button onClick={()=>setImportMode(m=>!m)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:6,border:"1.5px solid #fbcfe8",background:importMode?"#fdf2f8":"white",color:"#db2777",fontFamily:"inherit",fontSize:10.5,fontWeight:600,cursor:"pointer"}}>{Icon.import} {importMode?"Saisie manuelle":"Importer CSV"}</button>
        </div>
        {importMode?(
          <div style={{padding:"16px"}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>Format : <code>Étiquette, Valeur</code> — une ligne par point</div>
            <textarea rows={8} placeholder={"Tlemcen, 245\nMaghnia, 187\n..."} value={csvText} onChange={e=>setCsvText(e.target.value)} style={{...inputS,resize:"vertical",fontFamily:"monospace"}} onFocus={focus} onBlur={blur}/>
            <button onClick={parseCSV} style={{marginTop:10,padding:"7px 16px",borderRadius:7,border:"none",background:"#db2777",color:"white",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>Charger →</button>
          </div>
        ):(
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 32px",gap:8,marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",padding:"0 4px"}}>Axe X — {xLabel||"Étiquette"}</div>
              <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",padding:"0 4px"}}>Axe Y — {yLabel||"Valeur"}</div>
              <div/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:340,overflowY:"auto",paddingRight:2}}>
              {rows.map((row,i)=>(
                <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 32px",gap:8,alignItems:"center"}}>
                  <div style={{position:"relative"}}><span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:9.5,fontWeight:700,color:"#cbd5e1",pointerEvents:"none"}}>{i+1}</span><input type="text" placeholder={`Ex : ${["Tlemcen","Maghnia","2020","Sein","60+"][i%5]}`} value={row.x} onChange={e=>updateRow(row.id,"x",e.target.value)} style={{...inputS,paddingLeft:26}} onFocus={focus} onBlur={blur}/></div>
                  <input type="number" placeholder="Ex : 245" value={row.y} onChange={e=>updateRow(row.id,"y",e.target.value)} style={inputS} onFocus={focus} onBlur={blur}/>
                  <button onClick={()=>removeRow(row.id)} style={{width:30,height:30,borderRadius:7,border:"1.5px solid #fee2e2",background:"white",color:"#f87171",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Icon.trash}</button>
                </div>
              ))}
            </div>
            <button onClick={addRow} style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:7,border:"1.5px dashed #fbcfe8",background:"white",color:"#db2777",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer"}}>{Icon.plus} Ajouter une ligne</button>
          </div>
        )}
      </div>
      {rows.filter(r=>r.x.trim()&&!isNaN(parseFloat(r.y))).length>0&&(
        <div style={{background:"#fdf2f8",borderRadius:9,padding:"10px 14px",border:"1px solid #fbcfe8",display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:11,color:"#db2777",fontWeight:700}}>✓ {rows.filter(r=>r.x.trim()&&!isNaN(parseFloat(r.y))).length} point(s) valide(s)</span>
          <span style={{fontSize:11,color:"#94a3b8"}}>Σ = {rows.filter(r=>r.x.trim()&&!isNaN(parseFloat(r.y))).reduce((a,r)=>a+parseFloat(r.y),0).toLocaleString("fr-FR")}</span>
        </div>
      )}
      {error&&<div style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:8,padding:"9px 14px",fontSize:12,color:"#dc2626",fontWeight:600}}>⚠ {error}</div>}
      <div style={{textAlign:"center"}}>
        <button onClick={handleGenerate} style={{background:"linear-gradient(135deg,#be185d,#db2777)",color:"white",border:"none",padding:"11px 30px",borderRadius:9,fontFamily:"inherit",fontSize:13.5,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(219,39,119,0.3)",display:"inline-flex",alignItems:"center",gap:8}}>
          {Icon.stats} Générer le graphique
        </button>
      </div>
    </div>
  );
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const CHART_TYPES_LIST = [
  { id:"bar",    label:"Histogramme", icon:Icon.chart    },
  { id:"line",   label:"Courbe",      icon:Icon.line     },
  { id:"pie",    label:"Camembert",   icon:Icon.pie      },
  { id:"donut",  label:"Anneau",      icon:Icon.donut    },
  { id:"horizontal", label:"Barres H.", icon:Icon.hbar   },
  { id:"area",   label:"Aire",        icon:Icon.area     },
];

const CATEGORIES = [
  { id:"descriptive", label:"Statistiques Descriptives", icon:Icon.stats, color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe", desc:"Répartition par type, sexe, tranche d'âge",
    analyses:[
      {id:"by_cancer", label:"Par Type de Cancer",   icon:Icon.cancer, desc:"Distribution des cas par type de cancer"},
      {id:"by_sex",    label:"Par Sexe",              icon:Icon.gender, desc:"Répartition Masculin / Féminin"},
      {id:"by_age",    label:"Par Tranche d'âge",     icon:Icon.age,    desc:"Distribution par groupe d'âge"},
      {id:"top5",      label:"Top 5 Cancers",         icon:Icon.chart,  desc:"Les 5 cancers les plus fréquents"},
    ]
  },
  { id:"temporal", label:"Évolution Temporelle", icon:Icon.line, color:"#059669", bg:"#f0fdf4", border:"#bbf7d0", desc:"Tendances annuelles, mensuelles, trimestrielles",
    analyses:[
      {id:"by_year",    label:"Évolution Annuelle",  icon:Icon.calendar, desc:"Progression des cas 2018–2024"},
      {id:"by_month",   label:"Répartition Mensuelle", icon:Icon.calendar, desc:"Distribution sur les 12 mois"},
      {id:"by_quarter", label:"Par Trimestre",        icon:Icon.calendar, desc:"T1 / T2 / T3 / T4"},
    ]
  },
  { id:"geographic", label:"Répartition Géographique", icon:Icon.map, color:"#d97706", bg:"#fffbeb", border:"#fde68a", desc:"Carte interactive + tableau — Wilaya de Tlemcen",
    analyses:[
      {id:"map_daira", label:"Carte Interactive",    icon:Icon.mapPin, desc:"Carte SVG des daïras avec heatmap et tooltip"},
      {id:"by_daira",  label:"Par Daïra (Tableau)",  icon:Icon.hbar,   desc:"Classement des daïras les plus touchées"},
    ]
  },
  { id:"clinical", label:"Données Cliniques", icon:Icon.stethoscope, color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe", desc:"Stade, traitement, mode de diagnostic",
    analyses:[
      {id:"by_stade",      label:"Par Stade (I→IV)",     icon:Icon.stethoscope, desc:"Distribution I / II / III / IV"},
      {id:"by_mode_diag",  label:"Mode de Diagnostic",   icon:Icon.hospital,    desc:"Dépistage, symptômes, urgence…"},
      {id:"by_traitement", label:"Type de Traitement",   icon:Icon.syringe,     desc:"Chirurgie, chimio, radio…"},
      {id:"survie_stade",  label:"Taux de Survie",       icon:Icon.kpi,         desc:"Survie estimée à 1 an par stade"},
    ]
  },
  { id:"kpi", label:"KPIs & Indicateurs", icon:Icon.kpi, color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc", desc:"Tableau de bord synthétique des métriques clés",
    analyses:[
      {id:"kpi_dashboard", label:"Dashboard KPIs", icon:Icon.kpi, desc:"Total, ratio H/F, dominant, survie…"},
    ]
  },
  { id:"custom", label:"Analyse Personnalisée", icon:Icon.plus, color:"#db2777", bg:"#fdf2f8", border:"#fbcfe8", desc:"Entrez vos propres données (X / Y) et choisissez le graphique",
    analyses:[
      {id:"custom_build", label:"Construire mon analyse", icon:Icon.plus, desc:"Saisissez librement vos étiquettes X et valeurs Y"},
    ]
  },
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function StatBuilder() {
  const [step,setStep]=useState(1);
  const [selCat,setSelCat]=useState(null);
  const [selAn,setSelAn]=useState(null);
  const [selChart,setSelChart]=useState("bar");
  const [filters,setFilters]=useState({sex:"",age:"",year:"",daira:"",cancer:[],stade:[]});
  const [chartData,setChartData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [customMeta,setCustomMeta]=useState({title:"",xLabel:"",yLabel:""});

  const cat=CATEGORIES.find(c=>c.id===selCat);
  const analysis=cat?.analyses.find(a=>a.id===selAn);

  function reset(){setStep(1);setSelCat(null);setSelAn(null);setSelChart("bar");setFilters({sex:"",age:"",year:"",daira:"",cancer:[],stade:[]});setChartData([]);setCustomMeta({title:"",xLabel:"",yLabel:""});}
  function toggleArr(arr,val){return arr.includes(val)?arr.filter(x=>x!==val):[...arr,val];}
  function handleCustomGenerate({data,chartType,title,xLabel,yLabel}){setChartData(data);setSelChart(chartType);setCustomMeta({title,xLabel,yLabel});setStep(4);}

  function buildData(){
    if(selAn==="map_daira"){setStep(4);return;}
    setLoading(true);
    setTimeout(()=>{
      let data=RAW_DATA.filter(d=>
        (!filters.sex||d.sex===filters.sex)&&(!filters.age||d.age===filters.age)&&
        (!filters.year||String(d.year)===String(filters.year))&&(!filters.daira||d.daira===filters.daira)&&
        (filters.cancer.length===0||filters.cancer.includes(d.cancer))&&
        (filters.stade.length===0||filters.stade.includes(d.stade))
      );
      const cMap=Object.fromEntries(CANCERS.map(c=>[c.id,c.label]));
      const mOrd=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
      let result=[];
      if(selAn==="by_cancer"||selAn==="top5"){result=aggBy(data,"cancer",cMap).map((d,i)=>({...d,color:CANCERS.find(c=>c.label===d.label)?.color||PALETTE[i]}));if(selAn==="top5")result=result.slice(0,5);}
      else if(selAn==="by_sex"){result=aggBy(data,"sex",{M:"Masculin",F:"Féminin"}).map(d=>({...d,color:d.id==="M"?"#2563eb":"#e05c4b"}));}
      else if(selAn==="by_age"){const ord=["0–14","15–29","30–44","45–59","60+"];result=aggBy(data,"age").sort((a,b)=>ord.indexOf(a.id)-ord.indexOf(b.id)).map((d,i)=>({...d,color:PALETTE[i]}));}
      else if(selAn==="by_year"){result=aggBy(data,"year").sort((a,b)=>Number(a.id)-Number(b.id)).map(d=>({...d,color:"#2563eb"}));}
      else if(selAn==="by_month"){result=aggBy(data,"month").sort((a,b)=>mOrd.indexOf(a.id)-mOrd.indexOf(b.id)).map(d=>({...d,color:"#059669"}));}
      else if(selAn==="by_quarter"){const qMap={Jan:1,Fév:1,Mar:1,Avr:2,Mai:2,Jun:2,Jul:3,Aoû:3,Sep:3,Oct:4,Nov:4,Déc:4};const qAgg={};data.forEach(d=>{const q="T"+qMap[d.month];qAgg[q]=(qAgg[q]||0)+d.cases;});result=["T1","T2","T3","T4"].map((q,i)=>({id:q,label:q,value:qAgg[q]||0,color:PALETTE[i]}));}
      else if(selAn==="by_daira"){result=aggBy(data,"daira").map((d,i)=>({...d,color:PALETTE[i%PALETTE.length]}));}
      else if(selAn==="by_stade"){const ord=["Stade I","Stade II","Stade III","Stade IV"];result=aggBy(data,"stade").sort((a,b)=>ord.indexOf(a.id)-ord.indexOf(b.id)).map((d,i)=>({...d,color:["#059669","#d97706","#e05c4b","#7f1d1d"][i]}));}
      else if(selAn==="survie_stade"){result=[{id:"Stade I",label:"Stade I",value:95,color:"#059669"},{id:"Stade II",label:"Stade II",value:78,color:"#d97706"},{id:"Stade III",label:"Stade III",value:55,color:"#e05c4b"},{id:"Stade IV",label:"Stade IV",value:25,color:"#7f1d1d"}];}
      else if(selAn==="by_mode_diag"){result=aggBy(data,"mode").map((d,i)=>({...d,color:PALETTE[i%PALETTE.length]}));}
      else if(selAn==="by_traitement"){result=aggBy(data,"traitement").map((d,i)=>({...d,color:PALETTE[i%PALETTE.length]}));}
      setChartData(result);setLoading(false);setStep(4);
    },480);
  }

  const total=chartData.reduce((a,d)=>a+d.value,0);
  const isCirc=selChart==="pie"||selChart==="donut";
  const isKpi=selAn==="kpi_dashboard";
  const isCustom=selAn==="custom_build";
  const isMap=selAn==="map_daira";

  function renderChart(){
    if(isMap)  return <TlemcenMapLeaflet filters={filters}/>;
    if(isKpi)  return <KPIBoard filters={filters}/>;
    if(!chartData.length) return <div style={{textAlign:"center",color:"#94a3b8",padding:36,fontSize:13}}>Aucune donnée pour ces filtres</div>;
    const sz={w:510,h:275};
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:22,flexWrap:"wrap"}}>
        {selChart==="pie"&&<PieChart data={chartData} size={240}/>}
        {selChart==="donut"&&<PieChart data={chartData} donut size={240}/>}
        {selChart==="bar"&&<BarChart data={chartData} size={sz}/>}
        {selChart==="horizontal"&&<BarChart data={chartData} horizontal size={{w:510,h:Math.max(260,chartData.length*40+60)}}/>}
        {selChart==="line"&&<LineChart data={chartData} size={sz}/>}
        {selChart==="area"&&<LineChart data={chartData} area size={sz}/>}
        {isCirc&&<Legend data={chartData} total={total}/>}
      </div>
    );
  }

  const STEPS=[{n:1,label:"Catégorie"},{n:2,label:"Analyse"},{n:3,label:"Paramètres"},{n:4,label:"Résultat"}];
  const cardS={background:"white",borderRadius:11,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"hidden"};
  const lblS={fontSize:11,fontWeight:600,color:"#64748b",display:"block",marginBottom:5};
  const selS={width:"100%",padding:"7px 10px",borderRadius:7,border:"1.5px solid #e2e8f0",fontFamily:"inherit",fontSize:11.5,color:"#1e293b",background:"white",outline:"none"};

  return (
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif",background:"#f1f5f9",minHeight:"100vh",color:"#1e293b"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu 0.26s ease forwards}@keyframes sp{to{transform:rotate(360deg)}}.sp{animation:sp 0.75s linear infinite}`}</style>

      {/* HEADER */}
      <div style={{background:"white",borderBottom:"1.5px solid #e2e8f0",padding:"0 24px",display:"flex",alignItems:"center",gap:12,height:56,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
        <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#1d4ed8,#60a5fa)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:"#0f172a",letterSpacing:"-0.01em"}}>Générateur de Statistiques</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>Registre Cancer · Wilaya de Tlemcen · 2018–2026</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          {STEPS.map((st,i)=>(
            <div key={st.n} style={{display:"flex",alignItems:"center"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,opacity:step>=st.n?1:0.35}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:step>st.n?"#059669":step===st.n?"#2563eb":"#e2e8f0",color:step>=st.n?"white":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9.5,fontWeight:800,transition:"background 0.3s"}}>
                  {step>st.n?<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>:st.n}
                </div>
                <div style={{fontSize:8.5,color:step===st.n?"#2563eb":"#94a3b8",fontWeight:step===st.n?700:400}}>{st.label}</div>
              </div>
              {i<STEPS.length-1&&<div style={{width:26,height:2,background:step>st.n?"#059669":"#e2e8f0",margin:"0 3px",marginBottom:16,transition:"background 0.3s"}}/>}
            </div>
          ))}
        </div>
        {step>1&&<button onClick={reset} style={{marginLeft:14,display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,border:"1.5px solid #e2e8f0",background:"white",color:"#64748b",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer"}}>{Icon.reset} Réinitialiser</button>}
      </div>

      {/* BODY */}
      <div style={{maxWidth:1040,margin:"0 auto",padding:"24px 18px"}}>

        {/* ── STEP 1 ── */}
        {step===1&&(
          <div className="fu">
            <div style={{textAlign:"center",marginBottom:26}}>
              <div style={{fontSize:21,fontWeight:800,color:"#0f172a",letterSpacing:"-0.02em"}}>Sélectionnez une catégorie d'analyse</div>
              <div style={{fontSize:12.5,color:"#94a3b8",marginTop:5}}>Choisissez le type de statistique que vous souhaitez générer</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:13}}>
              {CATEGORIES.map(c=>(
                <button key={c.id} onClick={()=>{setSelCat(c.id);setStep(2);}}
                  style={{background:"white",border:`1.5px solid ${c.border}`,borderRadius:11,padding:"20px 16px",cursor:"pointer",textAlign:"left",boxShadow:"0 1px 5px rgba(0,0,0,0.05)",fontFamily:"inherit",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color;e.currentTarget.style.boxShadow=`0 4px 14px ${c.color}22`;e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=c.border;e.currentTarget.style.boxShadow="0 1px 5px rgba(0,0,0,0.05)";e.currentTarget.style.transform="translateY(0)";}}>
                  <div style={{width:36,height:36,borderRadius:9,background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:c.color,marginBottom:13}}>{c.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:5}}>{c.label}</div>
                  <div style={{fontSize:11,color:"#64748b",lineHeight:1.55}}>{c.desc}</div>
                  <div style={{marginTop:12,fontSize:10.5,fontWeight:700,color:c.color,display:"inline-flex",alignItems:"center",gap:4,background:c.bg,padding:"3px 9px",borderRadius:20}}>{c.analyses.length} analyses {Icon.chevron}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step===2&&cat&&(
          <div className="fu">
            <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:"#2563eb",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,marginBottom:14,padding:"4px 0"}}>{Icon.back} Retour aux catégories</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <div style={{width:34,height:34,borderRadius:9,background:cat.bg,border:`1.5px solid ${cat.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:cat.color}}>{cat.icon}</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:"#0f172a"}}>{cat.label}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>Sélectionnez le type d'analyse</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
              {cat.analyses.map(an=>(
                <button key={an.id} onClick={()=>{setSelAn(an.id);setStep(3);}}
                  style={{background:"white",border:`1.5px solid ${cat.border}`,borderRadius:10,padding:"17px 16px",cursor:"pointer",textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",fontFamily:"inherit",transition:"all 0.18s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=cat.border;e.currentTarget.style.transform="translateY(0)";}}>
                  <div style={{color:cat.color,marginBottom:9}}>{an.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:5}}>{an.label}</div>
                  <div style={{fontSize:11,color:"#64748b",lineHeight:1.55}}>{an.desc}</div>
                  <div style={{marginTop:11,fontSize:11,color:cat.color,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>Sélectionner {Icon.chevron}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step===3&&analysis&&(
          <div className="fu">
            <button onClick={()=>setStep(2)} style={{background:"none",border:"none",color:"#2563eb",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,marginBottom:14,padding:"4px 0"}}>{Icon.back} Retour aux analyses</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <div style={{width:32,height:32,borderRadius:8,background:cat.bg,border:`1.5px solid ${cat.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:cat.color}}>{analysis.icon}</div>
              <div>
                <div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>{analysis.label}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>
                  {isCustom?"Entrez vos propres données":isMap?"Configurez les filtres de la carte":"Configurez les paramètres"}
                </div>
              </div>
            </div>

            {isCustom ? (
              <CustomBuilder onGenerate={handleCustomGenerate}/>
            ) : (
              <>
                <div style={{display:"grid",gridTemplateColumns:isKpi||isMap?"1fr":"1fr 1fr",gap:16}}>
                  {/* Chart type — hidden for map & kpi */}
                  {!isKpi&&!isMap&&(
                    <div style={cardS}>
                      <div style={{padding:"13px 16px",borderBottom:"1px solid #f1f5f9"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>Type de graphique</div>
                      </div>
                      <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
                        {CHART_TYPES_LIST.map(ct=>(
                          <button key={ct.id} onClick={()=>setSelChart(ct.id)} style={{padding:"9px 5px",borderRadius:7,border:`1.5px solid ${selChart===ct.id?"#2563eb":"#e2e8f0"}`,background:selChart===ct.id?"#eff6ff":"white",color:selChart===ct.id?"#2563eb":"#64748b",fontFamily:"inherit",fontSize:10.5,fontWeight:600,cursor:"pointer",textAlign:"center",transition:"all 0.14s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <span style={{color:"inherit"}}>{ct.icon}</span>{ct.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Map info card */}
                  {isMap&&(
                    <div style={{...cardS,background:"linear-gradient(135deg,#fffbeb,white)",border:"1.5px solid #fde68a"}}>
                      <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
                        <div style={{fontSize:36}}>🗺️</div>
                        <div>
                          <div style={{fontWeight:800,fontSize:14,color:"#0f172a",marginBottom:4}}>Carte Interactive — Wilaya de Tlemcen</div>
                          <div style={{fontSize:11.5,color:"#64748b",lineHeight:1.6}}>
                            Visualisation géographique des 19 daïras.<br/>
                            Heatmap rose → cramoisi selon les cas.<br/>
                            Tooltip au survol + classement latéral.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filters */}
                  <div style={{...cardS,gridColumn:isKpi||isMap?"1/-1":""}}>
                    <div style={{padding:"13px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{color:"#94a3b8"}}>{Icon.filter}</span>
                      <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em"}}>Filtres (optionnels)</div>
                    </div>
                    <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                      <div>
                        <label style={lblS}>Sexe</label>
                        <div style={{display:"flex",gap:5}}>
                          {[["","Tous"],["M","Masculin"],["F","Féminin"]].map(([v,l])=>(
                            <button key={v} onClick={()=>setFilters(f=>({...f,sex:v}))} style={{flex:1,padding:"6px 3px",borderRadius:6,border:`1.5px solid ${filters.sex===v?"#2563eb":"#e2e8f0"}`,background:filters.sex===v?"#eff6ff":"white",color:filters.sex===v?"#2563eb":"#64748b",fontFamily:"inherit",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.14s"}}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={lblS}>Tranche d'âge</label>
                        <select value={filters.age} onChange={e=>setFilters(f=>({...f,age:e.target.value}))} style={selS}><option value="">Tous les âges</option>{AGE_GROUPS.map(ag=><option key={ag} value={ag}>{ag} ans</option>)}</select>
                      </div>
                      <div>
                        <label style={lblS}>Année</label>
                        <select value={filters.year} onChange={e=>setFilters(f=>({...f,year:e.target.value}))} style={selS}><option value="">Toutes les années</option>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
                      </div>
                      <div>
                        <label style={lblS}>Daïra</label>
                        <select value={filters.daira} onChange={e=>setFilters(f=>({...f,daira:e.target.value}))} style={selS}><option value="">Toutes les daïras</option>{DAIRAS.map(d=><option key={d} value={d}>{d}</option>)}</select>
                      </div>
                    </div>
                    <div style={{padding:"0 16px 12px"}}>
                      <label style={lblS}>Types de cancer <span style={{fontWeight:400,color:"#94a3b8"}}>(vide = tous)</span></label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {CANCERS.map(c=>{const sel=filters.cancer.includes(c.id);return<button key={c.id} onClick={()=>setFilters(f=>({...f,cancer:toggleArr(f.cancer,c.id)}))} style={{padding:"3px 9px",borderRadius:20,border:`1.5px solid ${sel?c.color:"#e2e8f0"}`,background:sel?c.color+"18":"white",color:sel?c.color:"#64748b",fontFamily:"inherit",fontSize:10.5,fontWeight:600,cursor:"pointer",transition:"all 0.13s",display:"flex",alignItems:"center",gap:4}}>{sel&&<span style={{color:c.color}}>{Icon.check}</span>}{c.label}</button>;})}
                      </div>
                    </div>
                    <div style={{padding:"0 16px 14px"}}>
                      <label style={lblS}>Stade <span style={{fontWeight:400,color:"#94a3b8"}}>(vide = tous)</span></label>
                      <div style={{display:"flex",gap:6}}>
                        {STADES.map((st,i)=>{const sel=filters.stade.includes(st);const cols=["#059669","#d97706","#e05c4b","#7f1d1d"];return<button key={st} onClick={()=>setFilters(f=>({...f,stade:toggleArr(f.stade,st)}))} style={{flex:1,padding:"5px 3px",borderRadius:7,border:`1.5px solid ${sel?cols[i]:"#e2e8f0"}`,background:sel?cols[i]+"15":"white",color:sel?cols[i]:"#64748b",fontFamily:"inherit",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.13s"}}>{st}</button>;})}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{textAlign:"center",marginTop:20}}>
                  <button onClick={buildData} disabled={loading} style={{background:loading?"#94a3b8":isMap?"linear-gradient(135deg,#b45309,#d97706)":`linear-gradient(135deg,#1d4ed8,#3b82f6)`,color:"white",border:"none",padding:"11px 30px",borderRadius:9,fontFamily:"inherit",fontSize:13.5,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":isMap?"0 4px 14px rgba(217,119,6,0.3)":"0 4px 14px rgba(37,99,235,0.3)",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:8}}>
                    {loading?<><div className="sp" style={{width:15,height:15,border:"2px solid white",borderTopColor:"transparent",borderRadius:"50%"}}/> Génération…</>
                     :isMap?<>{Icon.mapPin} Afficher la carte</>
                     :<>{Icon.stats} Générer — {analysis.label}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step===4&&(
          <div className="fu">
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:16,fontSize:11.5,color:"#94a3b8"}}>
              <span style={{cursor:"pointer",color:"#2563eb",fontWeight:600}} onClick={reset}>Accueil</span>
              <span>{Icon.chevron}</span>
              <span style={{cursor:"pointer",color:"#2563eb",fontWeight:600}} onClick={()=>setStep(2)}>{cat?.label}</span>
              <span>{Icon.chevron}</span>
              <span style={{fontWeight:700,color:"#0f172a"}}>{analysis?.label}</span>
            </div>

            <div style={cardS}>
              {/* Card Header */}
              <div style={{padding:"14px 20px",borderBottom:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",background:`linear-gradient(to right, ${cat?.color}06, transparent)`}}>
                <div style={{width:36,height:36,borderRadius:9,background:cat?.bg,border:`1.5px solid ${cat?.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:cat?.color}}>{analysis?.icon}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14.5,color:"#0f172a"}}>
                    {isCustom?(customMeta.title||"Analyse personnalisée"):analysis?.label}
                  </div>
                  <div style={{fontSize:10.5,color:"#94a3b8",marginTop:2}}>
                    {isMap
                      ? "Carte interactive · Heatmap par daïra · Wilaya de Tlemcen"
                      : isCustom
                        ? [customMeta.xLabel&&`X : ${customMeta.xLabel}`,customMeta.yLabel&&`Y : ${customMeta.yLabel}`].filter(Boolean).join(" · ")||"Données saisies manuellement"
                        : [filters.sex?(filters.sex==="M"?"Masculin":"Féminin"):"Tous sexes",filters.age||"Tous âges",filters.year||"2018–2026",filters.daira||"Toutes daïras"].join(" · ")
                    }
                  </div>
                </div>
                <div style={{flex:1}}/>

                {/* KPIs summary (not for map/kpi) */}
                {!isKpi&&!isMap&&chartData.length>0&&(
                  <div style={{display:"flex",gap:16}}>
                    {[{label:"Total",val:total.toLocaleString("fr-FR"),color:cat?.color},{label:"Catégories",val:chartData.length,color:"#0f172a"},{label:"Dominant",val:chartData[0]?.label||"—",color:"#0f172a"}].map((kp,i)=>(
                      <div key={i} style={{textAlign:"center"}}>
                        <div style={{fontSize:15,fontWeight:800,color:kp.color,letterSpacing:"-0.01em"}}>{kp.val}</div>
                        <div style={{fontSize:8.5,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{kp.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chart switcher (not for map/kpi) */}
                {!isKpi&&!isMap&&(
                  <div style={{display:"flex",gap:4}}>
                    {CHART_TYPES_LIST.map(ct=>(
                      <button key={ct.id} title={ct.label} onClick={()=>setSelChart(ct.id)} style={{width:27,height:27,borderRadius:6,border:`1.5px solid ${selChart===ct.id?"#2563eb":"#e2e8f0"}`,background:selChart===ct.id?"#eff6ff":"white",color:selChart===ct.id?"#2563eb":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.13s"}}>{ct.icon}</button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{display:"flex",gap:6}}>
                  {!isKpi&&!isMap&&chartData.length>0&&<>
                    <button onClick={()=>{
                      const rows=chartData.map((d,i)=>`<tr><td style="padding:7px 11px;font-weight:600;color:#2563eb;">${i+1}</td><td style="padding:7px 11px;">${d.label}</td><td style="padding:7px 11px;text-align:right;font-weight:700;">${d.value.toLocaleString("fr-FR")}</td><td style="padding:7px 11px;text-align:right;color:#64748b;">${((d.value/Math.max(total,1))*100).toFixed(1)}%</td></tr>`).join("");
                      const titleStr=isCustom?(customMeta.title||"Analyse personnalisée"):analysis?.label;
                      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Outfit,Arial,sans-serif;padding:30px;color:#1e293b}.h1{font-size:19px;font-weight:800;color:#1d4ed8;margin-bottom:4px}.meta{font-size:10.5px;color:#94a3b8;margin-bottom:18px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1d4ed8;color:white;padding:8px 11px;text-align:left;font-weight:600}td{border-bottom:1px solid #f1f5f9}.footer{margin-top:22px;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:9px}</style></head><body><div class="h1">${titleStr}</div><div class="meta">Registre du Cancer · CHU Tlemcen · ${new Date().toLocaleDateString("fr-FR")}</div><table><thead><tr><th>#</th><th>${isCustom&&customMeta.xLabel?customMeta.xLabel:"Catégorie"}</th><th>${isCustom&&customMeta.yLabel?customMeta.yLabel:"Valeur"}</th><th>%</th></tr></thead><tbody>${rows}</tbody></table><div class="footer"><span>Service d'Oncologie — CHU Tlemcen</span><span>Total : ${total.toLocaleString("fr-FR")}</span></div></body></html>`;
                      const w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),400);
                    }} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:7,border:"1.5px solid #cbd5e1",background:"white",color:"#475569",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer"}}>{Icon.print} PDF</button>
                    <button onClick={()=>{
                      const csv=["Rang,Catégorie,Valeur,Pourcentage",...chartData.map((d,i)=>`${i+1},${d.label},${d.value},${((d.value/total)*100).toFixed(1)}%`)].join("\n");
                      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`stats_${Date.now()}.csv`;a.click();
                    }} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:7,border:"1.5px solid #059669",background:"#f0fdf4",color:"#059669",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer"}}>{Icon.download} CSV</button>
                  </>}
                </div>
              </div>

              {/* Chart area */}
              <div style={{padding:isMap?"0":"24px 20px",minHeight:300}}>
                {isCustom&&(customMeta.xLabel||customMeta.yLabel)&&(
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,padding:"0 8px"}}>
                    {customMeta.yLabel&&<span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>↑ {customMeta.yLabel}</span>}
                    {customMeta.xLabel&&<span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>{customMeta.xLabel} →</span>}
                  </div>
                )}
                {renderChart()}
              </div>
            </div>

            {/* Data table — not for map or kpi */}
            {!isKpi&&!isMap&&chartData.length>0&&(
              <div style={{...cardS,marginTop:13}}>
                <div style={{padding:"12px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{color:"#64748b"}}>{Icon.chart}</span><span style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>Données détaillées</span></div>
                  <span style={{fontSize:10.5,color:"#94a3b8"}}>{chartData.length} catégories · {total.toLocaleString("fr-FR")} {isCustom&&customMeta.yLabel?customMeta.yLabel:"cas"}</span>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      {["#",isCustom&&customMeta.xLabel?customMeta.xLabel:"Catégorie",isCustom&&customMeta.yLabel?customMeta.yLabel:"Cas","% Total","Distribution"].map((h,i)=>(
                        <th key={i} style={{padding:"9px 15px",textAlign:i>1?"right":"left",color:"#94a3b8",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f8fafc"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"8px 15px"}}><span style={{width:19,height:19,borderRadius:"50%",background:i<3?"#eff6ff":"#f8fafc",color:i<3?"#2563eb":"#64748b",border:i<3?"1px solid #bfdbfe":"1px solid #e2e8f0",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9.5,fontWeight:800}}>{i+1}</span></td>
                        <td style={{padding:"8px 15px"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:7,height:7,borderRadius:2,background:d.color||PALETTE[i%PALETTE.length],flexShrink:0}}/><span style={{fontWeight:600,color:"#1e293b"}}>{d.label}</span></div></td>
                        <td style={{padding:"8px 15px",textAlign:"right",fontWeight:800,color:"#0f172a"}}>{d.value.toLocaleString("fr-FR")}</td>
                        <td style={{padding:"8px 15px",textAlign:"right",color:"#64748b",fontWeight:600}}>{total>0?((d.value/total)*100).toFixed(1)+"%":"—"}</td>
                        <td style={{padding:"8px 15px",width:150}}><div style={{background:"#f1f5f9",borderRadius:3,height:5,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:d.color||PALETTE[i%PALETTE.length],width:`${chartData[0]?.value>0?(d.value/chartData[0].value)*100:0}%`,transition:"width 0.5s ease"}}/></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,marginTop:18}}>
              <button onClick={()=>setStep(3)} style={{padding:"9px 18px",borderRadius:8,border:"1.5px solid #2563eb",background:"white",color:"#2563eb",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer"}}>Modifier les paramètres</button>
              <button onClick={reset} style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"none",padding:"9px 22px",borderRadius:8,fontFamily:"inherit",fontSize:12.5,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 12px rgba(37,99,235,0.3)",display:"inline-flex",alignItems:"center",gap:7}}>
                {Icon.plus} Nouvelle statistique
              </button>
            </div>
          </div> 
        )}
      </div>
    </div>
  );
}