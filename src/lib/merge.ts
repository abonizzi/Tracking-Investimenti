import type { Data } from '../store'
/** Merge a tre vie (base = ultimo stato sincronizzato) per elemento. Conflitto solo se entrambi i lati cambiano lo stesso elemento in modo diverso. */
const COLL = ['investments', 'movements', 'accounts', 'accMovements', 'pensions', 'pensionMovements', 'pacs', 'pacPayments', 'snapshots'] as const
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const pick = <T,>(b: T | undefined, l: T | undefined, r: T | undefined): { v: T | undefined; conflict: boolean } =>
  eq(l, r) ? { v: l, conflict: false } : eq(l, b) ? { v: r, conflict: false } : eq(r, b) ? { v: l, conflict: false } : { v: l, conflict: true }
export type MergeResult = { ok: true; data: Data } | { ok: false; conflicts: string[] }
export function merge3(base: Data, local: Data, remote: Data): MergeResult {
  const conflicts: string[] = []; const out: Record<string, unknown> = {}
  for (const c of COLL) {
    const key = (x: { id?: string; day?: string }) => (c === 'snapshots' ? x.day : x.id) as string
    const idx = (a: unknown[]) => new Map((a as { id?: string; day?: string }[]).map(x => [key(x), x]))
    const B = idx(base[c] ?? []), L = idx(local[c] ?? []), R = idx(remote[c] ?? []); const res: unknown[] = []
    for (const k of new Set([...B.keys(), ...L.keys(), ...R.keys()])) {
      const p = pick(B.get(k), L.get(k), R.get(k)); if (p.conflict) { conflicts.push(`${c}:${k}`); continue }
      if (p.v) res.push(p.v)
    }
    if (c === 'snapshots') (res as { day: string }[]).sort((a, b) => a.day.localeCompare(b.day))
    out[c] = res
  }
  const g = pick(base.goal, local.goal, remote.goal); if (g.conflict) conflicts.push('obiettivo'); out.goal = g.v
  const rates: Record<string, number> = {}
  for (const k of new Set([...Object.keys(base.rates), ...Object.keys(local.rates), ...Object.keys(remote.rates)])) {
    const p = pick(base.rates[k], local.rates[k], remote.rates[k]); if (p.conflict) conflicts.push(`cambio:${k}`); else if (p.v !== undefined) rates[k] = p.v
  }
  out.rates = rates
  const d = out as unknown as Data
  const ids = (a: { id: string }[]) => new Set(a.map(x => x.id))
  const I = ids(d.investments), A = ids(d.accounts), P = ids(d.pensions), K = ids(d.pacs)
  if (d.movements.some(m => !I.has(m.investmentId)) || d.pacs.some(p => !I.has(p.investmentId)) || d.accMovements.some(m => !A.has(m.accountId)) ||
    d.pensionMovements.some(m => !P.has(m.pensionId)) || d.pacPayments.some(p => !K.has(p.pacId))) conflicts.push('riferimenti incoerenti')
  return conflicts.length ? { ok: false, conflicts } : { ok: true, data: d }
}
