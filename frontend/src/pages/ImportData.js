import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DuplicateDetectionModal from '../components/DuplicateDetectionModal';

// ── API helper ────────────────────────────────────────────────────────────────
const API = 'http://localhost:8000/api';
function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('access_token');
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

// ── CSV parser (simple, no external lib) ─────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

// ── Strip accents from a string key ──────────────────────────────────────────
function normKey(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

// ── Map CSV/XLSX row to normalized patient object ────────────────────────────
function rowToPatient(row) {
  // Build accent-stripped key map so "prénom" matches "prenom", "téléphone" matches "telephone"
  const normRow = {};
  Object.entries(row).forEach(([k, v]) => { normRow[normKey(k)] = (v || '').toString().trim(); });

  const g = (...keys) => {
    for (const k of keys) {
      const v = normRow[normKey(k)] || '';
      if (v) return v;
    }
    return '';
  };

  const last  = g('nom', 'last_name', 'nom_famille', 'famille');
  const first = g('prenom', 'first_name', 'firstname', 'prénom');
  const full  = g('nom_complet', 'patient', 'name', 'full_name');

  const nom = (last && first) ? (first + ' ' + last).trim()
            : (last || first || full || '').trim();

  return {
    nin:           g('nin', 'national_id', 'id_national', 'nid', 'identifiant'),
    nom,
    dateNaissance: g('date_naissance', 'dob', 'date naissance', 'naissance', 'date de naissance'),
    telephone:     g('telephone', 'tel', 'phone', 'gsm'),
    wilaya:        g('wilaya'),
    commune:       g('commune'),
    organe:        g('organe', 'cancer', 'type_cancer', 'cancer_type'),
    stade:         g('stade', 'stade_clinique', 'stage'),
    traitement:    g('traitement', 'treatment', 'trt'),
    medecin:       g('medecin', 'doctor', 'praticien'),
    _raw:          row,
  };
}

// ── Fuzzy helpers (same as Page5) ─────────────────────────────────────────────
function normStr(s = '') {
  return s.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}
function strSim(a, b) {
  if (!a || !b) return 0;
  const na = normStr(a), nb = normStr(b);
  if (na === nb) return 100;
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 100 : Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}

// ── Normalize API patient → modal format ─────────────────────────────────────
function normalizeApiPatient(p) {
  const cd = v => (!v || v === '—' || v === '-') ? '' : v;
  const rawCancers = Array.isArray(p.cancers) ? p.cancers : [];
  const cancers = rawCancers.length > 0
    ? rawCancers.map(c => {
        if (typeof c === 'string') return c;
        const name  = cd(c.cancer_type_name || c.organe || c.name || '');
        const stade = cd(c.stade_clinique || c.stade_pathologique || '');
        if (!name && !stade) return null;
        return name ? (stade ? `${name} (Stade ${stade})` : name) : `Cancer Stade ${stade}`;
      }).filter(Boolean)
    : (() => {
        const dc = p.dernier_cancer;
        if (!dc) return [];
        const name  = cd(dc.organe || '');
        const stade = cd(dc.stade || '');
        return name || stade ? [name ? (stade ? `${name} (Stade ${stade})` : name) : `Cancer Stade ${stade}`] : [];
      })();
  const traitements = rawCancers.flatMap(c =>
    typeof c === 'object' ? (c.treatments || []).map(t => cd(t.type_traitement || t.protocole || '')) : []
  ).filter(Boolean);

  return {
    id:            p.id,
    nin:           p.national_id || '',
    nom:           p.last_name ? `${p.first_name || ''} ${p.last_name}`.trim() : (p.full_name || ''),
    dateNaissance: p.date_naissance || '',
    telephone:     p.phone || '',
    wilaya:        cd(p.wilaya_name || ''),
    commune:       cd(p.commune_name || ''),
    medecin:       p.medecin_nom || '',
    cancers,
    traitements,
    age:           p.age || '',
    cree:          p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '',
  };
}

// ── Row → modal candidate format ─────────────────────────────────────────────
function rowToModalCandidate(row) {
  return {
    nin:           row.nin,
    nom:           row.nom,
    dateNaissance: row.dateNaissance,
    telephone:     row.telephone,
    wilaya:        row.wilaya,
    commune:       row.commune,
    medecin:       row.medecin,
    cancers:       row.organe ? [row.stade ? `${row.organe} (Stade ${row.stade})` : row.organe] : [],
    traitements:   row.traitement ? [row.traitement] : [],
    age:           '',
    cree:          '',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ImportData() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [phase,          setPhase]          = useState('idle');   // idle|uploading|done|error
  const [progress,       setProgress]       = useState(0);
  const [parsedRows,     setParsedRows]      = useState([]);
  const [importStats,    setImportStats]     = useState(null);    // {imported, skipped, errors}
  const [duplicates,     setDuplicates]      = useState([]);      // [{rowPatient, existing, score, id}]
  const [modalData,      setModalData]       = useState(null);    // {existing, candidate, rowIndex}
  const [resolvedCount,  setResolvedCount]   = useState(0);
  const [errorMsg,       setErrorMsg]        = useState('');

  // ── Parse file ──────────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx'].includes(ext)) {
      setErrorMsg('Format non supporté. Utilisez .csv ou .xlsx');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Fichier trop grand (max 10MB)');
      return;
    }

    setPhase('uploading');
    setProgress(0);
    setErrorMsg('');
    setDuplicates([]);
    setImportStats(null);

    try {
      let rows = [];

      if (ext === 'csv') {
        const text = await file.text();
        rows = parseCSV(text).map(rowToPatient);
      } else {
        // xlsx — use SheetJS via CDN dynamically
        setErrorMsg('');
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs').catch(() => null);
        if (!XLSX) {
          setErrorMsg('Impossible de charger le parseur Excel. Utilisez .csv');
          setPhase('error');
          return;
        }
        const buf = await file.arrayBuffer();
        const wb  = XLSX.read(buf, { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json(ws, { defval: '' });
        rows = arr.map(r => rowToPatient(
          Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().trim(), String(v)]))
        ));
      }

      if (rows.length === 0) {
        setPhase('done');
        setImportStats({ imported: 0, skipped: 0, errors: 0, duplicatesFound: 0 });
        setParsedRows([]);
        setProgress(100);
        return;
      }

      setParsedRows(rows);

      // ── Check duplicates via API for each row ────────────────────────────────
      const token = localStorage.getItem('access_token');
      const foundDuplicates = [];
      let imported = 0, errors = 0;

      // Track rows already seen in THIS file (intra-file dedup)
      const seenNINs  = new Map();  // nin  -> row index
      const seenNames = new Map();  // nom normalized -> row index

      for (let i = 0; i < rows.length; i++) {
        setProgress(Math.round(((i + 1) / rows.length) * 85));
        const row = rows[i];

        // Skip completely empty rows
        if (!row.nom && !row.nin) continue;

        try {
          // ── Check intra-file duplicate first ──────────────────────────────
          const rowNomNorm = normStr(row.nom || '');

          if (row.nin && seenNINs.has(row.nin)) {
            const prevIdx = seenNINs.get(row.nin);
            foundDuplicates.push({
              id: `dup-intra-${i}`, rowIndex: i, row,
              existing: rowToModalCandidate(rows[prevIdx]),
              score: 100, reason: `Doublon interne (ligne ${prevIdx + 2})`, isIntra: true,
            });
            continue;
          }
          if (rowNomNorm && seenNames.has(rowNomNorm)) {
            const prevIdx = seenNames.get(rowNomNorm);
            foundDuplicates.push({
              id: `dup-intra-${i}`, rowIndex: i, row,
              existing: rowToModalCandidate(rows[prevIdx]),
              score: 98, reason: `Doublon interne — nom identique (ligne ${prevIdx + 2})`, isIntra: true,
            });
            continue;
          }

          // Register as seen
          if (row.nin) seenNINs.set(row.nin, i);
          if (rowNomNorm) seenNames.set(rowNomNorm, i);

          // Search by NIN first (exact)
          if (row.nin) {
            const ninRes = await apiFetch(`/patients/?national_id=${encodeURIComponent(row.nin)}`);
            if (ninRes.ok) {
              const ninData = await ninRes.json();
              const existing = (ninData.results || ninData)?.[0];
              if (existing) {
                // Fetch detail for full cancers/treatments
                let fullExisting = existing;
                try {
                  const det = await apiFetch(`/patients/${existing.id}/`);
                  if (det.ok) fullExisting = await det.json();
                } catch(_) {}
                foundDuplicates.push({
                  id:        `dup-${i}`,
                  rowIndex:  i,
                  row,
                  existing:  normalizeApiPatient(fullExisting),
                  score:     100,
                  reason:    'NIN identique',
                });
                continue;
              }
            }
          }

          // Search by name (fuzzy)
          if (row.nom) {
            const q = encodeURIComponent(row.nom);
            const nameRes = await apiFetch(`/patients/?search=${q}`);
            if (nameRes.ok) {
              const nameData = await nameRes.json();
              const list = nameData.results || nameData || [];
              let bestScore = 0, bestRaw = null;
              list.forEach(p => {
                const pNom = p.last_name ? `${p.first_name || ''} ${p.last_name}`.trim() : '';
                const nameSim = strSim(row.nom, pNom);
                // Also check NIN
                const ninSim  = row.nin && p.national_id ? strSim(row.nin, p.national_id) * 3 : 0;
                const score   = Math.round((nameSim * 2 + ninSim) / (row.nin ? 5 : 2));
                if (score > bestScore) { bestScore = score; bestRaw = p; }
              });
              if (bestScore >= 70 && bestRaw) {
                let fullBest = bestRaw;
                try {
                  const det = await apiFetch(`/patients/${bestRaw.id}/`);
                  if (det.ok) fullBest = await det.json();
                } catch(_) {}
                foundDuplicates.push({
                  id:       `dup-${i}`,
                  rowIndex: i,
                  row,
                  existing: normalizeApiPatient(fullBest),
                  score:    bestScore,
                  reason:   `Similarité ${bestScore}%`,
                });
                continue;
              }
            }
          }

          imported++;
        } catch(e) {
          errors++;
        }
      }

      setProgress(100);
      setDuplicates(foundDuplicates);
      const validRows = rows.filter(r => r.nom || r.nin).length;
      setImportStats({
        total:           rows.length,
        imported:        Math.max(0, validRows - foundDuplicates.length - errors),
        duplicatesFound: foundDuplicates.length,
        errors,
      });
      setPhase('done');

    } catch(e) {
      console.error(e);
      setErrorMsg('Erreur lors du parsing: ' + e.message);
      setPhase('error');
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  // ── Modal handlers ──────────────────────────────────────────────────────────
  const openModal = (dup) => {
    setModalData({
      existing:   dup.existing,
      candidate:  rowToModalCandidate(dup.row),
      dupId:      dup.id,
      existingId: dup.existing.id || null,
      isIntra:    dup.isIntra || false,
    });
  };

  const handleModalConfirm = async (fusionData, note, existingId, action) => {
    setModalData(null);
    const dupId = modalData?.dupId;

    if (action === 'garder_separe') {
      // Mark as resolved — will create new patient at validate
      setDuplicates(prev => prev.map(d => d.id === dupId ? { ...d, resolved: 'garder', fusionData } : d));
    } else {
      if (modalData?.isIntra || !existingId) {
        // Intra-file doublon — no DB record yet, just mark resolved
        setDuplicates(prev => prev.map(d => d.id === dupId ? { ...d, resolved: 'merged', fusionData } : d));
      } else {
        // DB doublon — PATCH existing patient
        try {
          const nameParts = (fusionData.nom || '').trim().split(' ');
          await apiFetch(`/patients/${existingId}/`, {
            method: 'PATCH',
            body: JSON.stringify({
              first_name:     nameParts[0] || '',
              last_name:      nameParts.slice(1).join(' ') || '',
              date_naissance: fusionData.dateNaissance || '',
              phone:          fusionData.telephone || '',
            }),
          });
          setDuplicates(prev => prev.map(d => d.id === dupId ? { ...d, resolved: 'merged', fusionData } : d));
        } catch(e) {
          console.error('Merge error:', e);
        }
      }
    }
    setResolvedCount(c => c + 1);
  };

  // ── Validate import ─────────────────────────────────────────────────────────
  const validateImport = async () => {
    // Create patients that have no duplicate or are marked 'garder_separe'
    const unresolved = duplicates.filter(d => !d.resolved);
    if (unresolved.length > 0) {
      alert(`Veuillez résoudre les ${unresolved.length} doublon(s) restant(s) avant de valider.`);
      return;
    }
    navigate('/dashboard');
  };

  const allResolved = duplicates.length === 0 || duplicates.every(d => d.resolved);

  // ══════════════════════════════════════════════════════
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={s.logoText}>Import Données</div>
        </div>
        <div style={s.userSection}>
          <div style={s.notifIcon}>🔔</div>
          <div style={s.userAvatar}>DR</div>
        </div>
      </div>

      <div style={s.container}>
        {/* Upload Card */}
        <div style={s.uploadCard}>
          <div style={s.uploadArea} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
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
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
            <button style={s.browseBtn} onClick={() => fileInputRef.current.click()}>
              Parcourir
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            {/* Progress */}
            {phase === 'uploading' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ ...s.progressTrack }}>
                  <div style={{ ...s.progressBar, width: `${progress}%` }} />
                </div>
                <div style={{ color: '#718096', fontSize: 14, marginTop: 8 }}>
                  Analyse en cours… {progress}%
                </div>
              </div>
            )}

            {/* Done */}
            {phase === 'done' && (
              <div style={{ marginTop: 24 }}>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressBar, width: '100%' }} />
                </div>
                <div style={s.successMsg}>
                  <span style={s.checkIcon}>✓</span>
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

        {/* Doublons Card */}
        {phase === 'done' && duplicates.length > 0 && (
          <div style={s.duplicatesCard}>
            <div style={s.duplicatesHeader}>
              <div style={s.warningIcon}>⚠</div>
              <div style={s.duplicatesTitle}>
                Doublons détectés <span style={{ color: '#718096' }}>({duplicates.length})</span>
              </div>
            </div>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Patient (fichier)</th>
                  <th style={s.th}>Correspondance DB</th>
                  <th style={s.th}>Similarité</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.map(d => {
                  const initials = (d.row.nom || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const resolved = d.resolved;
                  return (
                    <tr key={d.id} style={{ opacity: resolved ? 0.55 : 1 }}>
                      <td style={s.td}>
                        <div style={s.patientCell}>
                          <div style={{ ...s.patientAvatar, background: resolved ? '#a0aec0' : 'linear-gradient(135deg,#4A90E2,#5CA0F2)' }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#2d3748' }}>{d.row.nom || '—'}</div>
                            {d.row.nin && <div style={{ fontSize: 11, color: '#718096' }}>NIN: {d.row.nin}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: 13, color: '#4a5568', fontWeight: 600 }}>{d.existing.nom}</div>
                        <div style={{ fontSize: 11, color: '#a0aec0' }}>Base #{d.existing.id}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${d.score}%`, height: '100%', background: d.score >= 90 ? '#48bb78' : d.score >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: d.score >= 90 ? '#48bb78' : '#f59e0b', minWidth: 34 }}>{d.score}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 3 }}>{d.reason}</div>
                      </td>
                      <td style={s.td}>
                        {resolved ? (
                          <span style={{ fontSize: 12, color: '#48bb78', fontWeight: 700 }}>
                            {resolved === 'merged' ? '✓ Fusionné' : '✓ Gardé séparément'}
                          </span>
                        ) : (
                          <div style={s.actionBtns}>
                            <button style={{ ...s.btn, ...s.btnMerge }} onClick={() => openModal(d)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 10H7M7 10l4-4M7 10l4 4"/>
                              </svg>
                              Fusionner
                            </button>
                            <button style={{ ...s.btn, ...s.btnIgnore }}
                              onClick={() => setDuplicates(prev => prev.map(dd => dd.id === d.id ? { ...dd, resolved: 'garder' } : dd))}>
                              Ignorer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* No duplicates message */}
        {phase === 'done' && duplicates.length === 0 && importStats && (
          <div style={{ ...s.duplicatesCard, textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2d3748' }}>Aucun doublon détecté</div>
            <div style={{ fontSize: 14, color: '#718096', marginTop: 6 }}>
              {importStats.total} patient(s) prêts à être importés
            </div>
          </div>
        )}

        {/* Validate */}
        {phase === 'done' && (
          <div style={{ ...s.duplicatesCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, background: '#C6F6D5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48bb78', fontWeight: 'bold' }}>✓</div>
              <div>
                <div style={{ fontWeight: 700, color: '#2d3748' }}>Prêt à valider</div>
                {!allResolved && <div style={{ fontSize: 12, color: '#f59e0b' }}>Résolvez d'abord tous les doublons</div>}
              </div>
            </div>
            <button
              style={{ ...s.btnValidate, opacity: allResolved ? 1 : 0.5, cursor: allResolved ? 'pointer' : 'not-allowed' }}
              onClick={validateImport}>
              Valider Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page:          { minHeight: '100vh', background: 'linear-gradient(135deg,#e3e8f7 0%,#f0e7f7 100%)', padding: 20, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', borderRadius: 15, marginBottom: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  logoSection:   { display: 'flex', alignItems: 'center', gap: 15 },
  logo:          { width: 50, height: 50, background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  logoText:      { fontSize: 24, color: '#4a5568', fontWeight: 500 },
  userSection:   { display: 'flex', alignItems: 'center', gap: 20 },
  notifIcon:     { width: 40, height: 40, borderRadius: '50%', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  userAvatar:    { width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#4A90E2,#5CA0F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 },
  container:     { maxWidth: 900, margin: '0 auto' },
  uploadCard:    { background: 'linear-gradient(135deg,rgba(226,232,250,0.5),rgba(236,227,247,0.5))', borderRadius: 30, padding: 60, marginBottom: 30, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  uploadArea:    { background: 'rgba(255,255,255,0.7)', borderRadius: 25, padding: '60px 40px', textAlign: 'center', backdropFilter: 'blur(10px)' },
  uploadIconWrap:{ width: 140, height: 140, margin: '0 auto 30px', background: 'linear-gradient(135deg,rgba(255,255,255,0.8),rgba(240,245,255,0.8))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(74,144,226,0.1)', boxShadow: '0 10px 40px rgba(74,144,226,0.15)' },
  uploadIcon:    { width: 80, height: 80, color: '#4A90E2' },
  uploadTitle:   { fontSize: 28, color: '#2d3748', marginBottom: 10, fontWeight: 600 },
  uploadSubtitle:{ fontSize: 20, color: '#718096', marginBottom: 20 },
  uploadInfo:    { color: '#a0aec0', fontSize: 14, marginBottom: 30 },
  browseBtn:     { background: 'white', color: '#718096', border: 'none', padding: '12px 30px', borderRadius: 12, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'inline-flex', alignItems: 'center', gap: 10 },
  progressTrack: { width: '100%', height: 8, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' },
  progressBar:   { height: '100%', background: 'linear-gradient(90deg,#4A90E2,#9F7AEA,#F6AD55)', borderRadius: 10, transition: 'width 0.3s ease', boxShadow: '0 2px 10px rgba(74,144,226,0.3)' },
  successMsg:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#48bb78', fontSize: 16, marginTop: 12 },
  checkIcon:     { width: 24, height: 24, background: '#48bb78', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
  statChip:      (color) => ({ background: color + '18', color, border: `1px solid ${color}44`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }),
  duplicatesCard:{ background: 'white', borderRadius: 20, padding: 30, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  duplicatesHeader:{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 25 },
  warningIcon:   { width: 30, height: 30, background: '#FED7D7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53E3E', fontWeight: 'bold' },
  duplicatesTitle:{ fontSize: 20, color: '#2d3748', fontWeight: 600 },
  table:         { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
  thead:         { textAlign: 'left' },
  th:            { padding: '12px 15px', color: '#718096', fontWeight: 500, fontSize: 14 },
  td:            { padding: 15, background: '#f7fafc' },
  patientCell:   { display: 'flex', alignItems: 'center', gap: 12 },
  patientAvatar: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14, flexShrink: 0 },
  actionBtns:    { display: 'flex', gap: 8 },
  btn:           { padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, transition: '0.2s' },
  btnMerge:      { background: 'linear-gradient(135deg,#5CA0F2,#4A90E2)', color: 'white', boxShadow: '0 2px 8px rgba(74,144,226,0.3)' },
  btnIgnore:     { background: 'white', color: '#718096', border: '1px solid #e2e8f0' },
  btnValidate:   { padding: '13px 40px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#5CA0F2,#4A90E2)', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,144,226,0.35)', transition: '0.2s' },
};