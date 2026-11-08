import { useEffect, useState } from 'react'
import { LayoutDashboard, TrendingUp, Wallet, PiggyBank, Settings, Repeat, LineChart } from 'lucide-react'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import Investimenti from './pages/Investimenti'
import Liquidita from './pages/Liquidita'
import Pensione from './pages/Pensione'
import Pac from './pages/Pac'
import Andamento from './pages/Andamento'
import AuthGate from './components/AuthGate'
import SyncBar from './components/SyncBar'
import { useSync } from './hooks/useSync'
import { supabase } from './lib/supabase'
import { DialogHost } from './components/Dialog'
import Onboarding from './components/Onboarding'
import Lock from './components/Lock'
import { hasPin } from './lib/pin'
import { setHidden } from './lib/money'
import { sumEur } from './lib/totals'
import Impostazioni from './pages/Impostazioni'
const nav = [{ id: 'dash', label: 'Dashboard', Icon: LayoutDashboard }, { id: 'inv', label: 'Investimenti', Icon: TrendingUp }, { id: 'liq', label: 'Liquidità', Icon: Wallet }, { id: 'pac', label: 'PAC', Icon: Repeat }, { id: 'and', label: 'Andamento', Icon: LineChart }, { id: 'pen', label: 'Pensione', Icon: PiggyBank }, { id: 'set', label: 'Impostazioni', Icon: Settings, Repeat, LineChart }] as const
function Main({ userId, cloud, email, onLogout }: { userId: string; cloud: boolean; email?: string; onLogout?: () => void }) {
  const s = useStore(userId); const sync = useSync(userId, s, cloud); const [page, setPage] = useState<(typeof nav)[number]['id']>('dash')
  const [hidden, setHid] = useState(() => localStorage.getItem('mp:v1:hidden') === '1')
  const [locked, setLocked] = useState(hasPin())
  const obKey = `mp:v1:${userId}:onboarded`
  const [onb, setOnb] = useState(() => !localStorage.getItem(obKey) && !s.d.investments.length && !s.d.accounts.length && !s.d.pensions.length)
  const doneOnb = () => { try { localStorage.setItem(obKey, '1') } catch { /* */ } setOnb(false) }
  setHidden(hidden)
  const changeHidden = (v: boolean) => { setHid(v); try { localStorage.setItem('mp:v1:hidden', v ? '1' : '0') } catch { /* */ } }
  useEffect(() => { // blocco dopo 5 minuti di inattività
    let t: ReturnType<typeof setTimeout>
    const reset = () => { clearTimeout(t); t = setTimeout(() => { if (hasPin()) setLocked(true) }, 5 * 60_000) }
    const ev = ['pointerdown', 'keydown', 'scroll']; ev.forEach(e => addEventListener(e, reset)); reset()
    return () => { clearTimeout(t); ev.forEach(e => removeEventListener(e, reset)) }
  }, [])
  const takeSnapshot = () => {
    const I = sumEur(s.d.investments, s.d.rates), L = sumEur(s.d.accounts.map(a => ({ value: a.balance, currency: a.currency })), s.d.rates), P = sumEur(s.d.pensions, s.d.rates)
    const total = I.total + L.total + P.total
    if (total === 0 && !s.d.investments.length && !s.d.accounts.length && !s.d.pensions.length) return
    s.saveSnapshot({ day: new Date().toISOString().slice(0, 10), total, investments: I.total, liquidity: L.total, pension: P.total, partial: I.missing || L.missing || P.missing })
  }
  // Snapshot giornaliero automatico all'apertura/uso dell'app (aggiorna quello del giorno).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(takeSnapshot, [s.d.investments, s.d.accounts, s.d.pensions, s.d.rates])
  if (locked) return <Lock onUnlock={() => setLocked(false)} />
  if (onb) return <Onboarding s={s} onDone={doneOnb} />
  return (
    <div className="min-h-screen md:flex">
      <DialogHost />
      <aside className="hidden w-56 shrink-0 bg-brand-900 p-4 text-white md:block">
        <div className="mb-6 flex items-center gap-2"><img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl" /><b>Mio Portafoglio</b></div>
        {nav.map(n => <button key={n.id} onClick={() => setPage(n.id)} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${page === n.id ? 'bg-brand-500' : ''}`}><n.Icon size={18} />{n.label}</button>)}
      </aside>
      <main className="flex-1 p-4 pb-20 md:p-8">
        {cloud ? <SyncBar status={sync.status} conflict={!!sync.conflict} email={email} onLocal={sync.keepLocal} onRemote={sync.useRemote} onLogout={onLogout} /> : <p className="mb-4 text-xs">Modalità locale: Supabase non configurato, i dati restano su questo dispositivo.</p>}
        {page === 'dash' ? <Dashboard s={s} /> : page === 'inv' ? <Investimenti s={s} /> : page === 'liq' ? <Liquidita s={s} /> : page === 'pac' ? <Pac s={s} /> : page === 'and' ? <Andamento s={s} snap={takeSnapshot} /> : page === 'pen' ? <Pensione s={s} /> : <Impostazioni s={s} hidden={hidden} setHidden={changeHidden} />}</main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around gap-1 overflow-x-auto bg-brand-900 py-2 text-white md:hidden">
        {nav.map(n => <button key={n.id} onClick={() => setPage(n.id)} aria-label={n.label} className={`flex min-w-[4.5rem] flex-col items-center text-xs ${page === n.id ? 'text-sky-300' : ''}`}><n.Icon size={20} />{n.label}</button>)}
      </nav>
    </div>)
}

export default function App() {
  if (!supabase) return <Main userId="local" cloud={false} />
  return <AuthGate>{(u, logout) => <Main key={u.id} userId={u.id} cloud email={u.email} onLogout={logout} />}</AuthGate>
}
