// The shop was renamed from Ikbar Barbershop to Dinasti Barbershop, but older CMS rows may still say "Ikbar".
// The barber himself is still Ikbar Kamil, so only the shop name is rewritten.
export function toDinasti(value) {
  if (typeof value !== 'string') return value
  return value.replace(/\bikbar\b(?!\s+kamil)/gi, (m) => (m === m.toUpperCase() ? 'DINASTI' : 'Dinasti'))
}
