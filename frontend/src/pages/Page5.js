import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, BtnRow, InfoItem } from '../components/FormFields';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const API = 'http://localhost:8000/api';

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({}));
  if (res.status === 204) return null;
  return res.json();
}

function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function score(arr, total) {
  return Math.round((arr.filter(v => v && String(v).trim()).length / total) * 100);
}

/* ─── Tables de correspondance Page3 → BiologicalExam ───────────────────── */
const MARQUEURS_MAP = [
  { key: 'cea',   label: 'CEA',         unite: 'ng/mL' },
  { key: 'ca199', label: 'CA 19-9',     unite: 'U/mL'  },
  { key: 'ca125', label: 'CA 125',      unite: 'U/mL'  },
  { key: 'afp',   label: 'AFP',         unite: 'ng/mL' },
  { key: 'psa',   label: 'PSA',         unite: 'ng/mL' },
  { key: 'ca153', label: 'CA 15-3',     unite: 'U/mL'  },
];

const BILAN_MAP = [
  { key: 'nfs',   label: 'NFS',         unite: '',      numeric: false },
  { key: 'creat', label: 'Créatinine',  unite: 'mg/L',  numeric: true  },
  { key: 'ggt',   label: 'GGT',         unite: 'U/L',   numeric: true  },
  { key: 'ldh',   label: 'LDH',         unite: 'U/L',   numeric: true  },
  { key: 'hb',    label: 'Hémoglobine', unite: 'g/dL',  numeric: true  },
  { key: 'tp',    label: 'TP',          unite: '%',     numeric: true  },
];

/* ─── Composants visuels ─────────────────────────────────────────────────── */

function Bar({ label, pct }) {
  const color = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#e74c3c';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 180, fontSize: 12, fontWeight: 700, color: '#64748B' }}>{label}</div>
      <div style={{ flex: 1, height: 7, background: '#E8ECF5', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 10, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 900, color, width: 32, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

function Donut({ pct }) {
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#4A6CF7';
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E8ECF5" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color }}>
        {pct}%
      </div>
    </div>
  );
}

function StepProgress({ steps, current }) {
  return (
    <div style={{ margin: '12px 0', padding: '12px 16px', background: '#F8FAFF', border: '1.5px solid #E2E8F5', borderRadius: 10 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < steps.length - 1 ? 8 : 0 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900,
            background: i < current ? '#27ae60' : i === current ? '#4A6CF7' : '#E8ECF5',
            color: i <= current ? '#fff' : '#94A3B8',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: i === current ? '#4A6CF7' : i < current ? '#27ae60' : '#94A3B8' }}>
            {s}
          </span>
          {i === current && <span style={{ fontSize: 11, color: '#4A6CF7' }}>⏳</span>}
        </div>
      ))}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

const SAVE_STEPS = [
  'Création du dossier patient',
  'Enregistrement du cancer',
  'Envoi des traitements',
  'Examens biologiques & imagerie',
  'Habitudes de vie & antécédents',
];

export default function Page5() {
  const navigate = useNavigate();
  const { data, reset } = usePatient();
  const [saving, setSaving]     = useState(false);
  const [saveStep, setSaveStep] = useState(-1);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [dossier, setDossier]   = useState('');
  const [checks, setChecks]     = useState({ c1: false, c2: false, c3: false });
  const [unchecked, setUnc]     = useState([]);

  /* ── Scores de complétude — compatibles ancien et nouveau Page1 */
  const _fn   = data.first_name    || data.prenom || '';
  const _ln   = data.last_name     || data.nom    || '';
  const _dob  = data.date_naissance|| data.dob    || '';
  const _sex  = data.sexe || '';
  const _ph   = data.phone         || data.tel    || '';
  const _nin  = data.national_id   || data.nin    || '';

  const s1 = score([_fn, _ln, _dob, _sex, _ph, _nin], 6);
  const s2 = score([data.organe, data.stade_clinique, data.date_diagnostic, data.tnmT], 4);
  const s3 = score([data.cea, data.ca199, data.biopsy, data.imagerie?.length ? 'x' : ''], 4);
  const s4 = score([data.tabac, data.alcool, data.sport, data.antFam], 4);
  const global = Math.round((s1 + s2 + s3 + s4) / 4);

  const fullName = `${_fn || '—'} ${_ln || '—'}`;

  /* ══════════════════════════════════════════════════════════════════════
     SAVE — envoi complet vers le backend Django
     Ordre : Patient → Cancer → Traitements → BiologicalExam/ImagingExam
             → PatientHabit → Anthropométrie → Comorbidités
  ══════════════════════════════════════════════════════════════════════ */
  const handleSave = async () => {
    const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) { setUnc(missing); setTimeout(() => setUnc([]), 2000); return; }

    setSaving(true); setError(''); setSaveStep(0);
    const token = localStorage.getItem('access_token');
    if (!token) { setError('Session expirée — veuillez vous reconnecter.'); setSaving(false); return; }

    try {
      /* ── 1. Patient ──────────────────────────────────────────────────── */
      // Compatibilité ancienne / nouvelle version de Page1 :
      // Page1 ancien  → data.nom, data.prenom, data.dob, data.tel, data.nin, data.famille
      // Page1 corrigé → data.last_name, data.first_name, data.date_naissance, data.phone, data.national_id, data.situation_familiale
      const firstName       = data.first_name        || data.prenom       || '';
      const lastName        = data.last_name          || data.nom          || '';
      const dateNaissance   = data.date_naissance     || data.dob          || '';
      const phone           = data.phone              || data.tel          || '';
      const nationalId      = data.national_id        || data.nin          || null;
      const situationFam    = data.situation_familiale|| data.famille       || '';

      // Conversion sexe : supporte 'M'/'F', '♂ Masculin'/'♀ Féminin', 'Masculin'/'Féminin'
      let sexeVal = data.sexe || '';
      if (sexeVal.includes('Masculin') || sexeVal === 'M') sexeVal = 'M';
      else if (sexeVal.includes('Féminin') || sexeVal === 'F') sexeVal = 'F';
      else sexeVal = '';

      // Conversion situation familiale : supporte les anciens libellés et les nouvelles clés backend
      const famMap = {
        'Célibataire': 'celibataire', 'Marié(e)': 'marie',
        'Divorcé(e)': 'divorce',      'Veuf / Veuve': 'veuf',
      };
      const situationFamNorm = famMap[situationFam] || situationFam;

      // Validation minimale côté frontend avant d'envoyer
      const frontErrors = [];
      if (!lastName.trim())    frontErrors.push('Nom manquant');
      if (!firstName.trim())   frontErrors.push('Prénom manquant');
      if (!dateNaissance)      frontErrors.push('Date de naissance manquante');
      if (!sexeVal)            frontErrors.push('Sexe manquant');
      if (frontErrors.length) {
        setError('Données incomplètes — ' + frontErrors.join(', ') + '. Vérifiez la page 1.');
        setSaving(false);
        return;
      }

      const patientPayload = {
        first_name:          firstName,
        last_name:           lastName,
        date_naissance:      dateNaissance,
        sexe:                sexeVal,
        situation_familiale: situationFamNorm,
        profession:          data.profession || '',
        phone:               phone,
        email:               data.email || '',
        adresse:             data.adresse || '',
        national_id:         nationalId || null,
        couverture_sociale:  data.couverture_sociale || '',
        data_source:         'manual',
        ...(data.commune_id  ? { commune:  parseInt(data.commune_id)  } : {}),
        ...(data.hospital_id ? { hospital: parseInt(data.hospital_id) } : {}),
      };

      const patient = await post('/patients/', patientPayload, token);
      const patientId = patient.id;
      setDossier(patient.numero_dossier || '');
      setSaveStep(1);

      /* ── 2. Cancer ───────────────────────────────────────────────────── */
      // Compatibilité ancienne / nouvelle version de Page2 :
      // Page2 ancien  → data.histo, data.grade, data.stade, data.diagDate, data.taille, data.service, data.medecin, data.er, data.pr
      // Page2 corrigé → data.type_histologique, data.grade_histologique, data.stade_clinique, data.date_diagnostic, data.taille_tumorale, data.service_diag, data.medecin_diag, data.recepteur_er, data.recepteur_pr
      let cancerId = null;
      const hasCancer = data.organe || data.type_histologique || data.histo || data.stade_clinique || data.stade || data.date_diagnostic || data.diagDate;

      if (hasCancer) {
        const cimCode = data.cim10_code === '__manual__'
          ? (data.cim10_manual || '')
          : (data.cim10_code || '');

        // Normalisation type_tumeur : 'Hémato.' → 'hematologique', 'Solide' → 'solide', 'Liquide' → 'liquide'
        const typeTumeurRaw = data.type_tumeur || '';
        const typeTumeurMap = { 'Hémato.': 'hematologique', 'Solide': 'solide', 'Liquide': 'liquide' };
        const typeTumeurNorm = typeTumeurMap[typeTumeurRaw] || typeTumeurRaw.toLowerCase() || '';

        // Normalisation récepteurs : 'Positif' → 'positif', 'Négatif' → 'negatif', 'Équivoque' → 'equivoque'
        const normRec = (v) => {
          if (!v) return '';
          const m = { 'Positif': 'positif', 'Négatif': 'negatif', 'Inconnu': 'inconnu', 'Équivoque': 'equivoque' };
          return m[v] || v.toLowerCase();
        };

        const cancerPayload = {
          patient:             patientId,
          ...(data.cancer_type_id ? { cancer_type: parseInt(data.cancer_type_id) } : {}),
          type_tumeur:         typeTumeurNorm,
          sous_type:           data.sous_type || '',
          lateralite:          data.lateralite || '',
          cim10_code:          cimCode,
          date_symptomes:      data.date_symptomes || null,
          date_diagnostic:     data.date_diagnostic || data.diagDate || null,
          base_diagnostic:     data.base_diagnostic || [],
          etablissement_diag:  data.etablissement_diag || '',
          service_diag:        data.service_diag || data.service || '',
          medecin_diag:        data.medecin_diag || data.medecin || '',
          type_histologique:   data.type_histologique || data.histo || '',
          grade_histologique:  data.grade_histologique || data.grade || '',
          bloc_anapath:        data.bloc_anapath || '',
          stade_clinique:      data.stade_clinique || data.stade || '',
          tnm:                 [data.tnmT, data.tnmN, data.tnmM].filter(Boolean).join(''),
          taille_tumorale:     (data.taille_tumorale || data.taille) ? parseFloat(data.taille_tumorale || data.taille) : null,
          ganglions_envahis:   data.ganglions_envahis ? parseInt(data.ganglions_envahis) : null,
          localise:            !!data.localise,
          metastatique:        !!data.metastatique,
          recidive:            !!data.recidive,
          sites_metastatiques: data.sites_metastatiques || [],
          recepteur_er:        data.recepteur_er || normRec(data.er),
          recepteur_pr:        data.recepteur_pr || normRec(data.pr),
          her2:                normRec(data.her2),
          data_source:         'manual',
        };

        const cancer = await post(`/patients/${patientId}/cancers/`, cancerPayload, token);
        cancerId = cancer?.id;
        setSaveStep(2);

        /* ── 3. Traitements (Page6) ───────────────────────────────────── */
        // Structure Treatment : correspondance directe, aucune correction nécessaire
        if (cancerId && data.traitements?.length) {
          for (const t of data.traitements) {
            await post(`/patients/${patientId}/cancers/${cancerId}/treatments/`, {
              cancer:               cancerId,
              type_traitement:      t.type_traitement,
              intention:            t.intention || '',
              statut:               t.statut || 'planifie',
              ligne:                t.ligne || '',
              protocole:            t.protocole || '',
              medicaments:          t.medicaments || '',
              voie_administration:  t.voie_administration || '',
              jours_administration: t.jours_administration || [],
              cycles_prevus:        t.cycles_prevus ? parseInt(t.cycles_prevus) : null,
              cycles_realises:      t.cycles_realises ? parseInt(t.cycles_realises) : null,
              date_debut:           t.date_debut || null,
              date_fin:             t.date_fin || null,
              reponse_tumorale:     t.reponse_tumorale || '',
              date_evaluation:      t.date_evaluation || null,
              grade_toxicite:       t.grade_toxicite || '',
              description_toxicite: t.description_toxicite || '',
            }, token);
          }
        }
        setSaveStep(3);

        /* ── 4. Examens biologiques & Imagerie (Page3) ───────────────── */

        // 4a — Marqueurs tumoraux → BiologicalExam (un par marqueur)
        for (const { key, label, unite } of MARQUEURS_MAP) {
          if (data[key]) {
            await post(`/patients/${patientId}/cancers/${cancerId}/biological-exams/`, {
              cancer:       cancerId,
              type_analyse: label,
              valeur:       parseFloat(data[key]),
              unite,
              date_analyse: data.date_diagnostic || null,
            }, token);
          }
        }

        // 4b — Bilan sanguin → BiologicalExam
        for (const { key, label, unite, numeric } of BILAN_MAP) {
          if (data[key]) {
            await post(`/patients/${patientId}/cancers/${cancerId}/biological-exams/`, {
              cancer:       cancerId,
              type_analyse: label,
              valeur:       numeric ? parseFloat(data[key]) : null,
              resultat:     !numeric ? data[key] : '',
              unite,
              date_analyse: data.date_diagnostic || null,
            }, token);
          }
        }

        // 4c — Biopsie → BiologicalExam
        if (data.biopsy) {
          await post(`/patients/${patientId}/cancers/${cancerId}/biological-exams/`, {
            cancer:       cancerId,
            type_analyse: 'Biopsie / Anatomopathologie',
            resultat:     data.biopsy,
            date_analyse: data.biopsyDate || null,
          }, token);
        }

        // 4d — Imagerie → ImagingExam (un par type sélectionné)
        if (data.imagerie?.length) {
          for (const type_examen of data.imagerie) {
            await post(`/patients/${patientId}/cancers/${cancerId}/imaging-exams/`, {
              cancer:      cancerId,
              type_examen,
              date_examen: data.date_diagnostic || null,
            }, token);
          }
        }

        // 4e — Rechutes → CancerStatusHistory
        if (data.rechutes?.length) {
          for (const r of data.rechutes.filter(x => x.debut)) {
            await post(`/patients/${patientId}/cancers/${cancerId}/status-history/`, {
              cancer:      cancerId,
              status:      'rechute',
              status_date: r.debut,
            }, token);
          }
        }
      }
      setSaveStep(4);

      /* ── 5. Habitudes de vie (Page4) → PatientHabit ─────────────────── */
      const habitMap = [
        { key: 'tabac',  name: 'Tabagisme'         },
        { key: 'alcool', name: 'Alcool'             },
        { key: 'sport',  name: 'Activité physique'  },
        { key: 'alim',   name: 'Alimentation'       },
      ];
      for (const { key, name } of habitMap) {
        if (data[key]) {
          await post(`/patients/${patientId}/habits/`, {
            patient:    patientId,
            habit_name: name,
            frequency:  data[key],
          }, token);
        }
      }

      // 5b — Anthropométrie + allergies + antécédents → endpoint dédié
      // (nécessite l'ajout du endpoint dans le backend — voir models.py corrigé)
      if (data.poids || data.taille_patient || data.allergies || data.observations) {
        await post(`/patients/${patientId}/anthropometry/`, {
          patient:               patientId,
          poids:                 data.poids         ? parseFloat(data.poids)          : null,
          taille:                data.taille_patient ? parseFloat(data.taille_patient) : null,
          imc:                   data.imc            ? parseFloat(data.imc)            : null,
          allergies:             data.allergies       || '',
          autres_allergies:      data.autresAllergies || '',
          antecedents_familiaux: (data.antecedents || []).filter(Boolean),
          observations:          data.observations    || '',
        }, token);
      }

      // 5c — Comorbidités → PatientRiskFactor
      if (data.como?.length) {
        const comos = Array.isArray(data.como) ? data.como : [data.como];
        for (const c of comos.filter(x => x && x !== 'Aucune')) {
          await post(`/patients/${patientId}/risk-factors/`, {
            patient:          patientId,
            risk_factor_name: c,
          }, token);
        }
      }

      // 5d — Pathologies chroniques → pas de modèle Django existant → observations
      if (data.pathos?.length) {
        const pathoText = data.pathos
          .filter(p => p.name)
          .map(p => `${p.name}${p.date ? ' (' + p.date + ')' : ''}`)
          .join(', ');
        if (pathoText) {
          // On l'ajoute aux observations via PATCH si l'endpoint le permet
          // Sinon, le backend devra créer un modèle PathoChronique
          await post(`/patients/${patientId}/risk-factors/`, {
            patient:          patientId,
            risk_factor_name: 'Pathologies chroniques : ' + pathoText,
          }, token);
        }
      }

      setSaveStep(5);
      setSuccess(true);

    } catch (err) {
      // Reconstruit un message lisible depuis l'erreur Django DRF
      let msg = '';
      if (typeof err === 'object' && err !== null) {
        const fieldLabels = {
          first_name: 'Prénom', last_name: 'Nom', date_naissance: 'Date de naissance',
          national_id: 'NIN', sexe: 'Sexe', type_tumeur: 'Type de tumeur',
          recepteur_er: 'Récepteur ER', recepteur_pr: 'Récepteur PR', her2: 'HER2',
        };
        const fieldErrors = Object.entries(err)
          .filter(([k]) => k !== 'detail' && k !== 'non_field_errors')
          .map(([k, v]) => `${fieldLabels[k] || k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(' | ');
        msg = fieldErrors || err.detail || err.non_field_errors?.[0] || JSON.stringify(err);
      } else {
        msg = String(err);
      }
      setError('Erreur lors de l\'enregistrement : ' + msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── JSX ───────────────────────────────────────────────────────────────── */
  return (
    <Layout currentStep={6} progress={100}>

      {/* ── SUCCESS ── */}
      {success && (
        <div className="overlay">
          <div className="success-box">
            <div className="suc-icon">✓</div>
            <div className="suc-title">Dossier enregistré !</div>
            <div className="suc-sub">
              Le dossier de <strong>{fullName}</strong> a été créé avec succès.
              {data.traitements?.length > 0 && <span> {data.traitements.length} traitement(s).</span>}
              {data.imagerie?.length   > 0 && <span> {data.imagerie.length} imagerie(s).</span>}
            </div>
            {dossier && <div className="suc-num">{dossier}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
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
          <div className="pg-icon" style={{ background: 'linear-gradient(135deg,#9B59B6,#c39bd3)' }}>📋</div>
          Résumé &amp; Validation
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Donut pct={global} />
          <div className="pg-badge">Étape <b>6</b> / 6</div>
        </div>
      </div>

      {/* Patient card */}
      <div className="sum-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="sum-name">{fullName}</div>
            <div className="sum-meta-grid">
              <div className="sum-meta-item">Naissance : <b>{fmtDate(_dob)}</b></div>
              <div className="sum-meta-item">NIN : <b>{_nin || '—'}</b></div>
              <div className="sum-meta-item">Tél : <b>{_ph || '—'}</b></div>
              <div className="sum-meta-item">Couverture : <b>{data.couverture_sociale || '—'}</b></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span className="badge badge-green">🩺 Nouveau dossier</span>
            {_sex && (
              <span className="badge badge-blue">{_sex === 'M' ? '♂ Masculin' : _sex.includes('Masculin') ? '♂ Masculin' : '♀ Féminin'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Barre de progression d'envoi */}
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
                <InfoItem label="Organe"         value={data.organe || '—'} />
                <InfoItem label="Sous-type"       value={data.sous_type} />
                <InfoItem label="Stade"           value={data.stade_clinique ? 'Stade ' + data.stade_clinique : ''} />
                <InfoItem label="TNM"             value={[data.tnmT, data.tnmN, data.tnmM].filter(Boolean).join(' — ')} />
                <InfoItem label="Taille"          value={data.taille_tumorale} unit=" cm" />
                <InfoItem label="Ganglions"       value={data.ganglions_envahis} unit=" N+" />
                <InfoItem label="Histologie"      value={data.type_histologique} />
                <InfoItem label="Grade"           value={data.grade_histologique} />
                <InfoItem label="ER / PR / HER2"  value={[data.recepteur_er, data.recepteur_pr, data.her2].filter(Boolean).join(' / ')} />
                <InfoItem label="Date diagnostic" value={fmtDate(data.date_diagnostic)} />
                <InfoItem label="Établissement"   value={data.etablissement_diag} />
                <InfoItem label="Médecin"         value={data.medecin_diag} />
              </div>
            </div>
          </div>

          {/* Traitements */}
          <div className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">💊 Traitements ({data.traitements?.length || 0})</div>
              <button className="d-link" onClick={() => navigate('/page6')}>Modifier ↗</button>
            </div>
            <div className="section-block-body">
              {(!data.traitements || data.traitements.length === 0) ? (
                <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>Aucun traitement ajouté</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.traitements.map((t, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#F8FAFF', borderRadius:8, border:'1px solid #E8ECF5', fontSize:12 }}>
                      <span style={{ fontWeight:800, color:'#334155' }}>{t.type_traitement}</span>
                      <span style={{ color:'#64748B' }}>{t.protocole || '—'}</span>
                      <span style={{ color:'#64748B' }}>{t.intention || '—'}</span>
                      <span style={{ color: t.statut==='en_cours'?'#4A6CF7':t.statut==='termine'?'#27ae60':'#94A3B8', fontWeight:700 }}>{t.statut}</span>
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
                <InfoItem label="CA 15-3"      value={data.ca153} unit=" U/mL"  />
                <InfoItem label="Biopsie"      value={data.biopsy} />
                <InfoItem label="Imagerie"     value={(data.imagerie || []).join(', ')} />
                <InfoItem label="Comorbidités" value={Array.isArray(data.como) ? data.como.join(', ') : data.como} />
                <InfoItem label="Rechutes"     value={data.rechutes?.filter(r => r.debut).length ? data.rechutes.filter(r=>r.debut).length + ' épisode(s)' : ''} />
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
          {error && (
            <div style={{ padding:'12px 16px', background:'rgba(231,76,60,0.07)', border:'1.5px solid rgba(231,76,60,0.25)', borderRadius:10, fontSize:13, color:'#e74c3c', fontWeight:700, whiteSpace:'pre-wrap' }}>
              ⚠ {error}
            </div>
          )}

          {/* Confirmation */}
          <SC label="Confirmation" style={{ borderColor: 'rgba(74,108,247,0.3)' }}>
            {[
              { key:'c1', text:"Je certifie que les informations saisies sont exactes et correspondent au dossier médical du patient." },
              { key:'c2', text:"Le patient ou son représentant légal a donné son consentement à l'enregistrement de ces données." },
              { key:'c3', text:'Ces données seront traitées conformément à la réglementation sur la confidentialité médicale.' },
            ].map(({ key, text }) => (
              <div key={key} className={`confirm-check ${unchecked.includes(key) ? 'unchecked' : ''}`}>
                <input type="checkbox" checked={checks[key]} onChange={() => setChecks(p => ({ ...p, [key]: !p[key] }))} />
                <span>{text}</span>
              </div>
            ))}
          </SC>
        </div>
      </div>

      <BtnRow
        onBack={() => navigate('/page4')}
        onNext={handleSave}
        nextLabel={saving ? `⏳ Étape ${saveStep + 1}/${SAVE_STEPS.length}…` : '✓ Enregistrer le dossier'}
        nextClass="btn-success"
      />
    </Layout>
  );
}