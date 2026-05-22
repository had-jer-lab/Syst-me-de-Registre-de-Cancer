import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import Layout from '../components/Layout';
import { SC, Field, Select, TagGroup, PageHeader, BtnRow } from '../components/FormFields';

function calcIMC(poids, taille) {
  const p = parseFloat(poids);
  const t = parseFloat(taille) / 100;
  if (!p || !t || t <= 0) return { val: null, cat: '', color: 'var(--primary)' };
  const imc = p / (t * t);
  let cat = '', color = 'var(--primary)';
  if (imc < 18.5)     { cat = 'Insuffisance pondérale'; color = '#3498db'; }
  else if (imc < 25)  { cat = 'Corpulence normale'; color = 'var(--accent)'; }
  else if (imc < 30)  { cat = 'Surpoids'; color = 'var(--accent3)'; }
  else                { cat = 'Obésité'; color = 'var(--accent2)'; }
  return { val: imc.toFixed(1), cat, color };
}

function imcMarkerPct(imc) {
  if (!imc) return 0;
  return Math.min(100, Math.max(0, ((parseFloat(imc) - 16) / (40 - 16)) * 100));
}


export default function Page4() {
  const navigate = useNavigate();
  const { data, update } = usePatient();
  const set = (key) => (e) => update({ [key]: e.target.value });

  useEffect(() => {
    const { val } = calcIMC(data.poids, data.taillep);
    if (val) update({ imc: val });
  }, [data.poids, data.taillep]);

  const imc = calcIMC(data.poids, data.taillep);

  const addAntecedent = () => update({ antecedents: [...(data.antecedents || ['']), ''] });
  const removeAntecedent = (i) => update({ antecedents: (data.antecedents || []).filter((_, idx) => idx !== i) });
  const updateAntecedent = (i, val) => {
    const arr = [...(data.antecedents || [])];
    arr[i] = val;
    update({ antecedents: arr });
  };

  return (
    <Layout currentStep={4} progress={80}>
      <PageHeader
        icon="🌿"
        iconBg="linear-gradient(135deg,#00C9A7,#00a98b)"
        title="Habitudes de vie & Antécédents"
        step={4}
      />

      <div className="grid-2">
        {/* LEFT */}
        <div className="col-stack">

          {/* Tabagisme */}
          <SC label="Tabagisme">
            <TagGroup
              options={['Non-fumeur', 'Fumeur actif', 'Ex-fumeur']}
              value={data.tabac}
              onChange={v => update({ tabac: v })}
            />
            
          </SC>

          {/* Alcool */}
          <SC label="Consommation d'alcool">
            <div className="alc-grid">
              <TagGroup
                options={['Jamais', 'Rare', 'Modéré', 'Régulier']}
                value={data.alcool}
                onChange={v => update({ alcool: v })}
              />
            </div>
          </SC>

          {/* Activité physique */}
          <SC label="Activité physique">
            <TagGroup
              options={['Sédentaire', 'Légère', 'Modérée', 'Intense']}
              value={data.sport}
              onChange={v => update({ sport: v })}
            />
            <Field label="Fréquence hebdomadaire" style={{ marginTop: 10 }}>
              <Select
                options={['1 × / semaine','2–3 × / semaine','4–5 × / semaine','Quotidien']}
                placeholder="—"
                value={data.freqSport}
                onChange={set('freqSport')}
              />
            </Field>
          </SC>

          {/* Alimentation */}
          <SC label="Alimentation">
            <TagGroup
              options={['Omnivore', 'Végétarien', 'Végétalien', 'Régime spécial']}
              value={data.alim}
              onChange={v => update({ alim: v })}
            />
            <Field label="Remarques alimentaires" style={{ marginTop: 10 }}>
              <textarea className="fi" placeholder="ex: diabétique, régime hyposodé…"
                rows="2" value={data.alimentRem} onChange={set('alimentRem')} />
            </Field>
          </SC>
        </div>

        {/* RIGHT */}
        <div className="col-stack">

          {/* IMC */}
          <SC label="Poids, Taille & IMC">
            <div className="field-row c2">
              <Field label="Poids (kg)">
                <div className="fi-wrap">
                  <span className="fi-icon">⚖</span>
                  <input className="fi" type="number" step="0.5" placeholder="ex: 72"
                    value={data.poids} onChange={set('poids')} />
                  <span className="fi-unit">kg</span>
                </div>
              </Field>
              <Field label="Taille (cm)">
                <div className="fi-wrap">
                  <span className="fi-icon">📏</span>
                  <input className="fi" type="number" step="1" placeholder="ex: 175"
                    value={data.taillep} onChange={set('taillep')} />
                  <span className="fi-unit">cm</span>
                </div>
              </Field>
            </div>

            <div className="imc-display" style={{ marginTop: 12 }}>
              <span className="imc-val" style={{ color: imc.color }}>{imc.val || '—'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: imc.color }}>{imc.cat}</span>
            </div>
            <div className="imc-bar">
              <div className="imc-marker" style={{ left: `${imcMarkerPct(imc.val)}%` }} />
            </div>
            <div className="imc-ticks">
              <span>16</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
          </SC>

          {/* Antécédents familiaux */}
          <SC label="Antécédents familiaux de cancer">
            <TagGroup
              options={['✓ Oui', '✗ Non', '? Inconnu']}
              value={data.antFam}
              onChange={v => update({ antFam: v })}
            />
            <div style={{ marginTop: 12 }}>
              {(data.antecedents || ['']).map((ant, i) => (
                <div key={i} className="list-item" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}></span>
                  <input
                    className="fi"
                    style={{ flex: 1, border: 'none', background: 'transparent' }}
                    type="text"
                    placeholder="ex: Mère – cancer du sein, 52 ans…"
                    value={ant}
                    onChange={e => updateAntecedent(i, e.target.value)}
                  />
                  {i > 0 && (
                    <button className="del-btn" onClick={() => removeAntecedent(i)}>✕</button>
                  )}
                </div>
              ))}
              <button className="list-add" onClick={addAntecedent}>＋ Ajouter un antécédent</button>
            </div>
          </SC>

          {/* Traitements antérieurs */}
          

          {/* Allergies */}
          <SC label="Allergies médicamenteuses">
            <Field label="Médicaments déclencheurs">
              <input className="fi" type="text" placeholder="ex: Pénicilline, AINS, Iode…"
                value={data.allergies} onChange={set('allergies')} />
            </Field>
            <Field label="Autres allergies notables" style={{ marginTop: 10 }}>
              <input className="fi" type="text" placeholder="ex: Latex, arachides…"
                value={data.autresAllergies} onChange={set('autresAllergies')} />
            </Field>
          </SC>

          {/* Observations */}
          <SC label="Observations complémentaires">
            <textarea className="fi" rows="3" placeholder="Remarques libres du médecin…"
              value={data.observations} onChange={set('observations')} />
          </SC>
        </div>
      </div>

      <BtnRow onBack={() => navigate('/page3')} onNext={() => navigate('/page5')} />
    </Layout>
  );
}