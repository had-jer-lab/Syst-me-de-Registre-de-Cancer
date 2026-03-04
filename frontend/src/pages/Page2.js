import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, Select, TagGroup, CircleGroup, PageHeader, BtnRow } from '../components/FormFields';

const ORGANES = [
  'Sein','Poumon','Côlon / Rectum','Prostate','Col de l\'utérus','Thyroïde',
  'Foie / Voies biliaires','Estomac','Pancréas','Ovaire','Rein','Vessie',
  'Os / Tissu mou','Lymphome','Leucémie','Mélanome cutané','Cerveau / SNC','ORL','Autre',
];

const SOUS_TYPES = {
  'Sein':                   ['Canalaire invasif','Lobulaire invasif','Inflammatoire','Tubulaire','Mucineux','Médullaire','Papillaire','Triple négatif','Autre'],
  'Poumon':                 ['Adénocarcinome','Carcinome épidermoïde','Carcinome à petites cellules','Carcinome à grandes cellules','Carcinome neuroendocrine','Autre'],
  'Côlon / Rectum':         ['Adénocarcinome','Tumeur neuroendocrine','Lymphome colorectal','Tumeur stromale','Autre'],
  'Prostate':               ['Adénocarcinome acinaire','Adénocarcinome canalaire','Carcinome neuroendocrine','Carcinome à petites cellules','Autre'],
  'Col de l\'utérus':       ['Carcinome épidermoïde','Adénocarcinome','Adénosquameux','Neuroendocrine','Autre'],
  'Thyroïde':               ['Papillaire','Folliculaire','Médullaire','Anaplasique','Autre'],
  'Foie / Voies biliaires': ['Carcinome hépatocellulaire','Cholangiocarcinome','Angiosarcome','Hépatoblastome','Autre'],
  'Estomac':                ['Adénocarcinome intestinal','Adénocarcinome diffus','Lymphome MALT','Tumeur stromale (GIST)','Autre'],
  'Pancréas':               ['Adénocarcinome canalaire','Tumeur neuroendocrine','Cystadénocarcinome','Tumeur pseudopapillaire','Autre'],
  'Ovaire':                 ['Séreux','Mucineux','Endométrioïde','À cellules claires','Tumeur germinale','Autre'],
  'Rein':                   ['Carcinome à cellules claires','Carcinome papillaire','Carcinome chromophobe','Tumeur de Wilms','Autre'],
  'Vessie':                 ['Carcinome urothélial','Carcinome épidermoïde','Adénocarcinome','Carcinome à petites cellules','Autre'],
  'Os / Tissu mou':         ['Ostéosarcome','Sarcome d\'Ewing','Chondrosarcome','Liposarcome','Fibrosarcome','Autre'],
  'Lymphome':               ['Hodgkin classique','Hodgkin nodulaire','B diffus grandes cellules','Folliculaire','MALT','Burkitt','T périphérique','Autre'],
  'Leucémie':               ['Myéloïde aiguë (LAM)','Lymphoïde aiguë (LAL)','Myéloïde chronique (LMC)','Lymphoïde chronique (LLC)','Autre'],
  'Mélanome cutané':        ['Superficiel extensif','Nodulaire','Lentigo malin','Acral lentigineux','Autre'],
  'Cerveau / SNC':          ['Glioblastome','Astrocytome','Oligodendrogliome','Épendymome','Médulloblastome','Méningiome','Autre'],
  'ORL':                    ['Carcinome épidermoïde cavité buccale','Carcinome nasopharynx','Carcinome larynx','Adénocarcinome glandes salivaires','Autre'],
  'Autre':                  ['Non spécifié'],
};

const TNM_T = ['Tx','T0','Tis','T1','T2','T3','T4'];
const TNM_N = ['Nx','N0','N1','N2','N3'];
const TNM_M = ['Mx','M0','M1'];

const HISTO_TYPES = [
  'Adénocarcinome','Carcinome épidermoïde','Carcinome canalaire infiltrant',
  'Carcinome lobulaire infiltrant','Carcinome in situ',
  'Lymphome B diffus à grandes cellules','Lymphome de Hodgkin',
  'Lymphome T périphérique','Leucémie myéloïde aiguë',
  'Leucémie lymphoïde chronique','Sarcome des parties molles',
  'Mélanome','Glioblastome','Carcinome hépatocellulaire','Autre',
];

// Options de statut de localisation — sélection unique (une seule à la fois)
const LOCALISATION_OPTIONS = [
  { val: 'localise',     label: 'Localisé',     desc: 'Tumeur limitée à l\'organe d\'origine' },
  { val: 'metastatique', label: 'Métastatique', desc: 'Présence de métastases à distance' },
  { val: 'recidive',     label: 'Récidive',     desc: 'Réapparition après rémission' },
];

export default function Page2() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const set = (key) => (e) => update({ [key]: e.target.value });

  const handleOrganeChange = (e) => {
    update({ organe: e.target.value, sous_type: '' });
  };

  const sousTypesDispos = data.organe ? (SOUS_TYPES[data.organe] || ['Autre']) : [];

  // Gestion statut localisation — sélection unique
  const handleLocalisation = (val) => {
    // Si on clique sur la valeur déjà sélectionnée → désélectionner
    if (data.localisation === val) {
      update({ localisation: '' });
    } else {
      update({ localisation: val });
    }
  };

  return (
    <Layout currentStep={2} progress={40}>
      <PageHeader
        icon="🎗"
        iconBg="linear-gradient(135deg,#FF6B6B,#ff9797)"
        title="Diagnostic & Cancer"
        step={2}
      />

      <div className="grid-2">

        {/* ══════════════ COLONNE GAUCHE ══════════════ */}
        <div className="col-stack">

          {/* Type de tumeur — Solide / Liquide uniquement */}
          <SC label="Type de tumeur">
            <div style={s.typeGrid}>
              {[
                { val: 'Solide',  icon: '⬛', desc: 'Tumeur formant une masse solide (carcinome, sarcome…)' },
                { val: 'Liquide', icon: '💧', desc: 'Tumeur des cellules du sang (leucémie, lymphome…)' },
              ].map(({ val, icon, desc }) => (
                <div
                  key={val}
                  style={{
                    ...s.typeCard,
                    ...(data.typeT === val ? s.typeCardSel : {}),
                  }}
                  onClick={() => update({ typeT: data.typeT === val ? '' : val })}
                >
                  <div style={s.typeIcon}>{icon}</div>
                  <div style={s.typeLabel}>{val}</div>
                  <div style={s.typeDesc}>{desc}</div>
                  {data.typeT === val && <div style={s.typeCheck}>✓</div>}
                </div>
              ))}
            </div>
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
                  <span style={s.stPlaceholderIcon}></span>
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
          </SC>

          {/* Stade TNM */}
          <SC label="Stade TNM">
            <CircleGroup
              options={['I','II','III','IV']}
              value={data.stade}
              onChange={v => update({ stade: v })}
            />

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

        {/* ══════════════ COLONNE DROITE ══════════════ */}
        <div className="col-stack">

          {/* Statut de localisation — UNE SEULE sélection */}
          <SC label="Statut de localisation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LOCALISATION_OPTIONS.map(({ val, label, desc }) => {
                const isSelected = data.localisation === val;
                return (
                  <div
                    key={val}
                    style={{
                      ...s.locCard,
                      ...(isSelected ? s.locCardSel : {}),
                    }}
                    onClick={() => handleLocalisation(val)}
                  >
                    <div style={{ ...s.locRadio, ...(isSelected ? s.locRadioSel : {}) }}>
                      {isSelected && <div style={s.locRadioDot} />}
                    </div>
                    <div>
                      <div style={s.locLabel}>{label}</div>
                      <div style={s.locDesc}>{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SC>

          {/* Dates */}
          <SC label="Dates">
            <Field label="Date de découverte / Diagnostic">
              <input className="fi" type="date" value={data.diagDate} onChange={set('diagDate')} />
            </Field>
            <Field label="Date de la première consultation" style={{ marginTop:10 }}>
              <input className="fi" type="date" value={data.consultDate} onChange={set('consultDate')} />
            </Field>
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
                      if (diff === 0) return 'Aujourd\'hui';
                      if (diff <= 7)  return `${diff}j`;
                      if (diff <= 30) return `${diff}j`;
                      if (diff <= 365) return `${Math.floor(diff/30)} mois`;
                      return `${Math.floor(diff/365)} an(s)`;
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
              <Field label="Grade SBR / OMS">
                <Select options={['Grade 1','Grade 2','Grade 3']} placeholder="—" value={data.grade} onChange={set('grade')} />
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

        </div>
      </div>

      <BtnRow onBack={() => navigate('/page1')} onNext={() => navigate('/page3')} />
    </Layout>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const s = {
  /* ── Type de tumeur ── */
  typeGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
  },
  typeCard: {
    padding: '18px 14px', border: '2px solid var(--border)',
    borderRadius: 14, cursor: 'pointer', textAlign: 'center',
    background: 'var(--card)', transition: '0.2s', position: 'relative',
  },
  typeCardSel: {
    border: '2px solid var(--primary)',
    background: 'rgba(74,108,247,0.05)',
    boxShadow: '0 4px 16px rgba(74,108,247,0.15)',
  },
  typeIcon: { fontSize: 28, marginBottom: 8 },
  typeLabel: { fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  typeDesc: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 },
  typeCheck: {
    position: 'absolute', top: 8, right: 10,
    width: 20, height: 20, borderRadius: '50%',
    background: 'var(--primary)', color: '#fff',
    fontSize: 11, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

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

  /* ── TNM ── */
  tnmLabel: {
    fontSize: 12, fontWeight: 900, textAlign: 'center',
    color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: 6,
  },

  /* ── Statut localisation ── */
  locCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    border: '2px solid var(--border)',
    borderRadius: 12, cursor: 'pointer',
    background: 'var(--card)', transition: '0.2s',
  },
  locCardSel: {
    border: '2px solid var(--primary)',
    background: 'rgba(74,108,247,0.05)',
    boxShadow: '0 3px 12px rgba(74,108,247,0.12)',
  },
  locRadio: {
    width: 20, height: 20, borderRadius: '50%',
    border: '2px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: '0.2s',
  },
  locRadioSel: { border: '2px solid var(--primary)' },
  locRadioDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'var(--primary)',
  },
  locLabel: { fontSize: 13, fontWeight: 800, color: 'var(--text)' },
  locDesc:  { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },

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