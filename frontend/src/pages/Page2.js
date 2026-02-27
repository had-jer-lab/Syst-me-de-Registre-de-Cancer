import React from 'react';
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

export default function Page2() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const set = (key) => (e) => update({ [key]: e.target.value });

  const handleOrganeChange = (e) => {
    update({ organe: e.target.value, sous_type: '' });
  };

  const sousTypesDispos = data.organe ? (SOUS_TYPES[data.organe] || ['Autre']) : [];

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

        {/* ══════════════ COLONNE DROITE ══════════════ */}
        <div className="col-stack">

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
          </SC>

        </div>
      </div>

      <BtnRow onBack={() => navigate('/page1')} onNext={() => navigate('/page3')} />
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