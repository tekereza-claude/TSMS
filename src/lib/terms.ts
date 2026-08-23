// Terms unlock progressively as the school admin advances School.currentTerm —
// e.g. currentTerm "Term 2" makes both Term 1 and Term 2 available, not just Term 2.
export const TERM_ORDER = ["Term 1", "Term 2", "Term 3"] as const
export type Term = (typeof TERM_ORDER)[number]

export function availableTerms(currentTerm?: string): Term[] {
  const idx = TERM_ORDER.indexOf((currentTerm ?? "Term 1") as Term)
  return TERM_ORDER.slice(0, idx < 0 ? 1 : idx + 1)
}
