import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, PageHeader, BtnRow, InfoItem } from '../components/FormFields';
import DuplicateDetectionModal from '../components/DuplicateDetectionModal';

function fmtDate(str) {
  if (!str) return '—';
  try {
    // Handle ISO timestamps like 2026-02-28T13:17:37.521981+01:00
    const d = new Date(str);
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      return dd + '/' + mm + '/' + yyyy;
    }
    // Fallback: plain YYYY-MM-DD
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
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
  const filled = arr.filter(v => v && v.toString().trim()).length;
  return Math.round((filled / total) * 100);
}

function CompletionBar({ label, pct }) {
  const color = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#4A6CF7';
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

// Alias used elsewhere in JSX
const Bar = CompletionBar;

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

const SAVE_STEPS = [
  'Création du dossier patient',
  'Enregistrement du cancer',
  'Envoi des traitements',
  'Examens biologiques & imagerie',
  'Habitudes de vie & antécédents',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Page5() {
  const navigate = useNavigate();
  const { data, update, reset } = usePatient();
  const [duplicateModal, setDuplicateModal] = useState(null);
  const [merged, setMerged] = useState(false);
  const [saveStep, setSaveStep] = useState(0);
  const [checks, setChecks]       = useState({ c1: false, c2: false, c3: false });
  const [unchecked, setUnchecked] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [createdDossier, setCreatedDossier] = useState('');
  const [showError, setShowError] = useState('');
  const [mergedFlag, setMergedFlag] = useState(false);

  // ── Scores de complétude ─────────────────────────────────────────────────
  const s1 = score([data.first_name, data.last_name, data.date_naissance, data.sexe, data.phone, data.national_id], 6);
  const s2 = score([data.organe, data.stade_clinique, data.date_diagnostic, data.tnmT], 4);
  const s3 = score([data.cea, data.ca199, data.biopsy, data.imagerie?.length ? 'x' : ''], 4);
  const s4 = score([data.tabac, data.alcool, data.sport, data.antFam], 4);
  const global = Math.round((s1+s2+s3+s4)/4);

  const fullName = `${data.prenom || '—'} ${data.nom || '—'}`;

  const covLabels = { cnas: 'CNAS', casnos: 'CASNOS', pmsr: 'PMSR', aucune: 'Aucune', autre: 'Autre' };
  const famLabels = { celibataire: 'Célibataire', marie: 'Marié(e)', divorce: 'Divorcé(e)', veuf: 'Veuf / Veuve' };
  const sexeLabel = data.sexe === 'M' ? '♂ Masculin' : data.sexe === 'F' ? '♀ Féminin' : '';

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  // ── SAVE — envoie vraiment les données au backend ─────────────────────────
  const handleSave = async () => {
    // 1. Vérifier les checkboxes
    const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      setUnchecked(missing);
      setTimeout(() => setUnchecked([]), 2000);
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setSaveError('Session expirée. Veuillez vous reconnecter.');
        setSaving(false);
        return;
      }

      // ── 2. Créer le patient ──────────────────────────────────────
      const patientPayload = {
        first_name:          data.first_name,
        last_name:           data.last_name,
        date_naissance:      data.date_naissance,
        sexe:                data.sexe,                    // 'M' ou 'F'
        situation_familiale: data.situation_familiale || '',
        couverture_sociale:  data.couverture_sociale  || '',
        profession:          data.profession          || '',
        phone:               data.phone               || '',
        email:               data.email               || '',
        adresse:             data.adresse             || '',
        national_id:         data.national_id         || null,
        data_source:         'manual',
        ...(data.commune_id  ? { commune:  parseInt(data.commune_id)  } : {}),
        ...(data.hospital_id ? { hospital: parseInt(data.hospital_id) } : {}),
        ...(data.commune && !data.commune_id ? { commune_text: data.commune } : {}),
        ...(data.wilaya ? { wilaya_text: data.wilaya } : {}),
      };

      setSaveStep(0);
      // create patient
      const patientRes = await fetch(`http://localhost:8000/api/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patientPayload),
      });
      if (!patientRes.ok) {
        const e = await patientRes.json().catch(() => ({}));
        throw e;
      }
      const patient = await patientRes.json();
      setCreatedDossier(patient.numero_dossier || '');
      setSaveStep(1);

      // ── 3. Créer le cancer si organe renseigné ────────────────────
      if (data.organe) {
        const cancerPayload = {
          patient:             patient.id,
          ...(data.cancer_type_id ? { cancer_type: parseInt(data.cancer_type_id) } : {}),
          ...(data.organe ? { organe: data.organe } : {}),
          type_tumeur:         normalizeTypeTumeur(data.type_tumeur) || '',
          sous_type:           data.sous_type          || '',
          lateralite:          data.lateralite         || '',
          cim10_code:          (data.cim10_code || data.cim10_manual) || '',
          date_symptomes:      data.date_symptomes     || null,
          date_diagnostic:     data.date_diagnostic    || null,
          base_diagnostic:     data.base_diagnostic    || [],
          etablissement_diag:  data.etablissement_diag || '',
          service_diag:        data.service_diag       || '',
          medecin_diag:        data.medecin_diag       || '',
          type_histologique:   data.type_histologique  || '',
          grade_histologique:  data.grade_histologique || '',
          grade:               data.grade_histologique ? data.grade_histologique.substring(0, 1) : '',
          bloc_anapath:        data.bloc_anapath       || '',
          stade_clinique:      data.stade_clinique     || '',
          stade_pathologique:  data.stade_pathologique || '',
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
        };

        await fetch(`http://localhost:8000/api/patients/${patient.id}/cancers/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cancerPayload),
        });
        setSaveStep(2);
      }

      // ── 4. Succès ─────────────────────────────────────────────────
      setShowSuccess(true);

    } catch (err) {
      // Message d'erreur détaillé selon le champ Django
      const fieldLabels = {
        first_name:'Prénom', last_name:'Nom', date_naissance:'Date de naissance',
        national_id:'NIN', sexe:'Sexe', type_tumeur:'Type de tumeur',
        recepteur_er:'Récepteur ER', recepteur_pr:'Récepteur PR',
      };
      let msg = '';
      if (typeof err === 'object' && err !== null) {
        const parts = Object.entries(err)
          .filter(([k])=>k!=='detail'&&k!=='non_field_errors')
          .map(([k,v])=>`${fieldLabels[k]||k}: ${Array.isArray(v)?v[0]:v}`);
        msg = parts.join(' | ') || err.detail || err.non_field_errors?.[0] || JSON.stringify(err);
      } else msg = String(err);
      setSaveError('Erreur : ' + msg);
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

  // Simple helper to create a patient (and optionally associated cancer later)
  async function createPatientAndCancer(patientPayload, token, forceCreate = false) {
    const res = await fetch(`http://localhost:8000/api/patients/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patientPayload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw err;
    }
    return await res.json();
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

    // ── Garder séparément → force create new patient ──────────────────────────
    if (action === 'garder_separe') {
      setSaving(true);
      setSaveError('');
      try {
        const token = localStorage.getItem('access_token');
        if (!token) { setSaveError('Session expirée.'); setSaving(false); return; }
        const patientPayload = {
          first_name:     data.prenom     || '',
          last_name:      data.nom        || '',
          date_naissance: data.dob        || '',
          sexe:           data.sexe?.includes('Masculin') ? 'M' : 'F',
          phone:          data.tel        || '',
          national_id:    null,
          data_source:    'manual',
        };
        const created = await createPatientAndCancer(patientPayload, token, true);
        if (created) { setShowSuccess(true); setCreatedDossier(created.numero_dossier || ''); }
      } catch(e) {
        setSaveError('Erreur réseau.');
      } finally { setSaving(false); }
      return;
    }

    // ── Fusionner → PATCH existing patient ────────────────────────────────────
    setSaving(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { setSaveError('Session expirée.'); setSaving(false); return; }

      console.log('[MERGE] existingId:', existingId);
      console.log('[MERGE] fusionData.dateNaissance:', fusionData.dateNaissance);
      console.log('[MERGE] savedModal:', savedModal);

      // Convert display date → ISO for API
      const fusionDataFixed = {
        ...fusionData,
        dateNaissance: toISODate(fusionData.dateNaissance),
      };

      console.log('[MERGE] fusionDataFixed.dateNaissance:', fusionDataFixed.dateNaissance);
      console.log('[MERGE] PATCH URL: /api/patients/' + existingId + '/');

      const updated = await mergePatientAndCancer(existingId, fusionDataFixed, token, {
        _rawCancers: [],
      });
      if (updated) {
        setMerged(true);
        const nameParts = (fusionDataFixed.nom || '').trim().split(' ');
        update({
          prenom:      nameParts[0]                  || data.prenom,
          nom:         nameParts.slice(1).join(' ')  || data.nom,
          dob:         fusionDataFixed.dateNaissance || data.dob,
          tel:         fusionDataFixed.telephone     || data.tel,
          wilaya:      fusionDataFixed.wilaya        || data.wilaya,
          commune:     fusionDataFixed.commune       || data.commune,
          medecin:     fusionDataFixed.medecin       || data.medecin,
        });

        // ── If candidate was a pre-existing DB patient (has an id different
        // from existingId), DELETE it so only one record remains ────────────
        const candidateId = savedModal?.candidate?.id;
        if (candidateId && candidateId !== existingId) {
          try {
            await fetch(`http://localhost:8000/api/patients/${candidateId}/`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log('[MERGE] Deleted duplicate candidate id:', candidateId);
          } catch(delErr) {
            console.warn('[MERGE] Could not delete candidate:', delErr);
          }
        }

        console.log('[MERGE] Fusion OK — patient', existingId, 'updated:', updated.numero_dossier);
        setShowSuccess(true);
        setCreatedDossier(updated.numero_dossier || updated.id || '');
      }
    } catch (e) {
      console.error(e);
      setSaveError('Erreur réseau. Vérifiez que le serveur Django est lancé.');
    } finally {
      setSaving(false);
    }
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <Layout currentStep={5} progress={100}>

      {/* SUCCESS */}
      {showSuccess && (
        <div className="overlay">
          <div className="success-box">
            <div className="suc-icon">✓</div>
            <div className="suc-title">Patient enregistré !</div>
            <div className="suc-sub">
              Le dossier de <strong>{fullName}</strong> a été créé avec succès.
            </div>
            {createdDossier && <div className="suc-num">{createdDossier}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="btn btn-ghost" onClick={() => { reset(); navigate('/page1'); }}>
                ➕ Nouveau patient
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                📋 Voir mes patients
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pg-header">
        <div className="pg-title">
          <div className="pg-icon" style={{ background:'linear-gradient(135deg,#9B59B6,#c39bd3)' }}>📋</div>
          Résumé &amp; Validation
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Donut pct={global} />
          <div className="pg-badge">Étape <b>5</b> / 5</div>
        </div>
      </div>

      {/* Patient card */}
      <div className="sum-card">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
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
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
            <span className="badge badge-green">🩺 Nouveau dossier</span>
            {data.sexe && <span className="badge badge-blue">{sexeLabel}</span>}
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      {saving && <StepProgress steps={SAVE_STEPS} current={saveStep} />}

      <div className="grid-2">
        <div className="col-stack">

          {/* Diagnostic */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">🎗 Diagnostic & Cancer</div>
              <button className="d-link" onClick={() => navigate('/page2')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="Organe"          value={data.organe} />
                <InfoItem label="Sous-type"        value={data.sous_type} />
                <InfoItem label="Stade"            value={data.stade_clinique ? 'Stade '+data.stade_clinique : ''} />
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

          {/* Traitements */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">💊 Traitements ({data.traitements?.length||0})</div>
              <button className="d-link" onClick={() => navigate('/page6')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              {(!data.traitements||data.traitements.length===0) ? (
                <div style={{ fontSize:12, color:'#94A3B8', fontStyle:'italic' }}>Aucun traitement ajouté</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {data.traitements.map((t,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'8px 12px', background:'#F8FAFF',
                      borderRadius:8, border:'1px solid #E8ECF5', fontSize:12 }}>
                      <span style={{ fontWeight:800, color:'#334155' }}>{t.type_traitement}</span>
                      <span style={{ color:'#64748B' }}>{t.protocole||'—'}</span>
                      <span style={{ color:'#64748B' }}>{t.intention||'—'}</span>
                      <span style={{ color:t.statut==='en_cours'?'#4A6CF7':t.statut==='termine'?'#27ae60':'#94A3B8', fontWeight:700 }}>{t.statut}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Complétude */}
          <SC label="Complétude par section">
            <Bar label="Infos personnelles"  pct={s1} />
            <Bar label="Diagnostic & Cancer" pct={s2} />
            <Bar label="Données biologiques" pct={s3} />
            <Bar label="Habitudes de vie"    pct={s4} />
          </SC>
        </div>

        <div className="col-stack">

          {/* Biologie */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">🔬 Données biologiques</div>
              <button className="d-link" onClick={() => navigate('/page3')}>Modifier ↗</button>
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

          {/* Habitudes */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">🌿 Habitudes de vie</div>
              <button className="d-link" onClick={() => navigate('/page4')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              <div className="info-grid">
                <InfoItem label="Tabagisme"      value={data.tabac} />
                <InfoItem label="Alcool"         value={data.alcool} />
                <InfoItem label="Sport"          value={data.sport} />
                <InfoItem label="Poids"          value={data.poids}          unit=" kg" />
                <InfoItem label="Taille"         value={data.taille_patient} unit=" cm" />
                <InfoItem label="IMC"            value={data.imc ? parseFloat(data.imc).toFixed(1) : ''} />
                <InfoItem label="Ant. familiaux" value={data.antFam} />
                <InfoItem label="Allergies"      value={data.allergies} />
              </div>
            </div>
          </div>

          {/* Erreur */}
          {saveError && (
            <div style={{ padding:'12px 16px', background:'rgba(231,76,60,0.07)',
              border:'1.5px solid rgba(231,76,60,0.25)', borderRadius:10,
              fontSize:13, color:'#e74c3c', fontWeight:700, whiteSpace:'pre-wrap' }}>
              ⚠ {saveError}
            </div>
          )}

          {/* Confirmation */}
          <SC label="Confirmation" style={{ borderColor:'rgba(74,108,247,0.3)' }}>
            {[
              { key:'c1', text:"Je certifie que les informations saisies sont exactes et correspondent au dossier médical du patient." },
              { key:'c2', text:"Le patient ou son représentant légal a donné son consentement à l'enregistrement de ces données." },
              { key:'c3', text:'Ces données seront traitées conformément à la réglementation sur la confidentialité médicale.' },
            ].map(({ key, text }) => (
              <div key={key} className={`confirm-check ${unchecked.includes(key)?'unchecked':''}`}>
                <input type="checkbox" checked={checks[key]}
                  onChange={() => setChecks(p => ({ ...p, [key]: !p[key] }))} />
                <span>{text}</span>
              </div>
            ))}
          </SC>
        </div>
      </div>

      <BtnRow
        onBack={() => navigate('/page4')}
        onNext={handleSave}
        nextLabel={saving ? `⏳ Étape ${saveStep+1}/${SAVE_STEPS.length}…` : '✓ Enregistrer le dossier'}
        nextClass="btn-success"
      />

      {/* Duplicate modal */}
      {duplicateModal && (
        <DuplicateDetectionModal
          patientExistant={duplicateModal.existing}
          patientNouveau={duplicateModal.candidate}
          onClose={() => setDuplicateModal(null)}
          onConfirm={(fusionData, note, existingId, action) =>
            handleModalConfirm(fusionData, note, existingId, action)
          }
        />
      )}
    </Layout>
  );
}