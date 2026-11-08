import { useState } from 'react'
import { askAmount, askChoice } from '../components/Dialog'
import MoveList from '../components/MoveList'
import { editPensionMovement, deletePensionMovement } from '../lib/ledger'
import { Store } from '../store'
import { fmt, toCents } from '../lib/money'
import { unrealizedGain, returnPct } from '../lib/finance'
export default function Pensione({ s }: { s: Store }) {
  const [err, setErr] = useState('')
  const run = async (f: () => void | Promise<void>) => { try { setErr(''); await f() } catch (e) { setErr((e as Error).message) } }
  const ask = askAmount
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fondo Pensione</h2>
      {err && <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm text-red-900">{err}</p>}
      <form className="card grid gap-2 md:grid-cols-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget
        run(() => { const inv = toCents(String(f.get('invested') || '0')), val = toCents(String(f.get('value') || '0'))
          if (inv < 0 || val < 0) throw new Error('Gli importi non possono essere negativi')
          s.addPension({ name: String(f.get('name')), invested: inv, value: val, currency: String(f.get('currency') || 'EUR').toUpperCase(), startDate: String(f.get('date')) }); form.reset() }) }}>
        <input className="inp" name="name" placeholder="Nome fondo" aria-label="Nome fondo" />
        <input className="inp" name="invested" placeholder="Capitale versato" inputMode="decimal" aria-label="Capitale versato" />
        <input className="inp" name="value" placeholder="Valore attuale" inputMode="decimal" aria-label="Valore attuale" />
        <input className="inp" name="currency" placeholder="Valuta (EUR)" maxLength={3} aria-label="Valuta" />
        <input className="inp" name="date" type="date" aria-label="Data di inizio" />
        <button className="btn">Aggiungi fondo</button>
      </form>
      {s.d.pensions.map(p => { const g = unrealizedGain(p), r = returnPct(p); return (
        <div key={p.id} className="card">
          <b>{p.name}</b>
          <p className="text-sm">Versato {fmt(p.invested, p.currency)} · Valore {fmt(p.value, p.currency)}</p>
          <p className={`text-sm ${g >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rendimento {fmt(g, p.currency)} {r === null ? '' : `(${r.toFixed(2)}%)`}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn" onClick={() => run(async () => { const v = await ask('Importo contributo'); if (v !== null) s.pensionContribute(p.id, v) })}>Contributo</button>
            <button className="btn" onClick={() => run(async () => { const v = await ask('Nuovo valore attuale'); if (v !== null) s.setPensionValue(p.id, v) })}>Aggiorna valore</button>
            <button className="btn !bg-red-600" onClick={() => window.confirm('Eliminare?') && s.removePension(p.id)}>Elimina</button>
          </div>
          <MoveList rows={s.d.pensionMovements.filter(m => m.pensionId === p.id).map(m => ({ id: m.id, text: `${m.date} · contributo ${fmt(m.amount, p.currency)}` }))}
            onEdit={id => run(async () => { const v = await ask('Nuovo importo'); if (v !== null) s.ledger(d => editPensionMovement(d, id, v)) })}
            onDelete={id => { if (window.confirm('Annullare il contributo?')) run(() => s.ledger(d => deletePensionMovement(d, id))) }} />
        </div>) })}
    </div>)
}
