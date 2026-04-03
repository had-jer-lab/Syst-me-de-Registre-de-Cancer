import React from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { num: 1, label: 'Infos personnelles',     path: '/page1', icon: '👤' },
  { num: 2, label: 'Diagnostic & Cancer',    path: '/page2', icon: '🎗' },
  { num: 3, label: 'Traitements',            path: '/page6', icon: '💊' },
  { num: 4, label: 'Biologie & Imagerie',    path: '/page3', icon: '🔬' },
  { num: 5, label: 'Habitudes & Antécédents',path: '/page4', icon: '🌿' },
  { num: 6, label: 'Résumé & Validation',    path: '/page5', icon: '📋' },
];

export default function Layout({ children, currentStep, progress }) {
  const navigate = useNavigate();

  return (
    <div className="app-wrapper">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">⚕</div>
          MedDossier
        </div>
        <div className="topbar-right">
          <button className="notif-btn" title="Retour au dashboard" onClick={() => navigate('/dashboard')}>🏠</button>
          <div className="avatar">DR</div>
        </div>
      </div>

      {/* SHELL */}
      <div className="app-shell">

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-logo">
            Nouveau dossier <span>6 étapes</span>
          </div>
          <div className="sidebar-steps">
            {STEPS.map(step => {
              const isDone   = step.num < currentStep;
              const isActive = step.num === currentStep;
              return (
                <button
                  key={step.num}
                  className={`s-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  onClick={() => navigate(step.path)}
                >
                  <div className="s-num">
                    {isDone ? '✓' : step.icon || step.num}
                  </div>
                  <div className="s-step-label">{step.label}</div>
                </button>
              );
            })}
          </div>
          <div className="sidebar-footer">👤 Dr. Médecin</div>
        </div>

        {/* CONTENT */}
        <div className="content">
          <div className="prog-wrap">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="page-enter">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}