import type { Data, AccMovement } from '../store'
import { sell } from './finance'
/** Modifica/annullamento di movimenti con ricalcolo coerente di posizioni e saldi (funzioni pure). */
const upd = <T extends { id: string }>(a: T[], id: string, f: (x: T) => T) => a.map(x => x.id === id ? f(x) : x)
const eff = (m: AccMovement) => m.kind === 'uscita' ? -m.amount : m.amount
const posAmt = (n: number) => { if (!Number.isInteger(n) || n <= 0) throw new Error("L'importo deve essere positivo") }
const removeAcc = (d: Data, id: string): Data => {
  const m = d.accMovements.find(x => x.id === id); if (!m) return d
  return { ...d, accMovements: d.accMovements.filter(x => x.id !== id), accounts: upd(d.accounts, m.accountId, a => ({ ...a, balance: a.balance - eff(m) })) }
}
export function deleteMovement(d: Data, id: string): Data {
  const m = d.movements.find(x => x.id === id); if (!m) throw new Error('Movimento non trovato')
  let nd: Data = { ...d, movements: d.movements.filter(x => x.id !== id) }
  const inv = d.investments.find(i => i.id === m.investmentId)
  if (inv && m.kind === 'versamento') {
    if (inv.invested < m.amount || inv.value < m.amount) throw new Error('Impossibile annullare: capitale o valore sono inferiori al versamento')
    nd = { ...nd, investments: upd(nd.investments, inv.id, i => ({ ...i, invested: i.invested - m.amount, value: i.value - m.amount })) }
  } else if (inv && m.kind === 'vendita') {
    if (m.costBasis === undefined) throw new Error('Vendita registrata con una versione precedente: non annullabile')
    nd = { ...nd, investments: upd(nd.investments, inv.id, i => ({ ...i, invested: i.invested + m.costBasis!, value: i.value + m.amount })) }
    if (m.accMovementId) nd = removeAcc(nd, m.accMovementId)
  }
  if (m.pacPaymentId) { // rata PAC annullata: la scadenza torna disponibile
    const pay = d.pacPayments.find(p => p.id === m.pacPaymentId)
    if (pay) nd = { ...nd, pacPayments: nd.pacPayments.filter(p => p.id !== pay.id), pacs: upd(nd.pacs, pay.pacId, p => ({ ...p, nextDue: pay.dueDate })) }
  }
  return nd
}
export function editMovement(d: Data, id: string, amount: number): Data {
  posAmt(amount); const m = d.movements.find(x => x.id === id); if (!m) throw new Error('Movimento non trovato')
  const inv = d.investments.find(i => i.id === m.investmentId); if (!inv) throw new Error('Investimento non trovato')
  if (m.kind === 'versamento') {
    const delta = amount - m.amount
    if (inv.invested + delta < 0 || inv.value + delta < 0) throw new Error('Importo non compatibile con capitale e valore attuali')
    return { ...d, movements: upd(d.movements, id, x => ({ ...x, amount })), investments: upd(d.investments, inv.id, i => ({ ...i, invested: i.invested + delta, value: i.value + delta })) }
  }
  // Vendita: annulla e ricalcola sullo stato attuale (stima proporzionale).
  const back = deleteMovement(d, id); const cur = back.investments.find(i => i.id === inv.id)!; const r = sell(cur, amount)
  let nd: Data = { ...back, investments: upd(back.investments, inv.id, i => ({ ...i, ...r.position })), movements: [{ ...m, amount, realizedProfit: r.realizedProfit, costBasis: r.costBasisSold }, ...back.movements] }
  const old = d.accMovements.find(x => x.id === m.accMovementId)
  if (old && nd.accounts.some(a => a.id === old.accountId)) nd = { ...nd, accounts: upd(nd.accounts, old.accountId, a => ({ ...a, balance: a.balance + amount })), accMovements: [{ ...old, amount }, ...nd.accMovements] }
  return nd
}
export function deleteAccMovement(d: Data, id: string): Data {
  const m = d.accMovements.find(x => x.id === id); if (!m) throw new Error('Movimento non trovato')
  if (m.kind === 'vendita') throw new Error("Questo accredito deriva da una vendita: annullala dall'investimento")
  let nd = removeAcc(d, id)
  if (m.transferId) { const o = d.accMovements.find(x => x.transferId === m.transferId && x.id !== id); if (o) nd = removeAcc(nd, o.id) }
  return nd
}
export function editAccMovement(d: Data, id: string, amount: number): Data {
  posAmt(amount); const m = d.accMovements.find(x => x.id === id); if (!m) throw new Error('Movimento non trovato')
  if (m.kind !== 'entrata' && m.kind !== 'uscita') throw new Error('Solo entrate e uscite sono modificabili: per i trasferimenti elimina e ricrea')
  const delta = amount - m.amount
  return { ...d, accMovements: upd(d.accMovements, id, x => ({ ...x, amount })), accounts: upd(d.accounts, m.accountId, a => ({ ...a, balance: a.balance + (m.kind === 'entrata' ? delta : -delta) })) }
}
export function deletePensionMovement(d: Data, id: string): Data {
  const m = d.pensionMovements.find(x => x.id === id); if (!m) throw new Error('Movimento non trovato')
  const p = d.pensions.find(x => x.id === m.pensionId)
  if (p && (p.invested < m.amount || p.value < m.amount)) throw new Error('Impossibile annullare: versato o valore sono inferiori al contributo')
  return { ...d, pensionMovements: d.pensionMovements.filter(x => x.id !== id), pensions: upd(d.pensions, m.pensionId, x => ({ ...x, invested: x.invested - m.amount, value: x.value - m.amount })) }
}
export function editPensionMovement(d: Data, id: string, amount: number): Data {
  posAmt(amount); const m = d.pensionMovements.find(x => x.id === id); if (!m) throw new Error('Movimento non trovato')
  const p = d.pensions.find(x => x.id === m.pensionId); const delta = amount - m.amount
  if (p && (p.invested + delta < 0 || p.value + delta < 0)) throw new Error('Importo non compatibile con versato e valore attuali')
  return { ...d, pensionMovements: upd(d.pensionMovements, id, x => ({ ...x, amount })), pensions: upd(d.pensions, m.pensionId, x => ({ ...x, invested: x.invested + delta, value: x.value + delta })) }
}
