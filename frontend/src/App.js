import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';
import './styles/global.css';

import AdminDashboard from './pages/AdminDashboard';
import AuthPage      from './pages/AuthPage';
import Dashboard     from './pages/Dashboard';
import ImportData    from './pages/ImportData';
import DiscussionRCP from './pages/DiscussionRCP';
import EditPatient   from './pages/EditPatient';
import Page1         from './pages/Page1';
import Page2         from './pages/Page2';
import Page3         from './pages/Page3';
import Page4         from './pages/Page4';
import Page5         from './pages/Page5';
import Page6         from './pages/Page6';
import PatientDossier from './pages/PatientDossier';
import PatientPublicView from './pages/PatientPublicView';


export default function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<Navigate to="/auth" replace />} />
          <Route path="/auth"       element={<AuthPage />} />
          <Route path="/admin"      element={<AdminDashboard />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/import"     element={<ImportData />} />
          <Route path="/rcp"        element={<DiscussionRCP />} />

          {/* Formulaire patient — 6 étapes */}
          <Route path="/page1"      element={<Page1 />} />
          <Route path="/page2"      element={<Page2 />} />
          <Route path="/page6"      element={<Page6 />} />   {/* Traitements (step 3) */}
          <Route path="/page3"      element={<Page3 />} />   {/* Biologie (step 4) */}
          <Route path="/page4"      element={<Page4 />} />   {/* Habitudes (step 5) */}
          <Route path="/page5"      element={<Page5 />} />   {/* Résumé (step 6) */}
          <Route path="/patient/:id"      element={<PatientDossier />} />
          <Route path="/patient-public/:id" element={<PatientPublicView />} />
          <Route path="/patient/:id/edit" element={<EditPatient />} />
          <Route path="*"           element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}