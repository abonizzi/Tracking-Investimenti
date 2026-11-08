import { useState } from 'react'
import { Store } from '../store'
import { fmt, toCents } from '../lib/money'
import { isDue } from '../lib/pac'
export default function Pac({ s }: { s: Store }) {
  const [err, setErr] = useState('')
  const run = (f: () => void) => { try { setErr(''); f() } catch (e) { setErr((e as Error).message) } }
  const today = new Date().toISOString().slice(0, 10)
  const due = s.d.pacs.filter(p => isDue(p, today))
  const name = (id: string) => s.d.investments.find(i => i.id === id)?.name ?? '—'
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">PAC</h2>
      {due.length > 0 && <p role="status" className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">Rate in scadenza: {due.map(p => p.name).join(', ')}</p>}
      {err && <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm text-red-900">{err}</p>}
      <form className="card grid gap-2 md:grid-cols-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget
        run(() => { s.addPac({ name: String(f.get('name')), investmentId: String(f.get('inv')), amount: toCents(String(f.get('amount') || '0')), everyMonths: Number(f.get('every') || 1), nextDue: String(f.get('due')) }); form.reset() }) }}>
        <input className="inp" name="name" placeholder="Nome PAC" aria-label="Nome PAC" />
        <select className="inp" name="inv" aria-label="Investimento associato"><option value="">Investimento…</option>{s.d.investments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <input className="inp" name="amount" placeholder="Importo rata" inputMode="decimal" aria-label="Importo rata" />
        <input className="inp" name="every" type="number" min="1" defaultValue={1} aria-label="Ogni quanti mesi" />
        <input className="inp" name="due" type="date" aria-label="Prossima scadenza" />
        <button className="btn">Crea PAC</button>
      </form>
      {s.d.pacs.map(p => (
        <div key={p.id} className="card">
          <div className="flex justify-between"><b>{p.name}</b><span className="text-xs">{p.active ? 'attivo' : 'sospeso'}</span></div>
          <p className="text-sm">{name(p.investmentId)} · {fmt(p.amount)} ogni {p.everyMonths} mese/i · prossima: {p.nextDue}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn" onClick={() => run(() => s.payPac(p.id))}>Registra rata</button>
            <button className="btn" onClick={() => s.togglePac(p.id)}>{p.active ? 'Sospendi' : 'Riattiva'}</button>
            <button className="btn !bg-red-600" onClick={() => window.confirm('Eliminare PAC e storico rate?') && s.removePac(p.id)}>Elimina</button>
          </div>
          <ul className="mt-2 text-xs">{s.d.pacPayments.filter(x => x.pacId === p.id).slice(0, 5).map(x => <li key={x.id}>Scadenza {x.dueDate} · versata {x.date} · {fmt(x.amount)}</li>)}</ul>
        </div>))}
    </div>)
}
