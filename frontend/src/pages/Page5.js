import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import DuplicateDetectionModal from '../components/DuplicateDetectionModal';
import { SC, BtnRow, InfoItem } from '../components/FormFields';

const API = 'http://localhost:8000/api';

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    try {
      const errData = await res.json();
      throw errData;
    } catch (parseErr) {
      throw { detail: `Erreur HTTP ${res.status}: ${res.statusText}` };
    }
  }
  if (res.status === 204) return null;
  return res.json();
}

function fmtDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (!isNaN(d)) {
      return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
    }
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) return parts[2]+'/'+parts[1]+'/'+parts[0];
  } catch(_) {}
  return str;
}

const TYPE_TUMEUR_MAP = {
  'Solide': 'solide',
  'Liquide': 'liquide',
  'Hémato.': 'hematologique',
};

function normalizeTypeTumeur(value) {
  if (!value) return '';
  return TYPE_TUMEUR_MAP[value] || value.toLowerCase();
}

function score(arr, total) {
  return Math.round((arr.filter(v => v && String(v).trim()).length / total) * 100);
}

const MARQUEURS_MAP = [
  { key:'cea',   label:'CEA',     unite:'ng/mL' },
  { key:'ca199', label:'CA 19-9', unite:'U/mL'  },
  { key:'ca125', label:'CA 125',  unite:'U/mL'  },
  { key:'afp',   label:'AFP',     unite:'ng/mL' },
  { key:'psa',   label:'PSA',     unite:'ng/mL' },
  { key:'ca153', label:'CA 15-3', unite:'U/mL'  },
];
const BILAN_MAP = [
  { key:'nfs',   label:'NFS',         unite:'',     numeric:false },
  { key:'creat', label:'Créatinine',  unite:'mg/L', numeric:true  },
  { key:'ggt',   label:'GGT',         unite:'U/L',  numeric:true  },
  { key:'ldh',   label:'LDH',         unite:'U/L',  numeric:true  },
  { key:'hb',    label:'Hémoglobine', unite:'g/dL', numeric:true  },
  { key:'tp',    label:'TP',          unite:'%',    numeric:true  },
];
const SAVE_STEPS = [
  'Création du dossier patient',
  'Enregistrement du cancer',
  'Envoi des traitements',
  'Examens biologiques & imagerie',
  'Habitudes de vie & antécédents',
];

function Bar({ label, pct }) {
  const color = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#e74c3c';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <div style={{ width:180, fontSize:12, fontWeight:700, color:'#64748B' }}>{label}</div>
      <div style={{ flex:1, height:7, background:'#E8ECF5', borderRadius:10, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:10, transition:'width 0.5s' }} />
      </div>
      <div style={{ fontSize:11, fontWeight:900, color, width:32, textAlign:'right' }}>{pct}%</div>
    </div>
  );
}

function Donut({ pct }) {
  const r = 22, circ = 2 * Math.PI * r;
  const color = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#4A6CF7';
  return (
    <div style={{ position:'relative', width:56, height:56 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E8ECF5" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          strokeLinecap="round" style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:12, fontWeight:900, color }}>{pct}%</div>
    </div>
  );
}

function StepProgress({ steps, current }) {
  return (
    <div style={{ margin:'12px 0', padding:'12px 16px', background:'#F8FAFF',
      border:'1.5px solid #E2E8F5', borderRadius:10 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
          marginBottom: i < steps.length-1 ? 8 : 0 }}>
          <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:900,
            background: i < current ? '#27ae60' : i === current ? '#4A6CF7' : '#E8ECF5',
            color: i <= current ? '#fff' : '#94A3B8' }}>
            {i < current ? '✓' : i+1}
          </div>
          <span style={{ fontSize:12, fontWeight:700,
            color: i === current ? '#4A6CF7' : i < current ? '#27ae60' : '#94A3B8' }}>
            {s}
          </span>
          {i === current && <span style={{ fontSize:11, color:'#4A6CF7' }}>⏳</span>}
        </div>
      ))}
    </div>
  );
}

function normStr(s = '') {
  return s.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m+1 }, (_,i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function strSim(a, b) {
  if (!a||!b) return 0;
  const na=normStr(a), nb=normStr(b);
  if (na===nb) return 100;
  const maxLen=Math.max(na.length,nb.length);
  if (maxLen===0) return 100;
  return Math.round((1-levenshtein(na,nb)/maxLen)*100);
}
function dateSim(d1, d2) {
  if (!d1||!d2) return 0;
  try {
    const t1=new Date(d1), t2=new Date(d2);
    if (isNaN(t1)||isNaN(t2)) return normStr(d1)===normStr(d2)?100:0;
    const diffDays=Math.abs(t1-t2)/(1000*60*60*24);
    if (diffDays===0) return 100;
    if (diffDays<=7) return 80;
    if (diffDays<=365) return 30;
    return 0;
  } catch { return 0; }
}

function normalizePatient(p) {
  const cleanDash = v => (!v||v==='—'||v==='-')?'':`${v}`;
  const rawCancers = Array.isArray(p.cancers)?p.cancers:[];
  const cancers = rawCancers.length > 0
    ? rawCancers.map(c => {
        if (typeof c==='string') return c;
        const name=cleanDash(c.cancer_type_name||(typeof c.cancer_type==='string'?c.cancer_type:'')||c.organe||c.name||'');
        const stade=cleanDash(c.stade_clinique||c.stade_pathologique||c.stade||'');
        if (!name&&!stade) return null;
        return name?(stade?name+' (Stade '+stade+')':`${name}`):(stade?'Cancer Stade '+stade:null);
      }).filter(Boolean)
    : (() => {
        const dc=p.dernier_cancer;
        if (dc) {
          const name=cleanDash(dc.organe||dc.cancer_type_name||dc.name||'');
          const stade=cleanDash(dc.stade||dc.stade_clinique||'');
          const label=name?(stade?name+' (Stade '+stade+')':`${name}`):(stade?'Cancer Stade '+stade:'');
          if (label.trim()) return [label];
        }
        const organe=cleanDash(p.organe||'');
        const stade=cleanDash(p.stade_clinique||p.stade||'');
        if (organe) return [stade?organe+' (Stade '+stade+')':`${organe}`];
        return [];
      })();

  const nestedTrt=rawCancers.flatMap(c=>typeof c==='object'&&Array.isArray(c.treatments)?c.treatments:[]);
  const rawTrt=Array.isArray(p.traitements)?p.traitements:[];
  const formTrt=[p.trtAnt,p.trtActuel].filter(Boolean);
  const traitements=[...rawTrt,...nestedTrt,...formTrt].map(t=>{
    if (typeof t==='string') return cleanDash(t);
    return cleanDash(t.type_traitement||t.protocole||t.name||'');
  }).filter(Boolean);

  const wilaya=cleanDash(
    p.wilaya_name
    ||(p.commune&&typeof p.commune==='object'&&p.commune.wilaya?(p.commune.wilaya.name||''):'')
    ||(typeof p.wilaya==='string'?p.wilaya:'')
    ||''
  );
  const commune=cleanDash(
    p.commune_name
    ||(p.commune&&typeof p.commune==='object'?(p.commune.name||''):'')
    ||(typeof p.commune==='string'?p.commune:'')
    ||''
  );

  return {
    id: p.id,
    nin: p.national_id||p.nin||'',
    nom: p.last_name
      ? ((p.first_name||'')+' '+p.last_name).trim()
      : p.nom||((p.first_name||'')+' '+(p.prenom||'')).trim(),
    dateNaissance: p.date_naissance||p.dateNaissance||p.dob||'',
    telephone: p.phone||p.telephone||p.tel||'',
    wilaya, commune,
    medecin: p.medecin_nom||p.medecin||'',
    cancers, traitements,
    age: p.age||'',
    cree: fmtDate(cleanDash(p.created_at||p.cree||''))
  };
}

function computeSimilarity(a, b) {
  const fields = [
    { name:'nin',           weight:3, fn:(v1,v2)=>normStr(v1)===normStr(v2)?100:0 },
    { name:'nom',           weight:2, fn:strSim },
    { name:'dateNaissance', weight:2, fn:dateSim },
    { name:'telephone',     weight:2, fn:(v1,v2)=>{
      const t1=(v1||'').replace(/\D/g,''), t2=(v2||'').replace(/\D/g,'');
      if (!t1||!t2) return 0;
      return t1===t2?100:strSim(t1,t2);
    }},
    { name:'wilaya', weight:1, fn:strSim },
  ];
  let totalWeight=0, sc=0;
  fields.forEach(f=>{
    totalWeight+=f.weight;
    const va=a[f.name], vb=b[f.name];
    if (va&&vb) sc+=f.fn(va,vb)*f.weight;
  });
  return totalWeight===0?0:Math.round(sc/totalWeight);
}

async function findPossibleDuplicate(candidate, token) {
  try {
    const q=encodeURIComponent(candidate.nom||'');
    const res=await fetch(`${API}/patients/?search=${q}`,{headers:{Authorization:`Bearer ${token}`}});
    if (!res.ok) return null;
    const data=await res.json();
    const list=data.results||data;
    let bestRaw=null, bestScore=0;
    list.forEach(raw=>{
      const ex=normalizePatient(raw);
      const s=computeSimilarity(ex,candidate);
      if (s>bestScore){bestScore=s;bestRaw=raw;}
    });
    if (bestScore<=50||!bestRaw) return null;
    try {
      const dr=await fetch(`${API}/patients/${bestRaw.id}/`,{headers:{Authorization:`Bearer ${token}`}});
      if (dr.ok) return {existing:normalizePatient(await dr.json()),score:bestScore};
    } catch(_){}
    return {existing:normalizePatient(bestRaw),score:bestScore};
  } catch(e){ console.warn('dup lookup',e); return null; }
}

function toISODate(str) {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split('T')[0];
  const m=str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return str;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Page5() {
  const navigate  = useNavigate();
  const { data, update, reset } = usePatient();
  const [saving, setSaving]         = useState(false);
  const [saveStep, setSaveStep]     = useState(-1);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [merged, setMerged]         = useState(false);
  const [dossier, setDossier]       = useState('');
  const [checks, setChecks]         = useState({ c1:false, c2:false, c3:false });
  const [unchecked, setUnc]         = useState([]);
  const [duplicateModal, setDuplicateModal] = useState(null);

  const s1 = score([data.first_name,data.last_name,data.date_naissance,data.sexe,data.phone,data.national_id],6);
  const s2 = score([data.organe,data.stade_clinique,data.date_diagnostic,data.tnmT],4);
  const s3 = score([data.cea,data.ca199,data.biopsy,data.imagerie?.length?'x':''],4);
  const s4 = score([data.tabac,data.alcool,data.sport,data.antFam],4);
  const global = Math.round((s1+s2+s3+s4)/4);

  const fullName = `${data.first_name||'—'} ${data.last_name||'—'}`;
  const sexeLabel = data.sexe==='M'?'♂ Masculin':data.sexe==='F'?'♀ Féminin':'—';
  const famLabels = {celibataire:'Célibataire',marie:'Marié(e)',divorce:'Divorcé(e)',veuf:'Veuf / Veuve'};
  const covLabels = {cnas:'CNAS',casnos:'CASNOS',pmsr:'PMSR',aucune:'Aucune',autre:'Autre'};

  const buildCandidate = () => normalizePatient({
    first_name:    data.first_name     || '',
    last_name:     data.last_name      || '',
    date_naissance:data.date_naissance || '',
    phone:         data.phone          || '',
    national_id:   data.national_id    || '',
    wilaya:        data.wilaya         || '',
    organe:        data.organe         || '',
    stade_clinique:data.stade_clinique || '',
    traitements:   data.traitements    || [],
  });

  // ── Création complète ───────────────────────────────────────────────────────
  async function createFullDossier(token) {
    setSaveStep(0);

    // 1. Patient
    const patientPayload = {
      first_name:          data.first_name,
      last_name:           data.last_name,
      date_naissance:      data.date_naissance,
      sexe:                data.sexe,
      situation_familiale: data.situation_familiale || '',
      couverture_sociale:  data.couverture_sociale  || '',
      profession:          data.profession          || '',
      phone:               data.phone               || '',
      email:               data.email               || '',
      adresse:             data.adresse             || '',
      national_id:         data.national_id         || null,
      data_source:         'manual',
      wilaya_text:         data.wilaya              || '',   // FIX wilaya
      ...(data.commune_id  ? { commune:  parseInt(data.commune_id)  } : {}),
      ...(data.hospital_id ? { hospital: parseInt(data.hospital_id) } : {}),
      ...(data.commune && !data.commune_id ? { commune_text: data.commune } : {}),
    };
    const patient = await post('/patients/', patientPayload, token);
    const patientId = patient.id;
    setDossier(patient.numero_dossier || '');
    setSaveStep(1);

    // 2. Cancer
    let cancerId = null;
    const hasCancer = data.organe||data.type_histologique||data.stade_clinique||data.date_diagnostic;
    if (hasCancer) {
      const cimCode = data.cim10_code==='__manual__'?(data.cim10_manual||''):(data.cim10_code||'');
      const cancer = await post(`/patients/${patientId}/cancers/`, {
        patient:             patientId,
        ...(data.cancer_type_id ? { cancer_type: parseInt(data.cancer_type_id) } : {}),
        organe:              data.organe             || '',   // FIX organe
        type_tumeur:         normalizeTypeTumeur(data.type_tumeur),
        sous_type:           data.sous_type          || '',
        lateralite:          data.lateralite         || '',
        cim10_code:          cimCode,
        date_symptomes:      data.date_symptomes     || null,
        date_diagnostic:     data.date_diagnostic    || null,
        base_diagnostic:     data.base_diagnostic    || [],
        etablissement_diag:  data.etablissement_diag || '',
        service_diag:        data.service_diag       || '',
        medecin_diag:        data.medecin_diag       || '',
        type_histologique:   data.type_histologique  || '',
        grade_histologique:  data.grade_histologique || '',
        bloc_anapath:        data.bloc_anapath       || '',
        stade_clinique:      data.stade_clinique     || '',
        tnm:                 [data.tnmT,data.tnmN,data.tnmM].filter(Boolean).join(''),
        taille_tumorale:     data.taille_tumorale    ? parseFloat(data.taille_tumorale) : null,
        ganglions_envahis:   data.ganglions_envahis  ? parseInt(data.ganglions_envahis)  : null,
        localise:            !!data.localise,
        metastatique:        !!data.metastatique,
        recidive:            !!data.recidive,
        sites_metastatiques: data.sites_metastatiques || [],
        recepteur_er:        data.recepteur_er || '',
        recepteur_pr:        data.recepteur_pr || '',
        her2:                data.her2         || '',
        data_source:         'manual',
      }, token);
      cancerId = cancer?.id;
      setSaveStep(2);

      // 3. Traitements
      if (cancerId && data.traitements?.length) {
        for (const t of data.traitements) {
          await post(`/patients/${patientId}/cancers/${cancerId}/treatments/`, {
            cancer:               cancerId,
            type_traitement:      t.type_traitement,
            intention:            t.intention            || '',
            statut:               t.statut               || 'planifie',
            ligne:                t.ligne                || '',
            protocole:            t.protocole            || '',
            medicaments:          t.medicaments          || '',
            voie_administration:  t.voie_administration  || '',
            jours_administration: t.jours_administration || [],
            cycles_prevus:        t.cycles_prevus   ? parseInt(t.cycles_prevus)   : null,
            cycles_realises:      t.cycles_realises ? parseInt(t.cycles_realises) : null,
            date_debut:           t.date_debut      || null,
            date_fin:             t.date_fin        || null,
            reponse_tumorale:     t.reponse_tumorale || '',
            date_evaluation:      t.date_evaluation  || null,
            grade_toxicite:       t.grade_toxicite   || '',
            description_toxicite: t.description_toxicite || '',
          }, token).catch(()=>{});
        }
      }
      setSaveStep(3);

      // 4. Examens biologiques
      for (const {key,label,unite} of MARQUEURS_MAP) {
        if (data[key]) await post(`/patients/${patientId}/cancers/${cancerId}/biological-exams/`,
          {cancer:cancerId,type_analyse:label,valeur:parseFloat(data[key]),unite,
           date_analyse:data.date_diagnostic||null},token).catch(()=>{});
      }
      for (const {key,label,unite,numeric} of BILAN_MAP) {
        if (data[key]) await post(`/patients/${patientId}/cancers/${cancerId}/biological-exams/`,
          {cancer:cancerId,type_analyse:label,
           valeur:numeric?parseFloat(data[key]):null,
           resultat:!numeric?data[key]:'',
           unite,date_analyse:data.date_diagnostic||null},token).catch(()=>{});
      }
      if (data.biopsy) await post(`/patients/${patientId}/cancers/${cancerId}/biological-exams/`,
        {cancer:cancerId,type_analyse:'Biopsie / Anatomopathologie',
         resultat:data.biopsy,date_analyse:data.biopsyDate||null},token).catch(()=>{});
      for (const type_examen of (data.imagerie||[])) {
        await post(`/patients/${patientId}/cancers/${cancerId}/imaging-exams/`,
          {cancer:cancerId,type_examen,date_examen:data.date_diagnostic||null},token).catch(()=>{});
      }
      for (const r of (data.rechutes||[]).filter(x=>x.debut)) {
        await post(`/patients/${patientId}/cancers/${cancerId}/status-history/`,
          {cancer:cancerId,status:'rechute',status_date:r.debut},token).catch(()=>{});
      }
    }
    setSaveStep(4);

    // 5. Habitudes de vie
    for (const {key,name} of [{key:'tabac',name:'Tabagisme'},{key:'alcool',name:'Alcool'},
      {key:'sport',name:'Activité physique'},{key:'alim',name:'Alimentation'}]) {
      if (data[key]) await post(`/patients/${patientId}/habits/`,
        {patient:patientId,habit_name:name,frequency:data[key]},token).catch(()=>{});
    }
    if (data.como && data.como!=='Aucune') {
      const comos=Array.isArray(data.como)?data.como:[data.como];
      for (const c of comos.filter(x=>x&&x!=='Aucune'))
        await post(`/patients/${patientId}/risk-factors/`,
          {patient:patientId,risk_factor_name:c},token).catch(()=>{});
    }
    setSaveStep(5);
    return patient;
  }

  // ── PATCH existing patient (fusion) ────────────────────────────────────────
  async function mergePatientAndCancer(existingId, fusionData, token) {
    const nameParts=(fusionData.nom||'').trim().split(' ');
    const payload={
      first_name:     nameParts[0]||'',
      last_name:      nameParts.slice(1).join(' ')||'',
      date_naissance: fusionData.dateNaissance||'',
      phone:          fusionData.telephone||'',
      wilaya_text:    fusionData.wilaya||'',              // FIX wilaya modifier
    };
    const res=await fetch(`${API}/patients/${existingId}/`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body:JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(JSON.stringify(await res.json().catch(()=>({}))));
    const updated=await res.json();

    if (data.organe) {
      const cimCode=data.cim10_code==='__manual__'?(data.cim10_manual||''):(data.cim10_code||'');
      await post(`/patients/${existingId}/cancers/`,{
        patient:          existingId,
        ...(data.cancer_type_id ? { cancer_type: parseInt(data.cancer_type_id) } : {}),
        organe:           data.organe             || '',  // FIX organe modifier
        stade_clinique:   data.stade_clinique     || '',
        date_diagnostic:  data.date_diagnostic    || null,
        type_histologique:data.type_histologique  || '',
        cim10_code:       cimCode,
        data_source:      'manual',
      },token).catch(()=>{});
    }
    return updated;
  }

  // ── handleSave ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const missing=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
    if (missing.length){setUnc(missing);setTimeout(()=>setUnc([]),2000);return;}

    setSaving(true); setError(''); setSaveStep(0);
    const token=localStorage.getItem('access_token');
    if (!token){setError('Session expirée.');setSaving(false);return;}

    try {
      const frontErrs=[];
      if (!data.last_name?.trim())  frontErrs.push('Nom manquant');
      if (!data.first_name?.trim()) frontErrs.push('Prénom manquant');
      if (!data.date_naissance)     frontErrs.push('Date de naissance manquante');
      if (!data.sexe)               frontErrs.push('Sexe manquant');
      if (frontErrs.length){setError('Données incomplètes : '+frontErrs.join(', ')+'. Vérifiez la page 1.');setSaving(false);return;}

      const candidate=buildCandidate();

      const dup=await findPossibleDuplicate(candidate,token);
      if (dup){
        setDuplicateModal({existing:dup.existing,candidate});
        setSaving(false);
        return;
      }

      if (data.national_id) {
        const ninRes=await fetch(`${API}/patients/?national_id=${encodeURIComponent(data.national_id)}`,
          {headers:{Authorization:`Bearer ${token}`}});
        if (ninRes.ok) {
          const ninData=await ninRes.json();
          const list=ninData.results||(Array.isArray(ninData)?ninData:[]);
          const exact=list.find(p=>p.national_id===data.national_id);
          if (exact) {
            let full=exact;
            try {
              const dr=await fetch(`${API}/patients/${exact.id}/`,{headers:{Authorization:`Bearer ${token}`}});
              if (dr.ok) full=await dr.json();
            } catch(_){}
            setDuplicateModal({existing:normalizePatient(full),candidate});
            setSaving(false);
            return;
          }
        }
      }

      await createFullDossier(token);
      setSuccess(true);

    } catch(err) {
      const fieldLabels={first_name:'Prénom',last_name:'Nom',date_naissance:'Date de naissance',
        national_id:'NIN',sexe:'Sexe'};
      let msg='';
      if (typeof err==='object'&&err!==null) {
        const fieldErrors=Object.entries(err)
          .filter(([k])=>k!=='detail'&&k!=='non_field_errors')
          .map(([k,v])=>`${fieldLabels[k]||k}: ${Array.isArray(v)?v[0]:v}`);
        if (fieldErrors.length > 0) msg = fieldErrors.join(' | ');
        else if (err.detail) msg = err.detail;
        else if (err.non_field_errors) msg = Array.isArray(err.non_field_errors)?err.non_field_errors[0]:err.non_field_errors;
        else if (Object.keys(err).length===0) msg = 'Erreur serveur - Veuillez vérifier les données saisies';
        else msg = JSON.stringify(err);
      } else {
        msg = String(err);
      }
      setError('Erreur : '+(msg || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  // ── handleModalConfirm ──────────────────────────────────────────────────────
  const handleModalConfirm = async (fusionData, note, existingId, action='fusionner') => {
    const savedModal=duplicateModal;
    setDuplicateModal(null);

    if (action==='garder_separe') {
      setSaving(true); setError('');
      try {
        const token=localStorage.getItem('access_token');
        if (!token){setError('Session expirée.');setSaving(false);return;}
        const origNin=data.national_id;
        update({national_id:null});
        await createFullDossier(token);
        update({national_id:origNin});
        setMerged(false);
        setSuccess(true);
      } catch(e){setError('Erreur réseau.');}
      finally{setSaving(false);}
      return;
    }

    setSaving(true); setError('');
    try {
      const token=localStorage.getItem('access_token');
      if (!token){setError('Session expirée.');setSaving(false);return;}
      const fusionDataFixed={...fusionData,dateNaissance:toISODate(fusionData.dateNaissance)};
      const updated=await mergePatientAndCancer(existingId,fusionDataFixed,token);
      if (updated) {
        setMerged(true);
        const nameParts=(fusionDataFixed.nom||'').trim().split(' ');
        update({
          first_name: nameParts[0]||data.first_name,
          last_name:  nameParts.slice(1).join(' ')||data.last_name,
          date_naissance: fusionDataFixed.dateNaissance||data.date_naissance,
          phone: fusionDataFixed.telephone||data.phone,
        });
        const candidateId=savedModal?.candidate?.id;
        if (candidateId&&candidateId!==existingId) {
          await fetch(`${API}/patients/${candidateId}/`,{
            method:'DELETE',headers:{Authorization:`Bearer ${token}`},
          }).catch(()=>{});
        }
        setDossier(updated.numero_dossier||updated.id||'');
        setSuccess(true);
      }
    } catch(e){
      setError('Erreur lors de la fusion : '+e.message);
    } finally {setSaving(false);}
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <Layout currentStep={5} progress={100}>

      {success && (
        <div className="overlay">
          <div className="success-box">
            <div className="suc-icon">✓</div>
            <div className="suc-title">Patient {merged?'mis à jour':'enregistré'} !</div>
            <div className="suc-sub">
              Le dossier de <strong>{fullName}</strong> a été {merged?'fusionné/mis à jour avec succès':'créé avec succès'}.
              {!merged&&data.traitements?.length>0&&<span> {data.traitements.length} traitement(s).</span>}
              {!merged&&data.imagerie?.length>0&&<span> {data.imagerie.length} imagerie(s).</span>}
            </div>
            {dossier&&<div className="suc-num">{dossier}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button className="btn btn-ghost" onClick={()=>{reset();navigate('/page1');}}>
                ➕ Nouveau patient
              </button>
              <button className="btn btn-primary" onClick={()=>navigate('/dashboard')}>
                📋 Voir mes patients
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header">
        <div className="pg-title">
          <div className="pg-icon" style={{background:'linear-gradient(135deg,#9B59B6,#c39bd3)'}}>📋</div>
          Résumé &amp; Validation
        </div>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Donut pct={global} />
          <div className="pg-badge">Étape <b>5</b> / 5</div>
        </div>
      </div>

      <div className="sum-card">
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div className="sum-name">{fullName}</div>
            <div className="sum-meta-grid">
              <div className="sum-meta-item">Naissance : <b>{fmtDate(data.date_naissance)}</b></div>
              <div className="sum-meta-item">NIN : <b>{data.national_id||'—'}</b></div>
              <div className="sum-meta-item">Tél : <b>{data.phone||'—'}</b></div>
              <div className="sum-meta-item">Couverture : <b>{covLabels[data.couverture_sociale]||'—'}</b></div>
              <div className="sum-meta-item">Situation : <b>{famLabels[data.situation_familiale]||'—'}</b></div>
              <div className="sum-meta-item">Email : <b>{data.email||'—'}</b></div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
            <span className="badge badge-green">🩺 Nouveau dossier</span>
            {data.sexe&&<span className="badge badge-blue">{sexeLabel}</span>}
          </div>
        </div>
      </div>

      {saving&&<StepProgress steps={SAVE_STEPS} current={saveStep}/>}

      <div className="grid-2">
        <div className="col-stack">
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">🎗 Diagnostic & Cancer</div>
              <button className="d-link" onClick={()=>navigate('/page2')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="Organe"          value={data.organe} />
                <InfoItem label="Sous-type"        value={data.sous_type} />
                <InfoItem label="Stade"            value={data.stade_clinique?'Stade '+data.stade_clinique:''} />
                <InfoItem label="TNM"              value={[data.tnmT,data.tnmN,data.tnmM].filter(Boolean).join(' — ')} />
                <InfoItem label="Taille"           value={data.taille_tumorale} unit=" cm" />
                <InfoItem label="Histologie"       value={data.type_histologique} />
                <InfoItem label="Grade"            value={data.grade_histologique} />
                <InfoItem label="ER / PR / HER2"   value={[data.recepteur_er,data.recepteur_pr,data.her2].filter(Boolean).join(' / ')} />
                <InfoItem label="Date diagnostic"  value={fmtDate(data.date_diagnostic)} />
                <InfoItem label="Médecin"          value={data.medecin_diag} />
              </div>
            </div>
          </div>

          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">💊 Traitements ({data.traitements?.length||0})</div>
              <button className="d-link" onClick={()=>navigate('/page6')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              {(!data.traitements||data.traitements.length===0)?(
                <div style={{fontSize:12,color:'#94A3B8',fontStyle:'italic'}}>Aucun traitement ajouté</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {data.traitements.map((t,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',
                      alignItems:'center',padding:'8px 12px',background:'#F8FAFF',
                      borderRadius:8,border:'1px solid #E8ECF5',fontSize:12}}>
                      <span style={{fontWeight:800,color:'#334155'}}>{t.type_traitement}</span>
                      <span style={{color:'#64748B'}}>{t.protocole||'—'}</span>
                      <span style={{color:'#64748B'}}>{t.intention||'—'}</span>
                      <span style={{color:t.statut==='en_cours'?'#4A6CF7':t.statut==='termine'?'#27ae60':'#94A3B8',fontWeight:700}}>{t.statut}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SC label="Complétude par section">
            <Bar label="Infos personnelles"  pct={s1} />
            <Bar label="Diagnostic & Cancer" pct={s2} />
            <Bar label="Données biologiques" pct={s3} />
            <Bar label="Habitudes de vie"    pct={s4} />
          </SC>
        </div>

        <div className="col-stack">
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">🔬 Données biologiques</div>
              <button className="d-link" onClick={()=>navigate('/page3')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="CEA"          value={data.cea}   unit=" ng/mL" />
                <InfoItem label="CA 19-9"      value={data.ca199} unit=" U/mL"  />
                <InfoItem label="PSA"          value={data.psa}   unit=" ng/mL" />
                <InfoItem label="Biopsie"      value={data.biopsy} />
                <InfoItem label="Imagerie"     value={(data.imagerie||[]).join(', ')} />
                <InfoItem label="Comorbidités" value={data.como} />
              </div>
            </div>
          </div>

          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">🌿 Habitudes de vie</div>
              <button className="d-link" onClick={()=>navigate('/page4')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="Tabagisme"      value={data.tabac} />
                <InfoItem label="Alcool"         value={data.alcool} />
                <InfoItem label="Sport"          value={data.sport} />
                <InfoItem label="Poids"          value={data.poids}          unit=" kg" />
                <InfoItem label="Taille"         value={data.taille_patient} unit=" cm" />
                <InfoItem label="IMC"            value={data.imc?parseFloat(data.imc).toFixed(1):''} />
                <InfoItem label="Ant. familiaux" value={data.antFam} />
                <InfoItem label="Allergies"      value={data.allergies} />
              </div>
            </div>
          </div>

          {error&&(
            <div style={{padding:'12px 16px',background:'rgba(231,76,60,0.07)',
              border:'1.5px solid rgba(231,76,60,0.25)',borderRadius:10,
              fontSize:13,color:'#e74c3c',fontWeight:700,whiteSpace:'pre-wrap'}}>
              ⚠ {error}
            </div>
          )}

          <SC label="Confirmation" style={{borderColor:'rgba(74,108,247,0.3)'}}>
            {[
              {key:'c1',text:"Je certifie que les informations saisies sont exactes et correspondent au dossier médical du patient."},
              {key:'c2',text:"Le patient ou son représentant légal a donné son consentement à l'enregistrement de ces données."},
              {key:'c3',text:'Ces données seront traitées conformément à la réglementation sur la confidentialité médicale.'},
            ].map(({key,text})=>(
              <div key={key} className={`confirm-check ${unchecked.includes(key)?'unchecked':''}`}>
                <input type="checkbox" checked={checks[key]}
                  onChange={()=>setChecks(p=>({...p,[key]:!p[key]}))} />
                <span>{text}</span>
              </div>
            ))}
          </SC>
        </div>
      </div>

      <BtnRow
        onBack={()=>navigate('/page4')}
        onNext={handleSave}
        nextLabel={saving?`⏳ Étape ${saveStep+1}/${SAVE_STEPS.length}…`:'✓ Enregistrer le dossier'}
        nextClass="btn-success"
      />

      {duplicateModal&&(
        <DuplicateDetectionModal
          patientExistant={duplicateModal.existing}
          patientNouveau={duplicateModal.candidate}
          onClose={()=>setDuplicateModal(null)}
          onConfirm={(fusionData,note,existingId,action)=>
            handleModalConfirm(fusionData,note,existingId,action)
          }
        />
      )}
    </Layout>
  );
}