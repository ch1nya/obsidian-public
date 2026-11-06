import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Metrics: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <div class="metrics">
      <p>Метрики будут здесь.</p>
    </div>
  )
}

Metrics.css = `
.metrics { padding: 1rem 0; }
`

export default (() => Metrics) satisfies QuartzComponentConstructor
