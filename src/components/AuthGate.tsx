import { ReactNode, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type U = { id: string; email?: string }
export default function AuthGate({ children }: { children: (u: U, logout: () => void) => ReactNode }) {
  const [user, setUser] = useState<U | null>(null); const [ready, setReady] = useState(false); const [recovery, setRecovery] = useState(false)
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login'); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')
  useEffect(() => {
    const sb = supabase!
    sb.auth.getSession().then(({ data }) => { const u = data.session?.user; setUser(u ? { id: u.id, email: u.email } : null); setReady(true) })
    const { data: sub } = sb.auth.onAuthStateChange((ev, session) => { if (ev === 'PASSWORD_RECOVERY') setRecovery(true); const u = session?.user; setUser(u ? { id: u.id, email: u.email } : null) })
    return () => sub.subscription.unsubscribe()
  }, [])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setMsg(''); const sb = supabase!
    try {
      if (recovery) { if (pw.length < 8) throw new Error('La password deve avere almeno 8 caratteri'); const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error; setRecovery(false); setMsg('Password aggiornata.'); return }
      if (mode === 'reset') { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); if (error) throw error; setMsg('Se l\'indirizzo esiste, riceverai un\'email con il link.'); return }
      if (pw.length < 8) throw new Error('La password deve avere almeno 8 caratteri')
      if (mode === 'register') { const { error } = await sb.auth.signUp({ email, password: pw }); if (error) throw error; setMsg('Registrazione inviata: controlla l\'email se è richiesta la conferma.') }
      else { const { error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error }
    } catch (x) { setErr((x as Error).message) }
  }
  if (!ready) return <p className="p-8 text-sm">Caricamento…</p>
  if (user && !recovery) return <>{children(user, () => { supabase!.auth.signOut() })}</>
  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm space-y-3 p-4">
      <div className="text-center"><img src="/icon-192.png" alt="" className="mx-auto h-20 w-20 rounded-2xl" /><h1 className="mt-2 text-lg font-semibold">Mio Portafoglio</h1></div>
      <h2 className="text-center text-sm">{recovery ? 'Scegli una nuova password' : mode === 'login' ? 'Accedi' : mode === 'register' ? 'Registrati' : 'Recupera password'}</h2>
      {!recovery && <input className="inp" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} />}
      {(recovery || mode !== 'reset') && <input className="inp" type="password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Password (min. 8 caratteri)" aria-label="Password" value={pw} onChange={e => setPw(e.target.value)} />}
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p role="status" className="text-sm text-green-700">{msg}</p>}
      <button className="btn w-full">{recovery ? 'Aggiorna password' : mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Invia link'}</button>
      {!recovery && <div className="flex justify-between text-xs underline"><button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Crea un account' : 'Ho già un account'}</button>
        <button type="button" onClick={() => setMode('reset')}>Password dimenticata?</button></div>}
    </form>)
}
