import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, PageHeader, BtnRow, InfoItem } from '../components/FormFields';

function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function score(arr, total) {
  const filled = arr.filter(v => v && v.toString().trim()).length;
  return Math.round((filled / total) * 100);
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [createdDossier, setCreatedDossier] = useState('');

  // Compute scores
  const s1 = score([data.nom, data.prenom, data.dob, data.tel, data.sexe, data.wilaya, data.couverture], 7);
  const s2 = score([data.typeT, data.organe, data.histo, data.stade, data.taille, data.diagDate], 6);
  const s3 = score([data.cea, data.ca199, data.nfs, data.biopsy, data.como], 5);
  const s4 = score([data.tabac, data.alcool, data.sport, data.poids, data.antFam, data.trtAnt], 6);
  const global = Math.round((s1 + s2 + s3 + s4) / 4);

  const fullName = `${data.prenom || '—'} ${data.nom || '—'}`;

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
        first_name:     data.prenom        || '',
        last_name:      data.nom           || '',
        date_naissance: data.dob           || '',
        sexe:           data.sexe?.includes('Masculin') ? 'M' : 'F',
        phone:          data.tel           || '',
        national_id:    data.nin           || null,
        data_source:    'manual',
      };

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
        const msg = err.date_naissance?.[0] || err.national_id?.[0] || err.detail || JSON.stringify(err);
        setSaveError('Erreur : ' + msg);
        setSaving(false);
        return;
      }

      const patient = await patRes.json();
      setCreatedDossier(patient.numero_dossier || '');

      // ── 3. Créer le cancer si organe renseigné ────────────────────
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

      // ── 4. Succès ─────────────────────────────────────────────────
      setShowSuccess(true);

    } catch (err) {
      console.error(err);
      setSaveError('Erreur réseau. Vérifiez que le serveur Django est lancé.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout currentStep={5} progress={100}>
      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="overlay">
          <div className="success-box">
            <div className="suc-icon">✓</div>
            <div className="suc-title">Patient enregistré !</div>
            <div className="suc-sub">
              Le dossier de <strong>{fullName}</strong> a été créé avec succès.
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
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                📋 Voir mes patients
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="sum-meta-item">Date de naissance : <b>{data.dob ? fmtDate(data.dob) : '—'}{data.age ? ' · ' + data.age : ''}</b></div>
              <div className="sum-meta-item">Dossier N° : <b>{data.nin || '—'}</b></div>
              <div className="sum-meta-item">Téléphone : <b>{data.tel || '—'}</b></div>
              <div className="sum-meta-item">Email : <b>{data.email || '—'}</b></div>
              <div className="sum-meta-item">Wilaya : <b>{data.wilaya || '—'}</b></div>
              <div className="sum-meta-item">Couverture : <b>{data.couverture || '—'}</b></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span className="badge badge-green">🩺 Nouveau dossier</span>
            {data.sexe && <span className="badge badge-blue">{data.sexe}</span>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* LEFT */}
        <div className="col-stack">

          {/* Diagnostic */}
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
        onBack={() => navigate('/page4')}
        onNext={handleSave}
        nextLabel={saving ? '⏳ Enregistrement…' : '✓ Enregistrer le patient'}
        nextClass="btn-success"
      />
    </Layout>
  );
}