// PIN locale facoltativo: PBKDF2-SHA256 con salt casuale. Non sostituisce la sicurezza Supabase.
const KEY = 'mp:v1:pin'
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')
const derive = async (pin: string, salt: Uint8Array) => {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200_000 }, k, 256))
}
export const hasPin = () => !!localStorage.getItem(KEY)
export async function setPin(pin: string) {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('Il PIN deve avere da 4 a 8 cifre')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  localStorage.setItem(KEY, JSON.stringify({ salt: hex(salt.buffer), hash: await derive(pin, salt) }))
}
export async function verifyPin(pin: string) {
  const raw = localStorage.getItem(KEY); if (!raw) return true
  const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string }
  const s = new Uint8Array(salt.match(/../g)!.map(h => parseInt(h, 16)))
  return (await derive(pin, s)) === hash
}
export const clearPin = () => localStorage.removeItem(KEY)
