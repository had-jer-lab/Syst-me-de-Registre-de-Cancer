import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, IconInput, Select, TagGroup, PageHeader, BtnRow } from '../components/FormFields';

const WILAYAS_COMMUNES = {
  'Adrar':['Adrar','Aoulef','Reggane','Timimoun'],
  'Chlef':['Chlef','Ténès','Boukadir','Oued Fodda'],
  'Laghouat':['Laghouat','Aflou','Sidi Makhlouf'],
  'Oum El Bouaghi':['Oum El Bouaghi','Aïn Beïda',"Aïn M'lila"],
  'Batna':['Batna','Aïn Touta','Tazoult'],
  'Béjaïa':['Béjaïa','Akbou','Tazmalt','El Kseur'],
  'Biskra':['Biskra','Tolga','Ouled Djellal','Sidi Okba'],
  'Béchar':['Béchar','Abadla','Beni Abbès','Taghit'],
  'Blida':['Blida','Boufarik','Larbaa','Meftah'],
  'Bouira':['Bouira','Lakhdaria','Sour El Ghouzlane'],
  'Tamanrasset':['Tamanrasset','In Salah'],
  'Tébessa':['Tébessa','Bir El Ater','Cheria'],
  'Tlemcen':['Tlemcen','Maghnia','Ghazaouet','Nedroma'],
  'Tiaret':['Tiaret','Frenda','Ksar Chellala'],
  'Tizi Ouzou':['Tizi Ouzou','Azazga','Draa El Mizan','Tigzirt'],
  'Alger':['Alger Centre','Bab El Oued','Hussein Dey','El Harrach','Kouba','Rouiba'],
  'Djelfa':['Djelfa','Aïn Oussera','Messaad'],
  'Jijel':['Jijel','El Milia','Taher'],
  'Sétif':['Sétif','El Eulma','Aïn Oulmene','Bougaa'],
  'Saïda':['Saïda','Aïn El Hadjar'],
  'Skikda':['Skikda','Azzaba','El Harrouch','Collo'],
  'Sidi Bel Abbès':['Sidi Bel Abbès','Tessala','Telagh','Sfisef'],
  'Annaba':['Annaba','El Bouni','El Hadjar','Berrahal'],
  'Guelma':['Guelma','Bouchegouf','Héliopolis'],
  'Constantine':['Constantine','El Khroub','Hamma Bouziane'],
  'Médéa':['Médéa','Ksar El Boukhari','Berrouaghia'],
  'Mostaganem':['Mostaganem','Ain Tedeles','Achaacha'],
  "M'Sila":["M'Sila",'Bou Saâda','Magra'],
  'Mascara':['Mascara','Sig','Tighennif'],
  'Ouargla':['Ouargla','Touggourt','Hassi Messaoud'],
  'Oran':['Oran','Es Sénia','Bir El Djir','Aïn El Turk','Arzew'],
  'El Bayadh':['El Bayadh','Brezina'],
  'Illizi':['Illizi','Djanet','In Amenas'],
  'Bordj Bou Arréridj':['Bordj Bou Arréridj','Ras El Oued'],
  'Boumerdès':['Boumerdès','Khemis El Khechna','Boudouaou','Thénia'],
  'El Tarf':['El Tarf','El Kala','Besbes'],
  'Tindouf':['Tindouf'],
  'Tissemsilt':['Tissemsilt','Theniet El Had'],
  'El Oued':['El Oued','Reguiba','Guemar'],
  'Khenchela':['Khenchela','Aïn Touila','Baghaï'],
  'Souk Ahras':['Souk Ahras','Sedrata'],
  'Tipaza':['Tipaza','Koléa','Hadjout','Cherchell'],
  'Mila':['Mila','Ferdjioua','Chelghoum Laïd'],
  'Aïn Defla':['Aïn Defla','Khemis Miliana','El Attaf'],
  'Naâma':['Naâma','Mecheria','Aïn Sefra'],
  'Aïn Témouchent':['Aïn Témouchent','Beni Saf','El Amria'],
  'Ghardaïa':['Ghardaïa','Metlili','Berriane'],
  'Relizane':['Relizane','Mazouna','Yellel'],
};

const WILAYAS = Object.keys(WILAYAS_COMMUNES).sort();

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob), today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age > 0 ? `${age} ans` : '';
}

export default function Page1() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (data.date_naissance) update({ age: calcAge(data.date_naissance) });
  }, [data.date_naissance]);

  const communesDispos = data.wilaya ? (WILAYAS_COMMUNES[data.wilaya] || []) : [];

  const set = (key) => (e) => update({ [key]: e.target.value });

  const handleNext = () => {
    const errs = {};
    if (!data.last_name?.trim())  errs.last_name  = 'Le nom est obligatoire';
    if (!data.first_name?.trim()) errs.first_name = 'Le prénom est obligatoire';
    if (!data.date_naissance)     errs.date_naissance = 'La date de naissance est obligatoire';
    if (!data.sexe)               errs.sexe = 'Veuillez sélectionner le sexe';
    if (data.phone && !validatePhone(data.phone))
      errs.phone = 'Format invalide (ex: 0770 123 456)';
    if (data.national_id && !validateNIN(data.national_id))
      errs.national_id = 'Le NIN doit contenir exactement 18 chiffres';
    if (Object.keys(errs).length) { setErrors(errs); return; }
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
              <Field label="Âge"></Field>
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

const s = {
  err: {fontSize:11,fontWeight:700,color:'#FF6B6B',marginTop:3,display:'block'},
  ageBadge: {display:'inline-block',marginTop:6,background:'rgba(74,108,247,0.08)',
    border:'1.5px solid rgba(74,108,247,0.18)',borderRadius:20,padding:'3px 12px',
    fontSize:12,fontWeight:800,color:'#4A6CF7'},
};