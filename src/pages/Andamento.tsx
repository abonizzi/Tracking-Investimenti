import { useState } from 'react'
import { Store } from '../store'
import { fmt } from '../lib/money'
import { toCsv } from '../lib/csv'
import { flows, growthSeries } from '../lib/series'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
const periods: [string, number][] = [['1M', 30], ['3M', 90], ['1A', 365], ['Tutto', 36500]]
export default function Andamento({ s, snap }: { s: Store; snap: () => void }) {
  const [days, setDays] = useState(90)
  const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10)
  const list = s.d.snapshots.filter(x => x.day >= from)
  const fl = flows(s.d); const g = growthSeries(list, fl.flows)
  const delta = list.length ? list[list.length - 1].total - list[0].total : 0
  const growth = g.length ? g[g.length - 1].growth : 0
  const pct = list[0] && list[0].total > 0 ? (delta / list[0].total) * 100 : null
  const exportCsv = () => {
    const csv = toCsv([['giorno', 'totale', 'investimenti', 'liquidita', 'pensione', 'parziale'], ...s.d.snapshots.map(x => [x.day, x.total / 100, x.investments / 100, x.liquidity / 100, x.pension / 100, x.partial])])
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'snapshot.csv'; a.click()
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Andamento</h2>
      <div className="flex flex-wrap gap-2">{periods.map(([l, d]) => <button key={l} className={`btn ${days === d ? '' : '!bg-slate-500'}`} onClick={() => setDays(d)}>{l}</button>)}
        <button className="btn" onClick={snap}>Snapshot ora</button><button className="btn" onClick={exportCsv} disabled={!s.d.snapshots.length}>Esporta CSV</button></div>
      {list.length < 2 ? <p className="card text-sm">Servono almeno due snapshot nel periodo. Gli snapshot si creano quando usi l'app (non quando è chiusa).</p> : <>
        <div className="card space-y-1"><p className="text-xs">Variazione del patrimonio</p><p className="text-lg font-bold">{fmt(delta)} {pct === null ? '' : `(${pct.toFixed(2)}%)`}</p>
          <p className="text-xs">Di cui crescita al netto di versamenti e prelievi: <b>{fmt(growth)}</b> · flussi esterni: <b>{fmt(delta - growth)}</b></p>
          {fl.partial && <p className="text-xs text-amber-700">Alcuni flussi sono esclusi perché manca il cambio.</p>}</div>
        <div className="card h-64"><p className="mb-1 text-xs">Composizione patrimoniale nel tempo</p><ResponsiveContainer><AreaChart data={list.map(x => ({ day: x.day, Investimenti: x.investments / 100, Liquidità: x.liquidity / 100, Pensione: x.pension / 100 }))}>
          <XAxis dataKey="day" /><YAxis /><Tooltip /><Legend />
          <Area dataKey="Investimenti" stackId="1" stroke="#2d5aa8" fill="#2d5aa8" /><Area dataKey="Liquidità" stackId="1" stroke="#16a34a" fill="#16a34a" /><Area dataKey="Pensione" stackId="1" stroke="#f59e0b" fill="#f59e0b" /></AreaChart></ResponsiveContainer></div>
        <div className="card h-64"><p className="mb-1 text-xs">Patrimonio e crescita al netto dei flussi</p><ResponsiveContainer><LineChart data={g.map(x => ({ day: x.day, Patrimonio: x.total / 100, Crescita: x.growth / 100 }))}>
          <XAxis dataKey="day" /><YAxis /><Tooltip /><Legend /><Line dataKey="Patrimonio" stroke="#2d5aa8" dot={false} /><Line dataKey="Crescita" stroke="#16a34a" dot={false} /></LineChart></ResponsiveContainer></div></>}
      <ul className="text-xs">{[...s.d.snapshots].reverse().slice(0, 10).map(x => <li key={x.day}>{x.day} · {fmt(x.total)}{x.partial ? ' (parziale: cambi mancanti)' : ''}</li>)}</ul>
    </div>)
}
