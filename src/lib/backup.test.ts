import { describe, it, expect } from 'vitest'
import { exportBackup, parseBackup, mergeData } from './backup'
import type { Data } from '../store'
const base: Data = { investments: [{ id: 'a', name: 'X', category: 'etf', invested: 100, value: 120, currency: 'EUR', startDate: '' }], movements: [], accounts: [], accMovements: [], pensions: [], pensionMovements: [], pacs: [], pacPayments: [], snapshots: [], rates: { USD: 0.9 }, goal: 500 }
describe('backup', () => {
  it('round trip', () => { const r = parseBackup(exportBackup(base)); expect(r.ok && r.data.investments[0].id).toBe('a') })
  it('rifiuta file estranei', () => { expect(parseBackup('{"x":1}').ok).toBe(false); expect(parseBackup('non json').ok).toBe(false) })
  it('rifiuta importi non interi', () => { const bad = { ...base, investments: [{ ...base.investments[0], value: 1.5 }] }; expect(parseBackup(exportBackup(bad)).ok).toBe(false) })
  it('rifiuta id duplicati', () => { const bad = { ...base, investments: [base.investments[0], base.investments[0]] }; expect(parseBackup(exportBackup(bad)).ok).toBe(false) })
  it('unione senza duplicati né sovrascritture', () => {
    const inc = { ...base, investments: [{ ...base.investments[0], value: 999 }, { ...base.investments[0], id: 'b' }] }
    const m = mergeData(base, inc); expect(m.added).toBe(1); expect(m.data.investments.find(i => i.id === 'a')!.value).toBe(120)
  })
})
