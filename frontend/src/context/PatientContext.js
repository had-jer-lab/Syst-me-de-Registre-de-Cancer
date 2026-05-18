import React, { createContext, useContext, useState } from 'react';

const PatientContext = createContext();
export const usePatient = () => useContext(PatientContext);

const INITIAL = {
  // ── Page 1 — Patient model ──────────────────────────────────────────────
  last_name:           '',   // Patient.last_name
  first_name:          '',   // Patient.first_name
  date_naissance:      '',   // Patient.date_naissance
  age:                 '',   // calculé côté frontend
  national_id:         '',   // Patient.national_id
  phone:               '',   // Patient.phone
  email:               '',   // Patient.email
  sexe:                '',   // Patient.sexe  → 'M' | 'F'
  situation_familiale: '',   // Patient.situation_familiale → 'celibataire'|'marie'|'divorce'|'veuf'
  couverture_sociale:  '',   // Patient.couverture_sociale → 'cnas'|'casnos'|'pmsr'|'aucune'|'autre'
  wilaya:              '',   // UI only — pour filtrer les communes
  commune:             '',   // UI only — nom affiché
  commune_id:          null, // Patient.commune (FK id)
  hospital_id:         null, // Patient.hospital (FK id)
  adresse:             '',   // Patient.adresse
  profession:          '',   // Patient.profession

  // ── Page 2 — Cancer model ───────────────────────────────────────────────
  organe:              '',   // UI → label organe (affiché dans résumé)
  cancer_type_id:      null, // Cancer.cancer_type (FK id — optionnel)
  sous_type:           '',   // Cancer.sous_type
  type_tumeur:         '',   // Cancer.type_tumeur → 'solide'|'liquide'|'hematologique'
  lateralite:          '',   // Cancer.lateralite
  cim10_code:          '',   // Cancer.cim10_code
  cim10_manual:        '',   // UI only — si '__manual__'
  type_histologique:   '',   // Cancer.type_histologique (était data.histo)
  grade_histologique:  '',   // Cancer.grade_histologique (était data.grade)
  bloc_anapath:        '',   // Cancer.bloc_anapath
  stade_clinique:      '',   // Cancer.stade_clinique  (était data.stade)
  stade_pathologique:  '',   // Cancer.stade_pathologique
  tnmT:                'T0', // → Cancer.tnm (concaténé)
  tnmN:                'N0',
  tnmM:                'M0',
  taille_tumorale:     '',   // Cancer.taille_tumorale (était data.taille)
  ganglions_envahis:   '',   // Cancer.ganglions_envahis
  localise:            true, // Cancer.localise
  metastatique:        false,// Cancer.metastatique
  recidive:            false, // Cancer.recidive
  sites_metastatiques: [],   // Cancer.sites_metastatiques
  recepteur_er:        '',   // Cancer.recepteur_er → 'positif'|'negatif'|'inconnu'
  recepteur_pr:        '',   // Cancer.recepteur_pr
  her2:                '',   // Cancer.her2 → 'positif'|'equivoque'|'negatif'|'inconnu'
  date_symptomes:      '',   // Cancer.date_symptomes
  date_diagnostic:     '',   // Cancer.date_diagnostic (était data.diagDate)
  consultDate:         '',   // Consultation.consultation_date (UI only)
  dernier_rdv:         '',   // UI only
  etablissement_diag:  '',   // Cancer.etablissement_diag
  service_diag:        '',   // Cancer.service_diag (était data.service)
  medecin_diag:        '',   // Cancer.medecin_diag (était data.medecin)
  base_diagnostic:     [],   // Cancer.base_diagnostic

  // ── Page 3 — BiologicalExam / ImagingExam ──────────────────────────────
  cea:       '', ca199: '', ca125: '', afp: '', psa: '', ca153: '',
  nfs:       '', creat: '', ggt:  '', ldh: '', hb:  '', tp:   '',
  biopsy:    '',
  biopsyDate:'',
  imagerie:  [],
  rechutes:  [{ debut: '', fin: '' }],
  pathos:    [],
  como:      '',

  // ── Page 4 — PatientHabit / Patient (anthropométrie) ───────────────────
  tabac:           '',
  alcool:          '',
  sport:           '',
  freqSport:       '',
  alim:            '',
  alimentRem:      '',
  poids:           '',       // Patient.poids
  taille_patient:  '',       // Patient.taille (était data.taillep)
  imc:             '',       // Patient.imc
  antFam:          '',
  antecedents:     [''],
  allergies:       '',       // Patient.allergies
  autresAllergies: '',       // Patient.autres_allergies
  observations:    '',       // Patient.observations

  // ── Page 6 — Treatment ─────────────────────────────────────────────────
  traitements: [],
};

export const PatientProvider = ({ children }) => {
  const [data, setData] = useState({ ...INITIAL });

  const update = (updates) => setData(prev => ({ ...prev, ...updates }));

  const reset = () => setData({ ...INITIAL });

  return (
    <PatientContext.Provider value={{ data, update, reset }}>
      {children}
    </PatientContext.Provider>
  );
};