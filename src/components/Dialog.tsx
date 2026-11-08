import { useEffect, useState } from 'react'
import { toCents } from '../lib/money'
type Req = { kind: 'amount' | 'text' | 'choice'; label: string; options?: string[]; password?: boolean; resolve: (v: string | number | null) => void }
let push: ((r: Req) => void) | null = null
const open = <T,>(r: Omit<Req, 'resolve'>) => new Promise<T | null>(res => { if (!push) return res(null); push({ ...r, resolve: v => res(v as T | null) }) })
/** Importo in centesimi, o null se annullato. */
export const askAmount = (label: string) => open<number>({ kind: 'amount', label })
export const askText = (label: string, password = false) => open<string>({ kind: 'text', label, password })
/** Indice scelto, o null se annullato. */
export const askChoice = (label: string, options: string[]) => open<number>({ kind: 'choice', label, options })
export function DialogHost() {
  const [req, setReq] = useState<Req | null>(null); const [val, setVal] = useState(''); const [err, setErr] = useState('')
  useEffect(() => { push = r => { setVal(''); setErr(''); setReq(r) }; return () => { push = null } }, [])
  if (!req) return null
  const close = (v: string | number | null) => { req.resolve(v); setReq(null) }
  const submit = (e: React.FormEvent) => { e.preventDefault()
    if (req.kind === 'amount') { try { const c = toCents(val); if (!(c > 0)) throw new Error(); close(c) } catch { setErr('Inserisci un importo positivo valido') } }
    else close(val) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onKeyDown={e => e.key === 'Escape' && close(null)}>
      <form role="dialog" aria-modal="true" aria-label={req.label} onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <p className="text-sm font-medium">{req.label}</p>
        {req.kind === 'choice' ? <div className="space-y-2">{req.options!.map((o, i) => <button type="button" key={o} className="btn w-full text-left" onClick={() => close(i)}>{o}</button>)}</div>
          : <input className="inp" autoFocus inputMode={req.kind === 'amount' ? 'decimal' : 'numeric'} type={req.password ? 'password' : 'text'} value={val} onChange={e => setVal(e.target.value)} aria-label={req.label} />}
        {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn !bg-slate-500" onClick={() => close(null)}>Annulla</button>{req.kind !== 'choice' && <button className="btn">OK</button>}</div>
      </form>
    </div>)
}
