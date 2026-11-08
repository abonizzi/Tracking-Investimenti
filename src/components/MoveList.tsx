export interface Row { id: string; text: string; canEdit?: boolean; canDelete?: boolean }
export default function MoveList({ rows, onEdit, onDelete }: { rows: Row[]; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  if (!rows.length) return null
  return (
    <details className="mt-2 text-xs"><summary className="cursor-pointer">Storico movimenti ({rows.length})</summary>
      <ul className="mt-1 space-y-1">{rows.map(r => (
        <li key={r.id} className="flex items-center justify-between gap-2"><span>{r.text}</span>
          <span className="flex shrink-0 gap-2">{r.canEdit !== false && <button className="underline" onClick={() => onEdit(r.id)}>Modifica</button>}
            {r.canDelete !== false && <button className="text-red-600 underline" onClick={() => onDelete(r.id)}>Annulla</button>}</span></li>))}</ul></details>)
}
