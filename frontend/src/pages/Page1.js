import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, Select, TagGroup, PageHeader, BtnRow } from '../components/FormFields';

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

function validatePhone(p) {
  if (!p) return true;
  return /^0[567]\d{8}$/.test(p.replace(/\s/g,''));
}
function validateNIN(n) {
  if (!n) return true;
  return /^\d{18}$/.test(n.replace(/\s/g,''));
}

export default function Page1() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (data.date_naissance) update({ age: calcAge(data.date_naissance) });
  }, [data.date_naissance]);

  const communesDispos = data.wilaya ? (WILAYAS_COMMUNES[data.wilaya] || []) : [];

  const set = (key) => (e) => {
    update({ [key]: e.target.value });
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

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
      <PageHeader icon="👤" iconBg="linear-gradient(135deg,#4A6CF7,#6B87FF)" title="Infos personnelles" step={1} />

      <div className="grid-2">
        {/* LEFT */}
        <div className="col-stack">

          <SC label="Identité du patient">
            <div className="field-row c2">
              <div className="fg">
                <div className="fl">Nom *</div>
                <input className={`fi ${errors.last_name?'err':''}`} type="text"
                  placeholder="Nom de famille" value={data.last_name||''}
                  onChange={set('last_name')} />
                {errors.last_name && <span style={s.err}>{errors.last_name}</span>}
              </div>
              <div className="fg">
                <div className="fl">Prénom *</div>
                <input className={`fi ${errors.first_name?'err':''}`} type="text"
                  placeholder="Prénom" value={data.first_name||''}
                  onChange={set('first_name')} />
                {errors.first_name && <span style={s.err}>{errors.first_name}</span>}
              </div>
            </div>
          </SC>

          <SC label="Date de naissance">
            <div className="fg">
              <div className="fl">Date de naissance *</div>
              <input className={`fi ${errors.date_naissance?'err':''}`} type="date"
                value={data.date_naissance||''} onChange={set('date_naissance')}
                max={new Date().toISOString().split('T')[0]} />
              {errors.date_naissance && <span style={s.err}>{errors.date_naissance}</span>}
              {data.age && <span style={s.ageBadge}>{data.age}</span>}
            </div>
          </SC>

          <SC label="Identifiant national">
            <div className="fg">
              <div className="fl">NIN — 18 chiffres</div>
              <div className="fi-wrap">
                <span className="fi-icon">🪪</span>
                <input className={`fi ${errors.national_id?'err':''}`}
                  style={{paddingLeft:38}} type="text"
                  placeholder="ex: 198012031001234567" maxLength={18}
                  value={data.national_id||''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g,'');
                    update({ national_id: val });
                    if (errors.national_id) setErrors(p=>({...p,national_id:''}));
                  }} />
              </div>
              <span style={{fontSize:11,fontWeight:700,marginTop:4,
                color:data.national_id?.length===18?'#00C9A7':'#7A8BAD'}}>
                {data.national_id?.length||0} / 18{data.national_id?.length===18?' ✓':''}
              </span>
              {errors.national_id && <span style={s.err}>{errors.national_id}</span>}
            </div>
          </SC>

          <SC label="Contact">
            <div className="field-row">
              <div className="fg">
                <div className="fl">Téléphone</div>
                <div className="fi-wrap">
                  <span className="fi-icon">📱</span>
                  <input className={`fi ${errors.phone?'err':''}`}
                    style={{paddingLeft:38}} type="tel"
                    placeholder="0770 123 456" maxLength={14}
                    value={data.phone||''}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g,'').slice(0,10);
                      if (val.length>7) val=val.slice(0,4)+' '+val.slice(4,7)+' '+val.slice(7);
                      else if (val.length>4) val=val.slice(0,4)+' '+val.slice(4);
                      update({ phone: val });
                      if (errors.phone) setErrors(p=>({...p,phone:''}));
                    }} />
                </div>
                {errors.phone && <span style={s.err}>{errors.phone}</span>}
                {data.phone&&!errors.phone&&validatePhone(data.phone)&&
                  <span style={{fontSize:11,color:'#00C9A7',fontWeight:700}}>✓ Valide</span>}
              </div>
              <div className="fg">
                <div className="fl">Email</div>
                <div className="fi-wrap">
                  <span className="fi-icon">✉</span>
                  <input className="fi" style={{paddingLeft:38}} type="email"
                    placeholder="exemple@mail.com" value={data.email||''}
                    onChange={set('email')} />
                </div>
              </div>
            </div>
          </SC>
        </div>

        {/* RIGHT */}
        <div className="col-stack">

          <SC label="Sexe biologique">
            <div className="tag-group">
              {[{v:'M',l:'♂ Masculin'},{v:'F',l:'♀ Féminin'}].map(({v,l}) => (
                <button key={v} type="button"
                  className={`tag ${data.sexe===v?'sel':''}`}
                  onClick={() => { update({sexe:v}); if(errors.sexe) setErrors(p=>({...p,sexe:''})); }}>
                  {l}
                </button>
              ))}
            </div>
            {errors.sexe && <span style={s.err}>{errors.sexe}</span>}
          </SC>

          <SC label="Situation familiale">
            <div className="tag-group">
              {[
                {v:'celibataire',l:'Célibataire'},
                {v:'marie',l:'Marié(e)'},
                {v:'divorce',l:'Divorcé(e)'},
                {v:'veuf',l:'Veuf / Veuve'},
              ].map(({v,l}) => (
                <button key={v} type="button"
                  className={`tag ${data.situation_familiale===v?'sel':''}`}
                  onClick={() => update({situation_familiale:v})}>
                  {l}
                </button>
              ))}
            </div>
          </SC>

          <SC label="Couverture sociale">
            <div className="tag-group">
              {[
                {v:'cnas',l:'CNAS'},{v:'casnos',l:'CASNOS'},
                {v:'pmsr',l:'PMSR'},{v:'aucune',l:'Aucune'},{v:'autre',l:'Autre'},
              ].map(({v,l}) => (
                <button key={v} type="button"
                  className={`tag ${data.couverture_sociale===v?'sel':''}`}
                  onClick={() => update({couverture_sociale:v})}>
                  {l}
                </button>
              ))}
            </div>
          </SC>

          <SC label="Adresse">
            <div className="fg">
              <div className="fl">Wilaya</div>
              <select className="fi" value={data.wilaya||''}
                onChange={e => update({wilaya:e.target.value,commune:'',commune_id:null})}>
                <option value="">Sélectionner une wilaya…</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            {data.wilaya && (
              <div className="fg" style={{marginTop:10}}>
                <div className="fl">Commune</div>
                <select className="fi" value={data.commune||''}
                  onChange={e => update({commune:e.target.value})}>
                  <option value="">Sélectionner une commune…</option>
                  {communesDispos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div className="fg" style={{marginTop:10}}>
              <div className="fl">Adresse complète (optionnel)</div>
              <input className="fi" type="text" placeholder="Rue, n°…"
                value={data.adresse||''} onChange={set('adresse')} />
            </div>
          </SC>

          <SC label="Activité professionnelle">
            <div className="fg">
              <div className="fl">Profession (optionnel)</div>
              <input className="fi" type="text" placeholder="ex: Enseignant…"
                value={data.profession||''} onChange={set('profession')} />
            </div>
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