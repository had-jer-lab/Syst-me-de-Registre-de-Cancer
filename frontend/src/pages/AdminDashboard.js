import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: 'DOS-2026-18321', nom: 'Benali', prenom: 'Mehdi', age: 24, organe: 'Cœur', stade: 'II', wilaya: 'Alger', medecin: 'Dr. Hamidi', date: '15/02/2026', status: 'Actif' },
  { id: 'DOS-2026-17890', nom: 'Zerrouk', prenom: 'Fatima', age: 52, organe: 'Lymphome', stade: 'III', wilaya: 'Oran', medecin: 'Dr. Aouad', date: '12/02/2026', status: 'Suivi' },
  { id: 'DOS-2026-17654', nom: 'Bensalem', prenom: 'Karim', age: 61, organe: 'Poumon', stade: 'IV', wilaya: 'Constantine', medecin: 'Dr. Benamra', date: '10/02/2026', status: 'Critique' },
  { id: 'DOS-2026-17201', nom: 'Hamidi', prenom: 'Nadia', age: 38, organe: 'Col utérus', stade: 'I', wilaya: 'Tlemcen', medecin: 'Dr. Hamidi', date: '08/02/2026', status: 'Actif' },
  { id: 'DOS-2026-16988', nom: 'Tlemcani', prenom: 'Omar', age: 70, organe: 'Prostate', stade: 'II', wilaya: 'Annaba', medecin: 'Dr. Meziane', date: '05/02/2026', status: 'Suivi' },
  { id: 'DOS-2026-16500', nom: 'Amrani', prenom: 'Sara', age: 45, organe: 'Sein', stade: 'I', wilaya: 'Béjaïa', medecin: 'Dr. Aouad', date: '01/02/2026', status: 'Actif' },
];

const MOCK_USERS = [
  { id: 'USR-001', nom: 'Hamidi', prenom: 'Kamel', email: 'k.hamidi@chu-alger.dz', role: 'Médecin', specialite: 'Oncologie médicale', wilaya: 'Alger', etablissement: 'CHU Mustapha', status: 'Actif', createdAt: '10/01/2026', lastLogin: '21/02/2026 09:14', loginCount: 142, permissions: ['read', 'write', 'rcp'] },
  { id: 'USR-002', nom: 'Aouad', prenom: 'Fatima', email: 'f.aouad@chu-oran.dz', role: 'Médecin', specialite: 'Radiothérapie', wilaya: 'Oran', etablissement: 'CHU Oran', status: 'Actif', createdAt: '15/01/2026', lastLogin: '20/02/2026 16:42', loginCount: 98, permissions: ['read', 'write', 'rcp'] },
  { id: 'USR-003', nom: 'Meziane', prenom: 'Sofiane', email: 's.meziane@ehu-oran.dz', role: 'Biologiste', specialite: 'Biologie médicale', wilaya: 'Annaba', etablissement: 'EHU Annaba', status: 'Actif', createdAt: '20/01/2026', lastLogin: '21/02/2026 08:05', loginCount: 67, permissions: ['read', 'lab'] },
  { id: 'USR-004', nom: 'Benamra', prenom: 'Samir', email: 's.benamra@chu-const.dz', role: 'Médecin', specialite: 'Chirurgie oncologique', wilaya: 'Constantine', etablissement: 'CHU Constantine', status: 'Inactif', createdAt: '05/02/2026', lastLogin: '12/02/2026 11:20', loginCount: 23, permissions: ['read'] },
  { id: 'USR-005', nom: 'Larbi', prenom: 'Amina', email: 'a.larbi@hca.dz', role: 'Biologiste', specialite: 'Anatomopathologie', wilaya: 'Tlemcen', etablissement: 'HCA Tlemcen', status: 'Actif', createdAt: '01/02/2026', lastLogin: '19/02/2026 14:30', loginCount: 45, permissions: ['read', 'lab', 'write'] },
];

const MOCK_LOGS = [
  { user: 'Dr. Kamel Hamidi', action: 'Connexion', detail: 'Depuis 41.200.x.x', time: '21/02/2026 09:14', type: 'login' },
  { user: 'Dr. Fatima Aouad', action: 'Déconnexion', detail: 'Session de 2h14', time: '20/02/2026 18:56', type: 'logout' },
  { user: 'Dr. Sofiane Meziane', action: 'Connexion', detail: 'Depuis 41.111.x.x', time: '21/02/2026 08:05', type: 'login' },
  { user: 'Dr. Kamel Hamidi', action: 'Création patient', detail: 'DOS-2026-18321', time: '21/02/2026 10:32', type: 'action' },
  { user: 'Dr. Amina Larbi', action: 'Connexion', detail: 'Depuis mobile', time: '19/02/2026 14:30', type: 'login' },
  { user: 'Dr. Samir Benamra', action: 'Déconnexion', detail: 'Session de 0h47', time: '12/02/2026 12:07', type: 'logout' },
  { user: 'Dr. Fatima Aouad', action: 'Connexion', detail: 'Depuis 41.200.x.x', time: '20/02/2026 16:42', type: 'login' },
  { user: 'Dr. Sofiane Meziane', action: 'Modification résultat', detail: 'Labo #4521', time: '21/02/2026 09:00', type: 'action' },
];

const STATUS_COLORS = {
  'Actif':    { bg: 'rgba(0,201,167,0.12)',  color: '#00C9A7', border: 'rgba(0,201,167,0.25)' },
  'Suivi':    { bg: 'rgba(74,108,247,0.1)',  color: '#4A6CF7', border: 'rgba(74,108,247,0.2)' },
  'Critique': { bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: 'rgba(255,107,107,0.22)' },
  'Inactif':  { bg: 'rgba(122,139,173,0.1)', color: '#7A8BAD', border: 'rgba(122,139,173,0.2)' },
};

const ROLE_COLORS = {
  'Médecin':    { bg: 'rgba(74,108,247,0.1)',  color: '#4A6CF7' },
  'Biologiste': { bg: 'rgba(0,201,167,0.12)',  color: '#00C9A7' },
  'Admin':      { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6' },
};

const ALL_PERMISSIONS = [
  { key: 'read',  label: 'Lecture',     icon: '👁', desc: 'Consulter les dossiers patients' },
  { key: 'write', label: 'Écriture',    icon: '✏', desc: 'Créer / modifier des dossiers' },
  { key: 'rcp',   label: 'RCP',         icon: '💬', desc: 'Participer aux réunions RCP' },
  { key: 'lab',   label: 'Laboratoire', icon: '🔬', desc: 'Accès aux données biologiques' },
  { key: 'stats', label: 'Statistiques',icon: '📊', desc: 'Voir les tableaux de bord' },
  { key: 'admin', label: 'Admin',        icon: '⚙', desc: 'Gérer utilisateurs et paramètres' },
];

// ─── Sub-pages ────────────────────────────────────────────────────────────────
function PatientsPage({ search }) {
  const filtered = MOCK_PATIENTS.filter(p =>
    `${p.prenom} ${p.nom} ${p.id} ${p.organe} ${p.wilaya}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div style={s.pageTitle}>Liste des patients <span style={s.pageTitleCount}>{filtered.length} patients</span></div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              {['N° Dossier','Patient','Âge','Organe','Stade','Wilaya','Médecin référent','Date','Statut'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                <td style={s.td}><span style={s.dossierId}>{p.id}</span></td>
                <td style={s.td}>
                  <div style={s.patientCell}>
                    <div style={s.patientAvatar}>{p.prenom[0]}{p.nom[0]}</div>
                    <div>
                      <div style={s.patientName}>{p.prenom} {p.nom}</div>
                    </div>
                  </div>
                </td>
                <td style={s.td}><span style={s.ageChip}>{p.age} ans</span></td>
                <td style={s.td}>{p.organe}</td>
                <td style={s.td}><span style={s.stadeChip}>Stade {p.stade}</span></td>
                <td style={s.td}>{p.wilaya}</td>
                <td style={s.td}><span style={{ fontSize: 13, color: '#4A6CF7', fontWeight: 700 }}>{p.medecin}</span></td>
                <td style={s.td}>{p.date}</td>
                <td style={s.td}>
                  <span style={{ ...s.statusBadge, ...STATUS_COLORS[p.status] }}>{p.status}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: '#7A8BAD', padding: 40 }}>Aucun résultat pour « {search} »</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const isNew = !user;
  const [form, setForm] = useState(user || { nom: '', prenom: '', email: '', role: 'Médecin', specialite: '', wilaya: '', etablissement: '', status: 'Actif', permissions: ['read'] });

  const togglePerm = (key) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  return (
    <div style={s.modalOverlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>
            <div style={s.modalIcon}>{isNew ? '➕' : '✏'}</div>
            {isNew ? 'Créer un utilisateur' : `Modifier — ${user.prenom} ${user.nom}`}
          </div>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div style={s.modalBody}>
          {/* Identité */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>Identité</div>
            <div style={s.modalGrid2}>
              <div style={s.mfg}>
                <label style={s.ml}>Nom</label>
                <input style={s.mi} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom de famille" />
              </div>
              <div style={s.mfg}>
                <label style={s.ml}>Prénom</label>
                <input style={s.mi} value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" />
              </div>
            </div>
            <div style={s.mfg}>
              <label style={s.ml}>Email professionnel</label>
              <input style={s.mi} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="exemple@hopital.dz" />
            </div>
          </div>

          {/* Rôle & Profil */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>Rôle & Profil</div>
            <div style={s.modalGrid2}>
              <div style={s.mfg}>
                <label style={s.ml}>Rôle</label>
                <select style={s.mi} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option>Médecin</option>
                  <option>Biologiste</option>
                </select>
              </div>
              <div style={s.mfg}>
                <label style={s.ml}>Spécialité</label>
                <input style={s.mi} value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} placeholder="ex: Oncologie" />
              </div>
            </div>
            <div style={s.modalGrid2}>
              <div style={s.mfg}>
                <label style={s.ml}>Wilaya</label>
                <input style={s.mi} value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })} placeholder="Wilaya" />
              </div>
              <div style={s.mfg}>
                <label style={s.ml}>Établissement</label>
                <input style={s.mi} value={form.etablissement} onChange={e => setForm({ ...form, etablissement: e.target.value })} placeholder="CHU / EHU…" />
              </div>
            </div>
            <div style={s.mfg}>
              <label style={s.ml}>Statut du compte</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {['Actif', 'Inactif', 'Suspendu'].map(st => (
                  <button key={st} type="button"
                    style={{ ...s.statusToggle, ...(form.status === st ? s.statusToggleActive : {}) }}
                    onClick={() => setForm({ ...form, status: st })}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div style={s.modalSection}>
            <div style={s.modalSectionLabel}>Permissions d'accès</div>
            <div style={s.permGrid}>
              {ALL_PERMISSIONS.map(({ key, label, icon, desc }) => {
                const active = form.permissions.includes(key);
                return (
                  <div key={key} style={{ ...s.permCard, ...(active ? s.permCardActive : {}) }}
                    onClick={() => togglePerm(key)}>
                    <div style={s.permIcon}>{icon}</div>
                    <div style={s.permLabel}>{label}</div>
                    <div style={s.permDesc}>{desc}</div>
                    <div style={{ ...s.permCheck, ...(active ? s.permCheckActive : {}) }}>
                      {active ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={s.modalFooter}>
          <button style={s.btnGhost} onClick={onClose}>Annuler</button>
          <button style={s.btnPrimary} onClick={() => onSave(form)}>
            {isNew ? '✓ Créer l\'utilisateur' : '✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersPage({ search }) {
  const [users, setUsers] = useState(MOCK_USERS);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState('');

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.role} ${u.wilaya} ${u.etablissement}`.toLowerCase().includes(search.toLowerCase())
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = (form) => {
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...form } : u));
      showToast(`✓ Utilisateur ${form.prenom} ${form.nom} modifié`);
    } else {
      const newUser = { ...form, id: 'USR-' + String(users.length + 1).padStart(3, '0'), createdAt: new Date().toLocaleDateString('fr-FR'), lastLogin: '—', loginCount: 0 };
      setUsers(prev => [...prev, newUser]);
      showToast(`✓ Utilisateur ${form.prenom} ${form.nom} créé`);
    }
    setShowModal(false);
    setEditUser(null);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Supprimer ${name} ?`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast(`✓ Utilisateur supprimé`);
    }
  };

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}
      {(showModal || editUser) && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSave}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={s.pageTitle}>Gestion des utilisateurs <span style={s.pageTitleCount}>{filtered.length} comptes</span></div>
        <button style={s.btnPrimary} onClick={() => setShowModal(true)}>➕ Nouvel utilisateur</button>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              {['Utilisateur','Rôle','Spécialité','Établissement','Permissions','Dernière connexion','Statut','Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                <td style={s.td}>
                  <div style={s.patientCell}>
                    <div style={{ ...s.patientAvatar, background: ROLE_COLORS[u.role]?.bg || '#eee', color: ROLE_COLORS[u.role]?.color || '#555' }}>
                      {u.prenom[0]}{u.nom[0]}
                    </div>
                    <div>
                      <div style={s.patientName}>{u.prenom} {u.nom}</div>
                      <div style={{ fontSize: 11, color: '#7A8BAD', fontWeight: 600 }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.roleChip, ...ROLE_COLORS[u.role] }}>{u.role}</span>
                </td>
                <td style={s.td}><span style={{ fontSize: 13, color: '#4A5568' }}>{u.specialite}</span></td>
                <td style={s.td}>
                  <div style={{ fontSize: 12, color: '#4A6CF7', fontWeight: 700 }}>{u.etablissement}</div>
                  <div style={{ fontSize: 11, color: '#7A8BAD' }}>{u.wilaya}</div>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {u.permissions.map(p => {
                      const pm = ALL_PERMISSIONS.find(x => x.key === p);
                      return pm ? (
                        <span key={p} style={s.permBadge} title={pm.desc}>{pm.icon} {pm.label}</span>
                      ) : null;
                    })}
                  </div>
                </td>
                <td style={s.td}>
                  <div style={{ fontSize: 13, color: '#1A2B4A', fontWeight: 700 }}>{u.lastLogin}</div>
                  <div style={{ fontSize: 11, color: '#7A8BAD' }}>{u.loginCount} connexions</div>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.statusBadge, ...STATUS_COLORS[u.status] }}>{u.status}</span>
                </td>
                <td style={s.td}>
                  <div style={s.actionBtns}>
                    <button style={s.iconBtnBlue} title="Modifier" onClick={() => setEditUser(u)}>✏</button>
                    <button style={{ ...s.iconBtnBlue, color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }} title="Supprimer" onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#7A8BAD', padding: 40 }}>Aucun utilisateur trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogsPage({ search }) {
  const [filter, setFilter] = useState('all');
  const filtered = MOCK_LOGS
    .filter(l => (filter === 'all' || l.type === filter))
    .filter(l => `${l.user} ${l.action} ${l.detail}`.toLowerCase().includes(search.toLowerCase()));

  const logStyle = (type) => ({
    login:  { bg: 'rgba(0,201,167,0.1)',  color: '#00C9A7', icon: '🔑' },
    logout: { bg: 'rgba(74,108,247,0.1)', color: '#4A6CF7', icon: '🚪' },
    action: { bg: 'rgba(255,162,107,0.1)',color: '#FFA26B', icon: '⚡' },
  }[type] || {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={s.pageTitle}>Journal de connexions <span style={s.pageTitleCount}>{filtered.length} événements</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all','Tout'], ['login','Connexions'], ['logout','Déconnexions'], ['action','Actions']].map(([val, label]) => (
            <button key={val} style={{ ...s.filterBtn, ...(filter === val ? s.filterBtnActive : {}) }} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              {['Utilisateur','Type','Action','Détail','Horodatage'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => {
              const ls = logStyle(l.type);
              return (
                <tr key={i} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                  <td style={s.td}>
                    <div style={s.patientCell}>
                      <div style={{ ...s.patientAvatar, background: ls.bg, color: ls.color, fontSize: 14 }}>{ls.icon}</div>
                      <span style={s.patientName}>{l.user}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 800, background: ls.bg, color: ls.color }}>
                      {ls.icon} {l.type === 'login' ? 'Connexion' : l.type === 'logout' ? 'Déconnexion' : 'Action'}
                    </span>
                  </td>
                  <td style={s.td}><span style={{ fontWeight: 700, color: '#1A2B4A', fontSize: 13 }}>{l.action}</span></td>
                  <td style={s.td}><span style={{ fontSize: 12, color: '#7A8BAD', fontWeight: 600 }}>{l.detail}</span></td>
                  <td style={s.td}><span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, color: '#4A6CF7' }}>{l.time}</span></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#7A8BAD', padding: 40 }}>Aucun journal trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState('overview');
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total patients', value: '1 284', delta: '+12 ce mois', icon: '👥', color: '#4A6CF7' },
    { label: 'Médecins actifs', value: String(MOCK_USERS.filter(u => u.role === 'Médecin' && u.status === 'Actif').length), delta: `/${MOCK_USERS.filter(u => u.role === 'Médecin').length} total`, icon: '🩺', color: '#00C9A7' },
    { label: 'Biologistes', value: String(MOCK_USERS.filter(u => u.role === 'Biologiste').length), delta: 'actifs sur la plateforme', icon: '🔬', color: '#FFA26B' },
    { label: 'Connexions aujourd\'hui', value: '23', delta: '↑ 8 vs hier', icon: '🔑', color: '#9B59B6' },
  ];

  const navItems = [
    { id: 'overview',  icon: '🏠', label: 'Vue d\'ensemble' },
    { id: 'patients',  icon: '👥', label: 'Patients' },
    { id: 'users',     icon: '👤', label: 'Utilisateurs' },
    { id: 'logs',      icon: '📋', label: 'Journal' },
  ];

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarBrand}>
          <div style={s.brandIcon}>⚕</div>
          <div>
            <span style={s.brandName}>MedDossier</span>
            <div style={s.brandSub}>Administration</div>
          </div>
        </div>

        <nav style={s.nav}>
          {navItems.map(({ id, icon, label }) => (
            <button key={id} style={{ ...s.navItem, ...(page === id ? s.navActive : {}) }} onClick={() => { setPage(id); setSearch(''); }}>
              <span style={s.navIcon}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.adminBadge}>⚙ Admin</div>
          <div style={s.userCard}>
            <div style={s.userAvatar}>AD</div>
            <div>
              <div style={s.userName}>Administrateur</div>
              <div style={s.userRole}>Registre National</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={() => navigate('/auth')}>⬅ Déconnexion</button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={s.main}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <div>
            <div style={s.topbarTitle}>
              {page === 'overview' && 'Tableau de bord Admin'}
              {page === 'patients' && 'Liste des patients'}
              {page === 'users'    && 'Gestion des utilisateurs'}
              {page === 'logs'     && 'Journal d\'activité'}
            </div>
            <div style={s.topbarSub}>Registre National du Cancer — Panel Administrateur</div>
          </div>
          <div style={s.topbarRight}>
            {page !== 'overview' && (
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input style={s.searchInput} type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            )}
            <button style={s.notifBtn}>🔔</button>
            <div style={s.avatar}>AD</div>
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {page === 'overview' && (
          <>
            <div style={s.statsGrid}>
              {stats.map(({ label, value, delta, icon, color }) => (
                <div key={label} style={s.statCard}>
                  <div style={{ ...s.statIcon, background: color + '18', color }}>{icon}</div>
                  <div style={s.statInfo}>
                    <div style={s.statValue}>{value}</div>
                    <div style={s.statLabel}>{label}</div>
                    <div style={{ ...s.statDelta, color }}>{delta}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick navigation cards */}
            <div style={s.sectionHeader}>
              <div style={s.sectionTitle}>Navigation rapide</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { id: 'patients', icon: '👥', label: 'Patients', sub: 'Voir tous les dossiers', color: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', count: '1 284 patients' },
                { id: 'users',    icon: '👤', label: 'Utilisateurs', sub: 'Gérer médecins & biologistes', color: 'linear-gradient(135deg,#00C9A7,#00a98b)', count: `${MOCK_USERS.length} comptes` },
                { id: 'logs',     icon: '📋', label: 'Journal', sub: 'Connexions & activités', color: 'linear-gradient(135deg,#9B59B6,#8e44ad)', count: '23 événements aujourd\'hui' },
              ].map(({ id, icon, label, sub, color, count }) => (
                <div key={id} style={s.quickCard} onClick={() => setPage(id)}>
                  <div style={{ ...s.quickIcon, background: color }}>{icon}</div>
                  <div style={s.quickLabel}>{label}</div>
                  <div style={s.quickSub}>{sub}</div>
                  <div style={s.quickCount}>{count}</div>
                </div>
              ))}
            </div>

            {/* Recent users */}
            <div style={s.sectionHeader}>
              <div style={s.sectionTitle}>Dernières connexions</div>
              <button style={s.viewAllBtn} onClick={() => setPage('logs')}>Voir tout →</button>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    {['Utilisateur','Rôle','Action','Horodatage'].map(h => <th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LOGS.slice(0, 5).map((l, i) => {
                    const ls = { login: { bg: 'rgba(0,201,167,0.1)', color: '#00C9A7', icon: '🔑' }, logout: { bg: 'rgba(74,108,247,0.1)', color: '#4A6CF7', icon: '🚪' }, action: { bg: 'rgba(255,162,107,0.1)', color: '#FFA26B', icon: '⚡' } }[l.type];
                    return (
                      <tr key={i} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                        <td style={s.td}>
                          <div style={s.patientCell}>
                            <div style={{ ...s.patientAvatar, background: ls.bg, color: ls.color, fontSize: 14 }}>{ls.icon}</div>
                            <span style={s.patientName}>{l.user}</span>
                          </div>
                        </td>
                        <td style={s.td}><span style={{ ...s.roleChip, ...ROLE_COLORS['Médecin'] }}>Médecin</span></td>
                        <td style={s.td}>{l.action}</td>
                        <td style={s.td}><span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 700, color: '#4A6CF7' }}>{l.time}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {page === 'patients' && <PatientsPage search={search} />}
        {page === 'users'    && <UsersPage search={search} />}
        {page === 'logs'     && <LogsPage search={search} />}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: "'Nunito', sans-serif", background: '#EEF2FF' },

  // Sidebar
  sidebar: { width: 250, flexShrink: 0, background: 'linear-gradient(170deg, #1a2f6b 0%, #0f1c3f 100%)', display: 'flex', flexDirection: 'column', padding: '28px 16px', position: 'sticky', top: 0, height: '100vh' },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  brandIcon: { width: 38, height: 38, background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', boxShadow: '0 5px 15px rgba(74,108,247,0.5)' },
  brandName: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', display: 'block' },
  brandSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, border: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: '0.2s', textAlign: 'left', width: '100%' },
  navActive: { background: 'rgba(74,108,247,0.3)', color: '#fff', fontWeight: 800, boxShadow: '0 2px 12px rgba(74,108,247,0.25)' },
  navIcon: { fontSize: 17, width: 20, textAlign: 'center' },
  sidebarBottom: { display: 'flex', flexDirection: 'column', gap: 8 },
  adminBadge: { padding: '6px 14px', background: 'rgba(155,89,182,0.25)', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#c39bd3', letterSpacing: '0.5px', textAlign: 'center' },
  userCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#9B59B6,#c39bd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 },
  userName: { fontSize: 13, fontWeight: 800, color: '#fff' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
  logoutBtn: { padding: '9px 14px', background: 'rgba(255,107,107,0.15)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },

  // Main
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  topbarTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A' },
  topbarSub: { fontSize: 13, color: '#7A8BAD', fontWeight: 600, marginTop: 2 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A8BAD' },
  searchInput: { background: '#fff', border: '1.5px solid #DDE4F3', borderRadius: 30, padding: '10px 16px 10px 38px', fontSize: 13, fontFamily: "'Nunito', sans-serif", color: '#1A2B4A', outline: 'none', width: 260 },
  notifBtn: { width: 38, height: 38, border: 'none', background: '#fff', borderRadius: '50%', cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 14px rgba(74,108,247,0.1)' },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#9B59B6,#c39bd3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 14px rgba(155,89,182,0.3)' },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 20px rgba(74,108,247,0.08)', display: 'flex', alignItems: 'center', gap: 16, border: '1.5px solid #EEF2FF' },
  statIcon: { width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  statInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  statValue: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A' },
  statLabel: { fontSize: 12, color: '#7A8BAD', fontWeight: 600 },
  statDelta: { fontSize: 11, fontWeight: 800, marginTop: 2 },

  // Quick cards
  quickCard: { background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1.5px solid #EEF2FF', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: '0.22s', boxShadow: '0 4px 14px rgba(74,108,247,0.06)' },
  quickIcon: { width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,0.2)' },
  quickLabel: { fontSize: 14, fontWeight: 800, color: '#1A2B4A' },
  quickSub: { fontSize: 12, color: '#7A8BAD', fontWeight: 600 },
  quickCount: { fontSize: 12, fontWeight: 800, color: '#4A6CF7', background: 'rgba(74,108,247,0.08)', padding: '4px 10px', borderRadius: 8, alignSelf: 'flex-start' },

  // Section
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#1A2B4A' },
  viewAllBtn: { background: 'none', border: 'none', color: '#4A6CF7', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },

  // Page title
  pageTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#1A2B4A', marginBottom: 20 },
  pageTitleCount: { fontSize: 13, fontWeight: 700, color: '#7A8BAD', marginLeft: 10, background: '#EEF2FF', padding: '3px 10px', borderRadius: 20 },

  // Table
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(74,108,247,0.08)', border: '1.5px solid #EEF2FF' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F5F8FF' },
  th: { padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#7A8BAD', textTransform: 'uppercase', letterSpacing: '0.9px', borderBottom: '1.5px solid #EEF2FF', whiteSpace: 'nowrap' },
  tr: { transition: '0.15s' },
  td: { padding: '13px 16px', fontSize: 13, color: '#1A2B4A', fontWeight: 600, borderBottom: '1px solid #EEF2FF' },
  dossierId: { fontSize: 11, fontWeight: 800, color: '#4A6CF7', fontFamily: "'Poppins', sans-serif" },
  patientCell: { display: 'flex', alignItems: 'center', gap: 10 },
  patientAvatar: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0 },
  patientName: { fontWeight: 700, color: '#1A2B4A', fontSize: 13 },
  ageChip: { background: '#F0F4FF', color: '#4A6CF7', padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 800 },
  stadeChip: { background: 'rgba(255,162,107,0.12)', color: '#FFA26B', border: '1px solid rgba(255,162,107,0.25)', padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 800 },
  statusBadge: { padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 800, border: '1.5px solid' },
  roleChip: { padding: '4px 12px', borderRadius: 30, fontSize: 12, fontWeight: 800 },
  permBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(74,108,247,0.08)', color: '#4A6CF7', whiteSpace: 'nowrap' },
  actionBtns: { display: 'flex', gap: 6 },
  iconBtnBlue: { width: 32, height: 32, borderRadius: 8, border: '1.5px solid rgba(74,108,247,0.2)', background: 'rgba(74,108,247,0.05)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A6CF7', transition: '0.2s' },

  // Filter buttons
  filterBtn: { padding: '8px 16px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#7A8BAD', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },
  filterBtnActive: { background: '#4A6CF7', borderColor: '#4A6CF7', color: '#fff' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(10,20,50,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 24, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 70px rgba(0,0,0,0.2)', animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1.5px solid #EEF2FF' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#1A2B4A' },
  modalIcon: { width: 38, height: 38, background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' },
  modalClose: { width: 34, height: 34, borderRadius: 8, border: '1.5px solid #DDE4F3', background: '#F5F8FF', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8BAD' },
  modalBody: { padding: '24px 28px', overflowY: 'auto', flex: 1 },
  modalSection: { marginBottom: 24 },
  modalSectionLabel: { fontSize: 10.5, fontWeight: 900, color: '#7A8BAD', textTransform: 'uppercase', letterSpacing: '1.3px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  modalGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  mfg: { display: 'flex', flexDirection: 'column', gap: 5 },
  ml: { fontSize: 11.5, fontWeight: 700, color: '#7A8BAD' },
  mi: { background: '#F5F8FF', border: '1.5px solid #DDE4F3', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: "'Nunito', sans-serif", color: '#1A2B4A', outline: 'none', width: '100%' },
  statusToggle: { padding: '8px 16px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#F5F8FF', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#7A8BAD', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },
  statusToggleActive: { background: '#4A6CF7', borderColor: '#4A6CF7', color: '#fff' },
  permGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
  permCard: { padding: '14px 12px', border: '2px solid #DDE4F3', borderRadius: 12, cursor: 'pointer', transition: '0.2s', position: 'relative', background: '#F5F8FF' },
  permCardActive: { border: '2px solid #4A6CF7', background: 'rgba(74,108,247,0.05)' },
  permIcon: { fontSize: 20, marginBottom: 6 },
  permLabel: { fontSize: 13, fontWeight: 800, color: '#1A2B4A', marginBottom: 3 },
  permDesc: { fontSize: 11, color: '#7A8BAD', lineHeight: 1.4 },
  permCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', border: '2px solid #DDE4F3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 },
  permCheckActive: { background: '#4A6CF7', borderColor: '#4A6CF7', color: '#fff' },
  modalFooter: { display: 'flex', gap: 12, padding: '18px 28px', borderTop: '1.5px solid #EEF2FF', justifyContent: 'flex-end' },

  // Buttons
  btnPrimary: { padding: '11px 24px', borderRadius: 30, border: 'none', background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 6px 20px rgba(74,108,247,0.35)', transition: '0.2s' },
  btnGhost: { padding: '11px 24px', borderRadius: 30, border: '1.5px solid #DDE4F3', background: '#F5F8FF', color: '#7A8BAD', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: '0.2s' },

  // Toast
  toast: { position: 'fixed', bottom: 24, right: 24, background: 'linear-gradient(135deg,#00C9A7,#00a98b)', color: '#fff', padding: '14px 24px', borderRadius: 14, fontSize: 14, fontWeight: 800, boxShadow: '0 10px 30px rgba(0,201,167,0.4)', zIndex: 2000, fontFamily: "'Nunito', sans-serif" },
};