import type { Data } from '../store'
import { merge3 } from './merge'
/** Sincronizzazione a documento con revisione. In caso di modifiche concorrenti tenta un merge a tre vie per elemento; se non è possibile segnala il conflitto senza sovrascrivere. */
export interface RemoteDoc { data: Data; revision: number }
export interface Remote { fetch(): Promise<RemoteDoc | null>; push(data: Data, base: number): Promise<{ ok: true; revision: number } | { ok: false }> }
export interface Meta { base: number; dirty: boolean }
export type Outcome =
  | { kind: 'idle'; meta: Meta }
  | { kind: 'pushed'; meta: Meta }
  | { kind: 'pulled'; meta: Meta; data: Data }
  | { kind: 'merged'; meta: Meta; data: Data }
  | { kind: 'conflict'; meta: Meta; remote: RemoteDoc }
export async function syncOnce(local: Data, meta: Meta, remote: Remote, base: Data | null = null): Promise<Outcome> {
  const r = await remote.fetch()
  const resolve = async (rem: RemoteDoc): Promise<Outcome> => {
    const m = base && rem.revision >= meta.base ? merge3(base, local, rem.data) : null
    if (m && m.ok) { const p = await remote.push(m.data, rem.revision); if (p.ok) return { kind: 'merged', data: m.data, meta: { base: p.revision, dirty: false } } }
    return { kind: 'conflict', meta, remote: rem }
  }
  const tryPush = async (): Promise<Outcome> => {
    const p = await remote.push(local, meta.base)
    if (p.ok) return { kind: 'pushed', meta: { base: p.revision, dirty: false } }
    const fresh = await remote.fetch(); if (!fresh) throw new Error('Scrittura rifiutata')
    return resolve(fresh)
  }
  if (!r) return tryPush()
  if (r.revision === meta.base) return meta.dirty ? tryPush() : { kind: 'idle', meta }
  if (r.revision > meta.base && !meta.dirty) return { kind: 'pulled', data: r.data, meta: { base: r.revision, dirty: false } }
  return resolve(r)
}
