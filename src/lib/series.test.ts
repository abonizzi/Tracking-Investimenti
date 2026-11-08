import { describe, it, expect } from 'vitest'
import { flows, growthSeries } from './series'
import { mkData } from './testdata'
const snap = (day: string, total: number) => ({ day, total, investments: total, liquidity: 0, pension: 0, partial: false })
describe('series', () => {
  it('un versamento non è crescita', () => {
    const g = growthSeries([snap('2026-01-01', 10000), snap('2026-02-01', 15000)], [{ day: '2026-01-15', eur: 3000 }])
    expect(g[1].growth).toBe(2000)
  })
  it('flussi: vendita accreditata neutra, non accreditata in uscita', () => {
    const d = mkData({ investments: [{ id: 'i', name: 'X', category: 'etf', invested: 1, value: 1, currency: 'EUR', startDate: '' }],
      movements: [{ id: 'a', investmentId: 'i', kind: 'vendita', amount: 500, accMovementId: 'z', date: '2026-01-02' }, { id: 'b', investmentId: 'i', kind: 'vendita', amount: 200, date: '2026-01-03' }, { id: 'c', investmentId: 'i', kind: 'versamento', amount: 100, date: '2026-01-04' }] })
    expect(flows(d).flows.map(f => f.eur)).toEqual([-200, 100])
  })
  it('cambio mancante → flusso escluso e parziale', () => {
    const d = mkData({ pensions: [{ id: 'p', name: 'F', invested: 1, value: 1, currency: 'USD', startDate: '' }], pensionMovements: [{ id: 'm', pensionId: 'p', amount: 100, date: '2026-01-01' }] })
    expect(flows(d)).toEqual({ flows: [], partial: true })
  })
})
