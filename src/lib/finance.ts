export interface Position { invested: number; value: number } // centesimi
export const unrealizedGain = (p: Position) => p.value - p.invested
export const returnPct = (p: Position): number | null =>
  p.invested <= 0 ? null : (unrealizedGain(p) / p.invested) * 100
/** Un versamento non è un guadagno: capitale e valore crescono insieme. */
export const addContribution = (p: Position, amount: number): Position => {
  if (amount <= 0) throw new Error('Il versamento deve essere positivo')
  return { invested: p.invested + amount, value: p.value + amount }
}
export interface SaleResult { position: Position; costBasisSold: number; realizedProfit: number; estimated: true }
/** Vendita senza quantità: capitale attribuito in proporzione (STIMA, non calcolo fiscale).
 *  `netProceeds` è già netto commissioni: non vengono sottratte di nuovo. */
export const sell = (p: Position, netProceeds: number): SaleResult => {
  if (netProceeds <= 0) throw new Error('Incasso non valido')
  if (p.value <= 0) throw new Error('Valore attuale nullo')
  if (netProceeds > p.value) throw new Error('Incasso superiore al valore attuale')
  const costBasisSold = Math.round((p.invested * netProceeds) / p.value)
  return { position: { invested: p.invested - costBasisSold, value: p.value - netProceeds },
    costBasisSold, realizedProfit: netProceeds - costBasisSold, estimated: true }
}
export const cagr = (start: number, end: number, years: number): number | null =>
  start > 0 && end > 0 && years > 0 ? (Math.pow(end / start, 1 / years) - 1) * 100 : null
