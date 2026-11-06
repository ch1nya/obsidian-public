import { h } from "preact"

const MetricsComponent = (props) => {
  if (props?.fileData?.slug !== "index") return null
  return h("div", { class: "metrics" }, "Метрики будут здесь.")
}

MetricsComponent.css = ".metrics { padding: 1rem 0; }"

export const Metrics = () => MetricsComponent
export default () => MetricsComponent
