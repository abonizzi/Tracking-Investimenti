import { Store } from '../store'
import { fmt, toEur } from '../lib/money'
import { sumEur } from '../lib/totals'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts'
export default function Dashboard({ s }: { s: Store }) {
  const I = sumEur(s.d.investments, s.d.rates), L = sumEur(s.d.accounts.map(a => ({ value: a.balance, currency: a.currency })), s.d.rates), P = sumEur(s.d.pensions, s.d.rates)
  const inv = I.total, missing = I.missing || L.missing || P.missing, patrimonio = I.total + L.total + P.total
  const todayStr = new Date().toISOString().slice(0, 10); const prev = [...s.d.snapshots].reverse().find(x => x.day < todayStr)
  const realized = s.d.movements.reduce((a, m) => a + (m.realizedProfit ?? 0), 0)
  const pct = s.d.goal > 0 ? Math.min(100, (patrimonio / s.d.goal) * 100) : 0
  const byCat = Object.entries(s.d.investments.reduce<Record<string, number>>((a, i) => { const e = toEur(i.value, i.currency, s.d.rates) ?? 0; a[i.category] = (a[i.category] ?? 0) + e; return a }, {}))
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="card"><p className="text-xs">Patrimonio totale</p><p className="text-2xl font-bold">{fmt(patrimonio)}</p>
        {prev && <p className="text-xs">{patrimonio - prev.total >= 0 ? "+" : ""}{fmt(patrimonio - prev.total)} rispetto allo snapshot del {prev.day}</p>}</div>
      {missing && <p role="alert" className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">Manca il tasso di cambio per alcune valute: i totali sono parziali.</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card"><p className="text-xs">Investimenti</p><p className="text-lg font-bold">{fmt(inv)}</p></div>
        <div className="card"><p className="text-xs">Profitto realizzato (stima)</p><p className="text-lg font-bold">{fmt(realized)}</p></div>
        <div className="card"><p className="text-xs">Liquidità</p><p className="text-lg font-bold">{fmt(L.total)}</p></div>
        <div className="card"><p className="text-xs">Fondo pensione</p><p className="text-lg font-bold">{fmt(P.total)}</p></div>
      </div>
      {byCat.length === 0 ? <p className="card text-sm">Nessun dato: aggiungi il tuo primo investimento.</p> :
        <div className="card h-64"><ResponsiveContainer><PieChart><Pie data={byCat.map(([name, value]) => ({ name, value: value / 100 }))} dataKey="value" nameKey="name" outerRadius={90}>
          {byCat.map((_, i) => <Cell key={i} fill={['#2d5aa8', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>}
      {s.d.snapshots.length >= 2 && <div className="card h-56"><p className="mb-1 text-xs">Andamento storico del patrimonio</p><ResponsiveContainer><LineChart data={s.d.snapshots.map(x => ({ day: x.day, totale: x.total / 100 }))}><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="totale" stroke="#2d5aa8" dot={false} /></LineChart></ResponsiveContainer></div>}
      <div className="card"><label className="text-sm">Obiettivo patrimoniale (€)
        <input className="inp mt-1" type="number" min="0" defaultValue={s.d.goal / 100 || ''} onBlur={e => s.setGoal(Math.round(Number(e.target.value || 0) * 100))} /></label>
        {s.d.goal > 0 && <><div className="mt-3 h-3 rounded bg-slate-200"><div className="h-3 rounded bg-brand-500" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs">{pct.toFixed(1)}% · mancano {fmt(Math.max(0, s.d.goal - patrimonio))}</p></>}</div>
    </div>)
}
