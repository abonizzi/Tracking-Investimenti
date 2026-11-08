import { useState } from 'react'
import { askAmount, askChoice } from '../components/Dialog'
import MoveList from '../components/MoveList'
import { editMovement, deleteMovement } from '../lib/ledger'
import { Store } from '../store'
import { fmt, toCents } from '../lib/money'
import { unrealizedGain, returnPct } from '../lib/finance'
const cats = ['azioni', 'etf', 'obbligazioni', 'cripto', 'altro']
export default function Investimenti({ s }: { s: Store }) {
  const [err, setErr] = useState('')
  const run = async (f: () => void | Promise<void>) => { try { setErr(''); await f() } catch (e) { setErr((e as Error).message) } }
  const ask = askAmount
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Investimenti</h2>
      {err && <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm text-red-900">{err}</p>}
      <form className="card grid gap-2 md:grid-cols-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget
        run(() => { const inv = toCents(String(f.get('invested'))), val = toCents(String(f.get('value')))
          if (!String(f.get('name')).trim()) throw new Error('Inserisci un nome')
          if (inv < 0 || val < 0) throw new Error('Gli importi non possono essere negativi')
          s.addInvestment({ name: String(f.get('name')), category: String(f.get('category')), invested: inv, value: val, currency: String(f.get('currency') || 'EUR').toUpperCase(), startDate: String(f.get('date')) }); form.reset() }) }}>
        <input className="inp" name="name" placeholder="Nome" aria-label="Nome" />
        <select className="inp" name="category" aria-label="Categoria">{cats.map(c => <option key={c}>{c}</option>)}</select>
        <input className="inp" name="currency" placeholder="Valuta (EUR)" maxLength={3} aria-label="Valuta" />
        <input className="inp" name="invested" placeholder="Capitale investito" inputMode="decimal" aria-label="Capitale investito" />
        <input className="inp" name="value" placeholder="Valore attuale" inputMode="decimal" aria-label="Valore attuale" />
        <input className="inp" name="date" type="date" aria-label="Data di inizio" />
        <button className="btn md:col-span-3">Aggiungi investimento</button>
      </form>
      {s.d.investments.map(i => { const g = unrealizedGain(i), p = returnPct(i); return (
        <div key={i.id} className="card">
          <div className="flex justify-between"><b>{i.name}</b><span className="text-xs">{i.category} · {i.currency}</span></div>
          <p className="text-sm">Capitale {fmt(i.invested, i.currency)} · Valore {fmt(i.value, i.currency)}</p>
          <p className={`text-sm ${g >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(g, i.currency)} {p === null ? '' : `(${p.toFixed(2)}%)`}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn" onClick={() => run(async () => { const a = await ask('Importo del versamento'); if (a !== null) s.contribute(i.id, a) })}>Versa</button>
            <button className="btn" onClick={() => run(async () => { const a = await ask('Nuovo valore attuale'); if (a !== null) s.setValue(i.id, a) })}>Aggiorna valore</button>
            <button className="btn" onClick={() => run(async () => { const a = await ask('Incasso netto della vendita (stima proporzionale)'); if (a === null) return; const acc = s.d.accounts.filter(x => x.currency === i.currency); let id: string | undefined; if (acc.length) { const k = await askChoice('Accreditare su un conto?', [...acc.map(x => x.name), 'Nessun conto']); if (k === null) return; id = acc[k]?.id } s.sellPart(i.id, a, id) })}>Vendi</button>
            <button className="btn !bg-red-600" onClick={() => window.confirm('Eliminare?') && s.removeInvestment(i.id)}>Elimina</button>
          </div>
          <MoveList rows={s.d.movements.filter(m => m.investmentId === i.id).map(m => ({ id: m.id, text: `${m.date} · ${m.kind} · ${fmt(m.amount, i.currency)}${m.realizedProfit !== undefined ? ` · profitto stimato ${fmt(m.realizedProfit, i.currency)}` : ''}${m.pacPaymentId ? ' · PAC' : ''}` }))}
            onEdit={id => run(async () => { const v = await ask('Nuovo importo'); if (v !== null) s.ledger(d => editMovement(d, id, v)) })}
            onDelete={id => { if (window.confirm('Annullare il movimento? Posizione e conti collegati verranno ripristinati.')) run(() => s.ledger(d => deleteMovement(d, id))) }} />
        </div>) })}
    </div>)
}
