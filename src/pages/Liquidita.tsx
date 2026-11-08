import { useState } from 'react'
import { askAmount, askChoice } from '../components/Dialog'
import MoveList from '../components/MoveList'
import { editAccMovement, deleteAccMovement } from '../lib/ledger'
import { Store } from '../store'
import { fmt, toCents } from '../lib/money'
export default function Liquidita({ s }: { s: Store }) {
  const [err, setErr] = useState('')
  const run = async (f: () => void | Promise<void>) => { try { setErr(''); await f() } catch (e) { setErr((e as Error).message) } }
  const ask = askAmount
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Liquidità</h2>
      {err && <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm text-red-900">{err}</p>}
      <form className="card grid gap-2 md:grid-cols-4" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget
        run(() => { s.addAccount(String(f.get('name')), String(f.get('currency') || 'EUR').toUpperCase(), toCents(String(f.get('balance') || '0'))); form.reset() }) }}>
        <input className="inp" name="name" placeholder="Nome conto" aria-label="Nome conto" />
        <input className="inp" name="currency" placeholder="Valuta (EUR)" maxLength={3} aria-label="Valuta" />
        <input className="inp" name="balance" placeholder="Saldo iniziale" inputMode="decimal" aria-label="Saldo iniziale" />
        <button className="btn">Aggiungi conto</button>
      </form>
      {s.d.accounts.length >= 2 && <button className="btn" onClick={() => run(async () => { const names = s.d.accounts.map(a => a.name); const f = await askChoice('Da quale conto?', names); if (f === null) return; const t = await askChoice('A quale conto?', names); if (t === null) return; const amt = await ask('Importo da trasferire'); if (amt === null) return; s.transfer(s.d.accounts[f].id, s.d.accounts[t].id, amt) })}>Trasferisci tra conti</button>}
      {s.d.accounts.map(a => (
        <div key={a.id} className="card">
          <div className="flex justify-between"><b>{a.name}</b><span className="text-lg font-bold">{fmt(a.balance, a.currency)}</span></div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn" onClick={() => run(async () => { const v = await ask('Importo entrata'); if (v !== null) s.accountMove(a.id, 'entrata', v) })}>Entrata</button>
            <button className="btn" onClick={() => run(async () => { const v = await ask('Importo uscita'); if (v !== null) s.accountMove(a.id, 'uscita', v) })}>Uscita</button>
            <button className="btn !bg-red-600" onClick={() => window.confirm('Eliminare conto e storico?') && s.removeAccount(a.id)}>Elimina</button>
          </div>
          <MoveList rows={s.d.accMovements.filter(m => m.accountId === a.id).map(m => ({ id: m.id, text: `${m.date} · ${m.kind} · ${fmt(m.amount, a.currency)}${m.note ? ` · ${m.note}` : ''}`, canEdit: m.kind === 'entrata' || m.kind === 'uscita', canDelete: m.kind !== 'vendita' }))}
            onEdit={id => run(async () => { const v = await ask('Nuovo importo'); if (v !== null) s.ledger(d => editAccMovement(d, id, v)) })}
            onDelete={id => { if (window.confirm('Annullare il movimento? Il saldo verrà ripristinato (i trasferimenti vengono annullati su entrambi i conti).')) run(() => s.ledger(d => deleteAccMovement(d, id))) }} />
        </div>))}
    </div>)
}
