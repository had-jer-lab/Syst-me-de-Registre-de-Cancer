import React, { createContext, useContext, useState } from 'react';

const PatientContext = createContext();
export const usePatient = () => useContext(PatientContext);

const INITIAL = {
  /* ── Page 1 — Infos personnelles ───────────────────────────────── */
  // → Patient model
  first_name: '', last_name: '',          // first_name, last_name
  date_naissance: '', sexe: '',           // date_naissance, sexe (M/F)
  situation_familiale: '',                // situation_familiale
  profession: '',                         // profession
  phone: '', email: '',                   // phone, email
  adresse: '',                            // adresse
  wilaya_id: '', commune_id: '',          // commune (FK)
  national_id: '',                        // national_id (NIN)
  couverture_sociale: '',                 // couverture_sociale
  hospital_id: '',                        // hospital (FK)

  /* ── Page 2 — Diagnostic & Cancer ─────────────────────────────── */
  // → Cancer model
  cancer_type_id: '',                     // cancer_type (FK) — résolu via nom
  cancer_type_name: '',                   // nom local pour affichage
  type_tumeur: '',                        // type_tumeur (solide/liquide/hematologique)
  sous_type: '',                          // sous_type
  lateralite: '',                         // lateralite
  cim10_code: '', cim10_manual: '',       // cim10_code
  date_symptomes: '',                     // date_symptomes
  diagDate: '',                           // date_diagnostic
  consultDate: '',                        // (consultation locale)
  dernier_rdv: '',                        // (consultation locale)
  base_diagnostic: [],                    // base_diagnostic (JSONField)
  etablissement_diag: '',                 // etablissement_diag
  service: '',                            // service_diag
  medecin: '',                            // medecin_diag
  histo: '',                              // type_histologique
  grade: '',                              // grade_histologique
  bloc_anapath: '',                       // bloc_anapath
  stade: '',                              // stade_clinique
  tnmT: 'T0', tnmN: 'N0', tnmM: 'M0',   // tnm (T+N+M)
  taille: '',                             // taille_tumorale
  ganglions_envahis: '',                  // ganglions_envahis
  localise: true,                         // localise
  metastatique: false,                    // metastatique
  recidive: false,                        // recidive
  sites_metastatiques: [],                // sites_metastatiques (JSONField)
  // Récepteurs → recepteur_er, recepteur_pr, her2
  er: '', pr: '', her2: '',

  /* ── Page 3 — Biologie & Imagerie ────────────────────────────── */
  // → BiologicalExam (multiple)
  cea: '', ca199: '', ca125: '', afp: '', psa: '', ca153: '',
  nfs: '', creat: '', ggt: '', ldh: '', hb: '', tp: '',
  biopsy: '', biopsyDate: '',
  como: '',
  imagerie: [],                           // → ImagingExam (multiple)
  rechutes: [{ debut: '', fin: '' }],
  pathos: [],

  /* ── Page 4 — Habitudes & Antécédents ────────────────────────── */
  tabac: '', typeTabac: '', paquetsAnnees: '', dureTabac: '',
  alcool: '', sport: '', freqSport: '', alim: '', alimentRem: '',
  poids: '', taillep: '', imc: '',
  antFam: '', antecedents: [''],
  trtAnt: '', trtActuel: '',
  allergies: '', autresAllergies: '',
  observations: '',

  /* ── Page 6 — Traitements ─────────────────────────────────────── */
  // → Treatment model (nested sous Cancer)
  // Chaque objet :
  // { _id (local), type_traitement, intention, statut, ligne,
  //   protocole, medicaments, voie_administration, jours_administration[],
  //   cycles_prevus, cycles_realises, date_debut, date_fin,
  //   reponse_tumorale, date_evaluation, grade_toxicite, description_toxicite }
  traitements: [],
};

export const PatientProvider = ({ children }) => {
  const [data, setData] = useState(INITIAL);

  const update = (updates) => setData(prev => ({ ...prev, ...updates }));

  const reset = () => setData(INITIAL);

  return (
    <PatientContext.Provider value={{ data, update, reset }}>
      {children}
    </PatientContext.Provider>
  );
};