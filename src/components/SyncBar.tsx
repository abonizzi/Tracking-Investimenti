import type { SyncStatus } from '../hooks/useSync'
interface P { status: SyncStatus; conflict: boolean; email?: string; onLocal: () => void; onRemote: () => void; onLogout?: () => void }
export default function SyncBar({ status, conflict, email, onLocal, onRemote, onLogout }: P) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-xs"><span role="status">Stato: <b>{status}</b>{email ? ` · ${email}` : ''}</span>
        {onLogout && <button className="underline" onClick={onLogout}>Esci</button>}</div>
      {conflict && <div role="alert" className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
        <p>Sul server ci sono modifiche più recenti e anche questo dispositivo ha modifiche non sincronizzate. Nessun dato è stato cancellato.</p>
        <div className="mt-2 flex flex-wrap gap-2"><button className="btn" onClick={onLocal}>Tieni questo dispositivo</button>
          <button className="btn" onClick={onRemote}>Usa il server (scarica prima un backup locale)</button></div></div>}
    </div>)
}
