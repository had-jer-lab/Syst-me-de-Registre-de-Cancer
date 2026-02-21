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

// Sous-types par organe
const SOUS_TYPES = {
  'Sein': ['Canalaire invasif','Lobulaire invasif','Inflammatoire','Tubulaire','Mucineux','Médullaire','Papillaire','Triple négatif','Autre'],
  'Poumon': ['Adénocarcinome','Carcinome épidermoïde','Carcinome à petites cellules','Carcinome à grandes cellules','Carcinome neuroendocrine','Autre'],
  'Côlon / Rectum': ['Adénocarcinome','Tumeur neuroendocrine','Lymphome colorectal','Tumeur stromale','Autre'],
  'Prostate': ['Adénocarcinome acinaire','Adénocarcinome canalaire','Carcinome neuroendocrine','Carcinome à petites cellules','Autre'],
  'Col de l\'utérus': ['Carcinome épidermoïde','Adénocarcinome','Adénosquameux','Neuroendocrine','Autre'],
  'Thyroïde': ['Papillaire','Folliculaire','Médullaire','Anaplasique','Autre'],
  'Foie / Voies biliaires': ['Carcinome hépatocellulaire','Cholangiocarcinome','Angiosarcome','Hépatoblastome','Autre'],
  'Estomac': ['Adénocarcinome intestinal','Adénocarcinome diffus','Lymphome MALT','Tumeur stromale (GIST)','Autre'],
  'Pancréas': ['Adénocarcinome canalaire','Tumeur neuroendocrine','Cystadénocarcinome','Tumeur pseudopapillaire','Autre'],
  'Ovaire': ['Séreux','Mucineux','Endométrioïde','À cellules claires','Tumeur germinale','Autre'],
  'Rein': ['Carcinome à cellules claires','Carcinome papillaire','Carcinome chromophobe','Tumeur de Wilms','Autre'],
  'Vessie': ['Carcinome urothélial','Carcinome épidermoïde','Adénocarcinome','Carcinome à petites cellules','Autre'],
  'Os / Tissu mou': ['Ostéosarcome','Sarcome d\'Ewing','Chondrosarcome','Liposarcome','Fibrosarcome','Autre'],
  'Lymphome': ['Hodgkin classique','Hodgkin nodulaire','B diffus grandes cellules','Folliculaire','MALT','Burkitt','T périphérique','Autre'],
  'Leucémie': ['Myéloïde aiguë (LAM)','Lymphoïde aiguë (LAL)','Myéloïde chronique (LMC)','Lymphoïde chronique (LLC)','Autre'],
  'Mélanome cutané': ['Superficiel extensif','Nodulaire','Lentigo malin','Acral lentigineux','Autre'],
  'Cerveau / SNC': ['Glioblastome','Astrocytome','Oligodendrogliome','Épendymome','Médulloblastome','Méningiome','Autre'],
  'ORL': ['Carcinome épidermoïde cavité buccale','Carcinome nasopharynx','Carcinome larynx','Adénocarcinome glandes salivaires','Autre'],
  'Autre': ['Non spécifié']
};

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

          <SC label="Sous-type de cancer">
            <Field label="Sélectionner le sous-type">
              <Select 
                options={data.organe && SOUS_TYPES[data.organe] ? SOUS_TYPES[data.organe] : ['Sélectionner un organe d\'abord']}
                placeholder={data.organe ? "Sélectionner le sous-type…" : "Sélectionner un organe d'abord"}
                value={data.sousType} 
                onChange={set('sousType')}
                disabled={!data.organe}
              />
            </Field>
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