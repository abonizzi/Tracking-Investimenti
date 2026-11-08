import type { Data, Snapshot } from '../store'
import { toEur } from './money'
export interface Flow { day: string; eur: number }
/** Flussi esterni in EUR: versamenti (+), contributi (+), entrate (+), uscite (-), vendite non accreditate a un conto (-). Le vendite accreditate e i trasferimenti sono neutri. */
export function flows(d: Data): { flows: Flow[]; partial: boolean } {
  const out: Flow[] = []; let partial = false
  const add = (day: string, c: number, cur: string) => { const e = toEur(c, cur, d.rates); if (e === null) partial = true; else out.push({ day, eur: e }) }
  const invCur = (id: string) => d.investments.find(i => i.id === id)?.currency ?? 'EUR'
  d.movements.forEach(m => { if (m.kind === 'versamento') add(m.date, m.amount, invCur(m.investmentId)); else if (!m.accMovementId) add(m.date, -m.amount, invCur(m.investmentId)) })
  d.pensionMovements.forEach(m => add(m.date, m.amount, d.pensions.find(p => p.id === m.pensionId)?.currency ?? 'EUR'))
  d.accMovements.forEach(m => { const cur = d.accounts.find(a => a.id === m.accountId)?.currency ?? 'EUR'; if (m.kind === 'entrata') add(m.date, m.amount, cur); else if (m.kind === 'uscita') add(m.date, -m.amount, cur) })
  return { flows: out, partial }
}
/** Crescita rispetto al primo snapshot, al netto dei flussi esterni successivi: separa rendimento da versamenti/prelievi. */
export function growthSeries(snaps: Snapshot[], fl: Flow[]) {
  if (!snaps.length) return []
  const d0 = snaps[0].day
  return snaps.map(s => ({ day: s.day, total: s.total, growth: s.total - snaps[0].total - fl.filter(f => f.day > d0 && f.day <= s.day).reduce((a, f) => a + f.eur, 0) }))
}
