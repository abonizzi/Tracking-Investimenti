// Importi in centesimi (interi): nessun errore floating point.
export const toCents = (v: number | string): number => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  if (!Number.isFinite(n)) throw new Error('Importo non valido')
  return Math.round(n * 100)
}
let hidden = false
export const setHidden = (v: boolean) => { hidden = v }
export const fmt = (c: number, cur = 'EUR'): string => hidden ? '••••' :
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: cur }).format(c / 100)
// Cambi: 1 unità estera = X EUR. Cambio mancante → null (nessuna conversione inventata).
export type Rates = Record<string, number>
export const toEur = (cents: number, cur: string, rates: Rates): number | null => {
  if (cur === 'EUR') return cents
  const r = rates[cur]
  return r && r > 0 ? Math.round(cents * r) : null
}
