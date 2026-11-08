import { describe, it, expect } from 'vitest'
import { addContribution, sell, returnPct, unrealizedGain, cagr } from './finance'
import { toCents, toEur } from './money'
describe('finanza', () => {
  it('rendimento 5.000 → 5.650', () => {
    const p = { invested: 500000, value: 565000 }
    expect(unrealizedGain(p)).toBe(65000); expect(returnPct(p)).toBeCloseTo(13)
  })
  it('capitale zero → null', () => expect(returnPct({ invested: 0, value: 100 })).toBeNull())
  it('versamento non è guadagno', () => {
    const p = addContribution({ invested: 200000, value: 220000 }, 30000)
    expect(p).toEqual({ invested: 230000, value: 250000 }); expect(unrealizedGain(p)).toBe(20000)
  })
  it('vendita parziale proporzionale', () => {
    const r = sell({ invested: 80000, value: 100000 }, 20000)
    expect(r.costBasisSold).toBe(16000); expect(r.realizedProfit).toBe(4000)
    expect(r.position).toEqual({ invested: 64000, value: 80000 })
  })
  it('vendita oltre valore rifiutata', () => expect(() => sell({ invested: 1, value: 100 }, 200)).toThrow())
  it('niente errori float', () => expect(toCents('0,1') + toCents('0,2')).toBe(30))
  it('cambio mancante → null', () => { expect(toEur(1000, 'USD', {})).toBeNull(); expect(toEur(1000, 'USD', { USD: 0.9 })).toBe(900) })
  it('CAGR', () => expect(cagr(100, 121, 2)).toBeCloseTo(10))
})
