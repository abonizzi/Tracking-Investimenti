import { Rates, toEur } from './money'
export interface Item { value: number; currency: string }
/** Somma in EUR; gli elementi senza cambio sono esclusi e segnalati, mai stimati. */
export const sumEur = (items: Item[], rates: Rates) => {
  let total = 0, missing = false
  for (const i of items) { const e = toEur(i.value, i.currency, rates); if (e === null) missing = true; else total += e }
  return { total, missing }
}
