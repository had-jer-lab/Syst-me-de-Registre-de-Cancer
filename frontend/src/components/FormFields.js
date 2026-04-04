import React from 'react';

/* ── Tag selector ──
   options : tableau de valeurs envoyées au contexte
   labels  : tableau de libellés affichés (optionnel, = options si absent)
*/
export function TagGroup({ options, labels, value, onChange, className = '' }) {
  return (
    <div className={`tag-group ${className}`}>
      {options.map((opt, i) => (
        <button
          key={opt}
          className={`tag ${value === opt ? 'sel' : ''}`}
          onClick={() => onChange(value === opt ? '' : opt)}
          type="button"
        >
          {labels ? labels[i] : opt}
        </button>
      ))}
    </div>
  );
}

/* ── Circle selector ── */
const cirColors = ['a1', 'a2', 'a3', 'a4'];
export function CircleGroup({ options, value, onChange }) {
  return (
    <div className="circle-row">
      {options.map((opt, i) => (
        <button
          key={opt}
          className={`cir ${value === opt ? cirColors[i % cirColors.length] : ''}`}
          onClick={() => onChange(value === opt ? '' : opt)}
          type="button"
        >
          {opt}
        </button>
      ))}
      <div className="cir more">…</div>
    </div>
  );
}

/* ── Toggle ── */
export function Toggle({ label, checked, onChange }) {
  return (
    <div className="toggle-row">
      <label className="tgl">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className="tgl-track" />
      </label>
      <span className="tgl-label">{label}</span>
    </div>
  );
}

/* ── Field ── */
export function Field({ label, children, className = '' }) {
  return (
    <div className={`fg ${className}`}>
      {label && <div className="fl">{label}</div>}
      {children}
    </div>
  );
}

/* ── Input with icon ── */
export function IconInput({ icon, unit, ...props }) {
  return (
    <div className="fi-wrap">
      {icon && <span className="fi-icon">{icon}</span>}
      <input className="fi" {...props} />
      {unit && <span className="fi-unit">{unit}</span>}
    </div>
  );
}

/* ── Select ── */
export function Select({ options, placeholder, ...props }) {
  return (
    <select className="fi" {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt =>
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  );
}

/* ── Section card ── */
export function SC({ label, children, style }) {
  return (
    <div className="sc" style={style}>
      {label && <div className="sc-label">{label}</div>}
      {children}
    </div>
  );
}

/* ── Page header ── */
export function PageHeader({ icon, iconBg, title, step }) {
  return (
    <div className="pg-header">
      <div className="pg-title">
        <div className="pg-icon" style={{ background: iconBg }}>{icon}</div>
        {title}
      </div>
      <div className="pg-badge">Étape <b>{step}</b> / 5</div>
    </div>
  );
}

/* ── Button row ── */
export function BtnRow({ onBack, onNext, nextLabel = 'Suivant →', nextClass = 'btn-primary', backLabel = '← Précédent' }) {
  return (
    <div className="btn-row">
      {onBack && (
        <button className="btn btn-ghost" onClick={onBack} type="button">{backLabel}</button>
      )}
      {onNext && (
        <button className={`btn ${nextClass}`} onClick={onNext} type="button">{nextLabel}</button>
      )}
    </div>
  );
}

/* ── Imagerie card ── */
export function ImgCard({ icon, label, selected, onToggle }) {
  return (
    <div className={`img-card ${selected ? 'sel' : ''}`} onClick={onToggle}>
      <div className="img-icon">{icon}</div>
      {label}
    </div>
  );
}

/* ── Summary info item ── */
export function InfoItem({ label, value, unit = '' }) {
  const isEmpty = !value || value.toString().trim() === '';
  return (
    <div className="info-item">
      <div className="info-key">{label}</div>
      <div className={`info-val ${isEmpty ? 'empty' : ''}`}>
        {isEmpty ? 'Non renseigné' : value + unit}
      </div>
    </div>
  );
}