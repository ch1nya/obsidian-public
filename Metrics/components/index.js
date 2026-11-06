import { h } from "preact"

function isRealNote(slug) {
  if (!slug || slug === "index") return false
  if (slug.startsWith("tags/") || slug.startsWith("folders/")) return false
  return true
}

function countNotes(allFiles) {
  return allFiles.filter((f) => isRealNote(f.slug)).length
}

function countLinks(allFiles) {
  let total = 0
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    total += (f.links ?? []).length
  }
  return total
}

function typeDistribution(allFiles) {
  const types = ["permanent", "inbox", "book", "moc", "idea", "unsorted"]
  const result = {}
  for (const t of types) result[t] = 0
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    const t = (f.frontmatter && f.frontmatter.type) || "unsorted"
    if (result[t] === undefined) result.unsorted++
    else result[t]++
  }
  return result
}

function recentNotes(allFiles, n = 5) {
  return allFiles
    .filter((f) => isRealNote(f.slug))
    .sort((a, b) => {
      const da = a.frontmatter?.date ? new Date(a.frontmatter.date) : new Date(0)
      const db = b.frontmatter?.date ? new Date(b.frontmatter.date) : new Date(0)
      return db - da
    })
    .slice(0, n)
}

const MetricsComponent = (props) => {
  if (props?.fileData?.slug !== "index") return null
  const allFiles = props.allFiles ?? []
  const notes = countNotes(allFiles)
  const links = countLinks(allFiles)
  const lpn = notes > 0 ? (links / notes).toFixed(1) : "0.0"
  const types = typeDistribution(allFiles)
  const recent = recentNotes(allFiles, 5)

  return h("div", { class: "metrics" }, [
    h("div", { class: "metrics-grid" }, [
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-value" }, String(notes)),
        h("div", { class: "metric-label" }, "заметки"),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-value" }, String(links)),
        h("div", { class: "metric-label" }, "ссылки"),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-value" }, lpn),
        h("div", { class: "metric-label" }, "ссылок на заметку"),
      ]),
    ]),
    h("div", { class: "metrics-types" }, [
      h("h3", null, "Типы заметок"),
      ...Object.entries(types).map(([t, c]) =>
        h("div", { class: "type-row" }, [
          h("span", { class: "type-name" }, t),
          h("span", { class: "type-count" }, String(c)),
        ]),
      ),
    ]),
    h("div", { class: "metrics-recent" }, [
      h("h3", null, "Недавние"),
      ...recent.map((n) =>
        h("div", { class: "recent-row" }, [
          h("a", { href: "/" + n.slug, class: "internal" }, n.frontmatter?.title ?? n.slug),
        ]),
      ),
    ]),
  ])
}

MetricsComponent.css = `
.metrics { padding: 1rem 0; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.metric-card { border: 1px solid var(--lightgray); border-radius: 10px; padding: 0.75rem; }
.metric-value { font-family: var(--mono); font-size: 1.5rem; color: var(--secondary); }
.metric-label { font-family: var(--mono); font-size: 0.75rem; color: var(--gray); }
.metrics-types, .metrics-recent { margin-top: 1rem; }
.type-row, .recent-row { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 0.8rem; padding: 0.25rem 0; }
`

export const Metrics = () => MetricsComponent
export default () => MetricsComponent