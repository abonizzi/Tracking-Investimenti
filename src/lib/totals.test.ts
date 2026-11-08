import { describe, it, expect } from 'vitest'
import { sumEur } from './totals'
describe('sumEur', () => {
  it('converte e segnala cambi mancanti', () => {
    const r = sumEur([{ value: 1000, currency: 'EUR' }, { value: 1000, currency: 'USD' }, { value: 500, currency: 'CHF' }], { USD: 0.9 })
    expect(r).toEqual({ total: 1900, missing: true })
  })
  it('vuoto = 0', () => expect(sumEur([], {})).toEqual({ total: 0, missing: false }))
})
