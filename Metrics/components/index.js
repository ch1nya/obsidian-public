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

function backlinkCounts(allFiles) {
  const counts = {}
  const realSlugs = new Set(allFiles.filter((f) => isRealNote(f.slug)).map((f) => f.slug))
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    for (const l of f.links ?? []) {
      if (realSlugs.has(l)) counts[l] = (counts[l] ?? 0) + 1
    }
  }
  return counts
}

function orphans(allFiles) {
  const back = backlinkCounts(allFiles)
  return allFiles.filter((f) => {
    if (!isRealNote(f.slug)) return false
    const out = (f.links ?? []).length
    const inn = back[f.slug] ?? 0
    return out === 0 && inn === 0
  }).length
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

function hubs(allFiles, n = 4) {
  const back = backlinkCounts(allFiles)
  return allFiles
    .filter((f) => isRealNote(f.slug))
    .map((f) => ({ slug: f.slug, title: f.frontmatter?.title ?? f.slug, count: (f.links ?? []).length + (back[f.slug] ?? 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

function topTags(allFiles, n = 6) {
  const counts = {}
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    for (const t of f.frontmatter?.tags ?? []) counts[t] = (counts[t] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function createdDate(f) {
  const d = f.frontmatter?.created || f.frontmatter?.date
  if (!d) return null
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? null : dt
}

function weeklyDelta(allFiles) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  let n = 0
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    const d = createdDate(f)
    if (d && d >= weekAgo) n++
  }
  return n
}

function heatmapData(allFiles) {
  const counts = {}
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    const d = createdDate(f)
    if (!d) continue
    const key = d.toISOString().slice(0, 10)
    counts[key] = (counts[key] ?? 0) + 1
  }
  const cells = []
  const start = new Date()
  start.setDate(start.getDate() - 111)
  for (let i = 0; i < 112; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const c = counts[key] ?? 0
    let level = 0
    if (c >= 4) level = 4
    else if (c === 3) level = 3
    else if (c === 2) level = 2
    else if (c === 1) level = 1
    cells.push(level)
  }
  return cells
}

function growthData(allFiles) {
  const dates = allFiles.filter((f) => isRealNote(f.slug)).map(createdDate).filter(Boolean).sort((a, b) => a - b)
  const points = []
  if (dates.length === 0) return points
  const totalWeeks = 10
  const first = dates[0].getTime()
  const last = dates[dates.length - 1].getTime()
  const span = Math.max(last - first, 1)
  for (let i = 0; i <= totalWeeks; i++) {
    const t = first + (span * i) / totalWeeks
    points.push(dates.filter((d) => d.getTime() <= t).length)
  }
  return points
}

function streakDays(allFiles) {
  const counts = {}
  for (const f of allFiles) {
    if (!isRealNote(f.slug)) continue
    const d = createdDate(f)
    if (!d) continue
    counts[d.toISOString().slice(0, 10)] = (counts[d.toISOString().slice(0, 10)] ?? 0) + 1
  }
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    if (counts[key]) streak++
    else break
  }
  return streak
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
  const orph = orphans(allFiles)
  const types = typeDistribution(allFiles)
  const hubsList = hubs(allFiles, 4)
  const tags = topTags(allFiles, 6)
  const heat = heatmapData(allFiles)
  const growth = growthData(allFiles)
  const streak = streakDays(allFiles)
  const wDelta = weeklyDelta(allFiles)
  const rnd = randomNote(allFiles)
  const maxType = Math.max(1, ...Object.values(types))

  const gpoints = growth.map((v, i) => {
    const x = (i / Math.max(1, growth.length - 1)) * 200
    const y = 70 - (v / Math.max(1, notes)) * 62
    return x + "," + y
  }).join(" ")

  const netNodes = hubs(allFiles, 5)

  return h("div", { class: "metrics" }, [
    h("div", { class: "metrics-title" }, "Второй мозг"),
    h("div", { class: "metrics-grid" }, [
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-label" }, "ЗАМЕТОК"),
        h("div", { class: "metric-value" }, String(notes)),
        h("div", { class: "metric-delta" }, "+" + wDelta + " за неделю"),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-label" }, "СВЯЗЕЙ"),
        h("div", { class: "metric-value" }, String(links)),
        h("div", { class: "metric-delta" }, ""),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-label" }, "СВЯЗЕЙ / ЗАМЕТКА"),
        h("div", { class: "metric-value" }, lpn),
        h("div", { class: "metric-goal" }, "цель 3+"),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-label" }, "СИРОТЫ"),
        h("div", { class: "metric-value" }, String(orph)),
        h("div", { class: "metric-goal" }, "без ссылок"),
      ]),
    ]),
    h("div", { class: "metrics-row" }, [
      h("div", { class: "metrics-card" }, [
        h("div", { class: "metrics-card-title" }, "АКТИВНОСТЬ · 16 НЕДЕЛЬ"),
        h("div", { class: "heatmap" }, heat.map((lvl) =>
          h("div", { class: "heat-cell heat-" + lvl }, null)
        )),
        h("div", { class: "metrics-foot" }, "серия: " + streak + " дн."),
      ]),
      h("div", { class: "metrics-card" }, [
        h("div", { class: "metrics-card-title" }, "РОСТ БАЗЫ"),
        h("svg", { viewBox: "0 0 200 70", width: "100%", height: "70", class: "growth-svg" }, [
          h("polyline", { points: gpoints, fill: "none", stroke: "var(--secondary)", "stroke-width": 1.5 }),
          h("line", { x1: 0, y1: 68, x2: 200, y2: 68, stroke: "var(--lightgray)" }),
          growth.length > 0 ? h("circle", { cx: 200, cy: 70 - (growth[growth.length - 1] / Math.max(1, notes)) * 62, r: 3, fill: "var(--secondary)" }) : null,
        ]),
        h("div", { class: "metrics-foot" }, "заметки · по неделям"),
      ]),
    ]),
    h("div", { class: "metrics-row" }, [
      h("div", { class: "metrics-card" }, [
        h("div", { class: "metrics-card-title" }, "ГРАФ · РАЗМЕР = ЧИСЛО СВЯЗЕЙ"),
        h("svg", { viewBox: "0 0 200 100", width: "100%", height: "100" }, [
          h("g", { stroke: "var(--lightgray)", "stroke-width": 1 }, netNodes.map((_, i) => {
            if (i === 0) return null
            const cx = 100 + 60 * Math.cos((i / netNodes.length) * Math.PI * 2)
            const cy = 50 + 30 * Math.sin((i / netNodes.length) * Math.PI * 2)
            return h("line", { x1: 100, y1: 50, x2: cx, y2: cy })
          }).filter(Boolean)),
          h("circle", { cx: 100, cy: 50, r: 8, fill: "none", stroke: "var(--secondary)", "stroke-width": 1.5 }),
          ...netNodes.slice(1).map((_, i) => {
            const cx = 100 + 60 * Math.cos(((i + 1) / netNodes.length) * Math.PI * 2)
            const cy = 50 + 30 * Math.sin(((i + 1) / netNodes.length) * Math.PI * 2)
            return h("circle", { cx, cy, r: 4, fill: "var(--gray)" })
          }),
        ]),
      ]),
      h("div", { class: "metrics-card" }, [
        h("div", { class: "metrics-card-title" }, "ХАБЫ · ТОП ПО СВЯЗЯМ"),
        ...hubsList.map((hb) =>
          h("div", { class: "hub-row" }, [
            h("a", { href: "./" + hb.slug, class: "internal" }, hb.title),
            h("span", { class: "hub-count" }, String(hb.count)),
          ])
        ),
      ]),
    ]),
    h("div", { class: "metrics-row" }, [
      h("div", { class: "metrics-card" }, [
        h("div", { class: "metrics-card-title" }, "ПО ТИПАМ"),
        ...Object.entries(types).map(([t, c]) =>
          h("div", { class: "type-row" }, [
            h("span", { class: "type-name" }, t),
            h("div", { class: "type-bar", style: "width:" + Math.round((c / maxType) * 100) + "px" }, null),
            h("span", { class: "type-count" }, String(c)),
          ])
        ),
      ]),
      rnd ? h("div", { class: "metrics-card" }, [
        h("div", { class: "metrics-card-title" }, "СЛУЧАЙНАЯ"),
        h("div", { class: "rnd-title" }, rnd.frontmatter?.title ?? rnd.slug),
        h("div", { class: "rnd-desc" }, (rnd.frontmatter?.description ?? "").slice(0, 80)),
        h("a", { href: "./" + rnd.slug, class: "internal rnd-link" }, "открыть →"),
      ]) : null,
    ]),
    tags.length > 0 ? h("div", { class: "metrics-card" }, [
      h("div", { class: "metrics-card-title" }, "ТОП ТЕГОВ"),
      h("div", { class: "tags-cloud" }, tags.map(([t, c]) =>
        h("span", { class: "tag-chip" }, t + " (" + c + ")")
      )),
    ]) : null,
  ])
}

MetricsComponent.css = `
.metrics { padding: 0.5rem 0; }
.metrics-title { font-size: 1.4rem; font-weight: 300; letter-spacing: 0.3px; margin-bottom: 0.75rem; color: var(--dark); }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom: 10px; }
.metric-card { border: 1px solid var(--lightgray); border-radius: 10px; padding: 0.75rem; background: var(--card); }
.metric-label { font-size: 0.7rem; color: var(--gray); letter-spacing: 0.5px; text-transform: uppercase; }
.metric-value { font-size: 1.6rem; font-weight: 300; line-height: 1.1; color: var(--dark); }
.metric-delta { font-size: 0.7rem; color: var(--secondary); margin-top: 2px; }
.metric-goal { font-size: 0.7rem; color: var(--gray); margin-top: 2px; }
.metrics-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; margin-bottom: 10px; }
.metrics-card { border: 1px solid var(--lightgray); border-radius: 10px; padding: 10px 12px; background: var(--card); min-width: 0; }
.metrics-card-title { color: var(--gray); font-size: 0.7rem; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
.heatmap { display: grid; grid-template-rows: repeat(7, 10px); grid-auto-flow: column; grid-auto-columns: 10px; gap: 3px; }
.heat-cell { border-radius: 2px; background: var(--lightgray); }
.heat-1 { background: color-mix(in srgb, var(--secondary) 30%, var(--lightgray)); }
.heat-2 { background: color-mix(in srgb, var(--secondary) 55%, var(--lightgray)); }
.heat-3 { background: color-mix(in srgb, var(--secondary) 80%, var(--lightgray)); }
.heat-4 { background: var(--secondary); }
.metrics-foot { color: var(--gray); font-size: 0.7rem; margin-top: 8px; }
.growth-svg { display: block; }
.hub-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid var(--lightgray); font-size: 0.8rem; }
.hub-row:last-child { border-bottom: 0; }
.hub-count { color: var(--secondary); }
.type-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 0.8rem; }
.type-name { width: 78px; color: var(--gray); }
.type-bar { height: 6px; border-radius: 3px; background: var(--secondary); }
.type-count { color: var(--gray); }
.rnd-title { font-weight: 500; font-size: 0.9rem; color: var(--dark); }
.rnd-desc { color: var(--gray); margin: 4px 0 8px; font-size: 0.75rem; }
.rnd-link { color: var(--secondary); font-size: 0.75rem; }
.tags-cloud { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tag-chip { font-size: 0.7rem; border: 1px solid var(--lightgray); border-radius: 6px; padding: 2px 6px; }
`

export const Metrics = () => MetricsComponent
export default () => MetricsComponent