import React, { useState, useRef, useEffect } from 'react';

const notifications = [
  { id: 1, patientId: 1, avatar: "https://i.pravatar.cc/150?img=11", title: "Nouvelle réunion RCP", message: "Dr. Kamel Hamidi a démarré une réunion pour Mehdi Benali", time: "Il y a 5 min", unread: true },
  { id: 2, patientId: 1, avatar: "https://i.pravatar.cc/150?img=47", title: "Nouveau message", message: "Dr. Fatima Aouad a ajouté un commentaire", time: "Il y a 12 min", unread: true },
  { id: 3, patientId: 2, avatar: "https://i.pravatar.cc/150?img=14", title: "Décision requise", message: "Votre avis est demandé pour Amina Larbi", time: "Il y a 1h", unread: true }
];

const initialPatients = [
  {
    id: 1, name: "Mehdi Benali", age: 24, stage: "Stade 2", urgency: "élevée",
    avatar: "https://i.pravatar.cc/150?img=33", dossier: "152387489634 NIN 1990825184289",
    meetingActive: true, lastMeeting: "16/02/2026",
    participants: [
      { name: "Dr. Kamel Hamidi", avatar: "https://i.pravatar.cc/150?img=11", online: true },
      { name: "Dr. Fatima Aouad", avatar: "https://i.pravatar.cc/150?img=47", online: true },
      { name: "Dr. Samir Benamra", avatar: "https://i.pravatar.cc/150?img=59", online: false }
    ],
    messages: [
      { author: "Dr. Kamel Hamidi", avatar: "https://i.pravatar.cc/150?img=11", text: "Bonjour à tous, discussion sur le cas de Mehdi Benali, 24 ans avec une tumeur cardiaque solide de 4,2 cm en Stade 2.", time: "14:32" },
      { author: "Dr. Fatima Aouad", avatar: "https://i.pravatar.cc/150?img=47", text: "Une chirurgie cardiaque est nécessaire rapidement.", time: "14:35" },
      { author: "Dr. Samir Benamra", avatar: "https://i.pravatar.cc/150?img=59", text: "Je propose une chimiothérapie néoadjuvante avant l'opération.", time: "14:38" }
    ],
    currentDecision: "Chimiothérapie néoadjuvante recommandée avant chirurgie cardiaque",
    historique: [
      { date: "24/04/2024", title: "Chimiothérapie néoadjuvante validée", description: "Réunion de suivi prévue dans 3 semaines", decision: "Protocole de chimiothérapie néoadjuvante approuvé unanimement", status: "Validé", participants: "12 participants" },
      { date: "02/04/2024", title: "Consultation initiale", description: "Diagnostic confirmé - IRM recommandée", decision: "Examen complémentaire IRM requis avant traitement", status: "Complété", participants: "8 participants" }
    ]
  },
  {
    id: 2, name: "Amina Larbi", age: 31, stage: "Stade 4", urgency: "élevée",
    avatar: "https://i.pravatar.cc/150?img=45", dossier: "152387489635 NIN 1985625184290",
    meetingActive: false, lastMeeting: "20/04/2024",
    participants: [], messages: [], currentDecision: null, historique: []
  },
  {
    id: 3, name: "Sara El Amrani", age: 45, stage: "Stade 3", urgency: "modérée",
    avatar: "https://i.pravatar.cc/150?img=27", dossier: "152387489636 NIN 1978525184291",
    meetingActive: true, lastMeeting: "15/02/2026",
    participants: [], messages: [], currentDecision: null, historique: []
  }
];

const urgencyClass = (u) => u === 'élevée' ? s.urgElevee : u === 'modérée' ? s.urgModeree : s.urgFaible;

export default function DiscussionRCP() {
  const [patients, setPatients] = useState(initialPatients);
  const [notifs, setNotifs] = useState(notifications);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMyPatients, setShowMyPatients] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chatRef = useRef(null);

  const patient = selectedIndex !== null ? patients[selectedIndex] : null;
  const unreadCount = notifs.filter(n => n.unread).length;

  const selectPatient = (index) => {
    setSelectedIndex(index);
    setIsMinimized(false);
  };

  const handleNotifClick = (notif) => {
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    setShowNotifs(false);
    const idx = patients.findIndex(p => p.id === notif.patientId);
    if (idx !== -1) selectPatient(idx);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || selectedIndex === null) return;
    const newMsg = { author: "Dr. Vous", avatar: "https://i.pravatar.cc/150?img=12", text: messageInput, time: "Maintenant" };
    setPatients(prev => prev.map((p, i) => i === selectedIndex ? { ...p, messages: [...p.messages, newMsg] } : p));
    setMessageInput('');
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 50);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [patient?.messages]);

  return (
    <div style={s.root}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
        .my-patients-btn:hover { background: #4A90E2 !important; color: white !important; }
        .patient-card-large:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important; }
        .send-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74,144,226,0.3); }
        .notif-item:hover { background: #f7fafc; }
        .patient-sidebar-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .minimize-btn:hover, .expand-btn:hover { background: #4A90E2 !important; color: white !important; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.logoSection}>
          <div style={s.logo}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={s.logoText}>Discussion RCP</div>
        </div>
        <div style={s.headerActions}>
          <button className="my-patients-btn" style={s.myPatientsBtn} onClick={() => setShowMyPatients(!showMyPatients)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Mes patients
          </button>
          <div style={s.notifIcon} onClick={() => setShowNotifs(!showNotifs)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && <div style={s.notifBadge}>{unreadCount}</div>}
          </div>
          <img src="https://i.pravatar.cc/150?img=12" style={s.userAvatar} alt="User" />
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifs && (
        <div style={s.notifsPanel}>
          <div style={s.notifsHeader}>
            <h3 style={{ fontSize: 18, color: '#2d3748' }}>Notifications</h3>
            <button style={s.closeNotifBtn} onClick={() => setShowNotifs(false)}>×</button>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifs.map(notif => (
              <div key={notif.id} className="notif-item" style={{ ...s.notifItem, ...(notif.unread ? s.notifUnread : {}) }} onClick={() => handleNotifClick(notif)}>
                <img src={notif.avatar} style={s.notifAvatar} alt="" />
                <div>
                  <div style={{ fontSize: 14, color: '#2d3748', fontWeight: 600, marginBottom: 4 }}>{notif.title}</div>
                  <div style={{ fontSize: 13, color: '#718096', marginBottom: 4 }}>{notif.message}</div>
                  <div style={{ fontSize: 12, color: '#a0aec0' }}>{notif.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Patients View */}
      {showMyPatients && (
        <div style={s.myPatientsView}>
          <div style={s.myPatientsHeader}>
            <h2 style={{ fontSize: 28, color: '#2d3748' }}>📋 Mes Patients & Réunions RCP</h2>
            <button style={s.closePatientsBtn} onClick={() => setShowMyPatients(false)}>✕ Fermer</button>
          </div>

          {/* Stats */}
          <div style={s.statsGrid}>
            {[['12','Total Patients'],['3','RCP Actives'],['5','RCP Cette Semaine'],['8','Décisions en Attente']].map(([val, label]) => (
              <div key={label} style={s.statCard}>
                <div style={s.statValue}>{val}</div>
                <div style={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          {/* Patients Grid */}
          <div style={s.patientsGrid}>
            {patients.map((p, i) => (
              <div key={p.id} className="patient-card-large" style={s.patientCardLarge} onClick={() => { setShowMyPatients(false); selectPatient(i); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15 }}>
                  <img src={p.avatar} style={s.cardAvatar} alt={p.name} />
                  <div>
                    <h3 style={{ fontSize: 18, color: '#2d3748', marginBottom: 5 }}>{p.name}</h3>
                    <p style={{ fontSize: 14, color: '#718096' }}>{p.age} ans • {p.stage}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                  <span style={{ ...s.urgBadge, ...urgencyClass(p.urgency) }}>Urgence {p.urgency}</span>
                  <span style={p.meetingActive ? s.badgeActive : s.badgePending}>
                    {p.meetingActive ? '🟢 RCP Active' : '⏳ Pas de RCP'}
                  </span>
                </div>
                <div style={{ paddingTop: 15, borderTop: '1px solid #e2e8f0', fontSize: 13, color: '#718096' }}>
                  📅 Dernière réunion: {p.lastMeeting}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div style={{ ...s.mainLayout, gridTemplateColumns: isFullscreen ? '1fr' : '320px 1fr' }}>

        {/* Sidebar */}
        {!isFullscreen && (
          <div style={s.sidebar}>
            <div style={{ position: 'relative', marginBottom: 25 }}>
              <svg style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Recherche patient" style={s.searchInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {patients.map((p, i) => {
                const hasNotif = notifs.some(n => n.patientId === p.id && n.unread);
                return (
                  <div key={p.id} className="patient-sidebar-card" style={{ ...s.patientSidebarCard, ...(selectedIndex === i ? s.patientSidebarCardActive : {}) }} onClick={() => selectPatient(i)}>
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
                      {p.meetingActive && <span style={s.statusActive}>RCP en cours</span>}
                      {hasNotif && <div style={s.notifDot}>!</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={p.avatar} style={s.avatarSmall} alt={p.name} />
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: '#2d3748', marginBottom: 5 }}>{p.name}</h4>
                        <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                          <span style={s.stageBadge}>{p.stage}</span>
                          <span style={{ ...s.urgBadge, ...urgencyClass(p.urgency) }}>Urgence {p.urgency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={s.mainContent}>
          {/* Patient Header Bar */}
          <div style={{ ...s.patientHeaderBar, padding: isMinimized ? '15px 30px' : '25px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={s.newPatientIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: isMinimized ? 18 : 22, color: '#2d3748', fontWeight: 600 }}>
                  {patient ? patient.name : 'Sélectionnez un patient'}
                </h2>
              </div>
              {patient && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="expand-btn" style={s.iconBtn} onClick={() => setIsFullscreen(!isFullscreen)} title="Plein écran">
                    {isFullscreen
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
                    }
                  </button>
                  <button className="minimize-btn" style={s.iconBtn} onClick={() => setIsMinimized(!isMinimized)} title="Réduire en-tête">
                    {isMinimized
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                    }
                  </button>
                </div>
              )}
            </div>

            {!isMinimized && patient && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 15 }}>
                  <img src={patient.avatar} style={s.mainAvatar} alt={patient.name} />
                  <div>
                    <h3 style={{ fontSize: 24, color: '#2d3748', marginBottom: 5 }}>
                      {patient.name} <span style={{ color: '#718096', fontSize: 16, fontWeight: 400 }}>{patient.age} ans</span>
                    </h3>
                    <div style={{ color: '#718096', fontSize: 14 }}>Dossier : {patient.dossier}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 30, borderBottom: '2px solid #e2e8f0' }}>
                  {['Diagnostic & Cancer', 'Biologie & Imagerie', 'Habitudes & Anté...'].map((tab, i) => (
                    <div key={tab} style={{ padding: '12px 0', fontSize: 15, color: i === 0 ? '#4A90E2' : '#718096', cursor: 'pointer', borderBottom: i === 0 ? '2px solid #4A90E2' : '2px solid transparent', marginBottom: -2 }}>{tab}</div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Chat Area */}
          <div ref={chatRef} style={s.chatWrapper}>
            <div style={{ padding: 30 }}>
              {!patient ? (
                <p style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 20px' }}>Sélectionnez un patient ou cliquez sur une notification pour commencer</p>
              ) : (!patient.meetingActive || patient.messages.length === 0) ? (
                <p style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 20px' }}>Aucune réunion active pour ce patient</p>
              ) : (
                <>
                  {/* Participants */}
                  <div style={s.panel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#2d3748' }}>👥 Participants</span>
                      <span style={{ background: '#4A90E2', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>{patient.participants.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {patient.participants.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f7fafc', borderRadius: 8 }}>
                          <img src={p.avatar} style={{ width: 30, height: 30, borderRadius: '50%' }} alt={p.name} />
                          <span style={{ fontSize: 13, color: '#4a5568' }}>{p.name}</span>
                          {p.online && <span style={{ width: 8, height: 8, background: '#48bb78', borderRadius: '50%', display: 'inline-block' }}></span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discussion */}
                  <div style={s.panel}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 15, borderBottom: '2px solid #e2e8f0' }}>
                      <div style={{ width: 35, height: 35, background: '#EDF2F7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A90E2' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      </div>
                      <h3 style={{ fontSize: 18, color: '#2d3748', fontWeight: 600 }}>💬 Discussion</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 20 }}>
                      {patient.messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12 }}>
                          <img src={msg.avatar} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} alt={msg.author} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <span style={{ fontWeight: 600, color: '#2d3748', fontSize: 14 }}>{msg.author}</span>
                              <span style={{ color: '#a0aec0', fontSize: 12 }}>{msg.time}</span>
                            </div>
                            <div style={{ background: '#f7fafc', padding: '12px 15px', borderRadius: 10, color: '#4a5568', lineHeight: 1.5, fontSize: 14, borderLeft: '3px solid #4A90E2' }}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {patient.currentDecision && (
                      <div style={{ background: '#FEF5E7', borderRadius: 12, padding: 18, borderLeft: '4px solid #F39C12', marginTop: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#D68910' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          Décision proposée
                        </div>
                        <div style={{ color: '#4a5568', lineHeight: 1.5, fontSize: 14, marginBottom: 12 }}>{patient.currentDecision}</div>
                        <div style={{ display: 'flex', gap: 15, fontSize: 12, color: '#718096', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                          <span>📅 Aujourd'hui</span>
                          <span>👥 {patient.participants.length} votes</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Historique */}
                  {patient.historique && patient.historique.length > 0 && (
                    <div style={{ ...s.panel, marginTop: 40, marginBottom: 30 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 15, borderBottom: '2px solid #e2e8f0' }}>
                        <div style={{ width: 35, height: 35, background: '#EDF2F7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A90E2' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <h3 style={{ fontSize: 18, color: '#2d3748', fontWeight: 600 }}>📜 Historique</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        {patient.historique.map((h, i) => (
                          <div key={i} style={{ padding: 18, background: '#f7fafc', borderRadius: 12, borderLeft: '4px solid #4A90E2' }}>
                            <span style={{ display: 'inline-block', padding: '5px 12px', background: '#4A90E2', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{h.date}</span>
                            <div style={{ color: '#2d3748', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{h.title}</div>
                            <div style={{ color: '#718096', fontSize: 13, marginBottom: 12 }}>{h.description}</div>
                            <div style={{ background: '#FEF5E7', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid #F39C12', marginBottom: 12 }}>
                              <div style={{ fontSize: 11, color: '#D68910', fontWeight: 600, marginBottom: 5 }}>DÉCISION</div>
                              <div style={{ fontSize: 13, color: '#4a5568' }}>{h.decision}</div>
                            </div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#C6F6D5', color: '#2F855A', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>✓ {h.status}</span>
                            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#a0aec0' }}>
                              <span>👥 {h.participants}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Input Area */}
          {patient && patient.meetingActive && patient.messages.length > 0 && (
            <div style={s.inputArea}>
              <input
                type="text"
                placeholder="Écrire un commentaire..."
                style={s.msgInput}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
              />
              <button className="send-btn" style={s.sendBtn} onClick={sendMessage}>Envoyer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: 'linear-gradient(135deg, #e3e8f7, #f0e7f7)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  logoSection: { display: 'flex', alignItems: 'center', gap: 15 },
  logo: { width: 50, height: 50, background: 'linear-gradient(135deg, #4A90E2, #5CA0F2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  logoText: { fontSize: 24, color: '#2d3748', fontWeight: 500 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 15 },
  myPatientsBtn: { padding: '10px 20px', background: '#EDF2F7', color: '#4A90E2', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.3s ease' },
  notifIcon: { width: 40, height: 40, borderRadius: '50%', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#718096', position: 'relative' },
  notifBadge: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, background: '#E53E3E', borderRadius: '50%', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 50, height: 50, borderRadius: '50%', cursor: 'pointer', border: '2px solid #4A90E2' },
  notifsPanel: { position: 'fixed', top: 90, right: 20, width: 400, maxHeight: 500, background: 'white', borderRadius: 15, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 1000, animation: 'slideIn 0.3s ease' },
  notifsHeader: { padding: 20, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeNotifBtn: { background: 'none', border: 'none', fontSize: 24, color: '#a0aec0', cursor: 'pointer' },
  notifItem: { padding: '15px 20px', borderBottom: '1px solid #f7fafc', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', gap: 12 },
  notifUnread: { background: '#EBF8FF' },
  notifAvatar: { width: 40, height: 40, borderRadius: '50%', flexShrink: 0 },
  myPatientsView: { position: 'fixed', top: 90, left: 0, right: 0, bottom: 0, background: '#f7fafc', zIndex: 999, overflowY: 'auto', padding: 30, animation: 'fadeIn 0.3s ease' },
  myPatientsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  closePatientsBtn: { padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#4a5568' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 },
  statCard: { background: 'white', padding: 25, borderRadius: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  statValue: { fontSize: 32, fontWeight: 700, color: '#2d3748', marginBottom: 5 },
  statLabel: { fontSize: 14, color: '#718096' },
  patientsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  patientCardLarge: { background: 'white', padding: 25, borderRadius: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.3s ease' },
  cardAvatar: { width: 60, height: 60, borderRadius: '50%', border: '3px solid #4A90E2' },
  badgeActive: { display: 'inline-block', padding: '8px 15px', background: '#C6F6D5', color: '#2F855A', borderRadius: 8, fontSize: 13, fontWeight: 600 },
  badgePending: { display: 'inline-block', padding: '8px 15px', background: '#FEEBC8', color: '#C05621', borderRadius: 8, fontSize: 13, fontWeight: 600 },
  urgBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 },
  urgElevee: { background: '#FED7D7', color: '#C53030' },
  urgModeree: { background: '#FEEBC8', color: '#C05621' },
  urgFaible: { background: '#C6F6D5', color: '#2F855A' },
  mainLayout: { display: 'grid', height: 'calc(100vh - 90px)', overflow: 'hidden', transition: 'all 0.3s ease' },
  sidebar: { background: '#f7fafc', padding: 25, overflowY: 'auto', borderRight: '1px solid #e2e8f0' },
  searchInput: { width: '100%', padding: '12px 15px 12px 45px', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, background: 'white', outline: 'none' },
  patientSidebarCard: { background: 'white', padding: 15, borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid transparent', position: 'relative' },
  patientSidebarCardActive: { borderColor: '#4A90E2', boxShadow: '0 4px 12px rgba(74,144,226,0.2)' },
  avatarSmall: { width: 45, height: 45, borderRadius: '50%' },
  stageBadge: { padding: '3px 8px', borderRadius: 6, background: '#EDF2F7', color: '#4a5568', fontSize: 12 },
  statusActive: { padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#C6F6D5', color: '#2F855A' },
  notifDot: { width: 22, height: 22, borderRadius: '50%', background: '#E53E3E', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mainContent: { background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  patientHeaderBar: { background: 'white', borderBottom: '1px solid #e2e8f0', transition: 'all 0.3s ease' },
  newPatientIcon: { width: 40, height: 40, background: 'linear-gradient(135deg, #4A90E2, #5CA0F2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  iconBtn: { background: '#EDF2F7', border: 'none', width: 35, height: 35, borderRadius: 8, cursor: 'pointer', color: '#4A90E2', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mainAvatar: { width: 60, height: 60, borderRadius: '50%', border: '3px solid #4A90E2' },
  chatWrapper: { flex: 1, overflowY: 'auto', background: '#f7fafc' },
  panel: { background: 'white', borderRadius: 15, padding: 25, marginBottom: 25, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  inputArea: { padding: '20px 30px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 15 },
  msgInput: { flex: 1, padding: '12px 18px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' },
  sendBtn: { padding: '12px 25px', background: 'linear-gradient(135deg, #5CA0F2, #4A90E2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' },
};