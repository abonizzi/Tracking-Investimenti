import { jsPDF } from 'jspdf'
import type { Data } from '../store'
import { sumEur } from './totals'
const m = (c: number, cur = 'EUR') => new Intl.NumberFormat('it-IT', { style: 'currency', currency: cur, currencyDisplay: 'code' }).format(c / 100).replace(/\u00a0/g, ' ')
/** Report patrimoniale per periodo [from, to] (YYYY-MM-DD). Valori attuali + movimenti del periodo. */
export function buildReport(d: Data, from: string, to: string) {
  const doc = new jsPDF(); let y = 20
  const line = (t: string, bold = false, size = 10) => { if (y > 280) { doc.addPage(); y = 20 } doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.text(t, 15, y); y += size > 12 ? 9 : 6 }
  const I = sumEur(d.investments, d.rates), L = sumEur(d.accounts.map(a => ({ value: a.balance, currency: a.currency })), d.rates), P = sumEur(d.pensions, d.rates)
  line('Mio Portafoglio - Report patrimoniale', true, 16); line(`Periodo: ${from} / ${to}  ·  generato il ${new Date().toISOString().slice(0, 10)}`)
  y += 3; line(`Patrimonio totale: ${m(I.total + L.total + P.total)}`, true, 12)
  line(`Investimenti ${m(I.total)}  ·  Liquidità ${m(L.total)}  ·  Fondi pensione ${m(P.total)}`)
  if (I.missing || L.missing || P.missing) line('Attenzione: cambi mancanti, totali parziali.')
  y += 3; line('Investimenti', true, 12)
  d.investments.forEach(i => line(`${i.name} (${i.category}): capitale ${m(i.invested, i.currency)}, valore ${m(i.value, i.currency)}, ${i.invested > 0 ? (((i.value - i.invested) / i.invested) * 100).toFixed(2) + '%' : 'n/d'}`))
  y += 3; line('Fondi pensione', true, 12)
  d.pensions.forEach(p => line(`${p.name}: versato ${m(p.invested, p.currency)}, valore ${m(p.value, p.currency)}`))
  y += 3; line('Liquidità', true, 12); d.accounts.forEach(a => line(`${a.name}: ${m(a.balance, a.currency)}`))
  const inP = (x: string) => x >= from && x <= to; const name = (id: string) => d.investments.find(i => i.id === id)?.name ?? '-'
  y += 3; line('Movimenti del periodo', true, 12)
  const mv = d.movements.filter(x => inP(x.date)); if (!mv.length) line('Nessun movimento.')
  mv.forEach(x => line(`${x.date} ${x.kind} ${name(x.investmentId)} ${m(x.amount)}${x.realizedProfit !== undefined ? ` (profitto realizzato stimato ${m(x.realizedProfit)})` : ''}`))
  d.accMovements.filter(x => inP(x.date)).forEach(x => line(`${x.date} conto: ${x.kind} ${m(x.amount)}`))
  line('I profitti da vendita sono stime proporzionali, non un calcolo fiscale.')
  doc.save(`report-${from}_${to}.pdf`)
}
