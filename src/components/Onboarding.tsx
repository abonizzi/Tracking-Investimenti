import { useState } from 'react'
import { Store } from '../store'
import { toCents } from '../lib/money'
import { setPin } from '../lib/pin'
const steps = ['Valuta', 'Conto', 'Investimento', 'Fondo pensione', 'Obiettivo', 'PIN']
export default function Onboarding({ s, onDone }: { s: Store; onDone: () => void }) {
  const [i, setI] = useState(0); const [err, setErr] = useState('')
  const next = () => { setErr(''); i === steps.length - 1 ? onDone() : setI(i + 1) }
  const act = (f: (fd: FormData) => void | Promise<void>) => async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); try { await f(new FormData(e.currentTarget)); next() } catch (x) { setErr((x as Error).message) } }
  const g = (fd: FormData, k: string) => String(fd.get(k) ?? '')
  return (
    <div className="mx-auto max-w-md space-y-4 p-4 pt-10">
      <div className="text-center"><img src="/icon-192.png" alt="" className="mx-auto h-16 w-16 rounded-2xl" /><h1 className="mt-2 text-lg font-semibold">Benvenuto in Mio Portafoglio</h1>
        <p className="text-xs">Passo {i + 1} di {steps.length}: {steps[i]} · tutti i passi si possono saltare</p></div>
      {err && <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm text-red-900">{err}</p>}
      {i === 0 && <div className="card space-y-2 text-sm"><p>La valuta principale è <b>EUR</b>. Altre valute (USD, GBP, CHF…) si usano indicando a mano il cambio in Impostazioni (1 unità estera = X EUR).</p><button className="btn" onClick={next}>Continua</button></div>}
      {i === 1 && <form className="card space-y-2" onSubmit={act(fd => s.addAccount(g(fd, 'name'), 'EUR', toCents(g(fd, 'bal') || '0')))}>
        <input className="inp" name="name" placeholder="Nome del conto" aria-label="Nome del conto" /><input className="inp" name="bal" placeholder="Saldo attuale" inputMode="decimal" aria-label="Saldo attuale" /><button className="btn">Crea conto</button></form>}
      {i === 2 && <form className="card space-y-2" onSubmit={act(fd => { if (!g(fd, 'name').trim()) throw new Error('Inserisci un nome'); s.addInvestment({ name: g(fd, 'name'), category: g(fd, 'cat'), invested: toCents(g(fd, 'inv') || '0'), value: toCents(g(fd, 'val') || '0'), currency: 'EUR', startDate: '' }) })}>
        <input className="inp" name="name" placeholder="Nome investimento" aria-label="Nome investimento" />
        <select className="inp" name="cat" aria-label="Categoria">{['azioni', 'etf', 'obbligazioni', 'cripto', 'altro'].map(c => <option key={c}>{c}</option>)}</select>
        <input className="inp" name="inv" placeholder="Capitale investito" inputMode="decimal" aria-label="Capitale investito" /><input className="inp" name="val" placeholder="Valore attuale" inputMode="decimal" aria-label="Valore attuale" /><button className="btn">Aggiungi</button></form>}
      {i === 3 && <form className="card space-y-2" onSubmit={act(fd => s.addPension({ name: g(fd, 'name'), invested: toCents(g(fd, 'inv') || '0'), value: toCents(g(fd, 'val') || '0'), currency: 'EUR', startDate: '' }))}>
        <input className="inp" name="name" placeholder="Nome fondo" aria-label="Nome fondo" /><input className="inp" name="inv" placeholder="Capitale versato" inputMode="decimal" aria-label="Capitale versato" /><input className="inp" name="val" placeholder="Valore attuale" inputMode="decimal" aria-label="Valore attuale" /><button className="btn">Aggiungi</button></form>}
      {i === 4 && <form className="card space-y-2" onSubmit={act(fd => { const c = toCents(g(fd, 'goal') || '0'); if (c <= 0) throw new Error('Inserisci un obiettivo positivo'); s.setGoal(c) })}>
        <input className="inp" name="goal" placeholder="Obiettivo patrimoniale (€)" inputMode="decimal" aria-label="Obiettivo patrimoniale" /><button className="btn">Imposta obiettivo</button></form>}
      {i === 5 && <form className="card space-y-2" onSubmit={act(fd => setPin(g(fd, 'pin')))}>
        <p className="text-xs">Il PIN protegge solo questo dispositivo.</p><input className="inp" name="pin" type="password" inputMode="numeric" placeholder="PIN (4-8 cifre)" aria-label="PIN" /><button className="btn">Attiva PIN</button></form>}
      {i > 0 && <button className="w-full text-sm underline" onClick={next}>{i === steps.length - 1 ? 'Salta e termina' : 'Salta questo passo'}</button>}
    </div>)
}
