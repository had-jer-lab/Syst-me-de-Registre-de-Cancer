// components/MicButton.jsx
import React from 'react';
import { useSpeechInput } from '../hooks/useSpeechInput';

export function MicButton({ onResult, lang = 'fr-FR', style = {} }) {
  const { listening, supported, toggle } = useSpeechInput({ lang, onResult });
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Arrêter' : 'Dicter'}
      style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
        border: listening ? '2px solid #E53E3E' : '1.5px solid #CBD5E0',
        background: listening ? '#FFF5F5' : 'white', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: listening ? '0 0 0 4px rgba(229,62,62,0.15)' : 'none',
        ...style,
      }}
    >
      {listening ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#E53E3E">
          <rect x="3" y="8" width="3" height="8" rx="1.5">
            <animate attributeName="height" values="8;14;8" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="y" values="8;5;8" dur="0.8s" repeatCount="indefinite"/>
          </rect>
          <rect x="10.5" y="5" width="3" height="14" rx="1.5">
            <animate attributeName="height" values="14;8;14" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="y" values="5;8;5" dur="0.8s" repeatCount="indefinite"/>
          </rect>
          <rect x="18" y="8" width="3" height="8" rx="1.5">
            <animate attributeName="height" values="8;14;8" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="y" values="8;5;8" dur="0.8s" repeatCount="indefinite"/>
          </rect>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="11" rx="3"/>
          <path d="M5 10a7 7 0 0 0 14 0"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="9" y1="22" x2="15" y2="22"/>
        </svg>
      )}
    </button>
  );
}