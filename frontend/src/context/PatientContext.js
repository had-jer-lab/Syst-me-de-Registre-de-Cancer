import React, { createContext, useContext, useState } from 'react';

const PatientContext = createContext();
export const usePatient = () => useContext(PatientContext);

export const PatientProvider = ({ children }) => {
  const [data, setData] = useState({
    // Page 1
    nom: '', prenom: '', dob: '', age: '', nin: '',
    tel: '', email: '', sexe: '', famille: '',
    wilaya: '', commune: '', adresse: '', couverture: '', profession: '',
    // Page 2
    typeT: '', organe: '', lat: '', topo: '', stade: '',
    tnmT: 'T0', tnmN: 'N0', tnmM: 'M0',
    localisation: '',   // 'localise' | 'metastatique' | 'recidive' | ''
    diagDate: '', consultDate: '', histo: '', grade: '',
    taille: '', recepteurs: '', 
    trtActuel: '',
    dernier_rdv: '',
    sous_type: '',
    // Page 3
    cea: '', ca199: '', ca125: '', afp: '', psa: '', ca153: '',
    nfs: '', creat: '', ggt: '', ldh: '', hb: '', tp: '',
    biopsy: '', biopsyDate: '', como: '',
    imagerie: [],
    rechutes: [{ debut: '', fin: '' }],
    pathos: [{ name: 'Diabète : HTA', date: '12/2021' }],
    // Page 4
    tabac: '', typeTabac: '', paquetsAnnees: '', dureTabac: '',
    alcool: '', sport: '', freqSport: '', alim: '', alimentRem: '',
    poids: '', taillep: '', imc: '',
    antFam: '', antecedents: [''],
    trtAnt: '', allergies: '', autresAllergies: '', observations: '',
  });

  const update = (updates) => setData(prev => ({ ...prev, ...updates }));

  return (
    <PatientContext.Provider value={{ data, update }}>
      {children}
    </PatientContext.Provider>
  );
};