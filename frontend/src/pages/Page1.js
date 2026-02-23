import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, IconInput, Select, TagGroup, PageHeader, BtnRow } from '../components/FormFields';

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran',
  'El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf',
  'Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla',
  'Naâma','Aïn Témouchent','Ghardaïa','Relizane'
];

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age > 0 ? `${age} ans` : '';
}

export default function Page1() {
  const navigate = useNavigate();
  const { data, update } = usePatient();

  useEffect(() => {
    if (data.dob) update({ age: calcAge(data.dob) });
  }, [data.dob]);

  const set = (key) => (e) => update({ [key]: e.target.value });

  const handleNext = () => {
    if (!data.nom.trim() || !data.prenom.trim()) {
      const el = !data.nom.trim()
        ? document.querySelector('[data-id="nom"]')
        : document.querySelector('[data-id="prenom"]');
      if (el) { el.classList.add('err'); setTimeout(() => el.classList.remove('err'), 2000); }
      return;
    }
    navigate('/page2');
  };

  return (
    <Layout currentStep={1} progress={20}>
      <PageHeader
        icon="👤"
        iconBg="linear-gradient(135deg,#4A6CF7,#6B87FF)"
        title="Infos personnelles"
        step={1}
      />

      <div className="grid-2">
        {/* LEFT */}
        <div className="col-stack">

          <SC label="Identité du patient">
            <div className="field-row c2">
              <Field label="Nom *">
                <input
                  className="fi" data-id="nom" type="text"
                  placeholder="Nom de famille"
                  value={data.nom} onChange={set('nom')}
                />
              </Field>
              <Field label="Prénom *">
                <input
                  className="fi" data-id="prenom" type="text"
                  placeholder="Prénom"
                  value={data.prenom} onChange={set('prenom')}
                />
              </Field>
            </div>
          </SC>

          <SC label="Date de naissance & Âge">
            <div className="field-row c2">
              <Field label="Date de naissance">
                <input className="fi" type="date" value={data.dob} onChange={set('dob')} />
              </Field>
            
            </div>
          </SC>

          <SC label="Numéro de dossier">
            <Field label="NIN — Numéro d'identification nationale">
              <IconInput icon="🪪" value={data.nin} onChange={set('nin')} placeholder="ex: 1D00925D42889" />
            </Field>
          </SC>

          <SC label="Contact">
            <div className="field-row">
              <Field label="Téléphone">
                <IconInput icon="📱" value={data.tel} onChange={set('tel')} type="tel" placeholder="0770 123 456" />
              </Field>
              <Field label="Adresse email">
                <IconInput icon="✉" value={data.email} onChange={set('email')} type="email" placeholder="exemple@mail.com" />
              </Field>
            </div>
          </SC>
        </div>

        {/* RIGHT */}
        <div className="col-stack">

          <SC label="Sexe biologique">
            <TagGroup
              options={['♂ Masculin', '♀ Féminin']}
              value={data.sexe}
              onChange={v => update({ sexe: v })}
            />
          </SC>

          <SC label="Situation familiale">
            <TagGroup
              options={['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf / Veuve']}
              value={data.famille}
              onChange={v => update({ famille: v })}
            />
          </SC>

          <SC label="Adresse">
            <div className="field-row c2">
              <Field label="Wilaya">
                <Select
                  options={WILAYAS}
                  placeholder="Sélectionner…"
                  value={data.wilaya}
                  onChange={set('wilaya')}
                />
              </Field>
              <Field label="Commune">
                <input className="fi" type="text" placeholder="Commune / Quartier"
                  value={data.commune} onChange={set('commune')} />
              </Field>
            </div>
            <Field label="Adresse complète (optionnel)" style={{ marginTop: 12 }}>
              <input className="fi" type="text" placeholder="Rue, n°…"
                value={data.adresse} onChange={set('adresse')} />
            </Field>
          </SC>

          

          <SC label="Activité professionnelle">
            <Field label="Profession (optionnel)">
              <input className="fi" type="text" placeholder="ex: Enseignant, Agriculteur…"
                value={data.profession} onChange={set('profession')} />
            </Field>
          </SC>
        </div>
      </div>

      <BtnRow onNext={handleNext} />
    </Layout>
  );
}