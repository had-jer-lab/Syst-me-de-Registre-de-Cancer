import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, IconInput, Select, TagGroup, PageHeader, BtnRow } from '../components/FormFields';
import { MicButton } from '../components/MicButton';
import { VoiceFillPanel } from '../components/VoiceFillPanel';
import { IDCardScanner } from '../components/IDCardScanner'; // ✅ مهم

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

// wrapper micro
function MicField({ children, onResult, lang }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <MicButton onResult={onResult} lang={lang} />
    </div>
  );
}

export default function Page1() {
  const navigate = useNavigate();
  const { data, update } = usePatient();

  useEffect(() => {
    if (data.dob) update({ age: calcAge(data.dob) });
  }, [data.dob]);

  const set = (key) => (e) => update({ [key]: e.target.value });

  // ✅ VOICE + SCANNER (موحد)
  const handleVoiceFill = (fields) => {
    const mapped = {};

    if (fields.nom)         mapped.nom     = fields.nom;
    if (fields.prenom)      mapped.prenom  = fields.prenom;
    if (fields.dob)         mapped.dob     = fields.dob;
    if (fields.sexe)        mapped.sexe    = fields.sexe;
    if (fields.famille)     mapped.famille = fields.famille;
    if (fields.tel)         mapped.tel     = fields.tel;
    if (fields.wilaya)      mapped.wilaya  = fields.wilaya;
    if (fields.commune)     mapped.commune = fields.commune;
    if (fields.poids)       mapped.poids   = fields.poids;
    if (fields.taillep)     mapped.taillep = fields.taillep;

    // ✅ خاص بالـ ID Card
    if (fields.national_id) mapped.nin = fields.national_id;

    update(mapped);
  };

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

      {/* 🎤 Voice */}
      <VoiceFillPanel onFill={handleVoiceFill} />

      {/* 🪪 Scanner */}
      <IDCardScanner onFill={handleVoiceFill} />

      <div className="grid-2">

        {/* LEFT */}
        <div className="col-stack">

          <SC label="Identité du patient">
            <div className="field-row c2">
              <Field label="Nom *">
                <MicField onResult={(t) => update({ nom: t })}>
                  <input
                    className="fi" data-id="nom"
                    placeholder="Nom"
                    value={data.nom}
                    onChange={set('nom')}
                  />
                </MicField>
              </Field>

              <Field label="Prénom *">
                <MicField onResult={(t) => update({ prenom: t })}>
                  <input
                    className="fi" data-id="prenom"
                    placeholder="Prénom"
                    value={data.prenom}
                    onChange={set('prenom')}
                  />
                </MicField>
              </Field>
            </div>
          </SC>

          <SC label="Date de naissance">
            <Field>
              <input type="date" className="fi"
                value={data.dob}
                onChange={set('dob')}
              />
            </Field>
          </SC>

          <SC label="NIN">
            <MicField onResult={(t) => update({ nin: t })}>
              <IconInput icon="🪪"
                value={data.nin}
                onChange={set('nin')}
              />
            </MicField>
          </SC>

        </div>

        {/* RIGHT */}
        <div className="col-stack">

          <SC label="Sexe">
            <TagGroup
              options={['♂ Masculin', '♀ Féminin']}
              value={data.sexe}
              onChange={v => update({ sexe: v })}
            />
          </SC>

          <SC label="Adresse">
            <Field label="Wilaya">
              <Select
                options={WILAYAS}
                value={data.wilaya}
                onChange={set('wilaya')}
              />
            </Field>

            <Field label="Commune">
              <MicField onResult={(t) => update({ commune: t })}>
                <input
                  className="fi"
                  value={data.commune}
                  onChange={set('commune')}
                />
              </MicField>
            </Field>
          </SC>

        </div>

      </div>

      <BtnRow onNext={handleNext} />
    </Layout>
  );
}