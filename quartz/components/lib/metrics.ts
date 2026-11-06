// quartz/components/lib/metrics.ts
// Pure metric helpers for the brain homepage.

export type NoteData = {
  slug: string
  frontmatter?: Record<string, unknown>
  links?: string[]
  dates?: { created?: Date; modified?: Date }
}

export function isRealNote(note: NoteData): boolean {
  const slug = note.slug
  if (!slug || slug === "index" || slug.startsWith("tags/") || slug.startsWith("folders/")) return false
  return true
}

export function countNotes(notes: NoteData[]): number {
  return notes.filter(isRealNote).length
}

export function countLinks(notes: NoteData[]): number {
  let total = 0
  for (const n of notes) {
    if (!isRealNote(n)) continue
    total += (n.links ?? []).length
  }
  return total
}

export function orphans(notes: NoteData[], backlinks: Map<string, string[]>): NoteData[] {
  return notes.filter((n) => {
    if (!isRealNote(n)) return false
    const out = (n.links ?? []).length
    const back = (backlinks.get(n.slug) ?? []).length
    return out === 0 && back === 0
  })
}

export function topHubs(notes: NoteData[], backlinks: Map<string, string[]>, limit = 4): { slug: string; count: number }[] {
  const scored = notes
    .filter(isRealNote)
    .map((n) => {
      const out = (n.links ?? []).length
      const back = (backlinks.get(n.slug) ?? []).length
      return { slug: n.slug, count: out + back }
    })
    .sort((a, b) => b.count - a.count)
  return scored.slice(0, limit)
}

export function typeDistribution(notes: NoteData[]): Record<string, number> {
  const types = ["permanent", "inbox", "book", "moc", "idea", "unsorted"]
  const result: Record<string, number> = {}
  for (const t of types) result[t] = 0
  for (const n of notes) {
    if (!isRealNote(n)) continue
    const t = (n.frontmatter?.type as string) ?? "unsorted"
    if (result[t] === undefined) result.unsorted++
    else result[t]++
  }
  return result
}
