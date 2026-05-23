import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

// ─── QR Code generator (pure JS, sans librairie externe) ─────────────────────
// Utilise l'API QR Server gratuite
function getQRUrl(text, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=1A2B4A&qzone=2&format=png`;
}

function getPublicUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // ← REMPLACEZ CETTE IP PAR VOTRE ADRESSE IP RÉELLE (trouvée avec ipconfig)
    const localIP = '192.168.1.7';
    return `http://${localIP}:${window.location.port}`;
  }
  return window.location.origin;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PatientQRCode({ patient: propPatient }) {
  const { id } = useParams();
  const [showModal, setShowModal] = useState(Boolean(id));
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(!propPatient && Boolean(id));
  const [fetchedPatient, setFetchedPatient] = useState(null);
  const printRef = useRef();
  const patient = propPatient || fetchedPatient;

  useEffect(() => {
    if (propPatient || !id) return;

    const token = localStorage.getItem('access') ||
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('access_token');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    fetch(`/api/patients/${id}/`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setFetchedPatient(data))
      .catch(() => setFetchedPatient(null))
      .finally(() => setLoading(false));
  }, [id, propPatient]);

  if (!patient) {
    return loading ? (
      <div style={{ padding: 24, color: '#64748b', fontSize: 14 }}>
        Chargement du dossier patient…
      </div>
    ) : null;
  }

  const publicUrl = `${getPublicUrl()}/patient-public/${patient.id}?token=${btoa(patient.numero_dossier || patient.id)}`;
  const qrUrl     = getQRUrl(publicUrl, 300);
  const qrSmall   = getQRUrl(publicUrl, 120);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const content = `
      <html><head><title>QR Code — ${patient.first_name} ${patient.last_name}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; }
        .card { border: 2px solid #1A2B4A; border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; }
        .logo { font-size: 28px; font-weight: 900; color: #4A6CF7; margin-bottom: 8px; }
        .name { font-size: 18px; font-weight: 700; color: #1A2B4A; margin: 12px 0 4px; }
        .dossier { font-size: 13px; color: #7A8BAD; margin-bottom: 16px; }
        .qr { margin: 16px auto; }
        .hint { font-size: 12px; color: #7A8BAD; margin-top: 12px; line-height: 1.5; }
        .sep { border-top: 1px dashed #DDE4F3; margin: 16px 0; }
      </style></head>
      <body>
        <div class="card">
          <div class="logo">⚕ MedDossier</div>
          <div class="sep"></div>
          <img class="qr" src="${qrUrl}" width="220" height="220" alt="QR Code" />
          <div class="name">${patient.first_name} ${patient.last_name}</div>
          <div class="dossier">N° ${patient.numero_dossier || '—'}</div>
          <div class="sep"></div>
          <div class="hint">Scannez ce code pour accéder à votre dossier médical</div>
        </div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(content);
    win.document.close();
    win.print();
  };

  return (
    <>
      {/* ── Bouton dans la hero card ── */}
      <button style={s.qrBtn} onClick={() => setShowModal(true)} title="Générer QR Code">
        <span style={s.qrBtnIcon}>⬛</span>
        QR Code
      </button>

      {/* ── Modal ── */}
      {showModal && (
        <div style={s.backdrop} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>

            {/* Header */}
            <div style={s.modalHead}>
              <div style={s.modalHeadLeft}>
                <div style={s.modalHeadIcon}>⬛</div>
                <div>
                  <div style={s.modalTitle}>QR Code Patient</div>
                  <div style={s.modalSub}>Le patient scanne ce code pour voir son dossier</div>
                </div>
              </div>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Body */}
            <div style={s.modalBody}>

              {/* QR Code */}
              <div style={s.qrWrap}>
                <div style={s.qrCard}>
                  <div style={s.qrLogo}>⚕ MedDossier</div>
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    style={s.qrImg}
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div style={s.qrName}>{patient.first_name} {patient.last_name}</div>
                  <div style={s.qrDossier}>N° {patient.numero_dossier || '—'}</div>
                  <div style={s.qrHint}>📱 Scannez pour voir votre dossier</div>
                </div>
              </div>

              {/* Infos patient */}
              <div style={s.infoBox}>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Patient</span>
                  <span style={s.infoValue}>{patient.first_name} {patient.last_name}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>N° Dossier</span>
                  <span style={{ ...s.infoValue, color: '#4A6CF7', fontFamily: "'Poppins', sans-serif" }}>
                    {patient.numero_dossier}
                  </span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Date naissance</span>
                  <span style={s.infoValue}>
                    {patient.date_naissance
                      ? patient.date_naissance.split('-').reverse().join('/')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* URL */}
              <div style={s.urlBox}>
                <div style={s.urlLabel}>Lien public</div>
                <div style={s.urlRow}>
                  <span style={s.urlText}>{publicUrl.slice(0, 52)}…</span>
                  <button style={{ ...s.copyBtn, ...(copied ? s.copyBtnDone : {}) }} onClick={handleCopy}>
                    {copied ? '✓ Copié' : '📋 Copier'}
                  </button>
                </div>
              </div>

              {/* Info pour téléphone */}
              {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                <div style={s.infoBox}>
                  <span style={s.infoIcon}>📱</span>
                  <span><strong>Pour scanner depuis un téléphone:</strong> Le QR code utilise votre IP locale <code>192.168.1.7</code>. Assurez-vous que votre téléphone est connecté au même réseau Wi-Fi.</span>
                </div>
              )}

              {/* Avertissement */}
              <div style={s.warning}>
                <span style={s.warningIcon}>⚠</span>
                <span>Ce lien permet d'accéder aux informations médicales de ce patient. Ne le partagez qu'avec le patient concerné.</span>
              </div>
            </div>

            {/* Footer */}
            <div style={s.modalFoot}>
              <button style={s.btnGhost} onClick={() => setShowModal(false)}>Fermer</button>
              <button style={s.btnPrint} onClick={handlePrint}>
                🖨 Imprimer le QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Mini badge QR pour la hero card (petit) ─────────────────────────────────

export function QRMiniCard({ patient }) {
  const publicUrl = `${getPublicUrl()}/patient-public/${patient?.id}?token=${btoa(patient?.numero_dossier || patient?.id || '0')}`;
  const qrSmall   = getQRUrl(publicUrl, 80);

  return (
    <div style={sm.wrap}>
      <img src={qrSmall} alt="QR" style={sm.img} />
      <div style={sm.label}>QR Dossier</div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  qrBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10,
    border: '1.5px solid #DDE4F3', background: '#F5F8FF',
    color: '#4A6CF7', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    transition: '0.15s',
  },
  qrBtnIcon: { fontSize: 16 },

  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,20,50,0.55)',
    backdropFilter: 'blur(8px)',
    zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 22,
    width: '100%', maxWidth: 480,
    maxHeight: '92vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 28px 70px rgba(0,0,0,0.22)',
    fontFamily: "'Nunito', sans-serif",
    overflow: 'hidden',
  },
  modalHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 22px', borderBottom: '1px solid #F0F4FF',
    flexShrink: 0,
  },
  modalHeadLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  modalHeadIcon: {
    width: 40, height: 40, borderRadius: 11,
    background: 'linear-gradient(135deg,#1A2B4A,#4A6CF7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#fff',
  },
  modalTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700, fontSize: 16, color: '#1A2B4A',
  },
  modalSub: { fontSize: 12, color: '#7A8BAD', fontWeight: 600, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid #DDE4F3', background: '#F5F8FF',
    cursor: 'pointer', fontSize: 14, color: '#7A8BAD',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  modalBody: { padding: '20px 22px', overflowY: 'auto', flex: 1 },

  // QR Card
  qrWrap: { display: 'flex', justifyContent: 'center', marginBottom: 20 },
  qrCard: {
    background: '#fff', borderRadius: 16,
    border: '2px solid #E8EDF5',
    padding: '20px 28px', textAlign: 'center',
    boxShadow: '0 4px 20px rgba(74,108,247,0.08)',
    width: 260,
  },
  qrLogo: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800, fontSize: 15, color: '#4A6CF7',
    marginBottom: 14, letterSpacing: '0.5px',
  },
  qrImg: {
    width: 200, height: 200, display: 'block',
    margin: '0 auto', borderRadius: 8,
    border: '1px solid #F0F4FF',
  },
  qrName: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700, fontSize: 14, color: '#1A2B4A',
    marginTop: 14, marginBottom: 4,
  },
  qrDossier: { fontSize: 12, color: '#7A8BAD', fontWeight: 700, marginBottom: 10 },
  qrHint: {
    fontSize: 11, color: '#7A8BAD', fontWeight: 600,
    padding: '6px 12px', background: '#F5F8FF',
    borderRadius: 20, display: 'inline-block',
  },

  // Info box
  infoBox: {
    background: '#F8FAFC', borderRadius: 12,
    border: '1px solid #E8EDF5', marginBottom: 14,
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderBottom: '1px solid #F0F4FF', fontSize: 13,
  },
  infoLabel: { color: '#7A8BAD', fontWeight: 600, fontSize: 12 },
  infoValue: { fontWeight: 700, color: '#1A2B4A' },

  // URL
  urlBox: {
    background: '#F0F4FF', borderRadius: 10,
    border: '1px solid rgba(74,108,247,0.15)',
    padding: '10px 14px', marginBottom: 12,
  },
  urlLabel: { fontSize: 10.5, fontWeight: 800, color: '#4A6CF7', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 },
  urlRow: { display: 'flex', alignItems: 'center', gap: 8 },
  urlText: { flex: 1, fontSize: 11, color: '#4A5568', fontFamily: 'monospace', wordBreak: 'break-all' },
  copyBtn: {
    padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(74,108,247,0.3)',
    background: '#fff', color: '#4A6CF7', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Nunito', sans-serif",
  },
  copyBtnDone: { background: '#d1fae5', borderColor: '#059669', color: '#059669' },

  // Info box (dev)
  infoBox: {
    display: 'flex', gap: 8, padding: '10px 14px',
    background: '#dbeafe', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 10, fontSize: 12, color: '#1e40af', fontWeight: 600,
    lineHeight: 1.5,
  },
  infoIcon: { fontSize: 14, flexShrink: 0, marginTop: 1 },

  // Warning
  warning: {
    display: 'flex', gap: 8, padding: '10px 14px',
    background: '#fef3c7', border: '1px solid rgba(217,119,6,0.25)',
    borderRadius: 10, fontSize: 12, color: '#92400e', fontWeight: 600,
    lineHeight: 1.5,
  },
  warningIcon: { fontSize: 14, flexShrink: 0, marginTop: 1 },

  // Footer
  modalFoot: {
    display: 'flex', gap: 10, padding: '16px 22px',
    borderTop: '1px solid #F0F4FF', justifyContent: 'flex-end',
    flexShrink: 0,
  },
  btnGhost: {
    padding: '10px 18px', borderRadius: 30,
    border: '1.5px solid #DDE4F3', background: '#F5F8FF',
    color: '#7A8BAD', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
  },
  btnPrint: {
    padding: '10px 20px', borderRadius: 30, border: 'none',
    background: 'linear-gradient(135deg,#1A2B4A,#4A6CF7)',
    color: '#fff', fontSize: 13, fontWeight: 800,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 4px 14px rgba(74,108,247,0.3)',
  },
};

const sm = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  img: { width: 60, height: 60, borderRadius: 8, border: '1px solid #E8EDF5' },
  label: { fontSize: 10, color: '#7A8BAD', fontWeight: 700 },
};