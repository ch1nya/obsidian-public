import { h } from "preact"

function isRealNote(slug) {
  if (!slug) return false
  if (slug === "index" || slug === "404") return false
  if (slug.endsWith("/index")) return false
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

function backlinkCounts(allFiles) {
  const counts = {}
  const realSlugs = new Set(allFiles.filter((f) => isRealNote(f.slug)).map((f) => f.slug))
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    for (const l of f.links ?? []) {
      if (realSlugs.has(l)) {
        counts[l] = (counts[l] ?? 0) + 1
      }
    }
  }
  return counts
}

function hubs(allFiles, n = 5) {
  const counts = backlinkCounts(allFiles)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([slug, c]) => {
      const f = allFiles.find((x) => x.slug === slug)
      return { slug, count: c, title: f?.frontmatter?.title ?? slug }
    })
}

function topTags(allFiles, n = 8) {
  const counts = {}
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    for (const t of f.frontmatter?.tags ?? []) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

function monthlyActivity(allFiles) {
  const counts = {}
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    const d = f.frontmatter?.created || f.frontmatter?.date
    if (!d) continue
    const key = String(d).slice(0, 7)
    counts[key] = (counts[key] ?? 0) + 1
  }
  const keys = Object.keys(counts).sort()
  return keys.map((k) => ({ month: k, count: counts[k] }))
}

function randomNote(allFiles) {
  const real = allFiles.filter((f) => isRealNote(f.slug))
  if (real.length === 0) return null
  return real[Math.floor(Math.random() * real.length)]
}

const MetricsComponent = (props) => {
  if (props?.fileData?.slug !== "index") return null
  const allFiles = props.allFiles ?? []
  const notes = countNotes(allFiles)
  const links = countLinks(allFiles)
  const lpn = notes > 0 ? (links / notes).toFixed(1) : "0.0"
  const types = typeDistribution(allFiles)
  const recent = recentNotes(allFiles, 5)
  const hubsList = hubs(allFiles, 5)
  const tags = topTags(allFiles, 8)
  const activity = monthlyActivity(allFiles)
  const rnd = randomNote(allFiles)
  const maxActivity = Math.max(1, ...activity.map((a) => a.count))

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
    h("div", { class: "metrics-section" }, [
      h("h3", null, "Типы заметок"),
      ...Object.entries(types).map(([t, c]) =>
        h("div", { class: "type-row" }, [
          h("span", { class: "type-name" }, t),
          h("span", { class: "type-count" }, String(c)),
        ]),
      ),
    ]),
    h("div", { class: "metrics-section" }, [
      h("h3", null, "Активность по месяцам"),
      h("div", { class: "sparkline" }, activity.map((a) =>
        h("div", { class: "spark-bar", style: "height:" + Math.round((a.count / maxActivity) * 40) + "px", title: a.month + ": " + a.count }, null),
      )),
    ]),
    h("div", { class: "metrics-section" }, [
      h("h3", null, "Хабы (по входящим ссылкам)"),
      ...hubsList.map((hb) =>
        h("div", { class: "hub-row" }, [
          h("a", { href: "/" + hb.slug, class: "internal" }, hb.title),
          h("span", { class: "hub-count" }, String(hb.count)),
        ]),
      ),
    ]),
    h("div", { class: "metrics-section" }, [
      h("h3", null, "Топ тегов"),
      h("div", { class: "tags-cloud" }, tags.map(([t, c]) =>
        h("span", { class: "tag-chip" }, t + " (" + c + ")"),
      )),
    ]),
    h("div", { class: "metrics-section" }, [
      h("h3", null, "Недавние"),
      ...recent.map((n) =>
        h("div", { class: "recent-row" }, [
          h("a", { href: "/" + n.slug, class: "internal" }, n.frontmatter?.title ?? n.slug),
        ]),
      ),
    ]),
    rnd ? h("div", { class: "metrics-section" }, [
      h("h3", null, "Случайная заметка"),
      h("a", { href: "/" + rnd.slug, class: "internal" }, rnd.frontmatter?.title ?? rnd.slug),
    ]) : null,
  ])
}

MetricsComponent.css = `
.metrics { padding: 1rem 0; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.metric-card { border: 1px solid var(--lightgray); border-radius: 10px; padding: 0.75rem; }
.metric-value { font-family: var(--mono); font-size: 1.5rem; color: var(--secondary); }
.metric-label { font-family: var(--mono); font-size: 0.75rem; color: var(--gray); }
.metrics-section { margin-top: 1.25rem; }
.metrics-section h3 { font-family: var(--mono); font-size: 0.9rem; color: var(--darkgray); margin-bottom: 0.4rem; }
.type-row, .hub-row, .recent-row { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 0.8rem; padding: 0.25rem 0; }
.hub-count { color: var(--gray); }
.tags-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-chip { font-family: var(--mono); font-size: 0.75rem; border: 1px solid var(--lightgray); border-radius: 6px; padding: 2px 6px; }
.sparkline { display: flex; align-items: flex-end; gap: 4px; height: 44px; }
.spark-bar { width: 14px; background: var(--secondary); border-radius: 2px; }
`

export const Metrics = () => MetricsComponent
export default () => MetricsComponent