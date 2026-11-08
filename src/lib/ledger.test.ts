import { describe, it, expect } from 'vitest'
import { mkData } from './testdata'
import { deleteMovement, editMovement, deleteAccMovement, editAccMovement, deletePensionMovement } from './ledger'
const inv = (o = {}) => ({ id: 'i', name: 'X', category: 'etf', invested: 64000, value: 80000, currency: 'EUR', startDate: '', ...o })
const sale = { id: 'm', investmentId: 'i', kind: 'vendita' as const, amount: 20000, realizedProfit: 4000, costBasis: 16000, accountId: 'a', accMovementId: 'am', date: '2026-01-01' }
const withSale = () => mkData({ investments: [inv()], movements: [sale], accounts: [{ id: 'a', name: 'C', currency: 'EUR', balance: 20000 }], accMovements: [{ id: 'am', accountId: 'a', kind: 'vendita', amount: 20000, date: '2026-01-01' }] })
describe('ledger', () => {
  it('annullare un versamento ripristina capitale e valore', () => {
    const d = mkData({ investments: [inv({ invested: 230000, value: 250000 })], movements: [{ id: 'm', investmentId: 'i', kind: 'versamento', amount: 30000, date: 'x' }] })
    const n = deleteMovement(d, 'm'); expect(n.investments[0]).toMatchObject({ invested: 200000, value: 220000 }); expect(n.movements).toHaveLength(0)
  })
  it('annullare una vendita ripristina posizione e saldo conto', () => {
    const n = deleteMovement(withSale(), 'm'); expect(n.investments[0]).toMatchObject({ invested: 80000, value: 100000 })
    expect(n.accounts[0].balance).toBe(0); expect(n.accMovements).toHaveLength(0)
  })
  it('modificare una vendita ricalcola profitto e saldo senza duplicati', () => {
    const n = editMovement(withSale(), 'm', 40000)
    expect(n.movements).toHaveLength(1); expect(n.accMovements).toHaveLength(1); expect(n.accounts[0].balance).toBe(40000)
    expect(n.movements[0].costBasis).toBe(32000); expect(n.movements[0].realizedProfit).toBe(8000); expect(n.investments[0]).toMatchObject({ invested: 48000, value: 60000 })
  })
  it('modificare un versamento sposta capitale e valore insieme', () => {
    const d = mkData({ investments: [inv({ invested: 230000, value: 250000 })], movements: [{ id: 'm', investmentId: 'i', kind: 'versamento', amount: 30000, date: 'x' }] })
    expect(editMovement(d, 'm', 10000).investments[0]).toMatchObject({ invested: 210000, value: 230000 })
  })
  it('annullare una rata PAC libera la scadenza', () => {
    const d = mkData({ investments: [inv({ invested: 10000, value: 10000 })], pacs: [{ id: 'p', name: 'P', investmentId: 'i', amount: 10000, everyMonths: 1, nextDue: '2026-12-01', active: true }],
      pacPayments: [{ id: 'pp', pacId: 'p', dueDate: '2026-11-01', amount: 10000, date: 'x' }], movements: [{ id: 'm', investmentId: 'i', kind: 'versamento', amount: 10000, pacPaymentId: 'pp', date: 'x' }] })
    const n = deleteMovement(d, 'm'); expect(n.pacPayments).toHaveLength(0); expect(n.pacs[0].nextDue).toBe('2026-11-01')
  })
  it('eliminare un trasferimento ripristina entrambi i conti', () => {
    const d = mkData({ accounts: [{ id: 'a', name: 'A', currency: 'EUR', balance: 0 }, { id: 'b', name: 'B', currency: 'EUR', balance: 100 }],
      accMovements: [{ id: 'x', accountId: 'a', kind: 'trasferimento', amount: -100, transferId: 't', date: 'd' }, { id: 'y', accountId: 'b', kind: 'trasferimento', amount: 100, transferId: 't', date: 'd' }] })
    const n = deleteAccMovement(d, 'x'); expect(n.accounts.map(a => a.balance)).toEqual([100, 0]); expect(n.accMovements).toHaveLength(0)
  })
  it('accredito da vendita non eliminabile direttamente', () => expect(() => deleteAccMovement(withSale(), 'am')).toThrow())
  it('modifica di un\'uscita aggiorna il saldo', () => {
    const d = mkData({ accounts: [{ id: 'a', name: 'A', currency: 'EUR', balance: 900 }], accMovements: [{ id: 'u', accountId: 'a', kind: 'uscita', amount: 100, date: 'd' }] })
    expect(editAccMovement(d, 'u', 300).accounts[0].balance).toBe(700)
  })
  it('contributo pensione non annullabile se il versato è inferiore', () => {
    const d = mkData({ pensions: [{ id: 'p', name: 'F', invested: 50, value: 50, currency: 'EUR', startDate: '' }], pensionMovements: [{ id: 'm', pensionId: 'p', amount: 100, date: 'd' }] })
    expect(() => deletePensionMovement(d, 'm')).toThrow()
  })
})
