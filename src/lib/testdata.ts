import type { Data } from '../store'
export const mkData = (p: Partial<Data> = {}): Data => ({ investments: [], movements: [], accounts: [], accMovements: [], pensions: [], pensionMovements: [], pacs: [], pacPayments: [], snapshots: [], rates: {}, goal: 0, ...p })
