import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, PageHeader, BtnRow, InfoItem } from '../components/FormFields';
import DuplicateDetectionModal from '../components/DuplicateDetectionModal';

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
  // count any value that is not undefined/null and not just whitespace
  // (including "0" which JS treats as falsy).
  const filled = arr.filter(v => {
    if (v === null || v === undefined) return false;
    const s = v.toString();
    return s.trim() !== '';
  }).length;
  // protect against bad totals
  if (!total) return 0;
  return Math.round((filled / total) * 100);
}

// normalize patient object to match modal/duplication helpers
function normalizePatient(p) {
  // ── Cancers ───────────────────────────────────────────────────────────────
  // Detail endpoint  → p.cancers = [{cancer_type_name, stade_clinique, treatments:[...]}]
  // List  endpoint   → p.dernier_cancer = {organe, stade} (résumé du dernier cancer)
  // Form context     → p.cancers already array of strings or undefined
  const rawCancers = Array.isArray(p.cancers) ? p.cancers : [];

  // Helper: clean dash placeholder from backend
  const cleanDash = (v) => (!v || v === '—' || v === '-') ? '' : v;

  const cancers = rawCancers.length > 0
    ? rawCancers.map(c => {
        if (typeof c === 'string') return c;
        // Detail API: {cancer_type_name, stade_clinique}
        // cancer_type_name is '' when cancer_type FK is null in DB
        const name  = cleanDash(c.cancer_type_name)
          || (typeof c.cancer_type === 'string' ? cleanDash(c.cancer_type) : '')
          || cleanDash(c.organe) || cleanDash(c.name) || '';
        const stade = cleanDash(c.stade_clinique || c.stade_pathologique || c.stade || '');
        if (!name && !stade) return null;
        // If no name but stade exists → meaningful label
        const label = name
          ? (stade ? name + ' (Stade ' + stade + ')' : name)
          : (stade ? 'Cancer Stade ' + stade : null);
        return label;
      }).filter(Boolean)
    : (() => {
        // Fallback A: dernier_cancer from list serializer
        // Backend returns '—' (dash) when cancer_type is null
        const dc = p.dernier_cancer;
        if (dc) {
          const name  = cleanDash(dc.organe || dc.cancer_type_name || dc.name || '');
          const stade = cleanDash(dc.stade  || dc.stade_clinique || '');
          const label = name
            ? (stade ? name + ' (Stade ' + stade + ')' : name)
            : (stade ? 'Cancer Stade ' + stade : '');
          if (label.trim()) return [label];
        }
        // Fallback B: PatientContext form data (data.organe + data.stade)
        const organe = cleanDash(p.organe || '');
        const stade  = cleanDash(p.stade  || '');
        if (organe) return [stade ? organe + ' (Stade ' + stade + ')' : organe];
        return [];
      })();

  // ── Traitements ───────────────────────────────────────────────────────────
  // Detail API: nested c.treatments = [{type_traitement, protocole}]
  const nestedTrt = rawCancers.flatMap(c =>
    typeof c === 'object' && Array.isArray(c.treatments) ? c.treatments : []
  );
  const rawTrt = Array.isArray(p.traitements) ? p.traitements : [];
  // Fallback: PatientContext form fields trtAnt / trtActuel
  const formTrt = [p.trtAnt, p.trtActuel].filter(Boolean);
  const traitements = [...rawTrt, ...nestedTrt, ...formTrt].map(t => {
    if (typeof t === 'string') return cleanDash(t);
    return cleanDash(t.type_traitement || t.protocole || t.name || '');
  }).filter(Boolean);

  // ── Geo ───────────────────────────────────────────────────────────────────
  // PatientDetailSerializer:  wilaya_name = commune.wilaya.name
  // PatientListSerializer:    wilaya_name = commune.wilaya.name  (same)
  // PatientContext form:      wilaya is a string (name chosen by user)
  const wilaya = cleanDash(
    p.wilaya_name
    || (p.commune && typeof p.commune === 'object' && p.commune.wilaya
        ? (p.commune.wilaya.name || '') : '')
    || (typeof p.wilaya === 'string' ? p.wilaya : '')
    || ''
  );
  const commune = cleanDash(
    p.commune_name
    || (p.commune && typeof p.commune === 'object' ? (p.commune.name || '') : '')
    || (typeof p.commune === 'string' ? p.commune : '')
    || ''
  );
  const medecin = p.medecin_nom || p.medecin || '';

  return {
    id: p.id,
    nin: p.national_id || p.nin || '',
    nom: p.last_name
      ? ((p.first_name || '') + ' ' + p.last_name).trim()
      : p.nom || ((p.first_name || '') + ' ' + (p.prenom || '')).trim(),
    dateNaissance: p.date_naissance || p.dateNaissance || p.dob || '',
    telephone: p.phone || p.telephone || p.tel || '',
    wilaya,
    commune,
    medecin,
    cancers,
    traitements,
    age:  p.age  || '',
    // Format cree date — remove ISO noise
    cree: fmtDate(cleanDash(p.created_at || p.cree || '')),
  };
}

// ── Fuzzy similarity helpers (same logic as DuplicateDetectionModal) ────────
function normStr(s = '') {
  return s.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}
function strSim(a, b) {
  if (!a || !b) return 0;
  const na = normStr(a), nb = normStr(b);
  if (na === nb) return 100;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 100;
  return Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}
function dateSim(d1, d2) {
  if (!d1 || !d2) return 0;
  try {
    const t1 = new Date(d1), t2 = new Date(d2);
    if (isNaN(t1) || isNaN(t2)) return normStr(d1) === normStr(d2) ? 100 : 0;
    const diffDays = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24);
    if (diffDays === 0) return 100;
    if (diffDays <= 7) return 80;
    if (diffDays <= 365) return 30;
    return 0;
  } catch { return 0; }
}

// compute similarity percentage between two normalized patients (weighted)
function computeSimilarity(a, b) {
  const fields = [
    { name: 'nin',           weight: 3, fn: (v1, v2) => normStr(v1) === normStr(v2) ? 100 : 0 },
    { name: 'nom',           weight: 2, fn: strSim },
    { name: 'dateNaissance', weight: 2, fn: dateSim },
    { name: 'telephone',     weight: 2, fn: (v1, v2) => {
      const t1 = (v1 || '').replace(/\D/g, '');
      const t2 = (v2 || '').replace(/\D/g, '');
      if (!t1 || !t2) return 0;
      return t1 === t2 ? 100 : strSim(t1, t2);
    }},
    { name: 'wilaya',        weight: 1, fn: strSim },
  ];
  let totalWeight = 0, score = 0;
  fields.forEach((f) => {
    totalWeight += f.weight;
    const va = a[f.name], vb = b[f.name];
    if (va && vb) score += f.fn(va, vb) * f.weight;
  });
  if (totalWeight === 0) return 0;
  return Math.round(score / totalWeight);
}

// search for similar existing patient; returns {existing, score} if one >50%
async function findPossibleDuplicate(candidate, token) {
  try {
    const q = encodeURIComponent(candidate.nom || '');
    // Search list (lightweight)
    const res = await fetch(`http://localhost:8000/api/patients/?search=${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list = data.results || data;

    // Find best match by score
    let bestRaw = null, bestScore = 0;
    list.forEach((raw) => {
      const ex = normalizePatient(raw);
      const s = computeSimilarity(ex, candidate);
      if (s > bestScore) { bestScore = s; bestRaw = raw; }
    });
    if (bestScore <= 50 || !bestRaw) return null;

    // Fetch full detail to get cancers + treatments nested
    try {
      const detailRes = await fetch(`http://localhost:8000/api/patients/${bestRaw.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        return { existing: normalizePatient(detail), score: bestScore };
      }
    } catch (_) {}

    // Fallback to list version
    return { existing: normalizePatient(bestRaw), score: bestScore };
  } catch (e) {
    console.warn('duplicate lookup failed', e);
    return null;
  }
}

function CompletionBar({ label, pct }) {
  return (
    <div className="cbar-item">
      <div className="cbar-label">{label}</div>
      <div className="cbar-track">
        <div className="cbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="cbar-pct">{pct}%</div>
    </div>
  );
}

function Donut({ pct }) {
  const r = 23;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div className="donut-wrap">
        <svg width="58" height="58" viewBox="0 0 58 58">
          <circle cx="29" cy="29" r={r} fill="none" stroke="#DDE4F3" strokeWidth="5.5" />
          <circle cx="29" cy="29" r={r} fill="none" stroke="#4A6CF7" strokeWidth="5.5"
            strokeDasharray={`${circ.toFixed(2)}`}
            strokeDashoffset={offset.toFixed(2)}
            strokeLinecap="round" />
        </svg>
        <div className="donut-label">{pct}%</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Complétude
      </div>
    </div>
  );
}

export default function Page5() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const [checks, setChecks]       = useState({ c1: false, c2: false, c3: false });
  const [unchecked, setUnchecked] = useState([]);
  const [unc, setUnc] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [merged, setMerged] = useState(false); // indicates if we updated existing
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [error, setError]         = useState('');
  const [saveStep, setSaveStep]   = useState(0);
  const [createdDossier, setCreatedDossier] = useState('');

  // Compute scores
  const s1 = score([data.nom, data.prenom, data.dob, data.tel, data.sexe, data.wilaya, data.couverture], 7);
  const s2 = score([data.typeT, data.organe, data.histo, data.stade, data.taille, data.diagDate], 6);
  const s3 = score([data.cea, data.ca199, data.nfs, data.biopsy, data.como], 5);
  const s4 = score([data.tabac, data.alcool, data.sport, data.poids, data.antFam, data.trtAnt], 6);
  const global = Math.round((s1 + s2 + s3 + s4) / 4);

  const fullName = `${data.prenom || '—'} ${data.nom || '—'}`;

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  // Duplicate modal state
  const [duplicateModal, setDuplicateModal] = useState(null);
  const API = 'http://localhost:8000/api';
  const covLabels = { cnss: 'CNSS', rss: 'RSS', prive: 'Privé', aucune: 'Aucune' };
  const famLabels = { celibataire: 'Célibataire', marie: 'Marié(e)', veuf: 'Veuf(ve)', divorce: 'Divorcé(e)' };

  function buildCandidate() {
    return normalizePatient({
      ...data,
      first_name: data.prenom || data.first_name || '',
      last_name: data.nom || data.last_name || '',
    });
  }

  // helper that performs the actual creation (called after duplicate check / confirm)
  async function createPatientAndCancer(patientPayload, token, skipDuplicateCheck = false) {
    try {
      const patRes = await fetch('http://localhost:8000/api/patients/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patientPayload),
      });

      if (!patRes.ok) {
        const err = await patRes.json();
        console.error('Erreur patient:', err);

        // Detect NIN duplicate — French ("existe déjà") OR English ("already exists")
        const errMsg = JSON.stringify(err).toLowerCase();
        const isNINDuplicate = !skipDuplicateCheck && (
          errMsg.includes('national_id') ||
          errMsg.includes('existe') ||
          errMsg.includes('exist') ||
          errMsg.includes('déjà') ||
          errMsg.includes('deja') ||
          errMsg.includes('unique')
        );

        if (isNINDuplicate && patientPayload.national_id) {
          // Always try to open the modal — never show raw error for NIN conflict
          try {
            const existingRes = await fetch(
              `http://localhost:8000/api/patients/?national_id=${encodeURIComponent(patientPayload.national_id)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (existingRes.ok) {
              const existingData = await existingRes.json();
              const existingRaw = existingData.results?.[0] || existingData[0];
              if (existingRaw) {
                let fullExisting = existingRaw;
                try {
                  const detailRes = await fetch(
                    `http://localhost:8000/api/patients/${existingRaw.id}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  if (detailRes.ok) fullExisting = await detailRes.json();
                } catch (_) {}

                const existing = normalizePatient(fullExisting);
                const candidate = normalizePatient({
                  ...data,
                  first_name: data.prenom || data.first_name || '',
                  last_name:  data.nom    || data.last_name  || '',
                });
                setDuplicateModal({ existing, candidate });
                return null;  // stop here — modal handles the rest
              }
            }
          } catch (fetchErr) {
            console.warn('Could not fetch existing patient:', fetchErr);
          }
          // If fetch failed, show friendly message instead of raw error
          setSaveError('Un patient avec ce NIN existe déjà. Veuillez vérifier.');
          return null;
        }

        // Other errors (date, validation, etc.)
        const msg = err.date_naissance?.[0] || err.detail || Object.values(err).flat()[0] || JSON.stringify(err);
        setSaveError('Erreur : ' + msg);
        return null;
      }

      const patient = await patRes.json();
      setCreatedDossier(patient.numero_dossier || '');

      // create cancer if applicable
      if (data.organe) {
        const cancerPayload = {
          patient:         patient.id,
          stade_clinique:  data.stade    || '',
          tnm:             [data.tnmT, data.tnmN, data.tnmM].filter(Boolean).join(''),
          grade:           data.grade    || '',
          date_diagnostic: data.diagDate || null,
        };

        await fetch(`http://localhost:8000/api/patients/${patient.id}/cancers/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cancerPayload),
        });
      }

      return patient;
    } catch (e) {
      console.error(e);
      setSaveError('Erreur réseau. Vérifiez que le serveur Django est lancé.');
      return null;
    }
  }

  // ── SAVE — envoie vraiment les données au backend (avec contrôle doublon) ──
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

      const patientPayload = {
        first_name:     data.prenom        || '',
        last_name:      data.nom           || '',
        date_naissance: data.dob           || '',
        sexe:           data.sexe?.includes('Masculin') ? 'M' : 'F',
        phone:          data.tel           || '',
        national_id:    data.nin           || null,
        data_source:    'manual',
      };
      // commune is free-text in form, not a FK integer — don't send to backend

      // Try to create the patient
      // If a duplicate is detected (national_id exists), the function will show the modal and return null
      const created = await createPatientAndCancer(patientPayload, token);
      if (created) setShowSuccess(true);

    } catch (err) {
      console.error(err);
      setSaveError('Erreur réseau. Vérifiez que le serveur Django est lancé.');
    } finally {
      setSaving(false);
    }
  };

  // Handler when modal confirm: proceed with creation (force)
  // helper to update an existing patient based on fusion data
  async function mergePatientAndCancer(existingId, fusionData, token, candidateData) {
    // ── 1. PATCH patient fields ───────────────────────────────────────────────
    const nameParts = (fusionData.nom || '').trim().split(' ');
    // Only send fields that don't require FK lookup
    // commune requires integer PK — skip it to avoid 400 error
    // (commune stays as-is on existing patient)
    const payload = {
      first_name:     nameParts[0] || '',
      last_name:      nameParts.slice(1).join(' ') || '',
      date_naissance: fusionData.dateNaissance || '',
      phone:          fusionData.telephone || '',
    };

    // commune is a free-text field in the form (not an FK integer)
    // → never send it in PATCH to avoid 400 "attendait clé primaire" error

    console.log('[PATCH] payload:', JSON.stringify(payload));
    console.log('[PATCH] to patient id:', existingId);
    const res = await fetch(`http://localhost:8000/api/patients/${existingId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[PATCH] FAILED:', err);
      throw new Error(JSON.stringify(err));
    }
    console.log('[PATCH] SUCCESS status:', res.status);
    const updatedPatient = await res.json();

    // ── 2. Merge cancers — fetch existing, add missing ────────────────────────
    if (fusionData.cancers && fusionData.cancers.length > 0) {
      try {
        const cRes = await fetch(`http://localhost:8000/api/patients/${existingId}/cancers/`,
          { headers: { Authorization: `Bearer ${token}` } });
        if (cRes.ok) {
          const existingCancers = await cRes.json();
          // Existing cancer names (normalized)
          const existingNames = existingCancers.map(c =>
            (c.cancer_type_name || '').toLowerCase().trim()
          );
          for (const label of fusionData.cancers) {
            // label may be "Leucémie (Stade II)" — extract name part
            const namePart = label.replace(/\s*\(.*\)$/, '').toLowerCase().trim();
            if (existingNames.includes(namePart)) continue; // already exists

            // Find matching CancerType id from candidateData raw cancers
            const matchRaw = (candidateData?._rawCancers || []).find(c => {
              const n = (c.cancer_type_name || c.organe || '').toLowerCase().trim();
              return n === namePart;
            });
            if (matchRaw?.cancer_type) {
              await fetch(`http://localhost:8000/api/patients/${existingId}/cancers/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  cancer_type:     matchRaw.cancer_type,
                  stade_clinique:  matchRaw.stade_clinique || '',
                  tnm:             matchRaw.tnm || '',
                  grade:           matchRaw.grade || '',
                  date_diagnostic: matchRaw.date_diagnostic || null,
                }),
              });
            }
          }
        }
      } catch(e) { console.warn('Cancer merge warning:', e); }
    }

    return updatedPatient;
  }

  // ── Helper: convert DD/MM/YYYY → YYYY-MM-DD for API ─────────────────────────
  function toISODate(str) {
    if (!str) return '';
    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split('T')[0];
    // DD/MM/YYYY
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return str;
  }

  // action: 'fusionner' | 'garder_separe'
  const handleModalConfirm = async (fusionData, note, existingId, action = 'fusionner') => {
    // Save modal data BEFORE closing (duplicateModal will be null after)
    const savedModal = duplicateModal;
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
          setShowSuccess(true);
      } catch(e){setError('Erreur réseau.');}
      finally{setSaving(false);}
      return;
    }

    async function createFullDossier(token) {
      // Placeholder helper for modal action « garder séparé ».
      // Implement full dossier creation if needed, or keep as a no-op for now.
      return null;
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
        setCreatedDossier(updated.numero_dossier||updated.id||'');
          setShowSuccess(true);
      }
    } catch(e){
      setError('Erreur lors de la fusion : '+e.message);
    } finally {setSaving(false);}
  };

  return (
    <Layout currentStep={5} progress={100}>
      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="overlay">
          <div className="success-box">
            <div className="suc-icon">✓</div>
            <div className="suc-title">Patient {merged ? 'mis à jour' : 'enregistré'} !</div>
            <div className="suc-sub">
              Le dossier de <strong>{fullName}</strong> a été {merged ? 'fusionné/mis à jour' : 'créé'} avec succès.
            </div>
            {createdDossier && <div className="suc-num">{createdDossier}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => {
                // Reset form et retourner page1
                update({
                  nom: '', prenom: '', dob: '', age: '', nin: '',
                  tel: '', email: '', sexe: '', famille: '',
                  wilaya: '', commune: '', adresse: '', couverture: '', profession: '',
                  typeT: '', organe: '', lat: '', topo: '', stade: '',
                  tnmT: 'T0', tnmN: 'N0', tnmM: 'M0',
                  localise: true, metastatique: false, recidive: false,
                  diagDate: '', consultDate: '', histo: '', grade: '',
                  taille: '', recepteurs: '', service: '', medecin: '',
                  trtActuel: '', dernier_rdv: '', sous_type: '',
                });
                navigate('/page1');
              }}>
                ➕ Nouveau patient
              </button>
              <button className="btn btn-primary" onClick={()=>navigate('/dashboard')}>
                📋 Voir mes patients
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pg-header">
        <div className="pg-title">
          <div className="pg-icon" style={{ background: 'linear-gradient(135deg,#9B59B6,#c39bd3)' }}>📋</div>
          Résumé &amp; Validation
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Donut pct={global} />
          <div className="pg-badge">Étape <b>5</b> / 5</div>
        </div>
      </div>

      {/* PATIENT SUMMARY CARD */}
      <div className="sum-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span className="badge badge-green">🩺 Nouveau dossier</span>
            {data.sexe && <span className="badge badge-blue">{data.sexe}</span>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="col-stack">
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title"><span>🎗</span> Diagnostic &amp; Cancer</div>
              <button className="d-link" onClick={() => navigate('/page2')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="Type de tumeur" value={data.typeT} />
                <InfoItem label="Organe" value={data.organe} />
                <InfoItem label="Sous-type" value={data.sous_type} />
                <InfoItem label="Histologie" value={data.histo} />
                <InfoItem label="Stade" value={data.stade ? 'Stade ' + data.stade : ''} />
                <InfoItem label="TNM" value={[data.tnmT, data.tnmN, data.tnmM].filter(Boolean).join(' – ')} />
                <InfoItem label="Taille tumorale" value={data.taille} unit=" cm" />
                <InfoItem label="Récepteurs" value={data.recepteurs} />
                <InfoItem label="Date diagnostic" value={data.diagDate ? fmtDate(data.diagDate) : ''} />
                <InfoItem label="Dernier RDV" value={data.dernier_rdv ? fmtDate(data.dernier_rdv) : ''} />
              </div>
            </div>
          </div>

          {/* Biologique */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title"><span>🔬</span> Données biologiques</div>
              <button className="d-link" onClick={() => navigate('/page3')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="CEA" value={data.cea} unit=" ng/mL" />
                <InfoItem label="CA 19-9" value={data.ca199} unit=" U/mL" />
                <InfoItem label="PSA" value={data.psa} unit=" ng/mL" />
                <InfoItem label="Biopsie" value={data.biopsy} />
                <InfoItem label="Comorbidités" value={data.como} />
                <InfoItem label="Imagerie" value={(data.imagerie || []).join(', ')} />
              </div>
            </div>
          </div>

          {/* Completion bars */}
          <SC label="Complétude par section">
            <CompletionBar label="Infos personnelles" pct={s1} />
            <CompletionBar label="Diagnostic & Cancer" pct={s2} />
            <CompletionBar label="Données biologiques" pct={s3} />
            <CompletionBar label="Habitudes de vie" pct={s4} />
          </SC>
        </div>

        {/* RIGHT */}
        <div className="col-stack">

          {/* Habitudes */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title"><span>🌿</span> Habitudes de vie</div>
              <button className="d-link" onClick={() => navigate('/page4')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="Tabagisme" value={data.tabac} />
                <InfoItem label="Alcool" value={data.alcool} />
                <InfoItem label="Activité physique" value={data.sport} />
                <InfoItem label="IMC" value={data.imc ? parseFloat(data.imc).toFixed(1) : ''} />
                <InfoItem label="Poids" value={data.poids} unit=" kg" />
                <InfoItem label="Alimentation" value={data.alim} />
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="info-key" style={{ marginBottom: 6 }}>Antécédents familiaux</div>
                <div className={`info-val ${!data.antFam ? 'empty' : ''}`}>{data.antFam || 'Non renseigné'}</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="info-key" style={{ marginBottom: 6 }}>Traitements antérieurs</div>
                <div className={`info-val ${!data.trtAnt ? 'empty' : ''}`}>{data.trtAnt || 'Non renseigné'}</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="info-key" style={{ marginBottom: 6 }}>Allergies</div>
                <div className={`info-val ${!data.allergies ? 'empty' : ''}`}>{data.allergies || 'Non renseigné'}</div>
              </div>
            </div>
          </div>

          {/* Observations */}
          <SC label="Observations du médecin">
            <div style={{ fontSize: 13, fontWeight: 600, color: data.observations ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6, fontStyle: data.observations ? 'normal' : 'italic' }}>
              {data.observations || 'Aucune observation saisie.'}
            </div>
          </SC>

          {/* Erreur API */}
          {saveError && (
            <div style={{ background: 'rgba(255,107,107,0.1)', border: '1.5px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#FF6B6B', fontWeight: 700 }}>
              ⚠ {saveError}
            </div>
          )}

          {/* Confirmation */}
          <SC label="Confirmation avant enregistrement" style={{ borderColor: 'rgba(74,108,247,0.3)' }}>
            {[
              { key: 'c1', text: 'Je certifie que les informations saisies sont exactes et correspondent au dossier médical du patient.' },
              { key: 'c2', text: 'Le patient ou son représentant légal a donné son consentement à l\'enregistrement de ces données.' },
              { key: 'c3', text: 'Ces données seront traitées conformément à la réglementation en vigueur sur la confidentialité médicale.' },
            ].map(({ key, text }) => (
              <div key={key} className={`confirm-check ${unchecked.includes(key) ? 'unchecked' : ''}`}>
                <input type="checkbox" checked={checks[key]} onChange={() => toggleCheck(key)} />
                <span>{text}</span>
              </div>
            ))}
          </SC>
        </div>
      </div>

      <BtnRow
        onBack={()=>navigate('/page4')}
        onNext={handleSave}
        nextLabel={saving ? '⏳ Enregistrement…' : '✓ Enregistrer le patient'}
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