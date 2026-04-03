import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, IconInput, Select, TagGroup, PageHeader, BtnRow } from '../components/FormFields';

// ─── Wilayas + communes associées ────────────────────────────────────────────
const WILAYAS_COMMUNES = {
  'Adrar':             ['Adrar','Aoulef','Reggane','In Zghmir','Timimoun','Bordj Badji Mokhtar'],
  'Chlef':             ['Chlef','Ténès','Boukadir','Béni Haoua','Sobha','Oued Fodda'],
  'Laghouat':          ['Laghouat','Ksar El Hirane','Brida','Oued Morra','Aflou','Sidi Makhlouf'],
  'Oum El Bouaghi':    ['Oum El Bouaghi','Aïn Beïda','Aïn M\'lila','Souk Naamane','Fkirina'],
  'Batna':             ['Batna','Aïn Touta','Merouana','Tazoult','N\'Gaous','Aïn Djasser'],
  'Béjaïa':            ['Béjaïa','Akbou','Souk El Tenine','Tazmalt','El Kseur','Amizour'],
  'Biskra':            ['Biskra','Tolga','Ouled Djellal','Sidi Okba','Zeribet El Oued'],
  'Béchar':            ['Béchar','Abadla','Beni Abbès','Taghit','Kénadsa','Igli'],
  'Blida':             ['Blida','Boufarik','Larbaa','Meftah','Chiffa','Bougara'],
  'Bouira':            ['Bouira','Lakhdaria','Sour El Ghouzlane','Aïn Bessem','M\'Chedallah'],
  'Tamanrasset':       ['Tamanrasset','In Salah','In Guezzam','Abalessa','Tazrouk'],
  'Tébessa':           ['Tébessa','Bir El Ater','Cheria','El Aouinet','El Kouif'],
  'Tlemcen':           ['Tlemcen','Maghnia','Ghazaouet','Nedroma','Remchi','Aïn Témouchent'],
  'Tiaret':            ['Tiaret','Frenda','Ksar Chellala','Sougueur','Aïn Deheb'],
  'Tizi Ouzou':        ['Tizi Ouzou','Azazga','Draa El Mizan','Tigzirt','Boghni','Aïn El Hammam'],
  'Alger':             ['Alger Centre','Bab El Oued','Hussein Dey','El Harrach','Birkhadem','Dar El Beïda','Bordj El Kiffan','Kouba','Bachdjerrah','Rouiba'],
  'Djelfa':            ['Djelfa','Aïn Oussera','Messaad','Charef','Birine','Dar Chioukh'],
  'Jijel':             ['Jijel','El Milia','Taher','Ziama Mansouriah','Chekfa'],
  'Sétif':             ['Sétif','El Eulma','Aïn Oulmene','Bougaa','Béjaia'],
  'Saïda':             ['Saïda','Aïn El Hadjar','Sidi Boubekeur','Moulay Larbi'],
  'Skikda':            ['Skikda','Azzaba','El Harrouch','Collo','Aïn Charchar'],
  'Sidi Bel Abbès':    ['Sidi Bel Abbès','Tessala','Telagh','Sfisef','Benachour'],
  'Annaba':            ['Annaba','El Bouni','El Hadjar','Berrahal','Aïn Berda'],
  'Guelma':            ['Guelma','Bouchegouf','Héliopolis','Oued Zenati','Nechmaya'],
  'Constantine':       ['Constantine','El Khroub','Aïn Abid','Hamma Bouziane','Didouche Mourad'],
  'Médéa':             ['Médéa','Ksar El Boukhari','Berrouaghia','Tablat','Ain Boucif'],
  'Mostaganem':        ['Mostaganem','Ain Tedeles','Achaacha','Hassi Mameche','Sidi Ali'],
  'M\'Sila':           ['M\'Sila','Bou Saâda','Aïn El Melh','Magra','Sidi Aïssa'],
  'Mascara':           ['Mascara','Sig','Tighennif','Bouhanifia','Oggaz'],
  'Ouargla':           ['Ouargla','Touggourt','Hassi Messaoud','Ain Beida','El Borma'],
  'Oran':              ['Oran','Es Sénia','Bir El Djir','Aïn El Turk','Arzew','Bethioua','Mers El Kébir'],
  'El Bayadh':         ['El Bayadh','Brezina','Aïn El Orak','Chellala','Rogassa'],
  'Illizi':            ['Illizi','Djanet','In Amenas','Debdeb'],
  'Bordj Bou Arréridj':['Bordj Bou Arréridj','Ras El Oued','El Achir','Bir Kasdali'],
  'Boumerdès':         ['Boumerdès','Khemis El Khechna','Boudouaou','Thénia','Naciria','Corso'],
  'El Tarf':           ['El Tarf','El Kala','Ben M\'hidi','Besbes','Bouteldja'],
  'Tindouf':           ['Tindouf'],
  'Tissemsilt':        ['Tissemsilt','Theniet El Had','Bordj Bou Naama','Lardjem'],
  'El Oued':           ['El Oued','Biskra','Reguiba','Guemar','Bayadha','Robbah'],
  'Khenchela':         ['Khenchela','Aïn Touila','Baghaï','Chélia','Kais'],
  'Souk Ahras':        ['Souk Ahras','Sedrata','Mechroha','Oum El Adhaim'],
  'Tipaza':            ['Tipaza','Koléa','Hadjout','Cherchell','Fouka','Bou Ismail'],
  'Mila':              ['Mila','Ferdjioua','Chelghoum Laïd','Grarem Gouga'],
  'Aïn Defla':         ['Aïn Defla','Khemis Miliana','El Attaf','Aïn Lechiakh'],
  'Naâma':             ['Naâma','Mecheria','Aïn Sefra','Tiout','Sfissifa'],
  'Aïn Témouchent':    ['Aïn Témouchent','Beni Saf','Hammam Bou Hadjar','El Amria'],
  'Ghardaïa':          ['Ghardaïa','Metlili','Berriane','El Ménéa','Guerrara'],
  'Relizane':          ['Relizane','Mazouna','Aïn Tarik','Yellel','Sidi M\'Hamed'],
};

const WILAYAS = Object.keys(WILAYAS_COMMUNES).sort();

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age > 0 ? `${age} ans` : '';
}

// Validation téléphone algérien : 0X XX XX XX XX
function validatePhone(phone) {
  if (!phone) return true; // optionnel
  const cleaned = phone.replace(/\s/g, '');
  return /^0[567]\d{8}$/.test(cleaned);
}

// Validation NIN algérien : exactement 18 chiffres
function validateNIN(nin) {
  if (!nin) return true; // optionnel
  return /^\d{18}$/.test(nin.replace(/\s/g, ''));
}

export default function Page1() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (data.date_naissance) update({ age: calcAge(data.date_naissance) });
  }, [data.date_naissance]);

  // Communes disponibles selon la wilaya choisie
  const communesDispos = data.wilaya ? (WILAYAS_COMMUNES[data.wilaya] || []) : [];

  const set = (key) => (e) => {
    update({ [key]: e.target.value });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  // Quand on change de wilaya, réinitialiser la commune
  const handleWilayaChange = (e) => {
    update({ wilaya: e.target.value, commune: '', commune_id: null });
    if (errors.wilaya) setErrors(prev => ({ ...prev, wilaya: '' }));
  };

  const handleNext = () => {
    const newErrors = {};

    if (!data.last_name?.trim())    newErrors.last_name    = 'Le nom est obligatoire';
    if (!data.first_name?.trim())   newErrors.first_name   = 'Le prénom est obligatoire';
    if (!data.date_naissance)       newErrors.date_naissance = 'La date de naissance est obligatoire';
    if (!data.sexe)                 newErrors.sexe         = 'Veuillez sélectionner le sexe';

    if (data.phone && !validatePhone(data.phone)) {
      newErrors.phone = 'Format invalide (ex: 0770 123 456)';
    }
    if (data.national_id && !validateNIN(data.national_id)) {
      newErrors.national_id = 'Le NIN doit contenir exactement 18 chiffres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
              <div className="fg">
                <div className="fl">Nom *</div>
                <input
                  className={`fi ${errors.last_name ? 'err' : ''}`}
                  type="text"
                  placeholder="Nom de famille"
                  value={data.last_name || ''}
                  onChange={set('last_name')}
                />
                {errors.last_name && <span style={s.errTxt}>{errors.last_name}</span>}
              </div>
              <div className="fg">
                <div className="fl">Prénom *</div>
                <input
                  className={`fi ${errors.first_name ? 'err' : ''}`}
                  type="text"
                  placeholder="Prénom"
                  value={data.first_name || ''}
                  onChange={set('first_name')}
                />
                {errors.first_name && <span style={s.errTxt}>{errors.first_name}</span>}
              </div>
            </div>
          </SC>

          <SC label="Date de naissance">
            <div className="fg">
              <div className="fl">Date de naissance *</div>
              <input
                className={`fi ${errors.date_naissance ? 'err' : ''}`}
                type="date"
                value={data.date_naissance || ''}
                onChange={set('date_naissance')}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date_naissance && <span style={s.errTxt}>{errors.date_naissance}</span>}
              {data.age && (
                <span style={s.ageBadge}>{data.age}</span>
              )}
            </div>
          </SC>

          <SC label="Identifiant national">
            <div className="fg">
              <div className="fl">NIN — Numéro d'identification nationale (18 chiffres)</div>
              <div className="fi-wrap">
                <span className="fi-icon">🪪</span>
                <input
                  className={`fi ${errors.national_id ? 'err' : ''}`}
                  style={{ paddingLeft: 38 }}
                  type="text"
                  placeholder="ex: 198012031001234567"
                  maxLength={18}
                  value={data.national_id || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    update({ national_id: val });
                    if (errors.national_id) setErrors(prev => ({ ...prev, national_id: '' }));
                  }}
                />
              </div>
              <div style={s.ninCounter}>
                <span style={{ color: data.national_id?.length === 18 ? '#00C9A7' : '#7A8BAD' }}>
                  {data.national_id?.length || 0} / 18 chiffres
                </span>
                {data.national_id?.length === 18 && <span style={s.ninValid}>✓ Valide</span>}
              </div>
              {errors.national_id && <span style={s.errTxt}>{errors.national_id}</span>}
            </div>
          </SC>

          <SC label="Contact">
            <div className="field-row">
              <div className="fg">
                <div className="fl">Téléphone</div>
                <div className="fi-wrap">
                  <span className="fi-icon">📱</span>
                  <input
                    className={`fi ${errors.phone ? 'err' : ''}`}
                    style={{ paddingLeft: 38 }}
                    type="tel"
                    placeholder="0770 123 456"
                    maxLength={14}
                    value={data.phone || ''}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      if (val.length > 4 && val.length <= 7) val = val.slice(0,4) + ' ' + val.slice(4);
                      else if (val.length > 7) val = val.slice(0,4) + ' ' + val.slice(4,7) + ' ' + val.slice(7);
                      update({ phone: val });
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                  />
                </div>
                {errors.phone && <span style={s.errTxt}>{errors.phone}</span>}
                {data.phone && !errors.phone && validatePhone(data.phone) && (
                  <span style={s.ninValid}>✓ Numéro valide</span>
                )}
              </div>
              <div className="fg">
                <div className="fl">Adresse email</div>
                <div className="fi-wrap">
                  <span className="fi-icon">✉</span>
                  <input
                    className="fi"
                    style={{ paddingLeft: 38 }}
                    type="email"
                    placeholder="exemple@mail.com"
                    value={data.email || ''}
                    onChange={set('email')}
                  />
                </div>
              </div>
            </div>
          </SC>
        </div>

        {/* RIGHT */}
        <div className="col-stack">

          <SC label="Sexe biologique">
            <TagGroup
              options={['M', 'F']}
              labels={['♂ Masculin', '♀ Féminin']}
              value={data.sexe}
              onChange={v => { update({ sexe: v }); if (errors.sexe) setErrors(prev => ({ ...prev, sexe: '' })); }}
            />
            {errors.sexe && <span style={s.errTxt}>{errors.sexe}</span>}
          </SC>

          <SC label="Situation familiale">
            <TagGroup
              options={['celibataire', 'marie', 'divorce', 'veuf']}
              labels={['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf / Veuve']}
              value={data.situation_familiale}
              onChange={v => update({ situation_familiale: v })}
            />
          </SC>

          <SC label="Couverture sociale">
            <TagGroup
              options={['cnas', 'casnos', 'pmsr', 'aucune', 'autre']}
              labels={['CNAS', 'CASNOS', 'PMSR', 'Aucune', 'Autre']}
              value={data.couverture_sociale}
              onChange={v => update({ couverture_sociale: v })}
            />
          </SC>

          <SC label="Adresse">
            {/* Wilaya */}
            <div className="fg">
              <div className="fl">Wilaya</div>
              <select className="fi" value={data.wilaya || ''} onChange={handleWilayaChange}>
                <option value="">Sélectionner une wilaya…</option>
                {WILAYAS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Commune — visible seulement si wilaya choisie */}
            {data.wilaya && (
              <div className="fg" style={{ marginTop: 12 }}>
                <div className="fl">Commune</div>
                <select className="fi" value={data.commune || ''}
                  onChange={e => update({ commune: e.target.value })}>
                  <option value="">Sélectionner une commune…</option>
                  {communesDispos.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: '#7A8BAD', marginTop: 4 }}>
                  ℹ Le backend utilise un ID de commune — assurez-vous que l'API retourne <code>commune_id</code> lors de la recherche.
                </div>
              </div>
            )}

            <div className="fg" style={{ marginTop: 12 }}>
              <div className="fl">Adresse complète (optionnel)</div>
              <input className="fi" type="text" placeholder="Rue, n°…"
                value={data.adresse || ''} onChange={set('adresse')} />
            </div>
          </SC>

          <SC label="Activité professionnelle">
            <div className="fg">
              <div className="fl">Profession (optionnel)</div>
              <input className="fi" type="text" placeholder="ex: Enseignant, Agriculteur…"
                value={data.profession || ''} onChange={set('profession')} />
            </div>
          </SC>

        </div>
      </div>

      <BtnRow onNext={handleNext} />
    </Layout>
  );
}

const s = {
  errTxt: {
    fontSize: 11, fontWeight: 700, color: '#FF6B6B', marginTop: 3,
    display: 'flex', alignItems: 'center', gap: 4,
  },
  ageBadge: {
    display: 'inline-block', marginTop: 6,
    background: 'rgba(74,108,247,0.08)', border: '1.5px solid rgba(74,108,247,0.18)',
    borderRadius: 20, padding: '3px 12px',
    fontSize: 12, fontWeight: 800, color: '#4A6CF7',
  },
  ninCounter: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 700, marginTop: 4,
  },
  ninValid: {
    fontSize: 11, fontWeight: 800, color: '#00C9A7',
  },
};