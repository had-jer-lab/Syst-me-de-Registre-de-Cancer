import React from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { num: 1, label: 'Infos personnelles', path: '/page1' },
  { num: 2, label: 'Diagnostic & Cancer', path: '/page2' },
  { num: 3, label: 'Données biologiques & Imagerie', path: '/page3' },
  { num: 4, label: 'Habitudes de vie & Antécédents', path: '/page4' },
  { num: 5, label: 'Résumé & Validation', path: '/page5' },
];

export default function Layout({ children, currentStep, progress }) {
  const navigate = useNavigate();

  return (
    <div className="app-wrapper">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brand" onClick={() => navigate('/page1')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">⚕</div>
          MedDossier
        </div>
        <div className="topbar-right">
          <button className="notif-btn">🔔</button>
          <div className="avatar">DR</div>
        </div>
      </div>

      {/* SHELL */}
      <div className="app-shell">

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-logo">
            Nouveau Patient <span>5 étapes</span>
          </div>
          <div className="sidebar-steps">
            {STEPS.map(step => {
              const isDone = step.num < currentStep;
              const isActive = step.num === currentStep;
              return (
                <button
                  key={step.num}
                  className={`s-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  onClick={() => navigate(step.path)}
                >
                  <div className="s-num">
                    {isDone ? '✓' : step.num}
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
          {/* Progress Bar */}
          <div className="prog-wrap">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Page content */}
          <div className="page-enter">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}