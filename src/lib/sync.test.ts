import { describe, it, expect } from 'vitest'
import { syncOnce, Remote, RemoteDoc } from './sync'
import type { Data } from '../store'
const D = (goal: number) => ({ goal } as unknown as Data)
const fake = (doc: RemoteDoc | null, rejectPush = false): Remote & { doc: RemoteDoc | null } => {
  const r = { doc, fetch: async () => r.doc, push: async (data: Data, base: number) => {
    if (rejectPush || (r.doc?.revision ?? 0) !== base) return { ok: false as const }
    r.doc = { data, revision: base + 1 }; return { ok: true as const, revision: base + 1 } } }
  return r
}
describe('sync', () => {
  it('primo push', async () => { const r = fake(null); const o = await syncOnce(D(1), { base: 0, dirty: true }, r); expect(o.kind).toBe('pushed'); expect(r.doc?.revision).toBe(1) })
  it('niente da fare se pulito e allineato', async () => expect((await syncOnce(D(1), { base: 2, dirty: false }, fake({ data: D(1), revision: 2 }))).kind).toBe('idle'))
  it('pull se il server è più recente e locale pulito', async () => {
    const o = await syncOnce(D(1), { base: 1, dirty: false }, fake({ data: D(9), revision: 3 })); expect(o.kind).toBe('pulled')
    if (o.kind === 'pulled') { expect(o.data.goal).toBe(9); expect(o.meta.base).toBe(3) } })
  it('conflitto se il server è più recente e locale modificato', async () => {
    const r = fake({ data: D(9), revision: 3 }); const o = await syncOnce(D(1), { base: 1, dirty: true }, r)
    expect(o.kind).toBe('conflict'); expect(r.doc?.data.goal).toBe(9) }) // il server non viene toccato
  it('push rifiutato → conflitto, mai sovrascrittura', async () => {
    const o = await syncOnce(D(1), { base: 2, dirty: true }, fake({ data: D(5), revision: 2 }, true)); expect(o.kind).toBe('conflict') })
})
import { mkData } from './testdata'
describe('sync con merge', () => {
  const inv = (id: string) => ({ id, name: id, category: 'etf', invested: 1, value: 1, currency: 'EUR', startDate: '' })
  const base = mkData({ investments: [inv('a')] })
  it('unisce modifiche concorrenti su elementi diversi e le invia', async () => {
    const r = fake({ data: mkData({ investments: [inv('a'), inv('c')] }), revision: 3 })
    const o = await syncOnce(mkData({ investments: [inv('a'), inv('b')] }), { base: 2, dirty: true }, r, base)
    expect(o.kind).toBe('merged'); expect(r.doc?.revision).toBe(4); expect(r.doc?.data.investments).toHaveLength(3)
  })
  it('stesso elemento modificato su entrambi → conflitto, server intatto', async () => {
    const edit = (v: number) => mkData({ investments: [{ ...inv('a'), value: v }] })
    const r = fake({ data: edit(5), revision: 3 }); const o = await syncOnce(edit(9), { base: 2, dirty: true }, r, base)
    expect(o.kind).toBe('conflict'); expect(r.doc?.revision).toBe(3)
  })
})
