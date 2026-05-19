/* eslint-disable no-undef, react/jsx-no-undef */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DuplicateDetectionModal from '../components/DuplicateDetectionModal';

export default function ImportData() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [uploadProgress, setUploadProgress] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [importStats, setImportStats] = useState({ imported: 0, duplicatesFound: 0, errors: 0 });
  const [phase, setPhase] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicates, setDuplicates] = useState([
    { id: 1, name: 'Benali A', date: '12/02/2026', avatar: 'BA' },
    { id: 2, name: 'Rahmani S', date: '11/02/2026', avatar: 'RS' },
  ]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      simulateUpload();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      simulateUpload();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const simulateUpload = () => {
    setUploadProgress(true);
    setTimeout(() => {
      setShowDuplicates(true);
      setShowResolved(true);
    }, 1500);
  };

  const mergePatient = (id) => {
    setDuplicates(prev => prev.filter(d => d.id !== id));
  };

  const ignorePatient = (id) => {
    setDuplicates(prev => prev.filter(d => d.id !== id));
  };

  const closeModal = () => setModalData(null);
  const handleModalConfirm = (fusionData, note, existingId, action) => {
    setModalData(null);
  };
  const rowToModalCandidate = (row) => {
    if (!row) return null;
    const [first, ...rest] = (row.name || '').split(' ');
    return {
      first_name: first || '',
      last_name: rest.join(' ') || '',
      dateNaissance: row.date || '',
    };
  };

  const validateImport = () => {
    alert('Import validé avec succès!');
    navigate('/dashboard');
  };

  return (
    <div style={s.page}>
      {/* DuplicateDetectionModal */}
      {modalData && (
        <DuplicateDetectionModal
          patientExistant={modalData.existing}
          patientNouveau={modalData.candidate}
          onClose={() => setModalData(null)}
          onConfirm={(fusionData, note, existingId, action) =>
            handleModalConfirm(fusionData, note, existingId, action)
          }
        />
      )}

      {/* Header */}
      <div style={s.header}>
        <div style={s.logoSection}>
          <div style={s.logo}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={s.logoText}>Import Données</div>
        </div>
        <button onClick={() => navigate('/dashboard')} style={s.backBtn}>← Tableau de bord</button>
      </div>

      <div style={s.container}>
        {/* Upload Card */}
        <div style={s.uploadCard}>
          <div
            style={s.uploadArea}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div style={s.uploadIconWrap}>
              <svg style={s.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div style={s.uploadTitle}>Glisser fichier CSV / Excel</div>
            <div style={s.uploadSubtitle}>ou depuis OEDI</div>
            <div style={s.uploadInfo}>Formats acceptés : .csv, .xlsx – Max 10MB</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button style={s.browseBtn} onClick={() => fileInputRef.current.click()}>
              Parcourir
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            {uploadProgress && (
              <div style={s.progressWrap}>
                <div style={s.progressBar}></div>
                <div style={s.successMsg}>
                  <div style={s.checkIcon}>✓</div>
                  Import terminé avec succès
                </div>
                {importStats && (
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                    <div style={s.statChip('#48bb78')}>✓ {importStats.imported} nouveaux</div>
                    <div style={s.statChip('#f59e0b')}>⚠ {importStats.duplicatesFound} doublons</div>
                    {importStats.errors > 0 && <div style={s.statChip('#ef4444')}>✗ {importStats.errors} erreurs</div>}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {phase === 'error' && (
              <div style={{ marginTop: 20, color: '#e53e3e', fontWeight: 600 }}>
                ⚠ {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Duplicates Card */}
        {showDuplicates && duplicates.length > 0 && (
          <div style={s.duplicatesCard}>
            <div style={s.duplicatesHeader}>
              <div style={s.warningIcon}>⚠</div>
              <div style={s.duplicatesTitle}>
                Doublons détectés <span style={s.duplicatesCount}>({duplicates.length})</span>
              </div>
            </div>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Patient</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.map(d => (
                  <tr key={d.id}>
                    <td style={s.td}>
                      <div style={s.patientCell}>
                        <div style={s.patientAvatar}>{d.avatar}</div>
                        <span>{d.name}</span>
                      </div>
                    </td>
                    <td style={s.td}>{d.date}</td>
                    <td style={s.td}>
                      <div style={s.actionBtns}>
                        <button style={{ ...s.btn, ...s.btnMerge }} onClick={() => mergePatient(d.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 10H7M7 10l4-4M7 10l4 4"/>
                          </svg>
                          Fusionner
                        </button>
                        <button style={{ ...s.btn, ...s.btnIgnore }} onClick={() => ignorePatient(d.id)}>
                          Ignorer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resolved Section */}
        {showResolved && (
          <div style={s.resolvedSection}>
            <div style={s.resolvedHeader}>
              <div style={s.resolvedHeaderLeft}>
                <div style={s.successIcon}>✓</div>
                <div style={s.duplicatesTitle}>Prêt à valider</div>
              </div>
            </div>
            <div style={s.validateBtn}>
              <button style={s.btnValidate} onClick={validateImport}>
                Valider Import
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalData && (
        <DuplicateDetectionModal
          patientExistant={modalData.existing}
          patientNouveau={modalData.candidate || rowToModalCandidate(modalData.row)}
          onConfirm={handleModalConfirm}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #e3e8f7 0%, #f0e7f7 100%)', padding: 20, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', borderRadius: 15, marginBottom: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  logoSection: { display: 'flex', alignItems: 'center', gap: 15 },
  logo: { width: 50, height: 50, background: 'linear-gradient(135deg, #4A90E2, #5CA0F2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  logoText: { fontSize: 24, color: '#4a5568', fontWeight: 500 },
  userSection: { display: 'flex', alignItems: 'center', gap: 20 },
  notifIcon: { width: 40, height: 40, borderRadius: '50%', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  userAvatar: { width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #4A90E2, #5CA0F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 },
  container: { maxWidth: 900, margin: '0 auto' },
  uploadCard: { background: 'linear-gradient(135deg, rgba(226, 232, 250, 0.5), rgba(236, 227, 247, 0.5))', borderRadius: 30, padding: 60, marginBottom: 30, backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  uploadArea: { background: 'rgba(255, 255, 255, 0.7)', borderRadius: 25, padding: '60px 40px', textAlign: 'center', backdropFilter: 'blur(10px)' },
  uploadIconWrap: { width: 140, height: 140, margin: '0 auto 30px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(240, 245, 255, 0.8))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(74, 144, 226, 0.1)', boxShadow: '0 10px 40px rgba(74, 144, 226, 0.15)' },
  uploadIcon: { width: 80, height: 80, color: '#4A90E2' },
  uploadTitle: { fontSize: 28, color: '#2d3748', marginBottom: 10, fontWeight: 600 },
  uploadSubtitle: { fontSize: 20, color: '#718096', marginBottom: 20 },
  uploadInfo: { color: '#a0aec0', fontSize: 14, marginBottom: 30 },
  browseBtn: { background: 'white', color: '#718096', border: 'none', padding: '12px 30px', borderRadius: 12, fontSize: 16, cursor: 'pointer', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'inline-flex', alignItems: 'center', gap: 10 },
  progressWrap: { marginTop: 30 },
  progressBar: { width: '100%', height: 8, background: 'linear-gradient(90deg, #4A90E2, #9F7AEA, #F6AD55)', borderRadius: 10, marginBottom: 15, boxShadow: '0 2px 10px rgba(74, 144, 226, 0.3)' },
  successMsg: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#48bb78', fontSize: 16 },
  checkIcon: { width: 24, height: 24, background: '#48bb78', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
  duplicatesCard: { background: 'white', borderRadius: 20, padding: 30, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  duplicatesHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 25 },
  warningIcon: { width: 30, height: 30, background: '#FED7D7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53E3E', fontWeight: 'bold' },
  duplicatesTitle: { fontSize: 20, color: '#2d3748', fontWeight: 600 },
  duplicatesCount: { color: '#718096' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
  thead: { textAlign: 'left' },
  th: { padding: '12px 15px', color: '#718096', fontWeight: 500, fontSize: 14 },
  td: { padding: 15, background: '#f7fafc', border: 'none' },
  patientCell: { display: 'flex', alignItems: 'center', gap: 12 },
  patientAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4A90E2, #5CA0F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14 },
  actionBtns: { display: 'flex', gap: 10 },
  btn: { padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: '0.3s', display: 'inline-flex', alignItems: 'center', gap: 8 },
  btnMerge: { background: 'linear-gradient(135deg, #5CA0F2, #4A90E2)', color: 'white' },
  btnIgnore: { background: 'white', color: '#718096', border: '1px solid #e2e8f0' },
  resolvedSection: { background: 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  resolvedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  resolvedHeaderLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  successIcon: { width: 30, height: 30, background: '#C6F6D5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48bb78', fontWeight: 'bold' },
  validateBtn: { textAlign: 'center', marginTop: 30 },
  btnValidate: { padding: '15px 50px', borderRadius: 15, border: 'none', background: 'linear-gradient(135deg, #5CA0F2, #4A90E2)', color: 'white', fontSize: 18, fontWeight: 600, cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 20px rgba(74, 144, 226, 0.3)' },
};