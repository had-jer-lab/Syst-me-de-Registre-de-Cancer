import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, Select, TagGroup, CircleGroup, Toggle, PageHeader, BtnRow } from '../components/FormFields';

const ORGANES = [
  'Sein','Poumon','Côlon / Rectum','Prostate','Col de l\'utérus','Thyroïde',
  'Foie / Voies biliaires','Estomac','Pancréas','Ovaire','Rein','Vessie',
  'Os / Tissu mou','Lymphome','Leucémie','Mélanome cutané','Cerveau / SNC','ORL','Autre',
];

const SOUS_TYPES = {
  'Sein':['Canalaire invasif','Lobulaire invasif','Inflammatoire','Tubulaire','Mucineux','Médullaire','Papillaire','Triple négatif','Autre'],
  'Poumon':['Adénocarcinome','Carcinome épidermoïde','Carcinome à petites cellules','Carcinome à grandes cellules','Carcinome neuroendocrine','Autre'],
  'Côlon / Rectum':['Adénocarcinome','Tumeur neuroendocrine','Lymphome colorectal','Tumeur stromale','Autre'],
  'Prostate':['Adénocarcinome acinaire','Adénocarcinome canalaire','Carcinome neuroendocrine','Carcinome à petites cellules','Autre'],
  "Col de l'utérus":['Carcinome épidermoïde','Adénocarcinome','Adénosquameux','Neuroendocrine','Autre'],
  'Thyroïde':['Papillaire','Folliculaire','Médullaire','Anaplasique','Autre'],
  'Foie / Voies biliaires':['Carcinome hépatocellulaire','Cholangiocarcinome','Angiosarcome','Hépatoblastome','Autre'],
  'Estomac':['Adénocarcinome intestinal','Adénocarcinome diffus','Lymphome MALT','Tumeur stromale (GIST)','Autre'],
  'Pancréas':['Adénocarcinome canalaire','Tumeur neuroendocrine','Cystadénocarcinome','Tumeur pseudopapillaire','Autre'],
  'Ovaire':['Séreux','Mucineux','Endométrioïde','À cellules claires','Tumeur germinale','Autre'],
  'Rein':['Carcinome à cellules claires','Carcinome papillaire','Carcinome chromophobe','Tumeur de Wilms','Autre'],
  'Vessie':['Carcinome urothélial','Carcinome épidermoïde','Adénocarcinome','Carcinome à petites cellules','Autre'],
  'Os / Tissu mou':['Ostéosarcome','Sarcome d\'Ewing','Chondrosarcome','Liposarcome','Fibrosarcome','Autre'],
  'Lymphome':['Hodgkin classique','Hodgkin nodulaire','B diffus grandes cellules','Folliculaire','MALT','Burkitt','T périphérique','Autre'],
  'Leucémie':['Myéloïde aiguë (LAM)','Lymphoïde aiguë (LAL)','Myéloïde chronique (LMC)','Lymphoïde chronique (LLC)','Autre'],
  'Mélanome cutané':['Superficiel extensif','Nodulaire','Lentigo malin','Acral lentigineux','Autre'],
  'Cerveau / SNC':['Glioblastome','Astrocytome','Oligodendrogliome','Épendymome','Médulloblastome','Méningiome','Autre'],
  'ORL':['Carcinome épidermoïde cavité buccale','Carcinome nasopharynx','Carcinome larynx','Adénocarcinome glandes salivaires','Autre'],
  'Autre':['Non spécifié'],
};

const TNM_T = ['Tx','T0','Tis','T1','T1a','T1b','T2','T2a','T2b','T3','T4','T4a','T4b'];
const TNM_N = ['Nx','N0','N1','N1a','N1b','N2','N2a','N2b','N2c','N3'];
const TNM_M = ['Mx','M0','M1','M1a','M1b','M1c'];
const STADES = ['I','II','III','IV'];

const HISTO_TYPES = [
  'Adénocarcinome','Carcinome épidermoïde','Carcinome canalaire infiltrant',
  'Carcinome lobulaire infiltrant','Carcinome in situ',
  'Lymphome B diffus à grandes cellules','Lymphome de Hodgkin','Lymphome T périphérique',
  'Leucémie myéloïde aiguë','Leucémie lymphoïde chronique',
  'Sarcome des parties molles','Mélanome','Glioblastome','Carcinome hépatocellulaire','Autre',
];
const GRADE_HISTO = ['Grade 1 — Bien différencié','Grade 2 — Modérément différencié','Grade 3 — Peu différencié','Grade 4 — Indifférencié','Grade X — Non déterminable'];
const BASE_DIAG   = ['Histologie','Cytologie','Imagerie seule','Clinique seule','Marqueurs biologiques','Laparoscopie / Chirurgie exploratrice','Autopsie','Autre'];
const SITES_META  = ['Poumon','Foie','Os','Cerveau','Ganglions','Péritoine','Peau','Surrénale','Rein','Plèvre','Autre'];
const CIM10_LIST  = [
  {code:'C50',label:'C50 — Sein'},{code:'C34',label:'C34 — Bronches et poumon'},
  {code:'C18',label:'C18 — Côlon'},{code:'C61',label:'C61 — Prostate'},
  {code:'C53',label:'C53 — Col de l\'utérus'},{code:'C73',label:'C73 — Thyroïde'},
  {code:'C22',label:'C22 — Foie'},{code:'C16',label:'C16 — Estomac'},
  {code:'C25',label:'C25 — Pancréas'},{code:'C56',label:'C56 — Ovaire'},
  {code:'C64',label:'C64 — Rein'},{code:'C67',label:'C67 — Vessie'},
  {code:'C81',label:'C81 — Hodgkin'},{code:'C91',label:'C91 — Leucémie lymphoïde'},
  {code:'C43',label:'C43 — Mélanome'},{code:'C71',label:'C71 — Cerveau'},
];

/* ─── Composants UI ──────────────────────────────────────────────────────── */

function SectionBlock({ label, color = '#4A6CF7', children }) {
  return (
    <div style={s.block}>
      <div style={{ ...s.blockHeader, borderLeftColor: color }}>
        <span style={{ ...s.blockLabel, color }}>{label}</span>
      </div>
      <div style={s.blockBody}>{children}</div>
    </div>
  );
}

function Row({ cols = 2, gap = 12, children, mt = 0 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap, marginTop: mt,
    }}>
      {children}
    </div>
  );
}

function F({ label, required, children, mt = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: mt }}>
      {label && (
        <label style={s.label}>
          {label}
          {required && <span style={{ color: '#FF6B6B', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder, unit }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value || ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ ...s.input, paddingRight: unit ? 44 : 12 }}
      />
      {unit && <span style={s.unit}>{unit}</span>}
    </div>
  );
}

function Sel({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} style={s.input}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o =>
        typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.code} value={o.code}>{o.label}</option>
      )}
    </select>
  );
}

function Tags({ options, value, onChange, small }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => (
        <button key={opt} type="button"
          style={{
            ...s.tag,
            ...(small ? s.tagSmall : {}),
            ...(value === opt ? s.tagSel : {}),
          }}
          onClick={() => onChange(value === opt ? '' : opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiCheck({ options, value = [], onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map(o => (
        <label key={o} style={s.checkRow}>
          <div style={{ ...s.checkbox, ...(value.includes(o) ? s.checkboxOn : {}) }}>
            {value.includes(o) && <span style={s.checkMark}>✓</span>}
          </div>
          <span style={s.checkLabel}>{o}</span>
          <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} style={{ display: 'none' }} />
        </label>
      ))}
    </div>
  );
}

function MultiTags({ options, value = [], onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => (
        <button key={o} type="button"
          style={{ ...s.tag, ...s.tagSmall, ...(value.includes(o) ? s.tagSelPurple : {}) }}
          onClick={() => toggle(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={s.toggleRow}>
      <div style={{ ...s.toggleTrack, ...(checked ? s.toggleOn : {}) }} onClick={() => onChange(!checked)}>
        <div style={{ ...s.toggleThumb, ...(checked ? s.toggleThumbOn : {}) }} />
      </div>
      <span style={s.toggleLabel}>{label}</span>
    </label>
  );
}

function RecepteurRow({ label, value, onChange, options, colors }) {
  return (
    <div style={s.recRow}>
      <span style={s.recLabel}>{label}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map((opt, i) => {
          const active = value === opt;
          return (
            <button key={opt} type="button"
              style={{
                ...s.recBtn,
                ...(active ? { background: colors[i] + '18', borderColor: colors[i], color: colors[i], fontWeight: 900 } : {}),
              }}
              onClick={() => onChange(active ? '' : opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

export default function Page2() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const up = (k) => (v) => update({ [k]: v });
  const upE = (k) => (e) => update({ [k]: e.target.value });

  const sousTypes   = data.organe ? (SOUS_TYPES[data.organe] || ['Autre']) : [];
  const isTripleNeg = data.recepteur_er === 'negatif' && data.recepteur_pr === 'negatif' && data.her2 === 'negatif';

  // Mapping frontend → backend field names
  // Frontend: er/pr/her2 → backend: recepteur_er/recepteur_pr/her2
  // Frontend: organe → backend: cancer_type (FK via name)
  // Frontend: histo → backend: type_histologique
  // Frontend: grade → backend: grade_histologique
  // Frontend: diagDate → backend: date_diagnostic
  // All other new fields match directly

  return (
    <Layout currentStep={2} progress={33}>
      <PageHeader icon="🎗" iconBg="linear-gradient(135deg,#e74c3c,#c0392b)" title="Diagnostic & Cancer" step={2} />

      <div style={s.twoCol}>

        {/* ════ COLONNE GAUCHE ════ */}
        <div style={s.col}>

          {/* Type de tumeur */}
          <SC label="Type de tumeur">
            <TagGroup
              options={['Solide','Liquide','Hématologique']}
              value={data.typeT}
              onChange={v => update({ typeT: v })}
            />
          </SC>

          {/* Organe */}
          <SC label="Organe / Topographie">
            <Field label="Organe principal">
              <Select
                options={ORGANES}
                placeholder="Sélectionner…"
                value={data.organe}
                onChange={handleOrganeChange}
              />
            </Field>

            {/* ✅ SOUS-TYPE — toujours visible, message d'aide si pas d'organe choisi */}
            <div style={s.stWrap}>
              <div style={s.stHeader}>
                <span style={s.stDot} />
                <span style={s.stTitle}>
                  {data.organe
                    ? <>Sous-type &nbsp;·&nbsp; <b style={{ color: 'var(--primary)' }}>{data.organe}</b></>
                    : 'Sous-type de cancer'}
                </span>
              </div>

              {!data.organe ? (
                <div style={s.stPlaceholder}>
                  <span style={s.stPlaceholderIcon}>☝️</span>
                  Sélectionnez d'abord l'organe principal
                </div>
              ) : (
                <TagGroup
                  options={sousTypesDispos}
                  value={data.sous_type}
                  onChange={v => update({ sous_type: v })}
                />
              )}
            </div>

            <Field label="Latéralité" style={{ marginTop: 14 }}>
              <TagGroup
                options={['Droit','Gauche','Bilatéral','N / A']}
                value={data.lat}
                onChange={v => update({ lat: v })}
              />
            </Field>

            <div style={{ marginTop: 14 }}>
              <div className="fl" style={{ marginBottom: 8 }}>Niveau topographique</div>
              <CircleGroup
                options={['1','2','3','4']}
                value={data.topo}
                onChange={v => update({ topo: v })}
              />
            </div>
          </SC>

          {/* ✅ STADE TNM — les 3 selects sur UNE SEULE ligne */}
          <SC label="Stade TNM">
            <CircleGroup
              options={['I','II','III','IV']}
              value={data.stade}
              onChange={v => update({ stade: v })}
            />

            {/* ── Les 3 colonnes TNM alignées ── */}
            <div style={{ display:'flex', gap:12, marginTop:14, width:'100%' }}>

              <div style={{ flex:'1 1 0', minWidth:0 }}>
                <div style={s.tnmLabel}>T — Tumeur</div>
                <Select options={TNM_T} value={data.tnmT} onChange={set('tnmT')} />
              </div>

              <div style={{ flex:'1 1 0', minWidth:0 }}>
                <div style={s.tnmLabel}>N — Ganglion</div>
                <Select options={TNM_N} value={data.tnmN} onChange={set('tnmN')} />
              </div>

              <div style={{ flex:'1 1 0', minWidth:0 }}>
                <div style={s.tnmLabel}>M — Métastase</div>
                <Select options={TNM_M} value={data.tnmM} onChange={set('tnmM')} />
              </div>

            </div>
          </SC>

          {/* Traitement en cours */}
          <SC label="Traitement en cours">
            <TagGroup
              options={['Chimiothérapie','Radiothérapie','Chirurgie','Immunothérapie','Hormonothérapie','Thérapie ciblée','Aucun']}
              value={data.trtActuel}
              onChange={v => update({ trtActuel: v })}
            />
          </SC>

        </div>

        {/* ════ COLONNE DROITE ════ */}
        <div style={s.col}>

          {/* Localisation */}
          <SC label="Statut de localisation">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Toggle label="Localisé"     checked={data.localise}     onChange={v => update({ localise: v })} />
              <Toggle label="Métastatique" checked={data.metastatique} onChange={v => update({ metastatique: v })} />
              <Toggle label="Récidive"     checked={data.recidive}     onChange={v => update({ recidive: v })} />
            </div>
          </SC>

          {/* Dates */}
          <SC label="Date du diagnostic">
            <Field label="Date de découverte">
              <input className="fi" type="date" value={data.diagDate} onChange={set('diagDate')} />
            </Field>
            <Field label="Date de la première consultation" style={{ marginTop:10 }}>
              <input className="fi" type="date" value={data.consultDate} onChange={set('consultDate')} />
            </Field>

            {/* ✅ DATE DU DERNIER RDV */}
            <Field label="Date de la dernière consultation" style={{ marginTop:10 }}>
              <div style={s.rdvRow}>
                <input
                  className="fi"
                  type="date"
                  value={data.dernier_rdv}
                  onChange={set('dernier_rdv')}
                  style={{ flex: 1 }}
                />
                {data.dernier_rdv && (
                  <span style={s.rdvPill}>
                    {(() => {
                      const diff = Math.floor(
                        (new Date() - new Date(data.dernier_rdv)) / 86400000
                      );
                      if (diff === 0) return '🟢 Aujourd\'hui';
                      if (diff <= 7)  return `🟢 ${diff}j`;
                      if (diff <= 30) return `🟡 ${diff}j`;
                      if (diff <= 365) return `🟠 ${Math.floor(diff/30)} mois`;
                      return `🔴 ${Math.floor(diff/365)} an(s)`;
                    })()}
                  </span>
                )}
              </div>
            </Field>
          </SC>

          {/* Histologie */}
          <SC label="Histologie / Type moléculaire">
            <Field label="Type histologique">
              <Select options={HISTO_TYPES} placeholder="Sélectionner…" value={data.histo} onChange={set('histo')} />
            </Field>
            <div className="field-row c2" style={{ marginTop:12 }}>
              <Field label="Taille tumorale (cm)">
                <div className="fi-wrap">
                  <input className="fi" type="number" step="0.1" placeholder="ex: 4.2" value={data.taille} onChange={set('taille')} />
                  <span className="fi-unit">cm</span>
                </div>
              </Field>
            </div>
            <Field label="Récepteurs hormonaux (si sein)" style={{ marginTop:12 }}>
              <TagGroup
                options={['RH+','RH−','HER2+','HER2−','Triple négatif']}
                value={data.recepteurs}
                onChange={v => update({ recepteurs: v })}
              />
            </Field>
          </SC>

          {/* Médecin référent */}
          <SC label="Médecin référent">
            <div className="field-row c2">
              <Field label="Service">
                <input className="fi" type="text" placeholder="ex: Oncologie" value={data.service} onChange={set('service')} />
              </Field>
              <Field label="Médecin">
                <input className="fi" type="text" placeholder="Dr. Nom" value={data.medecin} onChange={set('medecin')} />
              </Field>
            </div>
            {isTripleNeg && (
              <div style={s.tripleNeg}>⚠ Triple négatif détecté — ER⁻ PR⁻ HER2⁻</div>
            )}
          </SC>

          {/* F — Dates */}
          <SectionBlock label="F — Dates clés" color="#16a085">
            <Row cols={2}>
              <F label="Premiers symptômes">
                <input style={s.input} type="date" value={data.date_symptomes || ''} onChange={upE('date_symptomes')} />
              </F>
              <F label="Date de diagnostic" required>
                <input style={s.input} type="date" value={data.date_diagnostic || ''} onChange={upE('date_diagnostic')} />
              </F>
            </Row>
            <Row cols={2} mt={10}>
              <F label="1ère consultation">
                <input style={s.input} type="date" value={data.consultDate || ''} onChange={upE('consultDate')} />
              </F>
              <F label="Dernier RDV">
                <div style={{ position: 'relative' }}>
                  <input style={s.input} type="date" value={data.dernier_rdv || ''} onChange={upE('dernier_rdv')} />
                  {data.dernier_rdv && <span style={s.rdvBadge}>{getRdvLabel(data.dernier_rdv)}</span>}
                </div>
              </F>
            </Row>
          </SectionBlock>

          {/* G — Établissement */}
          <SectionBlock label="G — Établissement diagnostiqueur" color="#7f8c8d">
            <Row cols={2}>
              <F label="Établissement">
                <Input value={data.etablissement_diag} onChange={up('etablissement_diag')} placeholder="ex: CHU Tlemcen" />
              </F>
              <F label="Service">
                <Input value={data.service_diag} onChange={up('service_diag')} placeholder="ex: Oncologie" />
              </F>
            </Row>
            <F label="Médecin diagnostiqueur" mt={10}>
              <Input value={data.medecin_diag} onChange={up('medecin_diag')} placeholder="Dr. Nom Prénom" />
            </F>
          </SectionBlock>

        </div>
      </div>

      <BtnRow onBack={() => navigate('/page1')} onNext={() => navigate('/page6')} nextLabel="Suivant → Traitements" />
    </Layout>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const s = {
  /* ── sous-type ── */
  stWrap: {
    marginTop: 14,
    padding: '14px 16px',
    background: 'linear-gradient(135deg, rgba(74,108,247,0.04), rgba(0,201,167,0.03))',
    border: '1.5px solid rgba(74,108,247,0.18)',
    borderRadius: 12,
  },
  stHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11,
  },
  stDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'linear-gradient(135deg,#4A6CF7,#00C9A7)',
    flexShrink: 0,
  },
  stTitle: {
    fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '1px',
  },
  stPlaceholder: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
    fontStyle: 'italic', padding: '6px 0',
  },
  stPlaceholderIcon: { fontSize: 16 },
  stGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 7,
  },
  stChip: {
    padding: '5px 12px', borderRadius: 20,
    border: '1.5px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--text-muted)',
    fontSize: 12, fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    transition: '0.15s',
  },
  stChipSel: {
    background: 'var(--primary)', borderColor: 'var(--primary)',
    color: '#fff', boxShadow: '0 3px 10px rgba(74,108,247,0.28)',
  },
  stConfirm: {
    marginTop: 10, display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 12, fontWeight: 700, color: 'var(--primary)',
    padding: '5px 11px',
    background: 'rgba(74,108,247,0.08)',
    borderRadius: 8, width: 'fit-content',
  },
  stCheck: {
    width: 18, height: 18, borderRadius: '50%',
    background: 'var(--primary)', color: '#fff',
    fontSize: 10, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  /* ✅ TNM — 3 colonnes sur une ligne */
  tnmRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginTop: 14,
  },
  tnmCol: {
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  tnmLabel: {
    fontSize: 12, fontWeight: 900, textAlign: 'center',
    color: 'var(--primary)', letterSpacing: '0.5px',
  },

  /* ── dernier rdv ── */
  rdvRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  rdvPill: {
    flexShrink: 0, fontSize: 11, fontWeight: 800,
    padding: '5px 11px', borderRadius: 20,
    background: 'rgba(74,108,247,0.08)',
    border: '1.5px solid rgba(74,108,247,0.18)',
    color: 'var(--primary)', whiteSpace: 'nowrap',
  },
};