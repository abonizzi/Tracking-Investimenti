import { describe, it, expect } from 'vitest'
import { merge3 } from './merge'
import { mkData } from './testdata'
const inv = (id: string, value = 100) => ({ id, name: id, category: 'etf', invested: 100, value, currency: 'EUR', startDate: '' })
describe('merge3', () => {
  const base = mkData({ investments: [inv('a')], goal: 100 })
  it('unisce aggiunte su dispositivi diversi', () => {
    const r = merge3(base, mkData({ investments: [inv('a'), inv('b')], goal: 100 }), mkData({ investments: [inv('a'), inv('c')], goal: 100 }))
    expect(r.ok && r.data.investments.map(i => i.id).sort()).toEqual(['a', 'b', 'c'])
  })
  it('prende la modifica di un solo lato (anche obiettivo)', () => {
    const r = merge3(base, mkData({ investments: [inv('a', 150)], goal: 100 }), mkData({ investments: [inv('a')], goal: 500 }))
    expect(r.ok && r.data.investments[0].value).toBe(150); expect(r.ok && r.data.goal).toBe(500)
  })
  it('conflitto se lo stesso elemento cambia in modo diverso', () => {
    const r = merge3(base, mkData({ investments: [inv('a', 150)], goal: 100 }), mkData({ investments: [inv('a', 200)], goal: 100 })); expect(r.ok).toBe(false)
  })
  it('eliminazione su un lato senza modifiche sull\'altro', () => {
    const r = merge3(base, mkData({ investments: [], goal: 100 }), mkData({ investments: [inv('a')], goal: 100 })); expect(r.ok && r.data.investments).toHaveLength(0)
  })
  it('riferimenti orfani → conflitto, non dati incoerenti', () => {
    const mv = { id: 'm', investmentId: 'a', kind: 'versamento' as const, amount: 1, date: 'd' }
    expect(merge3(base, mkData({ investments: [], goal: 100 }), mkData({ investments: [inv('a')], movements: [mv], goal: 100 })).ok).toBe(false)
  })
})
