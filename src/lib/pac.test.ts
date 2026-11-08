import { describe, it, expect } from 'vitest'
import { advanceDue, isDue, alreadyPaid } from './pac'
describe('pac', () => {
  it('scadenza mensile con fine mese', () => { expect(advanceDue('2026-01-31', 1)).toBe('2026-02-28'); expect(advanceDue('2026-11-15', 1)).toBe('2026-12-15') })
  it('promemoria', () => { expect(isDue({ active: true, nextDue: '2026-11-01' }, '2026-11-02')).toBe(true); expect(isDue({ active: false, nextDue: '2026-11-01' }, '2026-11-02')).toBe(false) })
  it('rata duplicata', () => expect(alreadyPaid([{ pacId: 'a', dueDate: '2026-11-01' }], 'a', '2026-11-01')).toBe(true))
})
