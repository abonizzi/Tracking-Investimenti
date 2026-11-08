import { useCallback, useEffect, useRef, useState } from 'react'
import type { Data, Store } from '../store'
import { supabase } from '../lib/supabase'
import { Meta, Remote, RemoteDoc, syncOnce } from '../lib/sync'
import { exportBackup } from '../lib/backup'
export type SyncStatus = 'locale' | 'offline' | 'sincronizzato' | 'sincronizzazione' | 'da sincronizzare' | 'conflitto' | 'errore'
const remote: Remote = {
  async fetch() { const { data, error } = await supabase!.from('user_state').select('data,revision').maybeSingle(); if (error) throw error; return data as RemoteDoc | null },
  async push(data, base) {
    if (base === 0) { const { data: r, error } = await supabase!.from('user_state').insert({ data, revision: 1 }).select('revision').single(); if (error) { if (error.code === '23505') return { ok: false }; throw error } return { ok: true, revision: r.revision } }
    const { data: rows, error } = await supabase!.from('user_state').update({ data, revision: base + 1, updated_at: new Date().toISOString() }).eq('revision', base).select('revision')
    if (error) throw error; return rows && rows.length ? { ok: true, revision: rows[0].revision } : { ok: false }
  } }
export function useSync(userId: string, s: Store, enabled: boolean) {
  const mk = `mp:v1:u:${userId}:meta`, bk = `mp:v1:u:${userId}:base`
  const meta = useRef<Meta>((() => { try { return JSON.parse(localStorage.getItem(mk) || '') as Meta } catch { return { base: 0, dirty: false } } })())
  const [status, setStatus] = useState<SyncStatus>(enabled ? 'sincronizzazione' : 'locale')
  const [conflict, setConflict] = useState<RemoteDoc | null>(null)
  const data = useRef(s.d); data.current = s.d
  const busy = useRef(false), skip = useRef(false), first = useRef(true), blocked = useRef(false)
  const save = () => { try { localStorage.setItem(mk, JSON.stringify(meta.current)) } catch { /* quota */ } }
  const loadBase = (): Data | null => { try { return JSON.parse(localStorage.getItem(bk) || 'null') } catch { return null } }
  const saveBase = (d: Data) => { try { localStorage.setItem(bk, JSON.stringify(d)) } catch { /* quota */ } }
  const run = useCallback(async () => {
    if (!enabled || busy.current || blocked.current) return
    if (!navigator.onLine) return setStatus('offline')
    busy.current = true; setStatus('sincronizzazione')
    try {
      const sent = data.current; const o = await syncOnce(sent, meta.current, remote, loadBase())
      const changed = data.current !== sent // modifiche fatte mentre si sincronizzava: non vanno perse
      if (o.kind === 'conflict') { meta.current = o.meta; save(); blocked.current = true; setConflict(o.remote); setStatus('conflitto'); return }
      if (o.kind === 'idle') { saveBase(sent); meta.current = o.meta }
      else if (o.kind === 'pushed') { saveBase(sent); meta.current = changed ? { base: o.meta.base, dirty: true } : o.meta }
      else if (!changed) { saveBase(o.data); skip.current = true; s.restore(o.data); meta.current = o.meta } // pulled | merged
      // se pulled/merged con modifiche in corso: si mantiene lo stato precedente e si riprova (il merge combinerà tutto)
      save(); setStatus(changed ? 'da sincronizzare' : 'sincronizzato'); if (changed) setTimeout(run, 300)
    } catch { setStatus('errore') } finally { busy.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
  useEffect(() => {
    if (!enabled) return
    if (first.current) { first.current = false; run(); return }
    if (skip.current) { skip.current = false; return }
    meta.current = { ...meta.current, dirty: true }; save(); if (!blocked.current) setStatus('da sincronizzare')
    const t = setTimeout(run, 1500); return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.d])
  useEffect(() => {
    if (!enabled) return
    const on = () => run(), off = () => setStatus('offline'); const i = setInterval(run, 60_000)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { clearInterval(i); removeEventListener('online', on); removeEventListener('offline', off) }
  }, [enabled, run])
  const download = (name: string, text: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click() }
  return { status, conflict,
    keepLocal: () => { if (!conflict) return; meta.current = { base: conflict.revision, dirty: true }; save(); blocked.current = false; setConflict(null); run() },
    useRemote: () => { if (!conflict) return; download('backup-locale-prima-del-conflitto.json', exportBackup(data.current)); skip.current = true; s.restore(conflict.data); saveBase(conflict.data)
      meta.current = { base: conflict.revision, dirty: false }; save(); blocked.current = false; setConflict(null); setStatus('sincronizzato') } }
}
