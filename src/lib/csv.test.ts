import { describe, it, expect } from 'vitest'
import { cell, toCsv } from './csv'
describe('csv', () => {
  it('neutralizza formule', () => { expect(cell('=SOMMA(A1)')).toBe("'=SOMMA(A1)"); expect(cell('@x')).toBe("'@x") })
  it('virgolette', () => expect(cell('a,"b"')).toBe('"a,""b"""'))
  it('righe', () => expect(toCsv([['a', 1], ['b', 2]])).toBe('a,1\r\nb,2'))
})
