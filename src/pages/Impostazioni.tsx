import { useState } from 'react'
import { askChoice, askText } from '../components/Dialog'
import { Store, Data } from '../store'
import { exportBackup, parseBackup, mergeData } from '../lib/backup'
import { buildReport } from '../lib/pdf'
import { hasPin, setPin, clearPin } from '../lib/pin'
const dl = (name: string, text: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click() }
export default function Impostazioni({ s, hidden, setHidden }: { s: Store; hidden: boolean; setHidden: (v: boolean) => void }) {
  const [msg, setMsg] = useState(''); const [pinOn, setPinOn] = useState(hasPin())
  const y = new Date().getFullYear(); const [from, setFrom] = useState(`${y}-01-01`); const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const used = Array.from(new Set(['USD', 'GBP', 'CHF', ...s.d.investments.map(i => i.currency), ...s.d.accounts.map(a => a.currency), ...s.d.pensions.map(p => p.currency)])).filter(c => c !== 'EUR')
  const onFile = async (f: File | undefined) => {
    if (!f) return; const r = parseBackup(await f.text()); if (!r.ok) return setMsg(r.error)
    const idx = await askChoice('Ripristino backup', ['Unisci (aggiunge solo elementi nuovi)', 'Sostituisci tutto (scarica prima un backup dei dati attuali)']); const mode = idx === null ? null : String(idx + 1)
    if (mode === '1') { const m = mergeData(s.d, r.data); s.restore(m.data); setMsg(`Uniti ${m.added} elementi nuovi.`) }
    else if (mode === '2' && window.confirm('Sostituire TUTTI i dati attuali?')) { dl('backup-prima-del-ripristino.json', exportBackup(s.d)); s.restore(r.data); setMsg('Dati sostituiti.') }
    else setMsg('Ripristino annullato.')
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Impostazioni</h2>
      {msg && <p role="status" className="rounded-lg bg-sky-100 p-2 text-sm text-sky-900">{msg}</p>}
      <div className="card space-y-2"><p className="text-sm">Cambi manuali: 1 unità di valuta estera = X EUR. Valuta principale: EUR.</p>
        {used.map(c => <label key={c} className="flex items-center gap-2 text-sm"><span className="w-12">{c}</span>
          <input className="inp" type="number" step="0.0001" min="0" defaultValue={s.d.rates[c] ?? ''} placeholder="Cambio in EUR" onBlur={e => s.setRate(c, Number(e.target.value || 0))} /></label>)}</div>
      <div className="card space-y-2"><b className="text-sm">Privacy e PIN</b>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} />Nascondi gli importi</label>
        <p className="text-xs">Il PIN protegge solo questo dispositivo e non sostituisce la sicurezza dell'account.</p>
        {pinOn ? <button className="btn" onClick={() => { clearPin(); setPinOn(false); setMsg('PIN disattivato.') }}>Disattiva PIN</button>
          : <button className="btn" onClick={async () => { try { await setPin((await askText('Scegli un PIN (4-8 cifre)', true)) ?? ''); setPinOn(true); setMsg('PIN attivato.') } catch (e) { setMsg((e as Error).message) } }}>Attiva PIN</button>}</div>
      <div className="card space-y-2"><b className="text-sm">Backup</b>
        <div className="flex flex-wrap gap-2"><button className="btn" onClick={() => dl('mio-portafoglio-backup.json', exportBackup(s.d))}>Esporta JSON</button>
          <label className="btn cursor-pointer">Importa JSON<input type="file" accept="application/json" className="sr-only" onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} /></label></div></div>
      <div className="card space-y-2"><b className="text-sm">Report PDF</b>
        <div className="flex flex-wrap items-center gap-2"><input className="inp !w-auto" type="date" value={from} onChange={e => setFrom(e.target.value)} aria-label="Da" /><input className="inp !w-auto" type="date" value={to} onChange={e => setTo(e.target.value)} aria-label="A" />
          <button className="btn" onClick={() => from <= to ? buildReport(s.d as Data, from, to) : setMsg('Intervallo date non valido')}>Genera PDF</button></div></div>
    </div>)
}
