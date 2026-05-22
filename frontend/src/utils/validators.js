export function validatePhone(p) {
  if (!p) return true;
  return /^0[567]\d{8}$/.test(p.replace(/\s/g, ''));
}

export function validateNIN(n) {
  if (!n) return true;
  return /^\d{18}$/.test(n.replace(/\s/g, ''));
}
