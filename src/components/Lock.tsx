import { useState } from 'react'
import { verifyPin } from '../lib/pin'
export default function Lock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState(''); const [err, setErr] = useState('')
  return (
    <form className="mx-auto mt-24 max-w-xs space-y-3 p-4 text-center" onSubmit={async e => { e.preventDefault(); if (await verifyPin(pin)) onUnlock(); else { setErr('PIN errato'); setPin('') } }}>
      <img src="/icon-192.png" alt="" className="mx-auto h-20 w-20 rounded-2xl" /><h1 className="text-lg font-semibold">Mio Portafoglio</h1>
      <input className="inp text-center" type="password" inputMode="numeric" autoFocus value={pin} onChange={e => setPin(e.target.value)} aria-label="PIN" />
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}<button className="btn w-full">Sblocca</button>
    </form>)
}
