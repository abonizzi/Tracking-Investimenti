import { useEffect, useState } from 'react'
import { Position, addContribution, sell } from './lib/finance'
import { advanceDue, alreadyPaid } from './lib/pac'
export interface Investment extends Position { id: string; name: string; category: string; currency: string; startDate: string; notes?: string }
export interface Movement { id: string; investmentId: string; kind: 'versamento' | 'vendita'; amount: number; realizedProfit?: number; costBasis?: number; accountId?: string; accMovementId?: string; pacPaymentId?: string; date: string }
export interface Account { id: string; name: string; currency: string; balance: number }
export interface AccMovement { id: string; accountId: string; kind: 'entrata' | 'uscita' | 'trasferimento' | 'vendita'; amount: number; date: string; note?: string; transferId?: string }
export interface Pension extends Position { id: string; name: string; currency: string; startDate: string; notes?: string }
export interface PensionMovement { id: string; pensionId: string; amount: number; date: string }
export interface Pac { id: string; name: string; investmentId: string; amount: number; everyMonths: number; nextDue: string; active: boolean }
export interface PacPayment { id: string; pacId: string; dueDate: string; amount: number; date: string }
export interface Snapshot { day: string; total: number; investments: number; liquidity: number; pension: number; partial: boolean }
export interface Data { pacs: Pac[]; pacPayments: PacPayment[]; snapshots: Snapshot[]; investments: Investment[]; movements: Movement[]; accounts: Account[]; accMovements: AccMovement[]; pensions: Pension[]; pensionMovements: PensionMovement[]; rates: Record<string, number>; goal: number }
const empty: Data = { pacs: [], pacPayments: [], snapshots: [], investments: [], movements: [], accounts: [], accMovements: [], pensions: [], pensionMovements: [], rates: {}, goal: 0 }
// Dati locali isolati per utente; 'local' = modalità senza account (compatibile con versioni precedenti).
const keyFor = (userId: string) => userId === 'local' ? 'mp:v1:data' : `mp:v1:u:${userId}:data`
const load = (KEY: string): Data => { try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return empty } }
const uid = () => crypto.randomUUID()
const today = () => new Date().toISOString().slice(0, 10)
const pos = (n: number) => { if (!(n > 0)) throw new Error('L\'importo deve essere positivo') }
export function useStore(userId: string) {
  const KEY = keyFor(userId)
  const [d, setD] = useState<Data>(() => load(KEY))
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* quota */ } }, [d])
  // Valida su stato corrente (fuori da setD) così gli errori arrivano alla UI.
  const acc = (id: string) => { const a = d.accounts.find(x => x.id === id); if (!a) throw new Error('Conto non trovato'); return a }
  return {
    d,
    addInvestment: (i: Omit<Investment, 'id'>) => setD(s => ({ ...s, investments: [...s.investments, { ...i, id: uid() }] })),
    removeInvestment: (id: string) => setD(s => ({ ...s, investments: s.investments.filter(i => i.id !== id), movements: s.movements.filter(m => m.investmentId !== id) })),
    setValue: (id: string, value: number) => setD(s => ({ ...s, investments: s.investments.map(i => i.id === id ? { ...i, value } : i) })),
    contribute: (id: string, amount: number) => { pos(amount); setD(s => ({ ...s,
      investments: s.investments.map(i => i.id === id ? { ...i, ...addContribution(i, amount) } : i),
      movements: [{ id: uid(), investmentId: id, kind: 'versamento', amount, date: today() }, ...s.movements] })) },
    sellPart: (id: string, net: number, accountId?: string) => {
      const inv = d.investments.find(i => i.id === id); if (!inv) throw new Error('Investimento non trovato')
      const r = sell(inv, net); const amid = uid()
      if (accountId) { const a = acc(accountId); if (a.currency !== inv.currency) throw new Error('Il conto ha una valuta diversa dall\'investimento') }
      setD(s => ({ ...s,
        investments: s.investments.map(i => i.id === id ? { ...i, ...r.position } : i),
        accounts: accountId ? s.accounts.map(a => a.id === accountId ? { ...a, balance: a.balance + net } : a) : s.accounts,
        accMovements: accountId ? [{ id: amid, accountId, kind: 'vendita', amount: net, date: today(), note: inv.name }, ...s.accMovements] : s.accMovements,
        movements: [{ id: uid(), investmentId: id, kind: 'vendita', amount: net, realizedProfit: r.realizedProfit, costBasis: r.costBasisSold, accountId, accMovementId: accountId ? amid : undefined, date: today() }, ...s.movements] }))
    },
    addPac: (p: Omit<Pac, 'id' | 'active'>) => {
      pos(p.amount); if (!p.name.trim()) throw new Error('Inserisci un nome'); if (!d.investments.some(i => i.id === p.investmentId)) throw new Error('Scegli un investimento')
      if (!(p.everyMonths >= 1)) throw new Error('Frequenza non valida'); if (!p.nextDue) throw new Error('Inserisci la prossima scadenza')
      setD(s => ({ ...s, pacs: [...s.pacs, { ...p, id: uid(), active: true }] })) },
    togglePac: (id: string) => setD(s => ({ ...s, pacs: s.pacs.map(p => p.id === id ? { ...p, active: !p.active } : p) })),
    removePac: (id: string) => setD(s => ({ ...s, pacs: s.pacs.filter(p => p.id !== id), pacPayments: s.pacPayments.filter(x => x.pacId !== id) })),
    payPac: (id: string) => {
      const p = d.pacs.find(x => x.id === id); if (!p) throw new Error('PAC non trovato'); const pid = uid(); if (!p.active) throw new Error('PAC sospeso')
      if (alreadyPaid(d.pacPayments, id, p.nextDue)) throw new Error('Rata già registrata per questa scadenza')
      if (!d.investments.some(i => i.id === p.investmentId)) throw new Error('Investimento associato non trovato')
      setD(s => ({ ...s,
        investments: s.investments.map(i => i.id === p.investmentId ? { ...i, ...addContribution(i, p.amount) } : i),
        movements: [{ id: uid(), investmentId: p.investmentId, kind: 'versamento', amount: p.amount, pacPaymentId: pid, date: today() }, ...s.movements],
        pacPayments: [{ id: pid, pacId: id, dueDate: p.nextDue, amount: p.amount, date: today() }, ...s.pacPayments],
        pacs: s.pacs.map(x => x.id === id ? { ...x, nextDue: advanceDue(x.nextDue, x.everyMonths) } : x) })) },
    saveSnapshot: (sn: Snapshot) => setD(s => ({ ...s, snapshots: [...s.snapshots.filter(x => x.day !== sn.day), sn].sort((a, b) => a.day.localeCompare(b.day)) })),
    ledger: (fn: (x: Data) => Data) => setD(fn(d)),
    restore: (data: Data) => setD({ ...empty, ...data }),
    setGoal: (goal: number) => setD(s => ({ ...s, goal })),
    setRate: (cur: string, rate: number) => setD(s => { const rates = { ...s.rates }; if (rate > 0) rates[cur] = rate; else delete rates[cur]; return { ...s, rates } }),
    addAccount: (name: string, currency: string, balance: number) => { if (!name.trim()) throw new Error('Inserisci un nome'); setD(s => ({ ...s, accounts: [...s.accounts, { id: uid(), name, currency, balance }] })) },
    removeAccount: (id: string) => setD(s => ({ ...s, accounts: s.accounts.filter(a => a.id !== id), accMovements: s.accMovements.filter(m => m.accountId !== id) })),
    accountMove: (id: string, kind: 'entrata' | 'uscita', amount: number) => {
      pos(amount); acc(id)
      setD(s => ({ ...s, accounts: s.accounts.map(a => a.id === id ? { ...a, balance: a.balance + (kind === 'entrata' ? amount : -amount) } : a),
        accMovements: [{ id: uid(), accountId: id, kind, amount, date: today() }, ...s.accMovements] }))
    },
    transfer: (from: string, to: string, amount: number) => {
      pos(amount); const a = acc(from), b = acc(to); const tid = uid()
      if (from === to) throw new Error('Scegli due conti diversi')
      if (a.currency !== b.currency) throw new Error('Trasferimenti solo tra conti nella stessa valuta')
      if (a.balance < amount) throw new Error('Saldo insufficiente')
      setD(s => ({ ...s, accounts: s.accounts.map(x => x.id === from ? { ...x, balance: x.balance - amount } : x.id === to ? { ...x, balance: x.balance + amount } : x),
        accMovements: [{ id: uid(), accountId: from, kind: 'trasferimento', amount: -amount, transferId: tid, date: today(), note: `a ${b.name}` }, { id: uid(), accountId: to, kind: 'trasferimento', amount, transferId: tid, date: today(), note: `da ${a.name}` }, ...s.accMovements] }))
    },
    addPension: (p: Omit<Pension, 'id'>) => { if (!p.name.trim()) throw new Error('Inserisci un nome'); setD(s => ({ ...s, pensions: [...s.pensions, { ...p, id: uid() }] })) },
    removePension: (id: string) => setD(s => ({ ...s, pensions: s.pensions.filter(p => p.id !== id), pensionMovements: s.pensionMovements.filter(m => m.pensionId !== id) })),
    setPensionValue: (id: string, value: number) => setD(s => ({ ...s, pensions: s.pensions.map(p => p.id === id ? { ...p, value } : p) })),
    pensionContribute: (id: string, amount: number) => { pos(amount); setD(s => ({ ...s,
      pensions: s.pensions.map(p => p.id === id ? { ...p, ...addContribution(p, amount) } : p),
      pensionMovements: [{ id: uid(), pensionId: id, amount, date: today() }, ...s.pensionMovements] })) },
  }
}
export type Store = ReturnType<typeof useStore>
