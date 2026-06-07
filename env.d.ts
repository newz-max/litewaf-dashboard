/// <reference types="vite/client" />

declare module "echarts-gl"

declare module "@geo-maps/countries-land-10km/map.geo.json" {
  const value: unknown
  export default value
}

declare module "china-geojson/src/geojson/china.json" {
  const value: unknown
  export default value
}

declare module "*.vue" {
  import type { DefineComponent } from "vue"

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
