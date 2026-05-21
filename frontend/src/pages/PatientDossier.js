import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OngletDemandes } from './DemandeExamen';
import PatientQRSection from '../components/PatientQRSection';

const API = `http://${window.location.hostname}:8000/api`;

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

function formatCancerStatus(status) {
  if (!status) return '—';
  const text = String(status).trim();
  return text || '—';
}

function computePatientOutcome(patient) {
  if (patient.death) {
    return {
      label: 'Décédé',
      value: patient.death.cause_principale
        ? `${fmtDate(patient.death.date_death)} · ${patient.death.cause_principale}`
        : fmtDate(patient.death.date_death),
      color: '#dc2626',
    };
  }

  const statusEntries = (patient.cancers || []).flatMap(cancer =>
    (cancer.status_history || []).map(entry => ({
      ...entry,
      cancer_type_name: cancer.cancer_type_name || cancer.cancer_type?.name || 'Cancer',
    }))
  );

  statusEntries.sort((a, b) => (a.status_date || '').localeCompare(b.status_date || ''));
  const latest = statusEntries[statusEntries.length - 1];
  const latestStatus = latest ? String(latest.status || '').toLowerCase() : '';

  if ((patient.cancers || []).some(c => c.recidive)) {
    return {
      label: 'Récidive',
      value: latest ? `${formatCancerStatus(latest.status)} · ${fmtDate(latest.status_date)}` : 'Récidive documentée',
      color: '#d97706',
    };
  }

  if (latestStatus.match(/gu[eé]ri|r[ée]mission|rc|complet|complet/)) {
    return {
      label: 'Guéri',
      value: latest ? `${formatCancerStatus(latest.status)} · ${fmtDate(latest.status_date)}` : 'Guéri',
      color: '#059669',
    };
  }

  if (latestStatus.match(/progress|en cours|stable|évolu|reprise|rechute|récid/)) {
    return {
      label: 'En traitement / Suivi',
      value: latest ? `${formatCancerStatus(latest.status)} · ${fmtDate(latest.status_date)}` : 'En suivi actif',
      color: '#4A6CF7',
    };
  }

  if (latest) {
    return {
      label: 'Statut récent',
      value: `${formatCancerStatus(latest.status)} · ${fmtDate(latest.status_date)}`,
      color: '#4A6CF7',
    };
  }

  return {
    label: 'Sans données',
    value: 'Aucun statut tumoral enregistré',
    color: '#64748B',
  };
}

function RdvPill({ date }) {
  if (!date || date === '—') return <span style={s.rdvNone}>Aucun RDV</span>;
  const d = daysSince(date);
  let color, bg;
  if (d === 0)      { color = '#059669'; bg = '#d1fae5'; }
  else if (d <= 7)  { color = '#059669'; bg = '#d1fae5'; }
  else if (d <= 30) { color = '#d97706'; bg = '#fef3c7'; }
  else if (d <= 90) { color = '#ea580c'; bg = '#ffedd5'; }
  else              { color = '#dc2626'; bg = '#fee2e2'; }
  const label = d === 0 ? "Aujourd'hui" : d <= 30 ? `${d}j` : `${Math.floor(d/30)} mois`;
  return <span style={{ ...s.rdvPill, color, background: bg }}>● {fmtDate(date)} · {label}</span>;
}

function StadeBadge({ stade }) {
  if (!stade || stade === '—') return <span style={s.emptyBadge}>—</span>;
  const colors = {
    I:   { color: '#059669', bg: '#d1fae5' },
    II:  { color: '#d97706', bg: '#fef3c7' },
    III: { color: '#ea580c', bg: '#ffedd5' },
    IV:  { color: '#dc2626', bg: '#fee2e2' },
  };
  const c = colors[stade] || { color: '#6b7280', bg: '#f3f4f6' };
  return <span style={{ ...s.stadeBadge, color: c.color, background: c.bg }}>Stade {stade}</span>;
}

const TREATMENT_TYPES = [
  { id:'chimio', label:'Chimiothérapie' },
  { id:'radio', label:'Radiothérapie' },
  { id:'chirurgie', label:'Chirurgie' },
  { id:'hormono', label:'Hormonothérapie' },
  { id:'immuno', label:'Immunothérapie' },
  { id:'targeted', label:'Thérapie ciblée' },
];
const TREATMENT_INTENTIONS = [
  { value:'curatif', label:'Curatif' },
  { value:'adjuvant', label:'Adjuvant' },
  { value:'neo_adjuvant', label:'Néo-adjuvant' },
  { value:'palliatif', label:'Palliatif' },
  { value:'prophylactique', label:'Prophylactique' },
];
const TREATMENT_STATUTS = [
  { value:'planifie', label:'Planifié' },
  { value:'en_cours', label:'En cours' },
  { value:'termine', label:'Terminé' },
  { value:'pause', label:'Pause' },
  { value:'suspendu', label:'Suspendu' },
  { value:'abandonne', label:'Abandonné' },
];
const TREATMENT_VOIES = ['IV (intraveineux)','PO (oral)','SC (sous-cutané)','IM (intramusculaire)','Topique','Intra-thécale','Intra-artérielle','Autre'];
const TREATMENT_JOURS = ['J1','J2','J3','J5','J7','J8','J14','J15','J21','J28'];
const TREATMENT_RESPONSES = [
  { value:'RC', label:'RC — Rémission complète' },
  { value:'RP', label:'RP — Rémission partielle' },
  { value:'SD', label:'SD — Stabilisation' },
  { value:'PD', label:'PD — Progression' },
  { value:'NE', label:'NE — Non évaluable' },
];
const TREATMENT_TOXICITIES = ['Grade 0','Grade 1 — Léger','Grade 2 — Modéré','Grade 3 — Sévère','Grade 4 — Vital','Grade 5 — Décès'];

function SexeAvatar({ sexe, name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const isMale = sexe === 'M';
  return (
    <div style={{ ...s.avatar, background: isMale ? '#dbeafe' : '#fce7f3', color: isMale ? '#1d4ed8' : '#be185d' }}>
      {initials}
    </div>
  );
}

function Divider() { return <div style={s.divider} />; }

function InfoRow({ label, value, accent }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={{ ...s.infoValue, color: accent ? 'var(--primary)' : 'inherit' }}>
        {value || <span style={s.emptyText}>—</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionCardHeader}>
        <div style={s.sectionCardTitle}><span style={s.sectionIcon}>{icon}</span>{title}</div>
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

function FormSubmissionsSection({ patientId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/patients/${patientId}/form-submissions/`)
      .then(data => { if (data) setSubmissions(data); })
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div style={{ fontSize: 12, color: '#94A3B8', padding: '8px 0' }}>Chargement…</div>;
  if (submissions.length === 0) return <EmptyState icon="📋" text="Aucune réponse reçue via le formulaire QR." />;

  const latest = submissions[0];
  const d = latest.submitted_data || {};

  const LABELS = {
    telephone: 'Téléphone', wilaya: 'Wilaya', commune: 'Commune',
    hopital: 'Hôpital', profession: 'Profession',
    poids: 'Poids (kg)', taille: 'Taille (cm)',
    sport: 'Activité physique', tabac: 'Tabagisme',
    alcool: 'Alcool', allergies: 'Allergies',
    antecedents: 'Antécédents familiaux', observations: 'Observations',
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 10 }}>
        Dernière réponse : {new Date(latest.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        {submissions.length > 1 && <span style={{ marginLeft: 8, color: '#6366f1' }}>({submissions.length} réponses au total)</span>}
      </div>
      {Object.entries(LABELS).map(([key, label]) => d[key] ? <InfoRow key={key} label={label} value={d[key]} /> : null)}
    </div>
  );
}

function CancerCard({ cancer, index, patientId, onAddTreatment }) {
  const [open, setOpen] = useState(index === 0);
  const type = cancer.cancer_type_name || '—';
  const stade = cancer.stade_clinique || cancer.stade_pathologique || '—';

  return (
    <div style={s.cancerCard}>
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
          <span style={s.chevron}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={s.cancerBody}>
          <div style={s.cancerActions}>
            <button style={s.cancerActionBtn} onClick={() => onAddTreatment?.(cancer.id)}>➕ Ajouter un traitement</button>
          </div>
          <div style={s.cancerGrid}>
            <InfoRow label="Type" value={type} />
            <InfoRow label="Stade clinique" value={cancer.stade_clinique} />
            <InfoRow label="Stade pathologique" value={cancer.stade_pathologique} />
            <InfoRow label="TNM" value={cancer.tnm} accent />
            <InfoRow label="Grade" value={cancer.grade} />
            <InfoRow label="Date diagnostic" value={fmtDate(cancer.date_diagnostic)} />
          </div>

          <Divider />
          <div style={s.subSectionTitle}>🩺 Détails du diagnostic</div>
          <div style={s.cancerGrid}>
            <InfoRow label="Type de tumeur" value={cancer.type_tumeur || '—'} />
            <InfoRow label="Sous-type" value={cancer.sous_type || '—'} />
            <InfoRow label="CIM10" value={cancer.cim10_code || '—'} />
            <InfoRow label="Service diagnostique" value={cancer.service_diag || '—'} />
            <InfoRow label="Médecin diagnostique" value={cancer.medecin_diag || '—'} />
            <InfoRow label="Établissement" value={cancer.etablissement_diag || '—'} />
          </div>

          <Divider />
          <div style={s.subSectionTitle}>📊 Statut tumoral</div>
          <div style={s.cancerGrid}>
            <InfoRow label="Localisé" value={cancer.localise ? 'Oui' : 'Non'} />
            <InfoRow label="Métastatique" value={cancer.metastatique ? 'Oui' : 'Non'} />
            <InfoRow label="Récidive" value={cancer.recidive ? 'Oui' : 'Non'} />
            <InfoRow label="Sites métastatiques" value={(cancer.sites_metastatiques || []).join(', ') || '—'} />
            <InfoRow label="Récepteurs ER" value={cancer.recepteur_er || '—'} />
            <InfoRow label="Récepteurs PR" value={cancer.recepteur_pr || '—'} />
          </div>
          <div style={s.cancerGrid}>
            <InfoRow label="HER2" value={cancer.her2 || '—'} />
            <InfoRow label="Triple négatif" value={cancer.triple_negatif ? 'Oui' : 'Non'} />
            <InfoRow label="Taille tumorale" value={cancer.taille_tumorale ? `${cancer.taille_tumorale} cm` : '—'} />
            <InfoRow label="Ganglions envahis" value={cancer.ganglions_envahis ?? '—'} />
            <InfoRow label="Base diagnostic" value={(Array.isArray(cancer.base_diagnostic) ? cancer.base_diagnostic.join(', ') : cancer.base_diagnostic) || '—'} />
          </div>

          {cancer.custom_values?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>🎛️ Champs personnalisés</div>
              <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
                {cancer.custom_values.map((cv, i) => (
                  <div key={cv.id || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E8EDF5' }}>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>{cv.field_label || cv.field_name}</span>
                    <span style={{ color: '#1F2937', fontWeight: 600, textAlign: 'right', minWidth: 120 }}>{cv.value || '—'}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.histology && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>🔬 Histologie</div>
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

          {(cancer.status_history?.length || 0) > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>📈 Suivi du statut tumoral</div>
              <div style={s.statusTimeline}>
                {(cancer.status_history || []).slice().sort((a, b) => (a.status_date || '').localeCompare(b.status_date || '')).map((status, idx) => (
                  <div key={idx} style={s.statusItem}>
                    <div style={s.statusDate}>{fmtDate(status.status_date)}</div>
                    <div style={s.statusText}>{status.status}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.treatments?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>💊 Traitements</div>
              <div style={s.treatmentList}>
                {cancer.treatments.map((t, i) => (
                  <div key={i} style={s.treatmentItem}>
                    <div style={s.treatmentHeader}>
                      <div style={s.treatmentType}>{t.type_traitement_display || t.type_traitement}</div>
                      <div style={s.treatmentMeta}>
                        {t.intention_display || '—'} · {t.statut_display || '—'}{t.ligne ? ` · ${t.ligne}` : ''}
                      </div>
                    </div>
                    {t.protocole && <div style={s.treatmentProto}>{t.protocole}</div>}
                    {t.medicaments && <div style={s.treatmentDetail}><strong>Médicaments:</strong> {t.medicaments}</div>}
                    {(t.voie_administration || (t.jours_administration?.length || 0) > 0) && (
                      <div style={s.treatmentDetail}>
                        {t.voie_administration && <span>Voie: {t.voie_administration}</span>}
                        {t.jours_administration?.length > 0 && <span style={s.detailSeparator}>Jours: {t.jours_administration.join(', ')}</span>}
                      </div>
                    )}
                    {(t.cycles_prevus || t.cycles_realises) && (
                      <div style={s.treatmentDetail}>Cycles: {t.cycles_realises || '0'} / {t.cycles_prevus || '—'}</div>
                    )}
                    {(t.date_debut || t.date_fin) && (
                      <div style={s.treatmentDates}>Du {fmtDate(t.date_debut)}{t.date_fin ? ` au ${fmtDate(t.date_fin)}` : ''}</div>
                    )}
                    {(t.reponse_display || t.grade_toxicite) && (
                      <div style={s.treatmentDetail}>
                        <strong>Réponse:</strong> {t.reponse_display || '—'}{t.grade_toxicite ? ` · Toxicité: ${t.grade_toxicite}` : ''}
                      </div>
                    )}
                    {t.description_toxicite && <div style={s.treatmentDetail}><strong>Toxicité:</strong> {t.description_toxicite}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {cancer.biological_exams?.length > 0 && (
            <>
              <Divider />
              <div style={s.subSectionTitle}>🧪 Examens biologiques</div>
              <div style={s.examTable}>
                <div style={s.examTableHeader}><span>Analyse</span><span>Résultat</span><span>Date</span></div>
                {cancer.biological_exams.map((e, i) => (
                  <div key={i} style={s.examRow}>
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
              <div style={s.subSectionTitle}>🏥 Imagerie</div>
              <div style={s.examTable}>
                <div style={s.examTableHeader}><span>Examen</span><span>Conclusion</span><span>Date</span></div>
                {cancer.imaging_exams.map((e, i) => (
                  <div key={i} style={s.examRow}>
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
              <div style={s.subSectionTitle}>⚠️ Métastases</div>
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
              <div style={s.subSectionTitle}>📅 Suivi</div>
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

function AddConsultationModal({ patientId, onClose, onSaved }) {
  const [form, setForm] = useState({ consultation_date: '', motif: '', compte_rendu: '', next_visit_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.consultation_date) { setError('La date est obligatoire.'); return; }
    setLoading(true);
    try {
      await apiFetch(`/patients/${patientId}/consultations/`, { method: 'POST', body: JSON.stringify(form) });
      onSaved();
    } catch { setError('Erreur lors de l\'enregistrement.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.modalBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>➕ Nouvelle consultation</span>
          <button style={s.modalClose} onClick={onClose}>✕</button>
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
            <textarea style={{...s.modalInput, minHeight: 100, resize: 'vertical'}} placeholder="Observations, décisions…" value={form.compte_rendu}
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
            {loading ? 'Enregistrement…' : '✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTreatmentModal({ patientId, cancerId, form, onChange, onClose, onSubmit, loading, error }) {
  return (
    <div style={s.modalBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalLarge}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>➕ Ajouter un traitement</span>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          {error && <div style={s.modalError}>{error}</div>}
          <div style={s.modalFieldRow}>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Type de traitement</label>
              <select style={s.modalInput} value={form.type_traitement} onChange={e => onChange('type_traitement', e.target.value)}>
                {TREATMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Intention</label>
              <select style={s.modalInput} value={form.intention} onChange={e => onChange('intention', e.target.value)}>
                <option value="">—</option>
                {TREATMENT_INTENTIONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          </div>
          <div style={s.modalFieldRow}>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Statut</label>
              <select style={s.modalInput} value={form.statut} onChange={e => onChange('statut', e.target.value)}>
                {TREATMENT_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Ligne de traitement</label>
              <input style={s.modalInput} type="text" value={form.ligne} onChange={e => onChange('ligne', e.target.value)} placeholder="ex: 1ère ligne" />
            </div>
          </div>
          <div style={s.modalField}>
            <label style={s.modalLabel}>Protocole</label>
            <input style={s.modalInput} type="text" value={form.protocole} onChange={e => onChange('protocole', e.target.value)} placeholder="ex: FOLFOX" />
          </div>
          <div style={s.modalField}>
            <label style={s.modalLabel}>Médicaments</label>
            <input style={s.modalInput} type="text" value={form.medicaments} onChange={e => onChange('medicaments', e.target.value)} placeholder="ex: Doxorubicine, Cyclophosphamide" />
          </div>
          <div style={s.modalFieldRow}>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Voie d'administration</label>
              <select style={s.modalInput} value={form.voie_administration} onChange={e => onChange('voie_administration', e.target.value)}>
                <option value="">—</option>
                {TREATMENT_VOIES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Jours d'administration</label>
              <input style={s.modalInput} type="text" value={(Array.isArray(form.jours_administration) ? form.jours_administration.join(', ') : form.jours_administration)} onChange={e => onChange('jours_administration', e.target.value)} placeholder="ex: J1, J8, J15" />
            </div>
          </div>
          <div style={s.modalFieldRow}>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Date de début</label>
              <input style={s.modalInput} type="date" value={form.date_debut} onChange={e => onChange('date_debut', e.target.value)} />
            </div>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Date de fin</label>
              <input style={s.modalInput} type="date" value={form.date_fin} onChange={e => onChange('date_fin', e.target.value)} />
            </div>
          </div>
          <div style={s.modalFieldRow}>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Cycles prévus</label>
              <input style={s.modalInput} type="number" min="0" value={form.cycles_prevus} onChange={e => onChange('cycles_prevus', e.target.value)} />
            </div>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Cycles réalisés</label>
              <input style={s.modalInput} type="number" min="0" value={form.cycles_realises} onChange={e => onChange('cycles_realises', e.target.value)} />
            </div>
          </div>
          <div style={s.modalFieldRow}>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Réponse tumorale</label>
              <select style={s.modalInput} value={form.reponse_tumorale} onChange={e => onChange('reponse_tumorale', e.target.value)}>
                <option value="">—</option>
                {TREATMENT_RESPONSES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={s.modalFieldHalf}>
              <label style={s.modalLabel}>Grade de toxicité</label>
              <select style={s.modalInput} value={form.grade_toxicite} onChange={e => onChange('grade_toxicite', e.target.value)}>
                <option value="">—</option>
                {TREATMENT_TOXICITIES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div style={s.modalField}>
            <label style={s.modalLabel}>Description toxicité</label>
            <textarea style={{ ...s.modalInput, minHeight: 84 }} value={form.description_toxicite} onChange={e => onChange('description_toxicite', e.target.value)} />
          </div>
        </div>
        <div style={s.modalFooter}>
          <button style={s.btnGhost} onClick={onClose}>Annuler</button>
          <button style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={onSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : '✓ Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientDossier() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('apercu');
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [activeCancerId, setActiveCancerId] = useState(null);
  const [treatmentForm, setTreatmentForm] = useState({
    type_traitement: 'chimio', intention: '', statut: 'planifie', ligne: '',
    protocole: '', medicaments: '', voie_administration: '', jours_administration: [],
    cycles_prevus: '', cycles_realises: '', date_debut: '', date_fin: '',
    reponse_tumorale: '', date_evaluation: '', grade_toxicite: '', description_toxicite: '',
  });
  const [treatmentError, setTreatmentError] = useState('');
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { navigate('/auth'); return; }
      const data = await apiFetch(`/patients/${id}/`);
      if (data) setPatient(data); else navigate('/auth');
    } catch (err) {
      console.error('Erreur chargement patient:', err);
      setError(`Impossible de charger ce dossier. (${err?.message || err?.detail || 'Erreur réseau'})`);
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const resetTreatmentForm = () => setTreatmentForm({
    type_traitement: 'chimio', intention: '', statut: 'planifie', ligne: '',
    protocole: '', medicaments: '', voie_administration: '', jours_administration: [],
    cycles_prevus: '', cycles_realises: '', date_debut: '', date_fin: '',
    reponse_tumorale: '', date_evaluation: '', grade_toxicite: '', description_toxicite: '',
  });

  const openTreatmentModal = (cancerId) => {
    setActiveCancerId(cancerId);
    resetTreatmentForm();
    setTreatmentError('');
    setShowTreatmentModal(true);
  };

  const updateTreatmentValue = (key, value) => {
    setTreatmentForm(prev => ({ ...prev, [key]: value }));
  };

  const submitTreatment = async () => {
    if (!activeCancerId) return;
    setTreatmentLoading(true);
    setTreatmentError('');
    try {
      const payload = {
        ...treatmentForm,
        jours_administration: Array.isArray(treatmentForm.jours_administration)
          ? treatmentForm.jours_administration
          : String(treatmentForm.jours_administration || '').split(',').map(v => v.trim()).filter(Boolean),
      };
      await apiFetch(`/patients/${id}/cancers/${activeCancerId}/treatments/`, {
        method: 'POST', body: JSON.stringify(payload),
      });
      setShowTreatmentModal(false);
      showToastMsg('Traitement ajouté avec succès.');
      load();
    } catch (err) {
      console.error('Erreur ajout traitement:', err);
      setTreatmentError('Impossible d\u2019ajouter le traitement.');
    } finally {
      setTreatmentLoading(false);
    }
  };

  const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  if (loading) return (
    <div style={s.loadingScreen}>
      <div style={s.loadingSpinner} />
      <div style={s.loadingText}>Chargement du dossier…</div>
    </div>
  );

  if (error || !patient) return (
    <div style={s.loadingScreen}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={s.loadingText}>{error || 'Dossier introuvable'}</div>
      <button style={{ ...s.btnPrimary, marginTop: 20 }} onClick={() => navigate('/dashboard')}>← Retour au tableau de bord</button>
    </div>
  );

  const age = calcAge(patient.date_naissance);
  const dernierCancer = patient.cancers?.[0];
  const dernierStade = dernierCancer?.stade_clinique || dernierCancer?.stade_pathologique || null;
  const latestStatus = (dernierCancer?.status_history || []).slice().sort((a, b) => {
    const da = a?.status_date ? new Date(a.status_date) : 0;
    const db = b?.status_date ? new Date(b.status_date) : 0;
    return db - da;
  })[0] || null;

const medicalStatus = patient.death
  ? { label: 'Statut', value: 'Décédé', detail: patient.death.date_death ? `Date de décès : ${fmtDate(patient.death.date_death)}` : '' }
  : dernierCancer?.recidive
    ? { label: 'Statut', value: 'Récidive', detail: latestStatus?.status_date ? `Dernière mise à jour : ${fmtDate(latestStatus.status_date)}` : '' }
    : latestStatus
      ? { label: 'Statut', value: latestStatus.status || 'En suivi', detail: latestStatus.status_date ? `Dernière mise à jour : ${fmtDate(latestStatus.status_date)}` : '' }
      : { label: 'Statut', value: 'En suivi', detail: '' };

  const TABS = [
    { id: 'apercu', label: 'Aperçu', icon: '📋' },
    { id: 'cancers', label: `Cancers (${patient.cancers?.length || 0})`, icon: '🎗' },
    { id: 'consultations', label: `Consultations (${patient.consultations?.length || 0})`, icon: '📅' },
    { id: 'demandes', label: `Examens (${patient.cancers?.reduce((a,c) => a + (c.demandes_examens?.length || 0), 0) || 0})`, icon: '🔬' },
  ];

  return (
    <div style={s.root}>
      {toast && <div style={s.toast}>{toast}</div>}

      {showConsultModal && (
        <AddConsultationModal patientId={id} onClose={() => setShowConsultModal(false)} onSaved={() => { setShowConsultModal(false); load(); showToastMsg('✓ Consultation enregistrée'); }} />
      )}

      {showTreatmentModal && (
        <AddTreatmentModal
          patientId={id}
          cancerId={activeCancerId}
          form={treatmentForm}
          onChange={updateTreatmentValue}
          onClose={() => setShowTreatmentModal(false)}
          onSubmit={submitTreatment}
          loading={treatmentLoading}
          error={treatmentError}
        />
      )}

      {showQR && (
        <PatientQRSection
          patientId={patient.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          dossier={patient.numero_dossier}
          modalMode={true}
          onClose={() => setShowQR(false)}
        />
      )}

      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
            <div style={s.breadcrumb}>
              <span style={s.breadcrumbLink} onClick={() => navigate('/dashboard')}>Mes patients</span>
              <span style={s.breadcrumbSep}>/</span>
              <span style={s.breadcrumbCurrent}>{patient.first_name} {patient.last_name}</span>
            </div>
          </div>
          <div style={s.headerActions}>
            <button style={s.btnGhost} onClick={() => navigate(`/patient/${id}/edit`)}>✏ Modifier</button>
            <button style={s.btnQR} onClick={() => setShowQR(true)}>📲 QR Code</button>
          </div>
        </div>
      </div>

      <div style={s.heroSection}>
        <div style={s.heroCard}>
          <div style={s.heroLeft}>
            <SexeAvatar sexe={patient.sexe} name={`${patient.first_name} ${patient.last_name}`} />
            <div style={s.heroInfo}>
              <h1 style={s.heroName}>{patient.first_name} {patient.last_name}</h1>
              <div style={s.heroMeta}>
                <span style={s.heroBadge}>{patient.sexe === 'M' ? '♂ Masculin' : '♀ Féminin'}</span>
                {age !== null && <span style={s.heroBadge}>{age} ans</span>}
                {patient.numero_dossier && <span style={{ ...s.heroBadge, ...s.dossierId }}>{patient.numero_dossier}</span>}
              </div>
              {dernierCancer && (
                <div style={s.heroTags}>
                  <span style={s.heroTag}>{dernierCancer.cancer_type_name || 'Type inconnu'}</span>
                  {dernierStade && <StadeBadge stade={dernierStade} />}
                  {dernierCancer.tnm && <span style={s.tnmTag}>TNM: {dernierCancer.tnm}</span>}
                </div>
              )}
            </div>
          </div>
          <div style={s.heroRight}>
            <div style={s.heroStat}>
              <div style={s.heroStatLabel}>Dernier RDV</div>
              <RdvPill date={dernierCancer?.date_diagnostic} />
            </div>
            <div style={s.heroStat}>
              <div style={s.heroStatLabel}>{medicalStatus.label}</div>
              <div style={s.heroStatValue}>{medicalStatus.value}</div>
              {medicalStatus.detail && <div style={s.heroStatDetail}>{medicalStatus.detail}</div>}
            </div>
            <div style={s.heroStat}>
              <div style={s.heroStatLabel}>Médecin référent</div>
              <div style={s.heroStatValue}>{patient.medecin_nom || '—'}</div>
            </div>
            <div style={s.heroStat}>
              <div style={s.heroStatLabel}>Établissement</div>
              <div style={s.heroStatValue}>{patient.hospital_name || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { label: 'Cancers', value: patient.cancers?.length || 0, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Consultations', value: patient.consultations?.length || 0, color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'Traitements', value: patient.cancers?.reduce((a,c) => a + (c.treatments?.length || 0), 0) || 0, color: '#059669', bg: '#d1fae5' },
          { label: 'Examens bio.', value: patient.cancers?.reduce((a,c) => a + (c.biological_exams?.length || 0), 0) || 0, color: '#d97706', bg: '#fef3c7' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statValue, color }}>{value}</div>
            <div style={s.statLabel}>{label}</div>
            <div style={{ ...s.statBar, background: bg }}><div style={{ ...s.statBarFill, background: color, width: `${Math.min(100, value * 10)}%` }} /></div>
          </div>
        ))}
      </div>

      <div style={s.tabsBar}>
        {TABS.map(tab => (
          <button key={tab.id} style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }} onClick={() => setActiveTab(tab.id)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={s.content}>
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
                <InfoRow label="Wilaya" value={patient.wilaya_name || patient.wilaya_text || '—'} />
                <InfoRow label="Commune" value={patient.commune_name || '—'} />
                <InfoRow label="Adresse" value={patient.adresse || '—'} />
                <InfoRow label="Hôpital" value={patient.hospital_name || '—'} />
              </SectionCard>

              <SectionCard title="Informations administratives" icon="📂">
                <InfoRow label="N° dossier" value={patient.numero_dossier} accent />
                <InfoRow label="Source" value={patient.data_source === 'manual' ? 'Saisie manuelle' : patient.data_source} />
                <InfoRow label="Créé le" value={fmtDate(patient.created_at?.split('T')[0])} />
                <InfoRow label="Mis à jour" value={fmtDate(patient.updated_at?.split('T')[0])} />
                <InfoRow label="Médecin" value={patient.medecin_nom} />
              </SectionCard>

              <SectionCard title="Statut clinique" icon="📌">
                {(() => {
                  const status = computePatientOutcome(patient);
                  return (
                    <>
                      <InfoRow label="État actuel" value={<span style={{ color: status.color, fontWeight: 800 }}>{status.label}</span>} />
                      <InfoRow label="Dernière évolution" value={status.value} />
                      <InfoRow label="Cancers suivis" value={(patient.cancers || []).length || 0} />
                    </>
                  );
                })()}
              </SectionCard>

              <SectionCard title="Habitudes de vie" icon="🌿">
                {patient.habits?.length > 0 ? (patient.habits.map((h, i) => (
                  <div key={i} style={s.habitRow}><div style={s.habitName}>{h.name}</div><div style={s.habitMeta}>{h.frequency || 'Fréquence inconnue'} · {h.duration_years ? `${h.duration_years} ans` : 'Durée inconnue'}</div></div>
                ))) : <EmptyState icon="🌿" text="Aucune habitude de vie enregistrée." />}
                {patient.risk_factors?.length > 0 && (<div style={s.riskBox}><div style={s.riskTitle}>Facteurs de risque</div><div style={s.riskList}>{patient.risk_factors.map((r, i) => <span key={i} style={s.riskItem}>{r.name}</span>)}</div></div>)}
              </SectionCard>

            </div>

            <div style={s.colStack}>
              <SectionCard title="Informations du formulaire patient" icon="📋" action={<button style={s.seeMoreBtn} onClick={() => setShowQR(true)}>📲 QR Code →</button>}>
                <FormSubmissionsSection patientId={patient.id} />
              </SectionCard>

              {dernierCancer ? (
                <SectionCard title="Dernier cancer enregistré" icon="🎗" action={<button style={s.seeMoreBtn} onClick={() => setActiveTab('cancers')}>Voir tous →</button>}>
                  <InfoRow label="Type" value={dernierCancer.cancer_type_name} />
                  <InfoRow label="Stade" value={dernierCancer.stade_clinique || dernierCancer.stade_pathologique} />
                  <InfoRow label="TNM" value={dernierCancer.tnm} accent />
                  <InfoRow label="Grade" value={dernierCancer.grade} />
                  <InfoRow label="Diagnostic" value={fmtDate(dernierCancer.date_diagnostic)} />
                  {dernierCancer.treatments?.length > 0 && (<><Divider /><div style={s.subSectionTitle}>Traitement en cours</div><div style={s.treatmentItem}><div style={s.treatmentType}>{dernierCancer.treatments[0].type_traitement}</div>{dernierCancer.treatments[0].protocole && <div style={s.treatmentProto}>{dernierCancer.treatments[0].protocole}</div>}</div></>)}
                </SectionCard>
              ) : (
                <SectionCard title="Cancer" icon="🎗"><EmptyState icon="🎗" text="Aucun cancer enregistré pour ce patient." /></SectionCard>
              )}

              {patient.consultations?.length > 0 ? (
                <SectionCard title="Dernière consultation" icon="📅" action={<button style={s.seeMoreBtn} onClick={() => setActiveTab('consultations')}>Voir toutes →</button>}>
                  <div style={s.consultItem}><div style={s.consultDate}>{fmtDate(patient.consultations[0].consultation_date)}</div>{patient.consultations[0].motif && <div style={s.consultMotif}>{patient.consultations[0].motif}</div>}{patient.consultations[0].compte_rendu && <div style={s.consultCR}>{patient.consultations[0].compte_rendu}</div>}{patient.consultations[0].next_visit_date && <div style={s.nextVisit}>📅 Prochain RDV : <strong>{fmtDate(patient.consultations[0].next_visit_date)}</strong></div>}<div style={s.consultMedecin}>{patient.consultations[0].user_name}</div></div>
                  </SectionCard>
              ) : (
                <SectionCard title="Consultations" icon="📅"><EmptyState icon="📅" text="Aucune consultation enregistrée." /><button style={{ ...s.btnPrimary, marginTop: 14, width: '100%' }} onClick={() => setShowConsultModal(true)}>➕ Ajouter une consultation</button></SectionCard>
              )}

            </div>
          </div>
        )}

        {activeTab === 'cancers' && (
          <div>{patient.cancers?.length === 0 ? <EmptyState icon="🎗" text="Aucun cancer enregistré pour ce patient." /> : patient.cancers.map((cancer, i) => <CancerCard key={cancer.id} cancer={cancer} index={i} patientId={id} onAddTreatment={openTreatmentModal} />)}</div>
        )}

        {activeTab === 'consultations' && (
          <div>
            <div style={s.consultHeader}><span style={s.consultCount}>{patient.consultations?.length || 0} consultation{patient.consultations?.length !== 1 ? 's' : ''}</span><button style={s.btnPrimary} onClick={() => setShowConsultModal(true)}>➕ Nouvelle consultation</button></div>
            {patient.consultations?.length === 0 ? <EmptyState icon="📅" text="Aucune consultation enregistrée pour ce patient." /> : <div style={s.consultTimeline}>{patient.consultations.map((c, i) => (<div key={c.id} style={s.timelineItem}><div style={s.timelineDot} />{i < patient.consultations.length - 1 && <div style={s.timelineLine} />}<div style={s.timelineCard}><div style={s.timelineCardHeader}><span style={s.timelineDate}>{fmtDate(c.consultation_date)}</span>{c.motif && <span style={s.timelineMotif}>{c.motif}</span>}</div>{c.compte_rendu && <div style={s.timelineCR}>{c.compte_rendu}</div>}<div style={s.timelineFooter}>{c.next_visit_date && <span style={s.nextVisit}>📅 Prochain : {fmtDate(c.next_visit_date)}</span>}<span style={s.timelineMedecin}>{c.user_name}</span></div></div></div>))}</div>}
          </div>
        )}

        {activeTab === 'demandes' && (<OngletDemandes patientId={id} cancers={patient.cancers || []} />)}

      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif", paddingBottom: 60 },
  loadingScreen: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#F8FAFC' },
  loadingSpinner: { width: 40, height: 40, borderRadius: '50%', border: '3px solid #DDE4F3', borderTopColor: '#4A6CF7', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: 14, color: '#7A8BAD', fontWeight: 600 },
  toast: { position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#1A2B4A', color: '#fff', padding: '13px 24px', borderRadius: 14, fontSize: 14, fontWeight: 700 },
  header: { background: '#fff', borderBottom: '1px solid #E8EDF5', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1080, margin: '0 auto', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  backBtn: { padding: '7px 16px', borderRadius: 8, border: '1px solid #DDE4F3', background: '#F5F8FF', color: '#7A8BAD', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A8BAD' },
  breadcrumbLink: { cursor: 'pointer', color: '#4A6CF7', fontWeight: 600 },
  breadcrumbSep: { color: '#C5D0E8' },
  breadcrumbCurrent: { color: '#1A2B4A', fontWeight: 700 },
  headerActions: { display: 'flex', gap: 10, alignItems: 'center' },
  btnQR: { padding: '9px 18px', borderRadius: 30, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  heroSection: { maxWidth: 1080, margin: '24px auto 0', padding: '0 28px' },
  heroCard: { background: '#fff', borderRadius: 16, border: '1px solid #E8EDF5', padding: '24px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 },
  heroLeft: { display: 'flex', alignItems: 'flex-start', gap: 18, flex: 1 },
  avatar: { width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 },
  heroInfo: { flex: 1 },
  heroName: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A', margin: '0 0 8px' },
  heroMeta: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  heroBadge: { padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#F0F4FF', color: '#4A6CF7', border: '1px solid rgba(74,108,247,0.15)' },
  dossierId: { fontFamily: "'Poppins', sans-serif", letterSpacing: '0.5px', background: '#1A2B4A', color: '#fff' },
  heroTags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  heroTag: { padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#F5F8FF', color: '#1A2B4A', border: '1px solid #DDE4F3' },
  tnmTag: { padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, background: '#EEF2FF', color: '#4A6CF7' },
  heroRight: { display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '1px solid #E8EDF5', paddingLeft: 28, minWidth: 220 },
  heroStat: { display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 0' },
  heroStatLabel: { fontSize: 11, fontWeight: 700, color: '#7A8BAD', textTransform: 'uppercase', marginBottom: 4 },
  heroStatValue: { fontSize: 13, fontWeight: 700, color: '#1A2B4A' },
  heroStatDetail: { fontSize: 12, color: '#4B5563', fontWeight: 600 },
  rdvPill: { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' },
  rdvNone: { fontSize: 12, color: '#C5D0E8', fontWeight: 600 },
  stadeBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 },
  emptyBadge: { color: '#C5D0E8', fontSize: 12 },
  statsRow: { maxWidth: 1080, margin: '16px auto 0', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  statCard: { background: '#fff', borderRadius: 12, border: '1px solid #E8EDF5', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  statValue: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 24, marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#7A8BAD', fontWeight: 600, marginBottom: 10 },
  statBar: { height: 4, borderRadius: 4, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },
  tabsBar: { maxWidth: 1080, margin: '20px auto 0', padding: '0 28px', display: 'flex', gap: 4, borderBottom: '1px solid #E8EDF5' },
  tab: { padding: '10px 18px', borderRadius: '10px 10px 0 0', border: '1px solid transparent', background: 'transparent', fontSize: 13, fontWeight: 700, color: '#7A8BAD', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { background: '#fff', border: '1px solid #E8EDF5', borderBottom: '1px solid #fff', color: '#4A6CF7', fontWeight: 800, marginBottom: -1 },
  content: { maxWidth: 1080, margin: '0 auto', padding: '24px 28px' },
  twoColGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  colStack: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionCard: { background: '#fff', borderRadius: 12, border: '1px solid #E8EDF5', overflow: 'hidden' },
  sectionCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid #F0F4FF', background: '#FAFBFF' },
  sectionCardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13.5, color: '#1A2B4A' },
  sectionIcon: { fontSize: 15 },
  sectionCardBody: { padding: '14px 18px' },
  seeMoreBtn: { fontSize: 12, fontWeight: 700, color: '#4A6CF7', background: 'none', border: 'none', cursor: 'pointer' },
  infoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F8FF', fontSize: 13 },
  infoLabel: { color: '#7A8BAD', fontWeight: 600, fontSize: 12 },
  infoValue: { fontWeight: 700, color: '#1A2B4A', textAlign: 'right', maxWidth: '60%' },
  emptyText: { color: '#C5D0E8', fontWeight: 600, fontStyle: 'italic' },
  divider: { height: 1, background: '#F0F4FF', margin: '14px 0' },
  subSectionTitle: { fontSize: 11.5, fontWeight: 800, color: '#7A8BAD', textTransform: 'uppercase', marginBottom: 10 },
  cancerCard: { background: '#fff', borderRadius: 12, border: '1px solid #E8EDF5', marginBottom: 14, overflow: 'hidden' },
  cancerCardToggle: { width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: '#FAFBFF', cursor: 'pointer' },
  cancerCardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  cancerIndex: { width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', color: '#4A6CF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 },
  cancerType: { fontWeight: 800, fontSize: 14, color: '#1A2B4A' },
  cancerMeta: { fontSize: 12, color: '#7A8BAD', marginTop: 2 },
  cancerCardRight: { display: 'flex', alignItems: 'center', gap: 10 },
  chevron: { color: '#7A8BAD', fontSize: 10 },
  cancerBody: { padding: '16px 20px', borderTop: '1px solid #F0F4FF' },
  cancerActions: { display: 'flex', justifyContent: 'flex-end', marginBottom: 14 },
  cancerActionBtn: { padding: '8px 14px', borderRadius: 10, border: '1px solid #DDE4F3', background: '#F5F8FF', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  cancerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' },
  treatmentList: { display: 'flex', flexDirection: 'column', gap: 8 },
  treatmentHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  treatmentMeta: { fontSize: 12, color: '#64748B', fontWeight: 600 },
  treatmentDetail: { fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 1.5 },
  detailSeparator: { marginLeft: 12 },
  treatmentItem: { padding: '10px 14px', borderRadius: 8, background: '#F5F8FF', border: '1px solid #E8EDF5' },
  treatmentType: { fontSize: 13, fontWeight: 800, color: '#1A2B4A' },
  treatmentProto: { fontSize: 12, color: '#7A8BAD' },
  statusTimeline: { display: 'grid', gap: 10 },
  statusItem: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' },
  statusDate: { fontSize: 12, fontWeight: 700, color: '#475569' },
  statusText: { fontSize: 13, color: '#1F2937', fontWeight: 700 },
  treatmentDates: { fontSize: 11, color: '#7A8BAD' },
  examTable: { borderRadius: 8, overflow: 'hidden', border: '1px solid #E8EDF5' },
  examTableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', background: '#F5F8FF', padding: '8px 14px', fontSize: 10.5, fontWeight: 800, color: '#7A8BAD' },
  examRow: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', padding: '9px 14px', fontSize: 13, gap: 12, alignItems: 'center' },
  examName: { fontWeight: 700, color: '#1A2B4A' },
  examResult: { color: '#4A5568' },
  examDate: { color: '#7A8BAD', fontSize: 12 },
  metaList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaItem: { padding: '6px 14px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FED7D7' },
  metaOrgane: { fontSize: 13, fontWeight: 700, color: '#dc2626' },
  metaDate: { fontSize: 11, color: '#7A8BAD' },
  followUpItem: { padding: '10px 14px', borderRadius: 8, background: '#F5F8FF', border: '1px solid #E8EDF5', marginBottom: 8 },
  followUpDate: { fontSize: 12, fontWeight: 800, color: '#4A6CF7', marginBottom: 3 },
  followUpStatus: { fontSize: 13, fontWeight: 700, color: '#1A2B4A' },
  followUpObs: { fontSize: 12, color: '#7A8BAD', marginTop: 4 },
  emptyState: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', color: '#7A8BAD' },
  emptyStateIcon: { fontSize: 24 },
  emptyStateText: { fontSize: 13, fontWeight: 600 },
  consultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  consultCount: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#1A2B4A' },
  consultItem: {},
  consultDate: { fontSize: 13, fontWeight: 800, color: '#4A6CF7', marginBottom: 4 },
  consultMotif: { fontSize: 14, fontWeight: 700, color: '#1A2B4A', marginBottom: 6 },
  consultCR: { fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8 },
  nextVisit: { fontSize: 12, color: '#059669', fontWeight: 700 },
  consultMedecin: { fontSize: 11, color: '#7A8BAD', fontWeight: 600, marginTop: 6 },
  consultTimeline: { position: 'relative', paddingLeft: 28 },
  timelineItem: { position: 'relative', marginBottom: 20 },
  timelineDot: { position: 'absolute', left: -28, top: 16, width: 12, height: 12, borderRadius: '50%', background: '#4A6CF7', border: '2px solid #fff' },
  timelineLine: { position: 'absolute', left: -22, top: 28, width: 1, height: 'calc(100% + 20px)', background: '#DDE4F3' },
  timelineCard: { background: '#fff', borderRadius: 12, border: '1px solid #E8EDF5', padding: '14px 18px' },
  timelineCardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  timelineDate: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 13, color: '#4A6CF7' },
  timelineMotif: { padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#EEF2FF', color: '#4A6CF7' },
  timelineCR: { fontSize: 13, color: '#4A5568', lineHeight: 1.7, marginBottom: 10 },
  timelineFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F0F4FF', paddingTop: 10 },
  timelineMedecin: { fontSize: 11, color: '#7A8BAD', fontWeight: 600 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(10,20,50,0.45)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalLarge: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #F0F4FF' },
  modalTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: '#1A2B4A' },
  modalClose: { width: 30, height: 30, borderRadius: 8, border: '1px solid #DDE4F3', background: '#F5F8FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: '20px 22px', overflowY: 'auto', flex: 1 },
  modalError: { background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 14 },
  modalField: { marginBottom: 14 },
  modalFieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  modalFieldHalf: { display: 'flex', flexDirection: 'column' },
  modalLabel: { fontSize: 12, fontWeight: 700, color: '#7A8BAD', display: 'block', marginBottom: 5 },
  modalInput: { width: '100%', background: '#F5F8FF', border: '1.5px solid #DDE4F3', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1A2B4A' },
  modalFooter: { display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid #F0F4FF', justifyContent: 'flex-end' },
  btnPrimary: { padding: '10px 20px', borderRadius: 30, border: 'none', background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' },
  btnGhost: { padding: '10px 18px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#F5F8FF', color: '#7A8BAD', fontSize: 13, fontWeight: 700 },
};
