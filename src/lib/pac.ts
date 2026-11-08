import { addMonths, format, parseISO } from 'date-fns'
export interface PacLike { active: boolean; nextDue: string }
export const advanceDue = (iso: string, months: number) => format(addMonths(parseISO(iso), months), 'yyyy-MM-dd')
export const isDue = (p: PacLike, today: string) => p.active && p.nextDue <= today
export const alreadyPaid = (payments: { pacId: string; dueDate: string }[], pacId: string, dueDate: string) =>
  payments.some(x => x.pacId === pacId && x.dueDate === dueDate)
