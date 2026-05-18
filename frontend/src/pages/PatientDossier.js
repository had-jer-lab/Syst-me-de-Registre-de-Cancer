import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OngletDemandes } from './DemandeExamen';
import PatientQRCode from './PatientQRCode';

const API = 'http://localhost:8000/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/auth'; return null; }
  if (!res.ok) throw await res.json().catch(() => ({}));
  if (res.status === 204) return null;
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str || str === '—') return '—';
  try {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  } catch { return str; }
}

function calcAge(dob) {
  if (!dob) return null;
  const b = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

function RdvPill({ date }) {
  if (!date || date === '—') return <span style={s.rdvNone}>Aucun RDV</span>;
  const d = daysSince(date);
  let color, bg, border, label;
  if (d === 0)      { color = '#0A9A6B'; bg = 'rgba(10,154,107,0.08)'; border = 'rgba(10,154,107,0.2)'; label = "Aujourd'hui"; }
  else if (d <= 7)  { color = '#0A9A6B'; bg = 'rgba(10,154,107,0.08)'; border = 'rgba(10,154,107,0.2)'; label = `${d}j`; }
  else if (d <= 30) { color = '#C08A2B'; bg = 'rgba(192,138,43,0.08)'; border = 'rgba(192,138,43,0.2)'; label = `${d}j`; }
  else if (d <= 90) { color = '#C05A2B'; bg = 'rgba(192,90,43,0.08)'; border = 'rgba(192,90,43,0.2)'; label = `${Math.floor(d/30)} mois`; }
  else              { color = '#C02B2B'; bg = 'rgba(192,43,43,0.08)'; border = 'rgba(192,43,43,0.2)'; label = `${Math.floor(d/30)} mois`; }
  return (
    <span style={{ ...s.rdvPill, color, background: bg, borderColor: border }}>
      <span style={{ ...s.rdvDot, background: color }} /> {fmtDate(date)} · {label}
    </span>
  );
}

function StadeBadge({ stade }) {
  if (!stade || stade === '—') return <span style={s.emptyBadge}>—</span>;
  const colors = {
    I:   { color: '#0A9A6B', bg: 'rgba(10,154,107,0.08)', border: 'rgba(10,154,107,0.2)' },
    II:  { color: '#C08A2B', bg: 'rgba(192,138,43,0.08)', border: 'rgba(192,138,43,0.2)' },
    III: { color: '#C05A2B', bg: 'rgba(192,90,43,0.08)', border: 'rgba(192,90,43,0.2)' },
    IV:  { color: '#C02B2B', bg: 'rgba(192,43,43,0.08)', border: 'rgba(192,43,43,0.2)' },
  };
  const c = colors[stade] || { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' };
  return (
    <span style={{ ...s.stadeBadge, color: c.color, background: c.bg, borderColor: c.border }}>
      Stade {stade}
    </span>
  );
}

function SexeAvatar({ sexe, name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const isMale = sexe === 'M';
  return (
    <div style={{ ...s.avatar, background: isMale ? 'linear-gradient(135deg, #1B3A7A, #2855B8)' : 'linear-gradient(135deg, #7A1B5A, #B82875)' }}>
      <span style={s.avatarInitials}>{initials}</span>
    </div>
  );
}

function Divider() {
  return <div style={s.divider} />;
}

function InfoRow({ label, value, accent }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={{ ...s.infoValue, color: accent ? '#1B3A7A' : '#1A1F2E' }}>
        {value || <span style={s.emptyText}>—</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionCardHeader}>
        <div style={s.sectionCardTitle}>
          <div style={s.sectionIconWrap}>{icon}</div>
          {title}
        </div>
        {action && action}
      </div>
      <div style={s.sectionCardBody}>{children}</div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={s.emptyState}>
      <span style={s.emptyStateIcon}>{icon}</span>
      <span style={s.emptyStateText}>{text}</span>
    </div>
  );
}

function CancerCard({ cancer, index, patientId }) {
  const [open, setOpen] = useState(index === 0);
  const type = cancer.cancer_type_name || '—';
  const stade = cancer.stade_clinique || cancer.stade_pathologique || '—';

  return (
    <div style={{ ...s.cancerCard, ...(open ? s.cancerCardOpen : {}) }}>
      <button style={s.cancerCardToggle} onClick={() => setOpen(o => !o)}>
        <div style={s.cancerCardLeft}>
          <span style={s.cancerIndex}>#{index + 1}</span>
          <div>
            <div style={s.cancerType}>{type}</div>
            <div style={s.cancerMeta}>
              {cancer.date_diagnostic ? fmtDate(cancer.date_diagnostic) : 'Date inconnue'}
              {cancer.tnm ? ` · TNM: ${cancer.tnm}` : ''}
            </div>
          </div>
        </div>
        <div style={s.cancerCardRight}>
          <StadeBadge stade={stade} />
          <div style={{ ...s.chevronWrap, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="#8A93A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div style={s.cancerBody}>
          <div style={s.cancerGrid}>
            <InfoRow label="Type" value={type} />
            <InfoRow label="Stade clinique" value={cancer.stade_clinique} />
            <InfoRow label="Stade pathologique" value={cancer.stade_pathologique} />
            <InfoRow label="TNM" value={cancer.tnm} accent />
            <InfoRow label="Grade" value={cancer.grade} />
            <InfoRow label="Date diagnostic" value={fmtDate(cancer.date_diagnostic)} />
          </div>

          {cancer.histology && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>
                <span style={s.subSectionDot} />
                Histologie
              </div>
              <div style={s.cancerGrid}>
                <InfoRow label="Type histologique" value={cancer.histology.type_histologique} />
                <InfoRow label="Grade histologique" value={cancer.histology.grade_histologique} />
                <InfoRow label="Marge chirurgicale" value={cancer.histology.marge_chirurgicale} />
                <InfoRow label="Envah. vasculaire" value={cancer.histology.envahissement_vasculaire === true ? 'Oui' : cancer.histology.envahissement_vasculaire === false ? 'Non' : '—'} />
                <InfoRow label="Envah. lymphatique" value={cancer.histology.envahissement_lymphatique === true ? 'Oui' : cancer.histology.envahissement_lymphatique === false ? 'Non' : '—'} />
                <InfoRow label="Date résultat" value={fmtDate(cancer.histology.date_resultat)} />
              </div>
            </>
          )}

          {cancer.treatments?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>
                <span style={s.subSectionDot} />
                Traitements
              </div>
              <div style={s.treatmentList}>
                {cancer.treatments.map((t, i) => (
                  <div key={i} style={s.treatmentItem}>
                    <div style={s.treatmentType}>{t.type_traitement}</div>
                    {t.protocole && <div style={s.treatmentProto}>{t.protocole}</div>}
                    <div style={s.treatmentDates}>
                      {t.date_debut && <span>Du {fmtDate(t.date_debut)}</span>}
                      {t.date_fin && <span> au {fmtDate(t.date_fin)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.biological_exams?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}><span style={s.subSectionDot} />Examens biologiques</div>
              <div style={s.examTable}>
                <div style={s.examTableHeader}>
                  <span>Analyse</span><span>Résultat</span><span>Date</span>
                </div>
                {cancer.biological_exams.map((e, i) => (
                  <div key={i} style={{ ...s.examRow, background: i % 2 === 0 ? '#FAFBFF' : '#fff' }}>
                    <span style={s.examName}>{e.type_analyse}</span>
                    <span style={s.examResult}>{e.resultat || '—'}</span>
                    <span style={s.examDate}>{fmtDate(e.date_analyse)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.imaging_exams?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}><span style={s.subSectionDot} />Imagerie</div>
              <div style={s.examTable}>
                <div style={s.examTableHeader}>
                  <span>Examen</span><span>Conclusion</span><span>Date</span>
                </div>
                {cancer.imaging_exams.map((e, i) => (
                  <div key={i} style={{ ...s.examRow, background: i % 2 === 0 ? '#FAFBFF' : '#fff' }}>
                    <span style={s.examName}>{e.type_examen}</span>
                    <span style={s.examResult}>{e.conclusion || '—'}</span>
                    <span style={s.examDate}>{fmtDate(e.date_examen)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.metastases?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}><span style={{ ...s.subSectionDot, background: '#C02B2B' }} />Métastases</div>
              <div style={s.metaList}>
                {cancer.metastases.map((m, i) => (
                  <div key={i} style={s.metaItem}>
                    <span style={s.metaOrgane}>{m.organe}</span>
                    {m.date_detection && <span style={s.metaDate}>Détectée le {fmtDate(m.date_detection)}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.follow_ups?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}><span style={s.subSectionDot} />Suivi</div>
              {cancer.follow_ups.map((f, i) => (
                <div key={i} style={s.followUpItem}>
                  <div style={s.followUpDate}>{fmtDate(f.date_visite)}</div>
                  <div style={s.followUpStatus}>{f.statut_clinique || '—'}</div>
                  {f.observation && <div style={s.followUpObs}>{f.observation}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Consultation Modal ────────────────────────────────────────────────────

function AddConsultationModal({ patientId, onClose, onSaved }) {
  const [form, setForm] = useState({ consultation_date: '', motif: '', compte_rendu: '', next_visit_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.consultation_date) { setError('La date est obligatoire.'); return; }
    setLoading(true);
    try {
      await apiFetch(`/patients/${patientId}/consultations/`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (e) {
      setError('Erreur lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modalBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalEyebrow}>NOUVELLE</div>
            <span style={s.modalTitle}>Consultation</span>
          </div>
          <button style={s.modalClose} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#8A93A8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div style={s.modalBody}>
          {error && <div style={s.modalError}>{error}</div>}
          <div style={s.modalField}>
            <label style={s.modalLabel}>Date *</label>
            <input type="date" style={s.modalInput} value={form.consultation_date}
              onChange={e => setForm(f => ({...f, consultation_date: e.target.value}))} />
          </div>
          <div style={s.modalField}>
            <label style={s.modalLabel}>Motif</label>
            <input type="text" style={s.modalInput} placeholder="Motif de la consultation"
              value={form.motif} onChange={e => setForm(f => ({...f, motif: e.target.value}))} />
          </div>
          <div style={s.modalField}>
            <label style={s.modalLabel}>Compte-rendu</label>
            <textarea style={{...s.modalInput, minHeight: 100, resize: 'vertical'}}
              placeholder="Observations, décisions…"
              value={form.compte_rendu}
              onChange={e => setForm(f => ({...f, compte_rendu: e.target.value}))} />
          </div>
          <div style={s.modalField}>
            <label style={s.modalLabel}>Prochain RDV</label>
            <input type="date" style={s.modalInput} value={form.next_visit_date}
              onChange={e => setForm(f => ({...f, next_visit_date: e.target.value}))} />
          </div>
        </div>
        <div style={s.modalFooter}>
          <button style={s.btnGhost} onClick={onClose}>Annuler</button>
          <button style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PatientDossier() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('apercu');
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/patients/${id}/`);
      if (data) setPatient(data);
    } catch {
      setError('Impossible de charger ce dossier.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  if (loading) return (
    <div style={s.loadingScreen}>
      <div style={s.loadingRing}>
        <div style={s.loadingInner} />
      </div>
      <div style={s.loadingText}>Chargement du dossier…</div>
    </div>
  );

  if (error || !patient) return (
    <div style={s.loadingScreen}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={s.loadingText}>{error || 'Dossier introuvable'}</div>
      <button style={{ ...s.btnPrimary, marginTop: 20 }} onClick={() => navigate('/dashboard')}>
        ← Retour au tableau de bord
      </button>
    </div>
  );

  const age = calcAge(patient.date_naissance);
  const dernierCancer = patient.cancers?.[0];
  const dernierStade = dernierCancer?.stade_clinique || dernierCancer?.stade_pathologique || null;

  const TABS = [
    { id: 'apercu',        label: 'Aperçu',      icon: '▤' },
    { id: 'cancers',       label: `Cancers`, count: patient.cancers?.length || 0, icon: '◈' },
    { id: 'consultations', label: `Consultations`, count: patient.consultations?.length || 0, icon: '◷' },
    { id: 'demandes',      label: `Examens`, count: patient.cancers?.reduce((a,c) => a + (c.demandes_examens?.length || 0), 0) || 0, icon: '⬡' },
  ];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #DDE1EC; border-radius: 99px; }
      `}</style>

      {toast && <div style={s.toast}>{toast}</div>}
      {showConsultModal && (
        <AddConsultationModal
          patientId={id}
          onClose={() => setShowConsultModal(false)}
          onSaved={() => { setShowConsultModal(false); load(); showToast('Consultation enregistrée avec succès'); }}
        />
      )}

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <button style={s.backBtn} onClick={() => navigate('/dashboard')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
                <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Retour
            </button>
            <div style={s.breadcrumb}>
              <span style={s.breadcrumbLink} onClick={() => navigate('/dashboard')}>Patients</span>
              <span style={s.breadcrumbSep}>/</span>
              <span style={s.breadcrumbCurrent}>{patient.first_name} {patient.last_name}</span>
            </div>
          </div>
          <div style={s.headerActions}>
            <button style={s.btnOutline} onClick={() => navigate(`/patient/${id}/edit`)}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6 }}>
                <path d="M9.5 1.5L11.5 3.5L4 11H2V9L9.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Modifier
            </button>
            <PatientQRCode patient={patient} />
          </div>
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <div style={s.heroSection}>
        <div style={s.heroCard}>
          {/* Left accent bar */}
          <div style={{ ...s.heroAccentBar, background: patient.sexe === 'M' ? 'linear-gradient(180deg, #1B3A7A, #2855B8)' : 'linear-gradient(180deg, #7A1B5A, #B82875)' }} />
          
          <div style={s.heroContent}>
            <div style={s.heroLeft}>
              <SexeAvatar sexe={patient.sexe} name={`${patient.first_name} ${patient.last_name}`} />
              <div style={s.heroInfo}>
                <div style={s.heroEyebrow}>Dossier Patient</div>
                <h1 style={s.heroName}>{patient.first_name} {patient.last_name}</h1>
                <div style={s.heroMeta}>
                  <span style={s.heroBadge}>{patient.sexe === 'M' ? '♂ Masculin' : '♀ Féminin'}</span>
                  {age !== null && <span style={s.heroBadge}>{age} ans</span>}
                  {patient.numero_dossier && (
                    <span style={{ ...s.heroBadge, ...s.dossierId }}>{patient.numero_dossier}</span>
                  )}
                </div>
                {dernierCancer && (
                  <div style={s.heroTags}>
                    <span style={s.heroTag}>{dernierCancer.cancer_type_name || 'Type inconnu'}</span>
                    {dernierStade && <StadeBadge stade={dernierStade} />}
                    {dernierCancer.tnm && (
                      <span style={s.tnmTag}>TNM: {dernierCancer.tnm}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={s.heroRight}>
              <div style={s.heroStat}>
                <div style={s.heroStatLabel}>Dernier RDV</div>
                <RdvPill date={dernierCancer?.date_diagnostic} />
              </div>
              <div style={s.heroStatDivider} />
              <div style={s.heroStat}>
                <div style={s.heroStatLabel}>Médecin référent</div>
                <div style={s.heroStatValue}>{patient.medecin_nom || '—'}</div>
              </div>
              <div style={s.heroStatDivider} />
              <div style={s.heroStat}>
                <div style={s.heroStatLabel}>Établissement</div>
                <div style={s.heroStatValue}>{patient.hospital_name || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div style={s.statsRow}>
        {[
          { label: 'Cancers', value: patient.cancers?.length || 0, color: '#C02B2B', icon: '◈' },
          { label: 'Consultations', value: patient.consultations?.length || 0, color: '#1B3A7A', icon: '◷' },
          { label: 'Traitements', value: patient.cancers?.reduce((acc, c) => acc + (c.treatments?.length || 0), 0) || 0, color: '#0A6B4A', icon: '⊕' },
          { label: 'Examens bio.', value: patient.cancers?.reduce((acc, c) => acc + (c.biological_exams?.length || 0), 0) || 0, color: '#8A4A00', icon: '⬡' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIcon, color }}>{icon}</div>
            <div style={{ ...s.statValue, color }}>{value}</div>
            <div style={s.statLabel}>{label}</div>
            <div style={s.statLine}>
              <div style={{ ...s.statLineFill, background: color, width: `${Math.min(100, value * 10)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={s.tabsWrap}>
        <div style={s.tabsBar}>
          {TABS.map(tab => (
            <button key={tab.id}
              style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}>
              <span style={s.tabIcon}>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ ...s.tabCount, ...(activeTab === tab.id ? s.tabCountActive : {}) }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={s.content}>

        {/* ══ APERÇU ══ */}
        {activeTab === 'apercu' && (
          <div style={s.twoColGrid}>
            <div style={s.colStack}>
              <SectionCard title="Informations personnelles" icon="🪪">
                <InfoRow label="Prénom" value={patient.first_name} />
                <InfoRow label="Nom" value={patient.last_name} />
                <InfoRow label="Date de naissance" value={`${fmtDate(patient.date_naissance)}${age !== null ? ` (${age} ans)` : ''}`} />
                <InfoRow label="Sexe" value={patient.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                <InfoRow label="NIN" value={patient.national_id} accent />
                <InfoRow label="Téléphone" value={patient.phone} />
                <InfoRow label="Email" value={patient.email} />
                <InfoRow label="Situation familiale" value={patient.situation_familiale} />
                <InfoRow label="Profession" value={patient.profession} />
              </SectionCard>

              <SectionCard title="Localisation" icon="📍">
                <InfoRow label="Wilaya" value={patient.wilaya_name} />
                <InfoRow label="Commune" value={patient.commune_name} />
                <InfoRow label="Adresse" value={patient.adresse} />
                <InfoRow label="Hôpital" value={patient.hospital_name} />
                <InfoRow label="Couverture sociale" value={patient.couverture_sociale} />
              </SectionCard>

              <SectionCard title="Informations administratives" icon="📂">
                <InfoRow label="N° dossier" value={patient.numero_dossier} accent />
                <InfoRow label="Source" value={patient.data_source === 'manual' ? 'Saisie manuelle' : patient.data_source} />
                <InfoRow label="Créé le" value={fmtDate(patient.created_at?.split('T')[0])} />
                <InfoRow label="Mis à jour" value={fmtDate(patient.updated_at?.split('T')[0])} />
                <InfoRow label="Médecin référent" value={patient.medecin_nom} />
                <InfoRow label="Fusionné" value={patient.is_merged ? 'Oui' : 'Non'} />
                {patient.is_merged && (
                  <InfoRow label="Patient fusionné vers" value={patient.merged_into_patient} />
                )}
              </SectionCard>

              <SectionCard title="Habitudes de vie" icon="🌿">
                {patient.habits?.length > 0 ? (
                  patient.habits.map((h, i) => (
                    <div key={i} style={s.habitRow}>
                      <div style={s.habitName}>{h.name}</div>
                      <div style={s.habitMeta}>{h.frequency || 'Fréquence inconnue'} · {h.duration_years ? `${h.duration_years} ans` : 'Durée inconnue'}</div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon="🌿" text="Aucune habitude de vie enregistrée." />
                )}
                {patient.risk_factors?.length > 0 && (
                  <div style={s.riskBox}>
                    <div style={s.riskTitle}>Facteurs de risque</div>
                    <div style={s.riskList}>{patient.risk_factors.map((r, i) => (
                      <span key={i} style={s.riskItem}>{r.name}</span>
                    ))}</div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Antécédents" icon="🧾">
                <InfoRow label="Allergies" value={patient.allergies} />
                <InfoRow label="Autres allergies" value={patient.autres_allergies} />
                <InfoRow label="Antécédents familiaux" value={Array.isArray(patient.antecedents_familiaux) ? patient.antecedents_familiaux.join(', ') : patient.antecedents_familiaux} />
                <InfoRow label="Antécédents familiaux (oui/non)" value={patient.antecedents_fam_yn} />
                <InfoRow label="Observations" value={patient.observations} />
              </SectionCard>

              <SectionCard title="Données de santé" icon="🩺">
                <InfoRow label="Poids" value={patient.poids ? `${patient.poids} kg` : ''} />
                <InfoRow label="Taille" value={patient.taille ? `${patient.taille} cm` : ''} />
                <InfoRow label="IMC" value={patient.imc} />
                <InfoRow label="Allergies" value={patient.allergies} />
                <InfoRow label="Autres allergies" value={patient.autres_allergies} />
                <InfoRow label="Antécédents familiaux" value={Array.isArray(patient.antecedents_familiaux) ? patient.antecedents_familiaux.join(', ') : patient.antecedents_familiaux} />
                <InfoRow label="Antécédents familiaux (oui/non)" value={patient.antecedents_fam_yn} />
                <InfoRow label="Observations" value={patient.observations} />
                <InfoRow label="Fusionné" value={patient.is_merged ? `Oui (${patient.merged_into_patient || 'Patient fusionné'})` : 'Non'} />
              </SectionCard>
            </div>

            <div style={s.colStack}>
              <SectionCard title="Antécédents" icon="🧾">
                <InfoRow label="Allergies" value={patient.allergies} />
                <InfoRow label="Autres allergies" value={patient.autres_allergies} />
                <InfoRow label="Antécédents familiaux" value={Array.isArray(patient.antecedents_familiaux) ? patient.antecedents_familiaux.join(', ') : patient.antecedents_familiaux} />
                <InfoRow label="Antécédents familiaux (oui/non)" value={patient.antecedents_fam_yn} />
                <InfoRow label="Observations" value={patient.observations} />
              </SectionCard>

              <SectionCard title="Données de santé" icon="🩺">
                <InfoRow label="Poids" value={patient.poids ? `${patient.poids} kg` : ''} />
                <InfoRow label="Taille" value={patient.taille ? `${patient.taille} cm` : ''} />
                <InfoRow label="IMC" value={patient.imc} />
                <InfoRow label="Allergies" value={patient.allergies} />
                <InfoRow label="Autres allergies" value={patient.autres_allergies} />
                <InfoRow label="Antécédents familiaux" value={Array.isArray(patient.antecedents_familiaux) ? patient.antecedents_familiaux.join(', ') : patient.antecedents_familiaux} />
                <InfoRow label="Antécédents familiaux (oui/non)" value={patient.antecedents_fam_yn} />
                <InfoRow label="Observations" value={patient.observations} />
                <InfoRow label="Fusionné" value={patient.is_merged ? `Oui (${patient.merged_into_patient || 'Patient fusionné'})` : 'Non'} />
              </SectionCard>

              {dernierCancer ? (
                <SectionCard title="Dernier cancer enregistré" icon="🎗"
                  action={
                    <button style={s.seeMoreBtn} onClick={() => setActiveTab('cancers')}>
                      Voir tous →
                    </button>
                  }>
                  <InfoRow label="Type" value={dernierCancer.cancer_type_name} />
                  <InfoRow label="Stade" value={dernierCancer.stade_clinique || dernierCancer.stade_pathologique} />
                  <InfoRow label="TNM" value={dernierCancer.tnm} accent />
                  <InfoRow label="Grade" value={dernierCancer.grade} />
                  <InfoRow label="Diagnostic" value={fmtDate(dernierCancer.date_diagnostic)} />
                  {dernierCancer.treatments?.length > 0 && (
                    <>
                      <Divider />
                      <div style={s.subSectionTitle}><span style={s.subSectionDot} />Traitement en cours</div>
                      <div style={s.treatmentItem}>
                        <div style={s.treatmentType}>{dernierCancer.treatments[0].type_traitement}</div>
                        {dernierCancer.treatments[0].protocole && (
                          <div style={s.treatmentProto}>{dernierCancer.treatments[0].protocole}</div>
                        )}
                      </div>
                    </>
                  )}
                </SectionCard>
              ) : (
                <SectionCard title="Cancer" icon="🎗">
                  <EmptyState icon="🎗" text="Aucun cancer enregistré pour ce patient." />
                </SectionCard>
              )}

              {patient.consultations?.length > 0 ? (
                <SectionCard title="Dernière consultation" icon="📅"
                  action={
                    <button style={s.seeMoreBtn} onClick={() => setActiveTab('consultations')}>
                      Voir toutes →
                    </button>
                  }>
                  <div style={s.consultItem}>
                    <div style={s.consultDate}>{fmtDate(patient.consultations[0].consultation_date)}</div>
                    {patient.consultations[0].motif && (
                      <div style={s.consultMotif}>{patient.consultations[0].motif}</div>
                    )}
                    {patient.consultations[0].compte_rendu && (
                      <div style={s.consultCR}>{patient.consultations[0].compte_rendu}</div>
                    )}
                    {patient.consultations[0].next_visit_date && (
                      <div style={s.nextVisit}>
                        Prochain RDV : <strong>{fmtDate(patient.consultations[0].next_visit_date)}</strong>
                      </div>
                    )}
                    <div style={s.consultMedecin}>{patient.consultations[0].user_name}</div>
                  </div>
                </SectionCard>
              ) : (
                <SectionCard title="Consultations" icon="📅">
                  <EmptyState icon="📅" text="Aucune consultation enregistrée." />
                  <button style={{ ...s.btnPrimary, marginTop: 14, width: '100%' }}
                    onClick={() => setShowConsultModal(true)}>
                    Ajouter une consultation
                  </button>
                </SectionCard>
              )}
            </div>
          </div>
        )}

        {/* ══ CANCERS ══ */}
        {activeTab === 'cancers' && (
          <div style={{ animation: 'fadeSlideIn 0.25s ease' }}>
            {patient.cancers?.length === 0 ? (
              <EmptyState icon="🎗" text="Aucun cancer enregistré pour ce patient." />
            ) : (
              patient.cancers.map((cancer, i) => (
                <CancerCard key={cancer.id} cancer={cancer} index={i} patientId={id} />
              ))
            )}
          </div>
        )}

        {/* ══ CONSULTATIONS ══ */}
        {activeTab === 'consultations' && (
          <div style={{ animation: 'fadeSlideIn 0.25s ease' }}>
            <div style={s.consultHeader}>
              <div>
                <div style={s.consultEyebrow}>HISTORIQUE</div>
                <span style={s.consultCount}>
                  {patient.consultations?.length || 0} consultation{patient.consultations?.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button style={s.btnPrimary} onClick={() => setShowConsultModal(true)}>
                + Nouvelle consultation
              </button>
            </div>

            {patient.consultations?.length === 0 ? (
              <EmptyState icon="📅" text="Aucune consultation enregistrée pour ce patient." />
            ) : (
              <div style={s.consultTimeline}>
                {patient.consultations.map((c, i) => (
                  <div key={c.id} style={s.timelineItem}>
                    <div style={s.timelineDot}>
                      <div style={s.timelineDotInner} />
                    </div>
                    {i < patient.consultations.length - 1 && <div style={s.timelineLine} />}
                    <div style={s.timelineCard}>
                      <div style={s.timelineCardHeader}>
                        <span style={s.timelineDate}>{fmtDate(c.consultation_date)}</span>
                        {c.motif && <span style={s.timelineMotif}>{c.motif}</span>}
                      </div>
                      {c.compte_rendu && (
                        <div style={s.timelineCR}>{c.compte_rendu}</div>
                      )}
                      <div style={s.timelineFooter}>
                        {c.next_visit_date && (
                          <span style={s.nextVisit}>
                            Prochain : {fmtDate(c.next_visit_date)}
                          </span>
                        )}
                        <span style={s.timelineMedecin}>{c.user_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ EXAMENS ══ */}
        {activeTab === 'demandes' && (
          <OngletDemandes patientId={id} cancers={patient.cancers || []} />
        )}

      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = {
  root: {
    minHeight: '100vh',
    background: '#F4F6FB',
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: 80,
  },

  // Loading
  loadingScreen: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 20,
    background: '#F4F6FB',
  },
  loadingRing: {
    width: 48, height: 48, borderRadius: '50%', position: 'relative',
    border: '2px solid #E8EBF4',
  },
  loadingInner: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    border: '2px solid transparent',
    borderTopColor: '#1B3A7A',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: 13, color: '#8A93A8', fontWeight: 500, letterSpacing: '0.02em' },

  // Toast
  toast: {
    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
    background: '#0F1D35', color: '#fff', padding: '14px 22px',
    borderRadius: 12, fontSize: 13, fontWeight: 500,
    boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
    animation: 'toastIn 0.3s ease',
    display: 'flex', alignItems: 'center', gap: 8,
    borderLeft: '3px solid #4A9CF7',
  },

  // Header
  header: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #E8EBF4',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    maxWidth: 1120, margin: '0 auto', padding: '0 32px',
    height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  backBtn: {
    display: 'flex', alignItems: 'center',
    padding: '7px 14px', borderRadius: 8,
    border: '1px solid #E8EBF4', background: '#fff',
    color: '#5A6478', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.01em',
    transition: 'all 0.15s',
  },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8A93A8' },
  breadcrumbLink: { cursor: 'pointer', color: '#1B3A7A', fontWeight: 600 },
  breadcrumbSep: { color: '#C8CEDE', fontSize: 11 },
  breadcrumbCurrent: { color: '#1A1F2E', fontWeight: 600 },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center' },

  // Hero
  heroSection: { maxWidth: 1120, margin: '28px auto 0', padding: '0 32px' },
  heroCard: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #E8EBF4',
    boxShadow: '0 4px 24px rgba(27,58,122,0.06)',
    overflow: 'hidden',
    display: 'flex',
    animation: 'fadeSlideIn 0.3s ease',
  },
  heroAccentBar: {
    width: 4, flexShrink: 0,
  },
  heroContent: {
    flex: 1, padding: '28px 32px',
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 28,
  },
  heroLeft: { display: 'flex', alignItems: 'flex-start', gap: 20, flex: 1 },
  avatar: {
    width: 68, height: 68, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  avatarInitials: {
    fontFamily: "'Lora', serif", fontWeight: 700,
    fontSize: 22, color: '#fff', letterSpacing: '0.02em',
  },
  heroInfo: { flex: 1 },
  heroEyebrow: {
    fontSize: 10, fontWeight: 700, color: '#8A93A8',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroName: {
    fontFamily: "'Lora', serif", fontWeight: 700,
    fontSize: 24, color: '#0F1D35', margin: '0 0 10px',
    letterSpacing: '-0.02em',
  },
  heroMeta: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  heroBadge: {
    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
    background: '#F4F6FB', color: '#5A6478',
    border: '1px solid #E8EBF4',
  },
  dossierId: {
    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
    background: '#0F1D35', color: '#fff', border: 'none', fontWeight: 600,
  },
  heroTags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  heroTag: {
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    background: '#EEF2FF', color: '#1B3A7A', border: '1px solid rgba(27,58,122,0.12)',
  },
  tnmTag: {
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
    background: '#F0F9FF', color: '#0369A1', fontFamily: "'DM Sans', sans-serif",
    border: '1px solid rgba(3,105,161,0.15)',
  },
  heroRight: {
    display: 'flex', flexDirection: 'column', gap: 16,
    borderLeft: '1px solid #E8EBF4', paddingLeft: 32, minWidth: 230,
  },
  heroStat: {},
  heroStatLabel: {
    fontSize: 10, fontWeight: 700, color: '#8A93A8',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5,
  },
  heroStatValue: { fontSize: 13, fontWeight: 600, color: '#1A1F2E' },
  heroStatDivider: { height: 1, background: '#F0F2F9' },

  // RDV pill
  rdvPill: {
    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: '1px solid transparent',
  },
  rdvDot: { width: 6, height: 6, borderRadius: '50%' },
  rdvNone: { fontSize: 12, color: '#C8CEDE', fontWeight: 500 },

  // Stade badge
  stadeBadge: {
    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    border: '1px solid transparent', letterSpacing: '0.03em',
  },
  emptyBadge: { color: '#C8CEDE', fontSize: 12 },

  // Stats row
  statsRow: {
    maxWidth: 1120, margin: '16px auto 0', padding: '0 32px',
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
  },
  statCard: {
    background: '#fff', borderRadius: 12, border: '1px solid #E8EBF4',
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(27,58,122,0.04)',
    position: 'relative', overflow: 'hidden',
  },
  statIcon: { fontSize: 18, marginBottom: 8, display: 'block' },
  statValue: {
    fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 28,
    lineHeight: 1, marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: '#8A93A8', fontWeight: 500, marginBottom: 14, letterSpacing: '0.02em' },
  statLine: { height: 2, background: '#F0F2F9', borderRadius: 2, overflow: 'hidden' },
  statLineFill: { height: '100%', borderRadius: 2, transition: 'width 0.6s ease' },

  // Tabs
  tabsWrap: {
    maxWidth: 1120, margin: '24px auto 0', padding: '0 32px',
  },
  tabsBar: {
    display: 'flex', gap: 2,
    borderBottom: '1px solid #E8EBF4',
  },
  tab: {
    padding: '11px 20px',
    border: 'none', borderBottom: '2px solid transparent',
    background: 'transparent', fontSize: 13, fontWeight: 500,
    color: '#8A93A8', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7,
    marginBottom: -1,
    letterSpacing: '0.01em',
  },
  tabActive: {
    color: '#1B3A7A', fontWeight: 700,
    borderBottom: '2px solid #1B3A7A',
  },
  tabIcon: { fontSize: 14, opacity: 0.7 },
  tabCount: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 18, height: 18, borderRadius: 5, fontSize: 10, fontWeight: 700,
    background: '#F0F2F9', color: '#8A93A8', padding: '0 5px',
  },
  tabCountActive: { background: '#EEF2FF', color: '#1B3A7A' },

  // Content
  content: { maxWidth: 1120, margin: '0 auto', padding: '24px 32px', animation: 'fadeSlideIn 0.25s ease' },
  twoColGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  colStack: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Section card
  sectionCard: {
    background: '#fff', borderRadius: 12, border: '1px solid #E8EBF4',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(27,58,122,0.04)',
  },
  sectionCardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #F0F2F9',
  },
  sectionCardTitle: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    fontSize: 13, color: '#0F1D35',
  },
  sectionIconWrap: { fontSize: 14, lineHeight: 1 },
  sectionCardBody: { padding: '14px 20px' },
  seeMoreBtn: {
    fontSize: 11, fontWeight: 600, color: '#1B3A7A',
    background: '#EEF2FF', border: 'none', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", padding: '5px 12px', borderRadius: 6,
  },

  // Info rows
  infoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 0', borderBottom: '1px solid #F7F8FC',
    fontSize: 13,
  },
  infoLabel: { color: '#8A93A8', fontWeight: 500, fontSize: 12 },
  infoValue: { fontWeight: 600, color: '#1A1F2E', textAlign: 'right', maxWidth: '60%', fontSize: 13 },
  emptyText: { color: '#C8CEDE', fontWeight: 500, fontStyle: 'italic' },
  habitRow: {
    padding: '12px 0', borderBottom: '1px solid #F7F8FC',
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  habitName: { fontWeight: 600, color: '#1A1F2E', fontSize: 13 },
  habitMeta: { fontSize: 12, color: '#8A93A8' },
  riskBox: {
    marginTop: 14, padding: 14, background: '#FAFBFF',
    borderRadius: 10, border: '1px solid #E8EBF4',
  },
  riskTitle: { fontSize: 11, fontWeight: 700, color: '#1A1F2E', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' },
  riskList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  riskItem: {
    padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
    background: '#EEF2FF', color: '#1B3A7A', border: '1px solid rgba(27,58,122,0.1)',
  },
  divider: { height: 1, background: '#F0F2F9', margin: '16px 0' },
  subSectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#5A6478',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  subSectionDot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: '#1B3A7A', flexShrink: 0,
  },

  // Cancer cards
  cancerCard: {
    background: '#fff', borderRadius: 12, border: '1px solid #E8EBF4',
    marginBottom: 12, overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(27,58,122,0.04)',
    transition: 'box-shadow 0.2s ease',
  },
  cancerCardOpen: {
    boxShadow: '0 4px 20px rgba(27,58,122,0.1)',
    borderColor: 'rgba(27,58,122,0.15)',
  },
  cancerCardToggle: {
    width: '100%', padding: '18px 22px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  cancerCardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  cancerIndex: {
    width: 30, height: 30, borderRadius: 8,
    background: '#EEF2FF', color: '#1B3A7A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
    fontFamily: "'Lora', serif",
  },
  cancerType: { fontWeight: 700, fontSize: 14, color: '#0F1D35', textAlign: 'left' },
  cancerMeta: { fontSize: 12, color: '#8A93A8', fontWeight: 500, textAlign: 'left', marginTop: 2 },
  cancerCardRight: { display: 'flex', alignItems: 'center', gap: 10 },
  chevronWrap: {
    width: 28, height: 28, borderRadius: 6, background: '#F4F6FB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s ease',
  },
  cancerBody: { padding: '20px 22px', borderTop: '1px solid #F0F2F9' },
  cancerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' },

  // Treatments
  treatmentList: { display: 'flex', flexDirection: 'column', gap: 8 },
  treatmentItem: {
    padding: '12px 16px', borderRadius: 8,
    background: '#FAFBFF', border: '1px solid #E8EBF4',
  },
  treatmentType: { fontSize: 13, fontWeight: 700, color: '#0F1D35' },
  treatmentProto: { fontSize: 12, color: '#8A93A8', marginTop: 3 },
  treatmentDates: { fontSize: 11, color: '#8A93A8', marginTop: 5, fontWeight: 500 },

  // Exam table
  examTable: { borderRadius: 8, overflow: 'hidden', border: '1px solid #E8EBF4' },
  examTableHeader: {
    display: 'grid', gridTemplateColumns: '1fr 1fr auto',
    background: '#F4F6FB', padding: '9px 16px',
    fontSize: 10, fontWeight: 700, color: '#8A93A8',
    textTransform: 'uppercase', letterSpacing: '0.08em', gap: 12,
  },
  examRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr auto',
    padding: '10px 16px', fontSize: 13, gap: 12,
    borderTop: '1px solid #F0F2F9',
    alignItems: 'center',
  },
  examName: { fontWeight: 600, color: '#1A1F2E' },
  examResult: { color: '#5A6478', fontWeight: 500 },
  examDate: { color: '#8A93A8', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' },

  // Metastasis
  metaList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaItem: {
    padding: '7px 14px', borderRadius: 8,
    background: 'rgba(192,43,43,0.05)', border: '1px solid rgba(192,43,43,0.15)',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  metaOrgane: { fontSize: 13, fontWeight: 600, color: '#C02B2B' },
  metaDate: { fontSize: 11, color: '#8A93A8' },

  // Follow up
  followUpItem: {
    padding: '12px 16px', borderRadius: 8,
    background: '#FAFBFF', border: '1px solid #E8EBF4', marginBottom: 8,
  },
  followUpDate: { fontSize: 11, fontWeight: 700, color: '#1B3A7A', marginBottom: 3, letterSpacing: '0.02em' },
  followUpStatus: { fontSize: 13, fontWeight: 600, color: '#1A1F2E' },
  followUpObs: { fontSize: 12, color: '#8A93A8', marginTop: 5, lineHeight: 1.5 },

  // Empty state
  emptyState: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '22px 0', color: '#8A93A8',
  },
  emptyStateIcon: { fontSize: 22, opacity: 0.5 },
  emptyStateText: { fontSize: 13, fontWeight: 500 },

  // Consultation
  consultHeader: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 24,
  },
  consultEyebrow: {
    fontSize: 10, fontWeight: 700, color: '#8A93A8',
    letterSpacing: '0.12em', marginBottom: 3,
  },
  consultCount: {
    fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 18, color: '#0F1D35',
  },
  consultItem: {},
  consultDate: {
    fontSize: 12, fontWeight: 700, color: '#1B3A7A',
    marginBottom: 4, letterSpacing: '0.02em',
  },
  consultMotif: { fontSize: 14, fontWeight: 600, color: '#1A1F2E', marginBottom: 8 },
  consultCR: { fontSize: 13, color: '#5A6478', lineHeight: 1.7, marginBottom: 10 },
  nextVisit: {
    fontSize: 12, color: '#0A6B4A', fontWeight: 600,
    padding: '4px 10px', background: 'rgba(10,107,74,0.06)',
    borderRadius: 6, display: 'inline-block',
    border: '1px solid rgba(10,107,74,0.15)',
  },
  consultMedecin: { fontSize: 11, color: '#8A93A8', fontWeight: 500, marginTop: 8 },

  // Timeline
  consultTimeline: { position: 'relative', paddingLeft: 30 },
  timelineItem: { position: 'relative', marginBottom: 20 },
  timelineDot: {
    position: 'absolute', left: -30, top: 18,
    width: 14, height: 14, borderRadius: '50%',
    background: '#fff', border: '2px solid #1B3A7A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  timelineDotInner: {
    width: 5, height: 5, borderRadius: '50%', background: '#1B3A7A',
  },
  timelineLine: {
    position: 'absolute', left: -24, top: 32,
    width: 1, height: 'calc(100% + 20px)',
    background: '#E8EBF4',
  },
  timelineCard: {
    background: '#fff', borderRadius: 12, border: '1px solid #E8EBF4',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(27,58,122,0.04)',
  },
  timelineCardHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  timelineDate: {
    fontFamily: "'Lora', serif", fontWeight: 600,
    fontSize: 13, color: '#1B3A7A',
  },
  timelineMotif: {
    padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
    background: '#EEF2FF', color: '#1B3A7A',
  },
  timelineCR: {
    fontSize: 13, color: '#5A6478', lineHeight: 1.7, marginBottom: 12,
  },
  timelineFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid #F0F2F9', paddingTop: 10,
  },
  timelineMedecin: { fontSize: 11, color: '#8A93A8', fontWeight: 500 },

  // Modal
  modalBackdrop: {
    position: 'fixed', inset: 0, background: 'rgba(8,18,40,0.5)',
    backdropFilter: 'blur(8px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500,
    boxShadow: '0 32px 80px rgba(0,0,0,0.2)', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    border: '1px solid #E8EBF4',
    animation: 'fadeSlideIn 0.2s ease',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 24px', borderBottom: '1px solid #F0F2F9',
  },
  modalEyebrow: {
    fontSize: 10, fontWeight: 700, color: '#8A93A8',
    letterSpacing: '0.12em', marginBottom: 2,
  },
  modalTitle: {
    fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 18, color: '#0F1D35',
  },
  modalClose: {
    width: 32, height: 32, borderRadius: 8, border: '1px solid #E8EBF4',
    background: '#F4F6FB', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: '22px 24px', overflowY: 'auto', flex: 1 },
  modalError: {
    background: 'rgba(192,43,43,0.05)', border: '1px solid rgba(192,43,43,0.2)',
    borderRadius: 8, padding: '11px 16px', fontSize: 13,
    color: '#C02B2B', fontWeight: 500, marginBottom: 16,
  },
  modalField: { marginBottom: 16 },
  modalLabel: {
    fontSize: 11, fontWeight: 700, color: '#5A6478',
    display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  modalInput: {
    width: '100%', background: '#F7F8FC', border: '1.5px solid #E8EBF4',
    borderRadius: 10, padding: '11px 14px', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", color: '#1A1F2E', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  modalFooter: {
    display: 'flex', gap: 10, padding: '18px 24px',
    borderTop: '1px solid #F0F2F9', justifyContent: 'flex-end',
  },

  // Buttons
  btnPrimary: {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    background: '#1B3A7A',
    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.01em',
    transition: 'opacity 0.15s',
  },
  btnGhost: {
    padding: '10px 18px', borderRadius: 8,
    border: '1.5px solid #E8EBF4', background: '#F7F8FC',
    color: '#5A6478', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  btnOutline: {
    display: 'flex', alignItems: 'center',
    padding: '8px 16px', borderRadius: 8,
    border: '1.5px solid #E8EBF4', background: '#fff',
    color: '#5A6478', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
};