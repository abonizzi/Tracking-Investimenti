import type { Data } from '../store'
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const intNN = (x: unknown) => typeof x === 'number' && Number.isInteger(x) && x >= 0
const cur = (x: unknown) => typeof x === 'string' && /^[A-Z]{3}$/.test(x)
const COLL = ['investments', 'movements', 'accounts', 'accMovements', 'pensions', 'pensionMovements', 'pacs', 'pacPayments'] as const
export const exportBackup = (d: Data) => JSON.stringify({ app: 'mio-portafoglio', version: 1, exportedAt: new Date().toISOString(), data: d }, null, 2)

export type Parsed = { ok: true; data: Data } | { ok: false; error: string }
export function parseBackup(text: string): Parsed {
  let j: unknown
  try { j = JSON.parse(text) } catch { return { ok: false, error: 'File non valido (JSON illeggibile)' } }
  if (!isObj(j) || j.app !== 'mio-portafoglio' || !isObj(j.data)) return { ok: false, error: 'Non è un backup di Mio Portafoglio' }
  if (j.version !== 1) return { ok: false, error: 'Versione del backup non supportata' }
  const d = j.data
  for (const k of COLL) {
    const arr = d[k] ?? []
    if (!Array.isArray(arr)) return { ok: false, error: `Sezione "${k}" non valida` }
    const ids = new Set<string>()
    for (const it of arr) {
      if (!isObj(it) || typeof it.id !== 'string' || !it.id) return { ok: false, error: `Elemento senza id in "${k}"` }
      if (ids.has(it.id)) return { ok: false, error: `Id duplicato in "${k}"` }
      ids.add(it.id)
      if (['investments', 'pensions'].includes(k) && !(intNN(it.invested) && intNN(it.value) && cur(it.currency))) return { ok: false, error: `Importi o valuta non validi in "${k}"` }
      if (k === 'accounts' && !(Number.isInteger(it.balance) && cur(it.currency))) return { ok: false, error: 'Conto non valido' }
      if (['movements', 'pensionMovements', 'pacPayments'].includes(k) && typeof it.amount !== 'number') return { ok: false, error: `Importo non valido in "${k}"` }
    }
  }
  const rates = d.rates ?? {}
  if (!isObj(rates) || Object.values(rates).some(v => typeof v !== 'number' || !(v > 0))) return { ok: false, error: 'Cambi non validi' }
  if (!intNN(d.goal ?? 0)) return { ok: false, error: 'Obiettivo non valido' }
  const snaps = d.snapshots ?? []
  if (!Array.isArray(snaps) || snaps.some(s => !isObj(s) || typeof s.day !== 'string' || !Number.isInteger(s.total))) return { ok: false, error: 'Snapshot non validi' }
  const out: Record<string, unknown> = { rates, goal: d.goal ?? 0, snapshots: snaps }
  for (const k of COLL) out[k] = d[k] ?? []
  return { ok: true, data: out as unknown as Data }
}
/** Unione: aggiunge solo gli elementi con id nuovo, non sovrascrive nulla di esistente. */
export function mergeData(cur: Data, inc: Data): { data: Data; added: number } {
  let added = 0
  const out: Record<string, unknown> = { ...cur }
  for (const k of COLL) {
    const have = new Set((cur[k] as { id: string }[]).map(x => x.id))
    const fresh = (inc[k] as { id: string }[]).filter(x => !have.has(x.id)); added += fresh.length
    out[k] = [...(cur[k] as unknown[]), ...fresh]
  }
  const days = new Set(cur.snapshots.map(s => s.day)); const fs = inc.snapshots.filter(s => !days.has(s.day)); added += fs.length
  out.snapshots = [...cur.snapshots, ...fs].sort((a, b) => a.day.localeCompare(b.day))
  out.rates = { ...inc.rates, ...cur.rates }; out.goal = cur.goal || inc.goal
  return { data: out as unknown as Data, added }
}
