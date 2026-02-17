import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, Select, TagGroup, CircleGroup, Toggle, PageHeader, BtnRow } from '../components/FormFields';

const ORGANES = [
  'Sein','Poumon','Côlon / Rectum','Prostate','Col de l\'utérus','Thyroïde',
  'Foie / Voies biliaires','Estomac','Pancréas','Ovaire','Rein','Vessie',
  'Os / Tissu mou','Lymphome','Leucémie','Mélanome cutané','Cerveau / SNC','ORL','Autre'
];

const HISTOS = [
  'Adénocarcinome','Carcinome épidermoïde','Carcinome canalaire infiltrant',
  'Carcinome lobulaire infiltrant','Carcinome in situ',
  'Lymphome B diffus à grandes cellules','Lymphome de Hodgkin',
  'Lymphome T périphérique','Leucémie myéloïde aiguë','Leucémie lymphoïde chronique',
  'Sarcome des parties molles','Mélanome','Glioblastome','Carcinome hépatocellulaire','Autre'
];

export default function Page2() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const set = (key) => (e) => update({ [key]: e.target.value });

  return (
    <Layout currentStep={2} progress={40}>
      <PageHeader
        icon="🎗"
        iconBg="linear-gradient(135deg,#FF6B6B,#ff9797)"
        title="Diagnostic & Cancer"
        step={2}
      />

      <div className="grid-2">
        {/* LEFT */}
        <div className="col-stack">

          <SC label="Type de tumeur">
            <TagGroup
              options={['Solide', 'Liquide', 'Hématologique']}
              value={data.typeT}
              onChange={v => update({ typeT: v })}
            />
          </SC>

          <SC label="Organe / Topographie">
            <Field label="Organe principal">
              <Select options={ORGANES} placeholder="Sélectionner…"
                value={data.organe} onChange={set('organe')} />
            </Field>

            <Field label="Latéralité" style={{ marginTop: 12 }}>
              <TagGroup
                options={['Droit', 'Gauche', 'Bilatéral', 'N / A']}
                value={data.lat}
                onChange={v => update({ lat: v })}
              />
            </Field>

            <div style={{ marginTop: 14 }}>
              <div className="fl" style={{ marginBottom: 8 }}>Niveau topographique</div>
              <CircleGroup
                options={['1', '2', '3', '4']}
                value={data.topo}
                onChange={v => update({ topo: v })}
              />
            </div>
          </SC>

          <SC label="Stade TNM">
            <CircleGroup
              options={['I', 'II', 'III', 'IV']}
              value={data.stade}
              onChange={v => update({ stade: v })}
            />
            <div className="stade-tnm">
              {[
                { key: 'tnmT', label: 'T — Tumeur', opts: ['Tx','T0','Tis','T1','T2','T3','T4'] },
                { key: 'tnmN', label: 'N — Ganglion', opts: ['Nx','N0','N1','N2','N3'] },
                { key: 'tnmM', label: 'M — Métastase', opts: ['Mx','M0','M1'] },
              ].map(({ key, label, opts }) => (
                <div className="tnm-box" key={key}>
                  <div className="fl" style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: 6 }}>{label}</div>
                  <Select options={opts} value={data[key]} onChange={set(key)} />
                </div>
              ))}
            </div>
          </SC>

          <SC label="Traitement en cours">
            <TagGroup
              options={['Chimiothérapie','Radiothérapie','Chirurgie','Immunothérapie','Hormonothérapie','Thérapie ciblée','Aucun']}
              value={data.trtActuel}
              onChange={v => update({ trtActuel: v })}
            />
          </SC>
        </div>

        {/* RIGHT */}
        <div className="col-stack">

          <SC label="Statut de localisation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Toggle label="Localisé" checked={data.localise} onChange={v => update({ localise: v })} />
              <Toggle label="Métastatique" checked={data.metastatique} onChange={v => update({ metastatique: v })} />
              <Toggle label="Récidive" checked={data.recidive} onChange={v => update({ recidive: v })} />
            </div>
          </SC>

          <SC label="Date du diagnostic">
            <Field label="Date de découverte">
              <input className="fi" type="date" value={data.diagDate} onChange={set('diagDate')} />
            </Field>
            <Field label="Date de la première consultation" style={{ marginTop: 10 }}>
              <input className="fi" type="date" value={data.consultDate} onChange={set('consultDate')} />
            </Field>
          </SC>

          <SC label="Histologie / Type moléculaire">
            <Field label="Type histologique">
              <Select options={HISTOS} placeholder="Sélectionner…"
                value={data.histo} onChange={set('histo')} />
            </Field>

            <div className="field-row c2" style={{ marginTop: 12 }}>
              <Field label="Taille tumorale (cm)">
                <div className="fi-wrap">
                  <input className="fi" type="number" step="0.1" placeholder="ex: 4.2"
                    value={data.taille} onChange={set('taille')} />
                  <span className="fi-unit">cm</span>
                </div>
              </Field>
              <Field label="Grade SBR / OMS">
                <Select options={['Grade 1','Grade 2','Grade 3']} placeholder="—"
                  value={data.grade} onChange={set('grade')} />
              </Field>
            </div>

            <Field label="Récepteurs hormonaux (si sein)" style={{ marginTop: 12 }}>
              <TagGroup
                options={['RH+', 'RH−', 'HER2+', 'HER2−', 'Triple négatif']}
                value={data.recepteurs}
                onChange={v => update({ recepteurs: v })}
              />
            </Field>
          </SC>

          <SC label="Médecin référent">
            <div className="field-row c2">
              <Field label="Service">
                <input className="fi" type="text" placeholder="ex: Oncologie"
                  value={data.service} onChange={set('service')} />
              </Field>
              <Field label="Médecin">
                <input className="fi" type="text" placeholder="Dr. Nom"
                  value={data.medecin} onChange={set('medecin')} />
              </Field>
            </div>
          </SC>
        </div>
      </div>

      <BtnRow onBack={() => navigate('/page1')} onNext={() => navigate('/page3')} />
    </Layout>
  );
}