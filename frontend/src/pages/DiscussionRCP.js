import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── API Helper ───────────────────────────────────────────────────────────────
const API = 'http://localhost:8000/api/';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/auth'; return; }
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
  if (res.status === 204) return {};
  return res.json();
}

const urgencyFromStade = (stade = '') => {
  if (stade.includes('4') || stade.toUpperCase().includes('IV'))  return 'élevée';
  if (stade.includes('3') || stade.toUpperCase().includes('III')) return 'modérée';
  return 'faible';
};
const urgencyClass = (u) =>
  u === 'élevée' ? s.urgElevee : u === 'modérée' ? s.urgModeree : s.urgFaible;

// ══════════════════════════════════════════════════════════════════════════════
export default function DiscussionRCP() {

  // ── Current user (from localStorage) ─────────────────────────────────────
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  // ── State principal ────────────────────────────────────────────────────────
  const [patients,      setPatients]      = useState([]);
  const [rcpList,       setRcpList]       = useState([]);
  const [notifs,        setNotifs]        = useState([]);
  const [selectedRcp,   setSelectedRcp]   = useState(null);
  const [loadingRcp,    setLoadingRcp]    = useState(false);
  const [messageInput,  setMessageInput]  = useState('');
  const [voteLoading,     setVoteLoading]     = useState(false);
  const [voteProposal,    setVoteProposal]    = useState('');
  const [showVoteInput,   setShowVoteInput]   = useState(false);
  const [decisionInput,    setDecisionInput]    = useState('');
  const [treatmentProtocol, setTreatmentProtocol] = useState('');
  const [showDecision,  setShowDecision]  = useState(false);
  const [isMinimized,   setIsMinimized]   = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showMyPatients,setShowMyPatients]= useState(false);
  const [toast,         setToast]         = useState('');

  // ── 🎤 Vocal recording ────────────────────────────────────────────────────
  const [isRecording,   setIsRecording]   = useState(false);
  const [recSeconds,    setRecSeconds]    = useState(0);
  const recIntervalRef  = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef  = useRef([]);

  // ── 🗳️ Multi-message vote selection ──────────────────────────────────────
  const [voteSelectMode,  setVoteSelectMode]  = useState(false);
  const [selectedMsgIds,  setSelectedMsgIds]  = useState(new Set());

  // ── 🔔 Notification sound ─────────────────────────────────────────────────
  const lastMsgCountRef = useRef(0);
  const notifSoundRef   = useRef(null);

  // ── State Create RCP Modal ─────────────────────────────────────────────────
  const [showCreateModal,   setShowCreateModal]   = useState(false);
  const [createStep,        setCreateStep]        = useState(1); // 1=patient, 2=cancer, 3=doctors+date
  const [selectedPatient,   setSelectedPatient]   = useState(null);
  const [patientCancers,    setPatientCancers]     = useState([]);
  const [selectedCancer,    setSelectedCancer]    = useState(null);
  const [allMedecins,       setAllMedecins]       = useState([]);
  const [invitedDoctors,    setInvitedDoctors]    = useState([]);
  const [meetingDatetime,   setMeetingDatetime]   = useState('');
  const [presentationReason,setPresentationReason]= useState('');
  const [createLoading,     setCreateLoading]     = useState(false);

  const chatRef = useRef(null);
  const unreadCount = notifs.filter(n => !n.is_read).length;

  // ── 🔔 Play notification sound ────────────────────────────────────────────
  const playNotifSound = useCallback((freq = 520) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ── Chargements initiaux ───────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    try { const d = await apiFetch('rcp/mes-patients/'); if (d) setPatients(d); } catch {}
  }, []);

  const loadRcpHistory = useCallback(async () => {
    try { const d = await apiFetch('rcp/history/'); if (d) setRcpList(d); } catch {}
  }, []);

  const loadNotifs = useCallback(async () => {
    try { const d = await apiFetch('rcp/notifications/'); if (d) setNotifs(d); } catch {}
  }, []);

  useEffect(() => { loadPatients(); loadRcpHistory(); loadNotifs(); }, []);

  // ── Auto-refresh messages 10s ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRcp) return;
    const iv = setInterval(async () => {
      try {
        const d = await apiFetch(`rcp/${selectedRcp.rcp_id}/`);
        if (d) {
          const newCount = (d.messages || []).length;
          const oldCount = lastMsgCountRef.current;
          // 🔔 New message arrived → play sound + toast
          if (newCount > oldCount && oldCount > 0) {
            const lastMsg = d.messages[d.messages.length - 1];
            playNotifSound();
            showToast(`💬 ${lastMsg.user}: ${lastMsg.message.substring(0, 50)}${lastMsg.message.length > 50 ? '…' : ''}`);
          }
          lastMsgCountRef.current = newCount;
          setSelectedRcp(d);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(iv);
  }, [selectedRcp, playNotifSound]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [selectedRcp?.messages]);

  // ── Check pending meetings every 60s ──────────────────────────────────────
  useEffect(() => {
    const checkPending = async () => {
      try {
        await apiFetch('rcp/check-pending/');
        // Reload notifications after check
        await loadNotifs();
      } catch {}
    };
    checkPending(); // run immediately on mount
    const iv = setInterval(checkPending, 60000); // every 60 seconds
    return () => clearInterval(iv);
  }, [loadNotifs]);

  // ── Sélectionner RCP ───────────────────────────────────────────────────────
  const selectRcp = async (rcpId) => {
    setLoadingRcp(true);
    setVoteSelectMode(false);
    setSelectedMsgIds(new Set());
    try {
      const d = await apiFetch(`rcp/${rcpId}/`);
      if (d) {
        lastMsgCountRef.current = (d.messages || []).length;
        setSelectedRcp(d);
        setIsMinimized(false);
      }
    }
    catch { showToast('Erreur chargement RCP'); }
    finally { setLoadingRcp(false); }
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const handleNotifClick = async (notif) => {
    setShowNotifs(false);
    try { await apiFetch(`rcp/notifications/${notif.id}/read/`, { method: 'POST' }); } catch {}
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    if (notif.rcp_id) selectRcp(notif.rcp_id);
  };

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedRcp) return;
    const text = messageInput.trim();
    setMessageInput('');
    try {
      const msg = await apiFetch(`rcp/${selectedRcp.rcp_id}/chat/`, {
        method: 'POST', body: JSON.stringify({ message: text }),
      });
      if (msg) setSelectedRcp(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    } catch { showToast('Erreur envoi message'); setMessageInput(text); }
  };

  // ── Vote ───────────────────────────────────────────────────────────────────
  const handleVote = async (voteValue) => {
    if (!selectedRcp || selectedRcp.my_vote) return; // ✅ منع التصويت مرتين
    setVoteLoading(true);
    try {
      const res = await apiFetch(`rcp/${selectedRcp.rcp_id}/vote/`, {
        method: 'POST', body: JSON.stringify({ vote: voteValue }),
      });
      if (res) {
        setSelectedRcp(prev => ({ ...prev, vote_summary: res.vote_summary, my_vote: res.my_vote }));
        showToast(`✓ Vote enregistré: ${voteValue}`);
      }
    } catch (e) { showToast(e?.error || 'Vous avez déjà voté'); }
    finally { setVoteLoading(false); }
  };

  // ── Ouvrir un vote (créateur seulement) ───────────────────────────────────
  const handleSetVote = async (proposal) => {
    if (!selectedRcp || !proposal.trim()) return;
    try {
      await apiFetch(`rcp/${selectedRcp.rcp_id}/set-vote/`, {
        method: 'POST', body: JSON.stringify({ proposal }),
      });
      showToast('🗳️ Vote ouvert — Les médecins ont été notifiés');
      setShowVoteInput(false); setVoteProposal('');
      await selectRcp(selectedRcp.rcp_id);
    } catch { showToast('Erreur ouverture vote'); }
  };

  // ── Fermer le vote (créateur seulement) ───────────────────────────────────
  const handleCloseVote = async () => {
    if (!selectedRcp) return;
    try {
      await apiFetch(`rcp/${selectedRcp.rcp_id}/close-vote/`, { method: 'POST' });
      showToast('Vote fermé');
      await selectRcp(selectedRcp.rcp_id);
    } catch { showToast('Erreur fermeture vote'); }
  };

  // ── Mettre un message en vote ──────────────────────────────────────────────
  const handlePutMessageToVote = (msgText) => {
    setVoteProposal(msgText);
    setShowVoteInput(true);
  };

  // ── 🗳️ Toggle multi-vote selection mode ───────────────────────────────────
  const toggleVoteSelectMode = () => {
    setVoteSelectMode(v => !v);
    setSelectedMsgIds(new Set());
  };

  const toggleMsgSelection = (msgId) => {
    if (!voteSelectMode) return;
    setSelectedMsgIds(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  const handleMultiVote = () => {
    if (selectedMsgIds.size === 0) return;
    const msgs = (selectedRcp.messages || [])
      .filter(m => selectedMsgIds.has(m.id))
      .map(m => m.message)
      .join('\n— ');
    setVoteProposal(msgs);
    setShowVoteInput(true);
    setVoteSelectMode(false);
    setSelectedMsgIds(new Set());
  };

  // ── 🎤 Voice recording ─────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      setIsRecording(true);
      setRecSeconds(0);
      recIntervalRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch {
      showToast('❌ Microphone non autorisé');
    }
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    clearInterval(recIntervalRef.current);
    setIsRecording(false);
    setRecSeconds(0);
    audioChunksRef.current = [];
  };

  const sendVoiceMessage = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');
      formData.append('duration', recSeconds);
      const token = localStorage.getItem('access_token');
      try {
        const res = await fetch(`${API}rcp/${selectedRcp.rcp_id}/chat/`, {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: formData,
        });
        if (res.ok) {
          const msg = await res.json();
          setSelectedRcp(prev => ({ ...prev, messages: [...prev.messages, msg] }));
        }
      } catch { showToast('Erreur envoi vocal'); }
      cancelRecording();
    };
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    clearInterval(recIntervalRef.current);
    setIsRecording(false);
    setRecSeconds(0);
  };

  // helper: format mm:ss
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Démarrer RCP ──────────────────────────────────────────────────────────
  const handleStartRcp = async () => {
    if (!selectedRcp) return;
    try {
      await apiFetch(`rcp/${selectedRcp.rcp_id}/start/`, { method: 'POST' });
      showToast('✅ RCP démarrée — Les médecins ont été notifiés');
      await selectRcp(selectedRcp.rcp_id);
      loadRcpHistory();
    } catch (e) {
      showToast(e?.error || 'Erreur démarrage');
    }
  };

  // ── Valider décision ───────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!decisionInput.trim() || !selectedRcp) return;
    try {
      await apiFetch(`rcp/${selectedRcp.rcp_id}/validate/`, {
        method: 'POST', body: JSON.stringify({ decision_text: decisionInput, treatment_protocol: treatmentProtocol }),
      });
      showToast('✓ Décision validée — Rapport généré');
      setShowDecision(false); setDecisionInput('');
      await selectRcp(selectedRcp.rcp_id);
      loadRcpHistory();
    } catch { showToast('Erreur validation'); }
  };

  // ── Télécharger rapport ────────────────────────────────────────────────────
  const handleDownloadRapport = async () => {
    if (!selectedRcp) return;
    try {
      const res = await apiFetch(`rcp/${selectedRcp.rcp_id}/rapport/`);
      if (res?.url) window.open(res.url, '_blank');
    } catch { showToast('Rapport non disponible'); }
  };

  // ══════════════════════════════════════════════
  // CREATE RCP — étapes
  // ══════════════════════════════════════════════

  const openCreateModal = async () => {
    setCreateStep(1);
    setSelectedPatient(null);
    setSelectedCancer(null);
    setInvitedDoctors([]);
    setMeetingDatetime('');
    setPresentationReason('');
    setShowCreateModal(true);
    // Charger médecins
    try { const d = await apiFetch('rcp/medecins/'); if (d) setAllMedecins(d); } catch {}
  };

  // Étape 1 → 2 : choisir patient → charger ses cancers
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSelectedCancer(null);
    setPatientCancers([]);
    try {
      const d = await apiFetch(`patients/${patient.id}/cancers/`);
      if (d) setPatientCancers(d);
    } catch { showToast('Erreur chargement cancers'); }
    setCreateStep(2);
  };

  // Étape 2 → 3 : choisir cancer
  const handleSelectCancer = (cancer) => {
    setSelectedCancer(cancer);
    setCreateStep(3);
  };

  // Toggle invitation médecin
  const toggleDoctor = (id) => {
    setInvitedDoctors(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Créer la RCP
  const handleCreateRcp = async () => {
    if (!selectedCancer || !meetingDatetime) {
      showToast('Choisissez un cancer et une date'); return;
    }
    setCreateLoading(true);
    try {
      const res = await apiFetch('rcp/create/', {
        method: 'POST',
        body: JSON.stringify({
          cancer_id:            selectedCancer.id,
          meeting_datetime:     meetingDatetime,
          invited_users:        invitedDoctors,
          presentation_reason:  presentationReason,
        }),
      });
      showToast('✓ RCP créée avec succès');
      setShowCreateModal(false);
      await loadRcpHistory();
      if (res?.rcp_id) selectRcp(res.rcp_id);
    } catch { showToast('Erreur création RCP'); }
    finally { setCreateLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 7px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
        .btn-h:hover { opacity:.85; transform:translateY(-1px); }
        .card-h:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.1) !important; }
        .doctor-row:hover { background: #EBF8FF !important; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes wavePulse { 0%,100%{transform:scaleY(.4)} 50%{transform:scaleY(1)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        .msg-bubble-selectable { cursor:pointer; transition:outline .15s; }
        .msg-bubble-selectable:hover { outline: 2px solid rgba(74,144,226,.4); outline-offset:2px; border-radius:18px; }
        .msg-bubble-selected { outline: 2.5px solid #4A90E2 !important; outline-offset:2px; border-radius:18px; }
        .rec-wave-bar { display:inline-block; width:3px; border-radius:3px; background:#E53E3E; opacity:.7; animation: wavePulse .9s ease-in-out infinite; margin:0 1px; }
        .voice-wave-bar { display:inline-block; width:3px; border-radius:3px; opacity:.75; animation: wavePulse 1.1s ease-in-out infinite; margin:0 1px; }
        .notif-toast-anim { animation: toastIn .35s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.logoSection}>
          <div style={s.logo}>🏥</div>
          <span style={s.logoText}>Discussion RCP</span>
        </div>
        <div style={s.headerActions}>
          {/* ➕ Créer RCP */}
          <button className="btn-h" style={s.createBtn} onClick={openCreateModal}>
            ➕ Nouvelle RCP
          </button>
          <button className="btn-h" style={s.myPatientsBtn} onClick={() => setShowMyPatients(!showMyPatients)}>
            👥 Mes patients
          </button>
          <div style={s.notifIcon} onClick={() => setShowNotifs(!showNotifs)}>
            🔔 {unreadCount > 0 && <div style={s.notifBadge}>{unreadCount}</div>}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MODAL CREATE RCP — 3 étapes
      ══════════════════════════════════════════════ */}
      {showCreateModal && (
        <div style={s.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            {/* Header modal */}
            <div style={s.modalHeader}>
              <div>
                <h2 style={{ fontSize: 20, color: '#2d3748', fontWeight: 700 }}>
                  ➕ Créer une RCP
                </h2>
                {/* Steps */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {['1. Patient', '2. Cancer', '3. Médecins & Date'].map((label, i) => (
                    <div key={i} style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: createStep === i + 1 ? '#4A90E2' : createStep > i + 1 ? '#C6F6D5' : '#EDF2F7',
                      color:      createStep === i + 1 ? 'white'   : createStep > i + 1 ? '#276749' : '#a0aec0',
                    }}>
                      {createStep > i + 1 ? '✓ ' : ''}{label}
                    </div>
                  ))}
                </div>
              </div>
              <button style={s.closeBtn} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <div style={s.modalBody}>

              {/* ── ÉTAPE 1 : Choisir patient ── */}
              {createStep === 1 && (
                <div>
                  <p style={s.stepDesc}>Choisissez le patient pour cette RCP :</p>
                  <div style={s.patientList}>
                    {patients.length === 0 && (
                      <p style={{ color: '#a0aec0', textAlign: 'center', padding: 30 }}>
                        Aucun patient trouvé
                      </p>
                    )}
                    {patients.map(p => (
                      <div
                        key={p.id}
                        className="card-h"
                        style={s.patientRow}
                        onClick={() => handleSelectPatient(p)}
                      >
                        <div style={s.patientRowAvatar}>{p.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#2d3748', fontSize: 15 }}>{p.name}</div>
                          <div style={{ fontSize: 13, color: '#718096', marginTop: 3 }}>
                            {p.age} ans • {p.numero_dossier}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: '#4A90E2', fontWeight: 600 }}>
                            🔬 {p.cancers_count} cancer{p.cancers_count > 1 ? 's' : ''}
                          </div>
                          {p.stade && <div style={{ fontSize: 12, color: '#718096' }}>Stade {p.stade}</div>}
                        </div>
                        <span style={{ color: '#4A90E2', fontSize: 18, marginLeft: 8 }}>›</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 2 : Choisir cancer ── */}
              {createStep === 2 && selectedPatient && (
                <div>
                  <div style={s.selectedPatientBanner}>
                    <strong>{selectedPatient.name}</strong> — {selectedPatient.age} ans — {selectedPatient.numero_dossier}
                  </div>
                  <p style={s.stepDesc}>
                    Ce patient a <strong>{patientCancers.length}</strong> cancer(s) enregistré(s).
                    Choisissez le cancer à discuter :
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {patientCancers.map(c => (
                      <div
                        key={c.id}
                        className="card-h"
                        style={{
                          ...s.cancerRow,
                          borderColor: selectedCancer?.id === c.id ? '#4A90E2' : '#e2e8f0',
                          background:  selectedCancer?.id === c.id ? '#EBF8FF' : 'white',
                        }}
                        onClick={() => handleSelectCancer(c)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#2d3748', fontSize: 15, marginBottom: 6 }}>
                            🔬 {c.cancer_type}
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: '#718096' }}>
                            <span>📊 Stade: <strong>{c.stade}</strong></span>
                            {c.tnm !== '—' && <span>TNM: <strong>{c.tnm}</strong></span>}
                            {c.grade !== '—' && <span>Grade: <strong>{c.grade}</strong></span>}
                            {c.date_diagnostic && <span>📅 {c.date_diagnostic}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {c.rcp_count > 0 && (
                            <div style={{ fontSize: 12, color: '#718096' }}>
                              {c.rcp_count} RCP précédente(s)
                            </div>
                          )}
                          {selectedCancer?.id === c.id && (
                            <div style={{ fontSize: 18, color: '#4A90E2' }}>✓</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={s.stepBtns}>
                    <button style={s.btnSecondary} onClick={() => setCreateStep(1)}>← Retour</button>
                    <button
                      className="btn-h"
                      style={{ ...s.btnPrimary, opacity: selectedCancer ? 1 : 0.5 }}
                      disabled={!selectedCancer}
                      onClick={() => selectedCancer && setCreateStep(3)}
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 3 : Médecins + Date ── */}
              {createStep === 3 && selectedCancer && (
                <div>
                  <div style={s.selectedPatientBanner}>
                    <strong>{selectedPatient.name}</strong> — 🔬 {selectedCancer.cancer_type} — Stade {selectedCancer.stade}
                  </div>

                  {/* Date */}
                  <div style={s.fieldGroup}>
                    <label style={s.fieldLabel}>📅 Date et heure de la réunion *</label>
                    <input
                      type="datetime-local"
                      style={s.input}
                      value={meetingDatetime}
                      onChange={e => setMeetingDatetime(e.target.value)}
                    />
                  </div>

                  {/* Raison */}
                  <div style={s.fieldGroup}>
                    <label style={s.fieldLabel}>📝 Raison de présentation</label>
                    <textarea
                      rows={2}
                      style={{ ...s.input, resize: 'none' }}
                      placeholder="Ex: Tumeur 4.2cm, stade avancé..."
                      value={presentationReason}
                      onChange={e => setPresentationReason(e.target.value)}
                    />
                  </div>

                  {/* Médecins à inviter */}
                  <div style={s.fieldGroup}>
                    <label style={s.fieldLabel}>
                      👥 Inviter des médecins ({invitedDoctors.length} sélectionné{invitedDoctors.length !== 1 ? 's' : ''})
                    </label>
                    <div style={s.doctorList}>
                      {allMedecins.length === 0 && (
                        <p style={{ color: '#a0aec0', fontSize: 13, padding: 12 }}>Aucun médecin disponible</p>
                      )}
                      {allMedecins.map(m => {
                        const isSelected = invitedDoctors.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            className="doctor-row"
                            style={{
                              ...s.doctorRow,
                              background: isSelected ? '#EBF8FF' : 'white',
                              borderColor: isSelected ? '#4A90E2' : '#e2e8f0',
                            }}
                            onClick={() => toggleDoctor(m.id)}
                          >
                            <div style={{ ...s.doctorAvatar, background: isSelected ? '#4A90E2' : '#EDF2F7', color: isSelected ? 'white' : '#4a5568' }}>
                              {(m.name || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: '#2d3748' }}>{m.name}</div>
                              <div style={{ fontSize: 12, color: '#718096' }}>{m.role} • {m.email}</div>
                            </div>
                            <div style={{ fontSize: 18, color: isSelected ? '#4A90E2' : '#e2e8f0' }}>
                              {isSelected ? '✓' : '○'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={s.stepBtns}>
                    <button style={s.btnSecondary} onClick={() => setCreateStep(2)}>← Retour</button>
                    <button
                      className="btn-h"
                      style={{ ...s.btnPrimary, opacity: (!meetingDatetime || createLoading) ? 0.5 : 1 }}
                      disabled={!meetingDatetime || createLoading}
                      onClick={handleCreateRcp}
                    >
                      {createLoading ? '...' : '🚀 Créer la RCP'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── PANEL NOTIFICATIONS ── */}
      {showNotifs && (
        <div style={s.notifsPanel}>
          <div style={s.notifsHeader}>
            <h3 style={{ fontSize: 16, color: '#2d3748' }}>Notifications</h3>
            <button style={s.closeBtn} onClick={() => setShowNotifs(false)}>✕</button>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifs.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: '#a0aec0' }}>Aucune notification</p>}
            {notifs.map(notif => (
              <div key={notif.id}
                style={{ ...s.notifItem, background: notif.is_read ? 'white' : '#EBF8FF' }}
                onClick={() => handleNotifClick(notif)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 3 }}>📋 {notif.patient || 'RCP'}</div>
                <div style={{ fontSize: 12, color: '#718096' }}>{notif.message}</div>
                <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 3 }}>{new Date(notif.created_at).toLocaleString('fr-FR')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VUE MES PATIENTS ── */}
      {showMyPatients && (
        <div style={s.overlay}>
          <div style={s.overlayHeader}>
            <h2 style={{ fontSize: 22, color: '#2d3748' }}>📋 Mes Patients & Réunions RCP</h2>
            <button style={s.closeBtn} onClick={() => setShowMyPatients(false)}>✕ Fermer</button>
          </div>
          <div style={s.statsGrid}>
            {[
              [patients.length, 'Total Patients'],
              [rcpList.filter(r => r.status === 'ongoing').length, 'RCP Actives'],
              [rcpList.length, 'RCP Total'],
              [rcpList.filter(r => r.status === 'closed').length, 'Clôturées'],
            ].map(([val, label]) => (
              <div key={label} style={s.statCard}>
                <div style={s.statValue}>{val}</div>
                <div style={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: 17, color: '#2d3748', marginBottom: 14 }}>📅 Historique des RCP</h3>
          <div style={s.rcpGrid}>
            {rcpList.map(rcp => (
              <div key={rcp.id} className="card-h" style={s.rcpCard}
                onClick={() => { setShowMyPatients(false); selectRcp(rcp.id); }}>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: 15, marginBottom: 5 }}>{rcp.patient}</div>
                <div style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>{rcp.cancer_type} • Stade {rcp.stade}</div>
                <span style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: rcp.status === 'ongoing' ? '#C6F6D5' : '#EDF2F7',
                  color: rcp.status === 'ongoing' ? '#276749' : '#4a5568',
                }}>
                  {rcp.status === 'ongoing' ? '🟢 En cours' : '✓ Clôturée'}
                </span>
                <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 8 }}>
                  📅 {new Date(rcp.date).toLocaleDateString('fr-FR')} • 👥 {rcp.participants_count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ ...s.mainLayout, gridTemplateColumns: isFullscreen ? '1fr' : '290px 1fr' }}>

        {/* SIDEBAR */}
        {!isFullscreen && (
          <div style={s.sidebar}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 10 }}>
              RCP récentes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {rcpList.slice(0, 15).map(rcp => {
                const isActive = selectedRcp?.rcp_id === rcp.id;
                return (
                  <div key={rcp.id} className="card-h"
                    style={{ ...s.rcpSidebarCard, ...(isActive ? s.rcpSidebarActive : {}) }}
                    onClick={() => selectRcp(rcp.id)}>
                    <div style={{ fontWeight: 600, color: '#2d3748', fontSize: 13, marginBottom: 4 }}>{rcp.patient}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span style={s.stageBadge}>Stade {rcp.stade}</span>
                      <span style={{ ...s.urgBadge, ...urgencyClass(urgencyFromStade(rcp.stade)) }}>
                        {urgencyFromStade(rcp.stade)}
                      </span>
                      {rcp.status === 'ongoing'    && <span style={s.statusActive}>🟢</span>}
                      {rcp.status === 'scheduled'  && <span style={{ fontSize: 11, color: '#C05621' }}>⏳</span>}
                    </div>
                  </div>
                );
              })}
              {rcpList.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, color: '#a0aec0', fontSize: 13 }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>💬</div>
                  Aucune RCP<br />
                  <button className="btn-h" style={{ ...s.createBtn, marginTop: 12, fontSize: 12 }} onClick={openCreateModal}>
                    ➕ Créer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENU PRINCIPAL */}
        <div style={s.mainContent}>

          {/* Header patient */}
          <div style={{ ...s.patientHeaderBar, padding: isMinimized ? '13px 26px' : '20px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={s.patientIcon}>👤</div>
                <h2 style={{ fontSize: isMinimized ? 16 : 20, color: '#2d3748', fontWeight: 700 }}>
                  {loadingRcp ? '...' : selectedRcp ? selectedRcp.patient : 'Sélectionnez une RCP'}
                </h2>
                {selectedRcp && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: selectedRcp.status === 'ongoing' ? '#C6F6D5' : '#EDF2F7',
                    color: selectedRcp.status === 'ongoing' ? '#276749' : '#4a5568',
                  }}>
                    {selectedRcp.status === 'ongoing' ? '🟢 En cours' : '✓ Clôturée'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedRcp?.rapport_url && (
                  <button className="btn-h" style={s.rapportBtn} onClick={handleDownloadRapport}>
                    📄 Rapport
                  </button>
                )}
                {selectedRcp && (
                  <>
                    <button className="btn-h" style={s.iconBtn} onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? '⊡' : '⊞'}
                    </button>
                    <button className="btn-h" style={s.iconBtn} onClick={() => setIsMinimized(!isMinimized)}>
                      {isMinimized ? '▼' : '▲'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {!isMinimized && selectedRcp && (
              <div style={{ marginTop: 12, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#718096' }}>
                <span>📋 <strong>{selectedRcp.numero_dossier}</strong></span>
                <span>🎂 {selectedRcp.age} ans</span>
                <span>🔬 {selectedRcp.cancer_type}</span>
                <span>📊 Stade <strong>{selectedRcp.stade}</strong></span>
                {selectedRcp.tnm && <span>TNM <strong>{selectedRcp.tnm}</strong></span>}
                <span>📅 {new Date(selectedRcp.date).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>

          {/* Chat zone */}
          <div ref={chatRef} style={s.chatWrapper}>
            <div style={{ padding: 26 }}>
              {loadingRcp ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>
                  <div style={{ fontSize: 30 }}>⟳</div>
                  <div style={{ marginTop: 8 }}>Chargement...</div>
                </div>
              ) : !selectedRcp ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>
                  <div style={{ fontSize: 50, marginBottom: 12 }}>💬</div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Sélectionnez une RCP dans la liste</div>
                  <div style={{ fontSize: 13, marginTop: 6, marginBottom: 20 }}>ou créez-en une nouvelle</div>
                  <button className="btn-h" style={s.createBtn} onClick={openCreateModal}>
                    ➕ Créer une RCP
                  </button>
                </div>
              ) : (
                <>
                  {/* ── RCP مجدولة — مغلوقة ── */}
                  {selectedRcp.status === 'scheduled' && (
                    <div style={s.scheduledBanner}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#744210', marginBottom: 6 }}>
                        RCP مجدولة — لم تبدأ بعد
                      </div>
                      <div style={{ fontSize: 13, color: '#92400e', marginBottom: 16 }}>
                        📅 {new Date(selectedRcp.date).toLocaleDateString('fr-FR')} الساعة {new Date(selectedRcp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {/* زر Démarrer — فقط للمنشئ */}
                      {selectedRcp.is_creator && (
                        <button
                          className="btn-h"
                          style={s.startBtn}
                          onClick={handleStartRcp}
                        >
                          ▶ Démarrer la réunion
                        </button>
                      )}
                      {!selectedRcp.is_creator && (
                        <div style={{ fontSize: 13, color: '#92400e', fontStyle: 'italic' }}>
                          ⏸ En attente du démarrage par le médecin responsable
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Participants ── */}
                  <div style={s.panel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, color: '#2d3748', fontSize: 15 }}>👥 Participants</span>
                      <span style={s.countBadge}>{selectedRcp.participants?.length || 0}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(selectedRcp.participants || []).map((p, i) => (
                        <div key={i} style={s.participantChip}>
                          <div style={s.participantAvatar}>{(p.name || '?')[0].toUpperCase()}</div>
                          <span style={{ fontSize: 13, color: '#4a5568' }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: '#a0aec0' }}>• {p.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discussion */}
                  <div style={s.panel}>
                    <h3 style={{ fontSize: 15, color: '#2d3748', fontWeight: 700, marginBottom: 16, borderBottom: '2px solid #e2e8f0', paddingBottom: 10 }}>
                      💬 Discussion
                    </h3>

                    {/* 🗳️ Multi-vote select toolbar */}
                    {selectedRcp.is_creator && selectedRcp.status === 'ongoing' && !selectedRcp.vote_open && !selectedRcp.decision && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <button
                          className="btn-h"
                          onClick={toggleVoteSelectMode}
                          style={{
                            padding: '5px 13px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: voteSelectMode ? '#4A90E2' : '#EBF4FF',
                            color:      voteSelectMode ? 'white'   : '#2B6CB0',
                            transition: 'all .2s',
                          }}>
                          🗳️ {voteSelectMode ? 'Annuler sélection' : 'Sélectionner messages à voter'}
                        </button>
                        {voteSelectMode && selectedMsgIds.size > 0 && (
                          <button
                            className="btn-h"
                            onClick={handleMultiVote}
                            style={{ padding: '5px 13px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#C6F6D5', color: '#276749' }}>
                            ✓ Soumettre {selectedMsgIds.size} message(s) au vote
                          </button>
                        )}
                        {voteSelectMode && (
                          <span style={{ fontSize: 11, color: '#718096', fontStyle: 'italic' }}>
                            Cliquez sur les messages à sélectionner
                          </span>
                        )}
                      </div>
                    )}

                    {(selectedRcp.messages || []).length === 0 ? (
                      <p style={{ color: '#a0aec0', textAlign: 'center', padding: 28 }}>Aucun message</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                        {(selectedRcp.messages || []).map((msg, i) => {
                          const isOwn = msg.user_id === currentUser.id;
                          const prevMsg = i > 0 ? selectedRcp.messages[i - 1] : null;
                          const showName = !isOwn && (!prevMsg || prevMsg.user_id !== msg.user_id);
                          return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                              {/* اسم المرسل — يظهر فقط عند أول رسالة متتالية للشخص */}
                              {showName && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#4A6CF7', marginLeft: 44, marginBottom: 2 }}>
                                  {msg.user}
                                </span>
                              )}
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isOwn ? 'row-reverse' : 'row', maxWidth: '78%' }}>
                                {/* Avatar — يسار للآخرين، لا يظهر للرسائل الخاصة */}
                                {!isOwn && (
                                  <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: `hsl(${(msg.user || '').charCodeAt(0) * 17 % 360}, 55%, 55%)`,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700,
                                  }}>
                                    {(msg.user || '?')[0].toUpperCase()}
                                  </div>
                                )}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                              {/* Bubble — supports text & voice */}
                              <div
                                className={`${voteSelectMode ? 'msg-bubble-selectable' : ''} ${voteSelectMode && selectedMsgIds.has(msg.id) ? 'msg-bubble-selected' : ''}`}
                                onClick={() => toggleMsgSelection(msg.id)}
                                style={{
                                  padding: '9px 13px',
                                  borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  background: isOwn ? 'linear-gradient(135deg, #4A6CF7, #6B87FF)' : '#F0F4FF',
                                  color: isOwn ? '#fff' : '#2D3748',
                                  fontSize: 13, lineHeight: 1.5,
                                  boxShadow: isOwn ? '0 2px 8px rgba(74,108,247,.25)' : '0 1px 3px rgba(0,0,0,.08)',
                                  wordBreak: 'break-word', position: 'relative',
                                  minWidth: msg.type === 'voice' ? 180 : 'unset',
                                }}>
                                {/* ✓ selection badge */}
                                {voteSelectMode && selectedMsgIds.has(msg.id) && (
                                  <div style={{ position: 'absolute', top: -8, left: isOwn ? 'auto' : -8, right: isOwn ? -8 : 'auto', width: 20, height: 20, borderRadius: '50%', background: '#4A90E2', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(74,144,226,.5)' }}>✓</div>
                                )}

                                {/* Voice message */}
                                {msg.type === 'voice' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button
                                      onClick={e => { e.stopPropagation(); const a = document.getElementById(`audio-${msg.id}`); a && (a.paused ? a.play() : a.pause()); }}
                                      style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: isOwn ? 'rgba(255,255,255,.25)' : '#4A90E2', color: isOwn ? 'white' : 'white', flexShrink: 0 }}>
                                      ▶
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 26 }}>
                                      {[14,20,28,18,32,22,16,28,20,14,24,18,30,16,22,18].map((h, i) => (
                                        <span key={i} className="voice-wave-bar" style={{ height: h, background: isOwn ? 'rgba(255,255,255,.85)' : '#4A90E2', animationDelay: `${i * 0.07}s` }} />
                                      ))}
                                    </div>
                                    <span style={{ fontSize: 11.5, opacity: .75 }}>{msg.duration || '0:00'}</span>
                                    {msg.audio_url && <audio id={`audio-${msg.id}`} src={msg.audio_url} style={{ display: 'none' }} />}
                                  </div>
                                ) : (
                                  msg.message
                                )}
                              </div>
                              {/* Heure */}
                              <span style={{ fontSize: 10, color: '#a0aec0', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                                {msg.time}
                              </span>
                            </div>
                              </div>
                              {/* زر Mettre en vote للمنشئ فقط */}
                              {selectedRcp.is_creator && selectedRcp.status === 'ongoing' && !selectedRcp.vote_open && !selectedRcp.decision && (
                                <button
                                  style={{ marginTop: 2, marginLeft: isOwn ? 0 : 44, padding: '2px 8px', background: '#EBF4FF', color: '#3182CE', border: '1px solid #90CDF4', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  onClick={() => handlePutMessageToVote(msg.message)}>
                                  🗳️ Mettre en vote
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ═══ VOTE SECTION ═══ */}
                    {selectedRcp.status === 'ongoing' && (
                      <div style={s.voteSection}>
                        <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: 12, fontSize: 14 }}>🗳️ Vote</div>

                        {/* Créateur — ouvrir un vote */}
                        {selectedRcp.is_creator && !selectedRcp.vote_open && !selectedRcp.decision && (
                          <div style={{ marginBottom: 12 }}>
                            {!showVoteInput ? (
                              <button className="btn-h"
                                style={{ padding: '8px 16px', background: '#EBF4FF', color: '#2B6CB0', border: '1.5px dashed #90CDF4', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => setShowVoteInput(true)}>
                                + Ouvrir un vote sur une proposition
                              </button>
                            ) : (
                              <div style={{ background: '#EBF4FF', borderRadius: 10, padding: 12, border: '1px solid #BEE3F8' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#2B6CB0', marginBottom: 6 }}>Proposition à soumettre au vote</div>
                                <textarea rows={2}
                                  style={{ width: '100%', padding: 8, borderRadius: 7, border: '1px solid #90CDF4', fontSize: 13, marginBottom: 8, resize: 'none', boxSizing: 'border-box' }}
                                  placeholder="Ex: Chimiothérapie FOLFOX 6 cycles..."
                                  value={voteProposal}
                                  onChange={e => setVoteProposal(e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button className="btn-h"
                                    style={{ padding: '7px 16px', background: '#4A6CF7', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                                    onClick={() => handleSetVote(voteProposal)}>
                                    🗳️ Lancer le vote
                                  </button>
                                  <button style={{ padding: '7px 14px', background: '#EDF2F7', color: '#718096', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}
                                    onClick={() => { setShowVoteInput(false); setVoteProposal(''); }}>
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vote en cours */}
                        {selectedRcp.vote_open && selectedRcp.vote_proposal && (
                          <div style={{ background: '#FFFBEB', borderRadius: 10, padding: 14, border: '2px solid #F6AD55', marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#C05621', marginBottom: 6, textTransform: 'uppercase' }}>📋 Proposition en vote</div>
                            <div style={{ fontSize: 14, color: '#2D3748', fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
                              "{selectedRcp.vote_proposal}"
                            </div>

                            {/* Boutons vote — désactivés si déjà voté */}
                            {!selectedRcp.my_vote ? (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                {[
                                  { v: 'approve', label: '✔ Approuver', bg: '#C6F6D5', color: '#276749' },
                                  { v: 'reject',  label: '✘ Rejeter',   bg: '#FED7D7', color: '#C53030' },
                                  { v: 'abstain', label: '— Abstention', bg: '#EDF2F7', color: '#4a5568' },
                                ].map(({ v, label, bg, color }) => (
                                  <button key={v} className="btn-h" disabled={voteLoading}
                                    style={{ padding: '9px 18px', background: bg, color, border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                                    onClick={() => handleVote(v)}>
                                    {label}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div style={{ background: '#F0FFF4', borderRadius: 8, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 18 }}>
                                  {selectedRcp.my_vote === 'approve' ? '✅' : selectedRcp.my_vote === 'reject' ? '❌' : '➖'}
                                </span>
                                <span style={{ fontSize: 13, color: '#276749', fontWeight: 700 }}>
                                  Votre vote a été enregistré
                                </span>
                              </div>
                            )}

                            {/* Résultats + fermé par créateur */}
                            {selectedRcp.vote_summary && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, flexWrap: 'wrap' }}>
                                <span style={{ color: '#276749', fontWeight: 700 }}>✔ {selectedRcp.vote_summary.approve}</span>
                                <span style={{ color: '#C53030', fontWeight: 700 }}>✘ {selectedRcp.vote_summary.reject}</span>
                                <span style={{ color: '#718096', fontWeight: 700 }}>— {selectedRcp.vote_summary.abstain}</span>
                                <span style={{ color: '#A0AEC0', fontSize: 12 }}>{selectedRcp.vote_summary.voted}/{selectedRcp.vote_summary.total} ont voté</span>
                                {selectedRcp.is_creator && (
                                  <button className="btn-h"
                                    style={{ marginLeft: 'auto', padding: '5px 12px', background: '#FED7D7', color: '#C53030', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                    onClick={handleCloseVote}>
                                    Fermer le vote
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Détails pour le créateur */}
                            {selectedRcp.is_creator && selectedRcp.votes && selectedRcp.votes.length > 0 && (
                              <div style={{ marginTop: 10, borderTop: '1px solid #F6AD55', paddingTop: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#C05621', marginBottom: 6 }}>Détail des votes (visible par vous seul)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {selectedRcp.votes.map((v, i) => (
                                    <div key={i} style={{
                                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                      background: v.vote === 'approve' ? '#C6F6D5' : v.vote === 'reject' ? '#FED7D7' : '#EDF2F7',
                                      color: v.vote === 'approve' ? '#276749' : v.vote === 'reject' ? '#C53030' : '#4a5568',
                                    }}>
                                      {v.user} — {v.vote === 'approve' ? '✔' : v.vote === 'reject' ? '✘' : '—'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vote fermé — résultats finaux */}
                        {!selectedRcp.vote_open && selectedRcp.vote_proposal && !selectedRcp.decision && (
                          <div style={{ background: '#F7FAFC', borderRadius: 10, padding: 12, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 12, color: '#718096', fontWeight: 700, marginBottom: 6 }}>Vote terminé — "{selectedRcp.vote_proposal}"</div>
                            {selectedRcp.vote_summary && (
                              <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
                                <span style={{ color: '#276749', fontWeight: 700 }}>✔ {selectedRcp.vote_summary.approve}</span>
                                <span style={{ color: '#C53030', fontWeight: 700 }}>✘ {selectedRcp.vote_summary.reject}</span>
                                <span style={{ color: '#718096', fontWeight: 700 }}>— {selectedRcp.vote_summary.abstain}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Décision validée */}
                    {selectedRcp.decision && (
                      <div style={s.decisionBox}>
                        <div style={{ fontWeight: 700, color: '#D68910', marginBottom: 8, fontSize: 14 }}>✅ Décision Validée</div>
                        <div style={{ color: '#4a5568', lineHeight: 1.6 }}>{selectedRcp.decision}</div>
                        {selectedRcp.treatment_protocol && (
                          <div style={{ marginTop: 10, background: '#F0FFF4', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid #48BB78' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#276749', marginBottom: 6 }}>💊 Protocole de Traitement</div>
                            <pre style={{ margin: 0, fontSize: 12, color: '#2D3748', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{selectedRcp.treatment_protocol}</pre>
                          </div>
                        )}
                        {selectedRcp.signature_code && (
                          <div style={{ marginTop: 10, background: '#EBF4FF', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>🔐</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#2C5282', fontWeight: 700 }}>Signature Numérique</div>
                              <code style={{ fontSize: 12, color: '#1a2f6b', fontWeight: 700, letterSpacing: 1 }}>{selectedRcp.signature_code}</code>
                            </div>
                          </div>
                        )}
                        {selectedRcp.rapport_url && (
                          <button className="btn-h"
                            style={{ marginTop: 10, padding: '7px 16px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                            onClick={handleDownloadRapport}>
                            📄 Télécharger PDF
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bouton valider — seulement le créateur */}
                    {selectedRcp.status === 'ongoing' && !selectedRcp.decision && (
                      <div style={{ marginTop: 18 }}>
                        {!selectedRcp.is_creator ? (
                          <div style={{ background: '#EDF2F7', borderRadius: 10, padding: '10px 14px', color: '#718096', fontSize: 13, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>⏳</span>
                            <span>En attente de la décision du responsable...</span>
                          </div>
                        ) : !showDecision ? (
                          <button className="btn-h"
                            style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                            onClick={() => setShowDecision(true)}>
                            📝 Valider une Décision
                          </button>
                        ) : (
                          <div style={{ background: '#FEF5E7', borderRadius: 12, padding: 16, border: '1px solid #F6AD55' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#744210', fontSize: 14 }}>Décision finale</div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: '#744210', marginBottom: 4 }}>Décision thérapeutique *</div>
                            <textarea rows={3}
                              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #DDE4F3', fontSize: 13, resize: 'none', marginBottom: 12, boxSizing: 'border-box' }}
                              placeholder="Ex: Chimiothérapie adjuvante recommandée..."
                              value={decisionInput}
                              onChange={e => setDecisionInput(e.target.value)}
                            />
                            <div style={{ fontWeight: 600, fontSize: 12, color: '#744210', marginBottom: 4 }}>Protocole de traitement (optionnel)</div>
                            <textarea rows={4}
                              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #DDE4F3', fontSize: 13, resize: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                              placeholder={"Ex:\n- Docetaxel 75 mg/m² J1\n- Carboplatine AUC5 J1\n- Cycles: toutes les 3 semaines x 6"}
                              value={treatmentProtocol}
                              onChange={e => setTreatmentProtocol(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-h"
                                style={{ padding: '8px 18px', background: '#48BB78', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                                onClick={handleValidate}>
                                ✔ Confirmer
                              </button>
                              <button style={{ padding: '8px 16px', background: '#EDF2F7', color: '#4a5568', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                                onClick={() => { setShowDecision(false); setDecisionInput(''); setTreatmentProtocol(''); }}>
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Input message + Recording */}
          {selectedRcp && selectedRcp.status === 'ongoing' && (
            <>
              {/* 🎤 Recording bar */}
              {isRecording && (
                <div style={s.recBar}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E53E3E', animation: 'blink .9s infinite', flexShrink: 0 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#E53E3E', minWidth: 46, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtDur(recSeconds)}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 26 }}>
                    {Array.from({ length: 16 }, (_, i) => (
                      <span key={i} className="rec-wave-bar" style={{ height: 8 + Math.sin(i * 0.8) * 10 + 6, animationDelay: `${i * 0.06}s` }} />
                    ))}
                  </div>
                  <button onClick={cancelRecording} style={s.recCancelBtn}>✕ Annuler</button>
                  <button onClick={sendVoiceMessage} style={s.recSendBtn}>📤 Envoyer</button>
                </div>
              )}

              {/* Text input */}
              {!isRecording && (
                <div style={s.inputArea}>
                  <input type="text"
                    placeholder="Écrire un commentaire... (Entrée pour envoyer)"
                    style={s.msgInput}
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  />
                  {/* 🎤 Mic button */}
                  <button
                    className="btn-h"
                    title="Message vocal"
                    onClick={startRecording}
                    style={{ width: 40, height: 40, borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#f7fafc', color: '#718096', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}>
                    🎤
                  </button>
                  <button className="btn-h" style={s.sendBtn} onClick={sendMessage}>Envoyer ➤</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🔔 Toast Notification */}
      {toast && (
        <div className="notif-toast-anim" style={s.notifToast}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>
            {toast.startsWith('💬') ? '💬' : toast.startsWith('✓') ? '✅' : toast.startsWith('❌') ? '❌' : '🔔'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 2 }}>
              {toast.startsWith('💬') ? 'Nouveau message' : 'Notification'}
            </div>
            <div style={{ fontSize: 12, color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {toast}
            </div>
          </div>
          <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 15, padding: '2px 6px' }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  root:           { minHeight: '100vh', background: 'linear-gradient(135deg,#e3e8f7,#f0e7f7)', fontFamily: '-apple-system, BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,.06)' },
  logoSection:    { display: 'flex', alignItems: 'center', gap: 12 },
  logo:           { width: 42, height: 42, background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  logoText:       { fontSize: 20, color: '#2d3748', fontWeight: 700 },
  headerActions:  { display: 'flex', alignItems: 'center', gap: 12 },
  createBtn:      { padding: '9px 18px', background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
  myPatientsBtn:  { padding: '9px 16px', background: '#EDF2F7', color: '#4A90E2', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
  notifIcon:      { width: 38, height: 38, borderRadius: '50%', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, position: 'relative' },
  notifBadge:     { position: 'absolute', top: 3, right: 3, width: 17, height: 17, background: '#E53E3E', borderRadius: '50%', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalOverlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn .2s', padding: 16 },
  modal:          { background: 'white', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.3)', animation: 'slideIn .2s' },
  modalHeader:    { padding: '22px 26px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 },
  modalBody:      { padding: '20px 26px', overflowY: 'auto', flex: 1 },
  stepDesc:       { fontSize: 14, color: '#718096', marginBottom: 14 },
  patientList:    { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' },
  patientRow:     { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#f7fafc', borderRadius: 12, cursor: 'pointer', border: '2px solid transparent', transition: 'all .2s' },
  patientRowAvatar:{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  selectedPatientBanner: { background: '#EBF8FF', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2b6cb0', marginBottom: 14, border: '1px solid #BEE3F8' },
  cancerRow:      { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: '2px solid', transition: 'all .2s' },
  fieldGroup:     { marginBottom: 16 },
  fieldLabel:     { display: 'block', fontSize: 13, fontWeight: 700, color: '#4a5568', marginBottom: 7 },
  input:          { width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  doctorList:     { maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' },
  doctorRow:      { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', border: '1px solid', borderLeft: 'none', borderRight: 'none', borderTop: 'none', transition: 'all .15s' },
  doctorAvatar:   { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, transition: 'all .2s' },
  stepBtns:       { display: 'flex', justifyContent: 'space-between', marginTop: 20 },
  btnPrimary:     { padding: '10px 22px', background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
  btnSecondary:   { padding: '10px 18px', background: '#EDF2F7', color: '#4a5568', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' },
  closeBtn:       { background: 'none', border: 'none', fontSize: 17, color: '#a0aec0', cursor: 'pointer', padding: '4px 8px' },
  // Notifications
  notifsPanel:    { position: 'fixed', top: 75, right: 18, width: 360, maxHeight: 480, background: 'white', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,.15)', overflow: 'hidden', zIndex: 1000, animation: 'slideIn .2s' },
  notifsHeader:   { padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  notifItem:      { padding: '12px 18px', borderBottom: '1px solid #f7fafc', cursor: 'pointer', transition: 'background .2s' },
  // Overlay
  overlay:        { position: 'fixed', top: 76, left: 0, right: 0, bottom: 0, background: '#f7fafc', zIndex: 999, overflowY: 'auto', padding: '26px 30px', animation: 'slideIn .2s' },
  overlayHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  statsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 },
  statCard:       { background: 'white', padding: 20, borderRadius: 13, boxShadow: '0 2px 8px rgba(0,0,0,.06)' },
  statValue:      { fontSize: 28, fontWeight: 800, color: '#2d3748', marginBottom: 4 },
  statLabel:      { fontSize: 12, color: '#718096' },
  rcpGrid:        { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 },
  rcpCard:        { background: 'white', padding: 20, borderRadius: 13, boxShadow: '0 2px 8px rgba(0,0,0,.06)', cursor: 'pointer', transition: 'all .25s' },
  // Layout
  mainLayout:     { display: 'grid', height: 'calc(100vh - 76px)', overflow: 'hidden', transition: 'all .3s' },
  sidebar:        { background: '#f7fafc', padding: 18, overflowY: 'auto', borderRight: '1px solid #e2e8f0' },
  rcpSidebarCard: { background: 'white', padding: 12, borderRadius: 11, cursor: 'pointer', transition: 'all .2s', border: '2px solid transparent' },
  rcpSidebarActive: { borderColor: '#4A90E2', boxShadow: '0 4px 12px rgba(74,144,226,.2)' },
  stageBadge:     { padding: '2px 7px', borderRadius: 5, background: '#EDF2F7', color: '#4a5568', fontSize: 11 },
  urgBadge:       { padding: '2px 7px', borderRadius: 5, fontSize: 11 },
  urgElevee:      { background: '#FED7D7', color: '#C53030' },
  urgModeree:     { background: '#FEEBC8', color: '#C05621' },
  urgFaible:      { background: '#C6F6D5', color: '#2F855A' },
  statusActive:   { fontSize: 11 },
  mainContent:    { background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  patientHeaderBar:{ background: 'white', borderBottom: '1px solid #e2e8f0', transition: 'all .2s' },
  patientIcon:    { width: 36, height: 36, background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 },
  rapportBtn:     { padding: '6px 14px', background: '#C6F6D5', color: '#276749', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all .2s' },
  iconBtn:        { background: '#EDF2F7', border: 'none', width: 32, height: 32, borderRadius: 7, cursor: 'pointer', fontSize: 15, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatWrapper:    { flex: 1, overflowY: 'auto', background: '#f7fafc' },
  panel:          { background: 'white', borderRadius: 13, padding: 20, marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,.05)' },
  countBadge:     { background: '#4A90E2', color: 'white', padding: '2px 9px', borderRadius: 5, fontSize: 12, fontWeight: 700 },
  participantChip:{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', background: '#f7fafc', borderRadius: 8 },
  participantAvatar:{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  msgAvatar:      { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  msgBubble:      { padding: '9px 13px', borderRadius: '18px 18px 18px 4px', background: '#F0F4FF', color: '#2D3748', lineHeight: 1.5, fontSize: 13 },
  voteSection:    { background: '#F7FAFC', borderRadius: 10, padding: 14, marginTop: 14, borderTop: '2px solid #e2e8f0' },
  decisionBox:    { background: '#FEF5E7', borderRadius: 11, padding: 16, borderLeft: '4px solid #F39C12', marginTop: 14 },
  inputArea:      { padding: '16px 26px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 },
  msgInput:       { flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none' },
  sendBtn:        { padding: '10px 22px', background: 'linear-gradient(135deg,#5CA0F2,#4A90E2)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
  startBtn:       { padding: '11px 28px', background: 'linear-gradient(135deg,#48BB78,#38A169)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', boxShadow: '0 4px 14px rgba(72,187,120,.4)' },
  scheduledBanner:{ background: '#FFFBEB', borderRadius: 14, padding: '28px 20px', textAlign: 'center', border: '2px solid #F6AD55', marginBottom: 18 },
  toast:          { position: 'fixed', bottom: 20, right: 20, background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', color: 'white', padding: '12px 20px', borderRadius: 11, fontSize: 13, fontWeight: 700, boxShadow: '0 10px 28px rgba(74,144,226,.4)', zIndex: 9999 },
  // 🔔 Rich toast
  notifToast:     { position: 'fixed', top: 82, right: 20, zIndex: 9999, background: 'white', borderRadius: 13, padding: '14px 16px', boxShadow: '0 8px 30px rgba(0,0,0,.14)', borderLeft: '4px solid #4A90E2', display: 'flex', gap: 10, alignItems: 'center', minWidth: 280, maxWidth: 360 },
  // 🎤 Recording bar
  recBar:         { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#FFF5F5', borderTop: '1.5px solid #FEB2B2', flexShrink: 0 },
  recCancelBtn:   { background: '#FED7D7', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: '#C53030', cursor: 'pointer' },
  recSendBtn:     { background: '#4A90E2', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: 'white', cursor: 'pointer' },
};s