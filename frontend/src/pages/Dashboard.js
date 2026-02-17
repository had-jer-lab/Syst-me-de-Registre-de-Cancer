import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RECENT_PATIENTS = [
  { id: 'DOS-2024-18321', name: 'Mehdi Benali', age: 24, type: 'Solide', organe: 'Sein', stade: 'II', date: '15/02/2024', status: 'Actif' },
  { id: 'DOS-2024-17890', name: 'Fatima Zerrouk', age: 52, type: 'Hématologique', organe: 'Lymphome', stade: 'III', date: '12/02/2024', status: 'Suivi' },
  { id: 'DOS-2024-17654', name: 'Karim Bensalem', age: 61, type: 'Solide', organe: 'Poumon', stade: 'IV', date: '10/02/2024', status: 'Critique' },
  { id: 'DOS-2024-17201', name: 'Nadia Hamidi', age: 38, type: 'Solide', organe: 'Col utérus', stade: 'I', date: '08/02/2024', status: 'Actif' },
  { id: 'DOS-2024-16988', name: 'Omar Tlemcani', age: 70, type: 'Solide', organe: 'Prostate', stade: 'II', date: '05/02/2024', status: 'Suivi' },
];

const STATUS_COLORS = {
  'Actif': { bg: 'rgba(0,201,167,0.12)', color: '#00C9A7', border: 'rgba(0,201,167,0.25)' },
  'Suivi': { bg: 'rgba(74,108,247,0.1)', color: '#4A6CF7', border: 'rgba(74,108,247,0.2)' },
  'Critique': { bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: 'rgba(255,107,107,0.22)' },
};

const QUICK_ACTIONS = [
  { icon: '➕', label: 'Ajouter patient', sub: 'Nouveau dossier', color: 'linear-gradient(135deg,#4A6CF7,#6B87FF)', path: '/page1', highlight: true },
  { icon: '🔍', label: 'Rechercher', sub: 'Trouver un dossier', color: 'linear-gradient(135deg,#00C9A7,#00a98b)', path: '/dashboard' },
  { icon: '📊', label: 'Statistiques', sub: 'Tableaux de bord', color: 'linear-gradient(135deg,#FFA26B,#ff8c4a)', path: '/dashboard' },
  { icon: '📋', label: 'Rapports', sub: 'Générer un rapport', color: 'linear-gradient(135deg,#9B59B6,#8e44ad)', path: '/dashboard' },
  { icon: '📅', label: 'Rendez-vous', sub: 'Agenda patients', color: 'linear-gradient(135deg,#FF6B6B,#e74c3c)', path: '/dashboard' },
  { icon: '⚙', label: 'Paramètres', sub: 'Configuration', color: 'linear-gradient(135deg,#5D6D7E,#4a5568)', path: '/dashboard' },
];

const STATS = [
  { label: 'Total patients', value: '1 284', delta: '+12 ce mois', icon: '👥', color: '#4A6CF7' },
  { label: 'Nouveaux (mois)', value: '47', delta: '+8.3%', icon: '📈', color: '#00C9A7' },
  { label: 'En cours de suivi', value: '892', delta: '69.5%', icon: '🔄', color: '#FFA26B' },
  { label: 'Stade IV actifs', value: '134', delta: '10.4%', icon: '⚠', color: '#FF6B6B' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sidebarOpen] = useState(true);

  const filtered = RECENT_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.root}>

      {/* ── SIDEBAR ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarBrand}>
          <div style={s.brandIcon}>⚕</div>
          <span style={s.brandName}>MedDossier</span>
        </div>

        <nav style={s.nav}>
          {[
            { icon: '🏠', label: 'Tableau de bord', active: true },
            { icon: '👥', label: 'Patients' },
            { icon: '📊', label: 'Statistiques' },
            { icon: '📋', label: 'Rapports' },
            { icon: '📅', label: 'Agenda' },
            { icon: '🏥', label: 'Établissements' },
            { icon: '👤', label: 'Utilisateurs' },
          ].map(({ icon, label, active }) => (
            <button
              key={label}
              style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
            >
              <span style={s.navIcon}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.userCard}>
            <div style={s.userAvatar}>DR</div>
            <div>
              <div style={s.userName}>Dr. Médecin</div>
              <div style={s.userRole}>Oncologue</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={() => navigate('/auth')}>
            ⬅ Déconnexion
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={s.main}>

        {/* TOP BAR */}
        <div style={s.topbar}>
          <div>
            <div style={s.topbarTitle}>Tableau de bord</div>
            <div style={s.topbarSub}>Bienvenue, Dr. Médecin — CHU Oran</div>
          </div>
          <div style={s.topbarRight}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.searchInput}
                type="text"
                placeholder="Rechercher un patient, N° dossier…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button style={s.notifBtn}>🔔</button>
            <div style={s.avatar}>DR</div>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div style={s.statsGrid}>
          {STATS.map(({ label, value, delta, icon, color }) => (
            <div key={label} style={s.statCard}>
              <div style={{ ...s.statIcon, background: color + '18', color }}>
                {icon}
              </div>
              <div style={s.statInfo}>
                <div style={s.statValue}>{value}</div>
                <div style={s.statLabel}>{label}</div>
                <div style={{ ...s.statDelta, color }}>{delta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Actions rapides</div>
        </div>
        <div style={s.actionsGrid}>
          {QUICK_ACTIONS.map(({ icon, label, sub, color, path, highlight }) => (
            <button
              key={label}
              style={{ ...s.actionCard, ...(highlight ? s.actionHighlight : {}) }}
              onClick={() => navigate(path)}
            >
              <div style={{ ...s.actionIcon, background: color }}>
                {icon}
              </div>
              <div style={s.actionLabel}>{label}</div>
              <div style={s.actionSub}>{sub}</div>
              {highlight && <div style={s.highlightBadge}>Nouveau</div>}
            </button>
          ))}
        </div>

        {/* ── RECENT PATIENTS ── */}
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Patients récents</div>
          <button style={s.viewAllBtn}>Voir tous →</button>
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['N° Dossier', 'Patient', 'Âge', 'Type', 'Organe', 'Stade', 'Date', 'Statut', 'Actions'].map(h => (
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
                      <div style={s.patientAvatar}>
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span style={s.patientName}>{p.name}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.ageChip}>{p.age} ans</span></td>
                  <td style={s.td}>{p.type}</td>
                  <td style={s.td}>{p.organe}</td>
                  <td style={s.td}>
                    <span style={s.stadeChip}>Stade {p.stade}</span>
                  </td>
                  <td style={s.td}>{p.date}</td>
                  <td style={s.td}>
                    <span style={{ ...s.statusBadge, ...STATUS_COLORS[p.status] }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={s.actionBtns}>
                      <button style={s.iconBtn} title="Voir">👁</button>
                      <button style={s.iconBtn} title="Modifier">✏</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...s.td, textAlign: 'center', color: '#7A8BAD', padding: 32 }}>
                    Aucun patient trouvé pour « {search} »
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>{/* /main */}
    </div>
  );
}

/* ─── STYLES ─── */
const s = {
  root: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'Nunito', sans-serif",
    background: '#EEF2FF',
  },
  /* sidebar */
  sidebar: {
    width: 240, flexShrink: 0,
    background: 'linear-gradient(170deg, #1a2f6b 0%, #0f1c3f 100%)',
    display: 'flex', flexDirection: 'column',
    padding: '28px 16px',
    position: 'sticky', top: 0, height: '100vh',
  },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  brandIcon: {
    width: 38, height: 38,
    background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)',
    borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, color: '#fff', boxShadow: '0 5px 15px rgba(74,108,247,0.5)',
  },
  brandName: {
    fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px', borderRadius: 12,
    border: 'none', background: 'transparent',
    fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600,
    color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: '0.2s',
    textAlign: 'left', width: '100%',
  },
  navActive: {
    background: 'rgba(74,108,247,0.3)',
    color: '#fff', fontWeight: 800,
    boxShadow: '0 2px 12px rgba(74,108,247,0.25)',
  },
  navIcon: { fontSize: 17, width: 20, textAlign: 'center' },
  sidebarBottom: { display: 'flex', flexDirection: 'column', gap: 10 },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', background: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 13,
  },
  userName: { fontSize: 13, fontWeight: 800, color: '#fff' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
  logoutBtn: {
    padding: '9px 14px', background: 'rgba(255,107,107,0.15)',
    color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.25)',
    borderRadius: 10, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: '0.2s',
  },
  /* main */
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 28,
  },
  topbarTitle: {
    fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A',
  },
  topbarSub: { fontSize: 13, color: '#7A8BAD', fontWeight: 600, marginTop: 2 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A8BAD' },
  searchInput: {
    background: '#fff', border: '1.5px solid #DDE4F3',
    borderRadius: 30, padding: '10px 16px 10px 38px',
    fontSize: 13, fontFamily: "'Nunito', sans-serif", color: '#1A2B4A',
    outline: 'none', width: 280,
  },
  notifBtn: {
    width: 38, height: 38, border: 'none', background: '#fff',
    borderRadius: '50%', cursor: 'pointer', fontSize: 16,
    boxShadow: '0 4px 14px rgba(74,108,247,0.1)',
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 13,
    boxShadow: '0 4px 14px rgba(74,108,247,0.3)',
  },
  /* stats */
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 },
  statCard: {
    background: '#fff', borderRadius: 16, padding: '20px 20px',
    boxShadow: '0 4px 20px rgba(74,108,247,0.08)',
    display: 'flex', alignItems: 'center', gap: 16,
    border: '1.5px solid #EEF2FF',
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
  },
  statInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  statValue: { fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A2B4A' },
  statLabel: { fontSize: 12, color: '#7A8BAD', fontWeight: 600 },
  statDelta: { fontSize: 11, fontWeight: 800, marginTop: 2 },
  /* section */
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#1A2B4A' },
  viewAllBtn: {
    background: 'none', border: 'none', color: '#4A6CF7',
    fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
  },
  /* actions */
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 28 },
  actionCard: {
    background: '#fff', borderRadius: 16, padding: '20px 14px',
    border: '1.5px solid #EEF2FF', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    transition: '0.22s', position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(74,108,247,0.06)',
    fontFamily: "'Nunito', sans-serif",
  },
  actionHighlight: {
    border: '2px solid rgba(74,108,247,0.3)',
    background: 'linear-gradient(135deg, rgba(74,108,247,0.05), rgba(107,135,255,0.03))',
    boxShadow: '0 8px 28px rgba(74,108,247,0.18)',
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, color: '#fff',
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
  },
  actionLabel: { fontSize: 13, fontWeight: 800, color: '#1A2B4A', textAlign: 'center' },
  actionSub: { fontSize: 11, color: '#7A8BAD', fontWeight: 600, textAlign: 'center' },
  highlightBadge: {
    position: 'absolute', top: 10, right: 10,
    background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)',
    color: '#fff', fontSize: 9, fontWeight: 900,
    padding: '3px 8px', borderRadius: 30,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  /* table */
  tableWrap: {
    background: '#fff', borderRadius: 16,
    overflow: 'hidden', boxShadow: '0 4px 20px rgba(74,108,247,0.08)',
    border: '1.5px solid #EEF2FF',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F5F8FF' },
  th: {
    padding: '13px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 900, color: '#7A8BAD',
    textTransform: 'uppercase', letterSpacing: '0.9px',
    borderBottom: '1.5px solid #EEF2FF', whiteSpace: 'nowrap',
  },
  tr: { transition: '0.15s' },
  td: { padding: '13px 16px', fontSize: 13, color: '#1A2B4A', fontWeight: 600, borderBottom: '1px solid #EEF2FF' },
  dossierId: { fontSize: 11, fontWeight: 800, color: '#4A6CF7', fontFamily: "'Poppins', sans-serif" },
  patientCell: { display: 'flex', alignItems: 'center', gap: 10 },
  patientAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg,#4A6CF7,#6B87FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0,
  },
  patientName: { fontWeight: 700, color: '#1A2B4A' },
  ageChip: {
    background: '#F0F4FF', color: '#4A6CF7',
    padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 800,
  },
  stadeChip: {
    background: 'rgba(255,162,107,0.12)', color: '#FFA26B',
    border: '1px solid rgba(255,162,107,0.25)',
    padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 800,
  },
  statusBadge: {
    padding: '4px 12px', borderRadius: 30,
    fontSize: 12, fontWeight: 800, border: '1.5px solid',
  },
  actionBtns: { display: 'flex', gap: 6 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8,
    border: '1.5px solid #DDE4F3', background: '#F5F8FF',
    cursor: 'pointer', fontSize: 13, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
};