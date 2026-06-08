<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { registerMap, use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { MapChart, ScatterChart } from "echarts/charts"
import { GeoComponent, TooltipComponent, VisualMapComponent } from "echarts/components"
import "echarts-gl"
import { whereAlpha2, whereAlpha3, whereCountry } from "iso-3166-1"
import worldMap from "@geo-maps/countries-land-10km/map.geo.json"
import chinaMap from "china-geojson/src/geojson/china.json"
import type { GeoPoint, GeoRank, StatisticsGeoReport } from "@/api/litewaf"
import type { StatisticsMapView, StatisticsMetric, StatisticsScope } from "@/composables/useStatisticsReport"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, MapChart, ScatterChart, GeoComponent, TooltipComponent, VisualMapComponent])

type Coordinate = [number, number]
type LinearRing = Coordinate[]
type PolygonCoordinates = LinearRing[]
type MultiPolygonCoordinates = PolygonCoordinates[]
type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: MultiPolygonCoordinates }
  | { type: string; coordinates?: unknown }

interface GeoJsonFeature {
  type: "Feature"
  id?: string | number
  properties?: Record<string, unknown>
  geometry: GeoJsonGeometry
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection"
  features: GeoJsonFeature[]
}

interface MapRegion {
  code: string
  name: string
}

interface MapDatum {
  name: string
  value: number
  count: number
  blocked: number
  code: string
  displayName: string
}

interface GlobeLine {
  coords: Array<[number, number, number]>
}

interface TooltipParams {
  name?: string
  value?: unknown
  data?: Partial<MapDatum>
}

const regionDisplayNames = new Intl.DisplayNames(["zh-CN"], { type: "region" })
const normalizedWorldMap = normalizeWorldMap(worldMap)
const normalizedChinaMap = normalizeChinaMap(chinaMap)
const worldRegions = collectRegions(normalizedWorldMap)
const chinaRegions = collectRegions(normalizedChinaMap)
const globeBorderLines = buildGlobeBorderLines(normalizedWorldMap)

registerMap("litewaf-world", normalizedWorldMap as any)
registerMap("litewaf-china", normalizedChinaMap as any)

const props = defineProps<{
  geo?: Omit<Readonly<StatisticsGeoReport>, "ranking" | "points" | "diagnostics"> & {
    readonly ranking: readonly GeoRank[]
    readonly points: readonly GeoPoint[]
    readonly diagnostics?: readonly string[]
  }
  scope: StatisticsScope
  mapView: StatisticsMapView
  metric: StatisticsMetric
  loading: boolean
}>()

const emit = defineEmits<{
  updateScope: [value: StatisticsScope]
  updateMapView: [value: StatisticsMapView]
  updateMetric: [value: StatisticsMetric]
}>()

const themeStore = useThemeStore()
const canUse3D = computed(() => props.scope === "world")
const ranking = computed(() => props.geo?.ranking ?? [])
const emptyDescription = computed(() => (props.geo?.diagnostics?.length ? "当前日志未包含可用地理字段" : "暂无地理统计"))
const chartMapName = computed(() => (props.scope === "china" ? "litewaf-china" : "litewaf-world"))
const activeRegions = computed(() => (props.scope === "china" ? chinaRegions : worldRegions))
const chartData = computed(() => ranking.value.map((item) => toMapDatum(item, activeRegions.value)))
const displayRanking = computed(() => ranking.value.map((item) => ({ ...item, displayName: findRegion(item, activeRegions.value)?.name ?? item.name })))
const maxRegionValue = computed(() => Math.max(...chartData.value.map((item) => item.value), 1))
const globeTexture = computed(() => {
  return createGlobeTexture(normalizedWorldMap, {
    landColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.45)",
    waterColor: "rgba(8, 19, 31, 0.22)"
  })
})

const chartOption = computed(() => {
  const textColor = themeStore.chartTextColor
  const panelColor = themeStore.cssVars["--lw-panel"]
  const borderColor = themeStore.chartGridColor
  const palette = themeStore.chartPalette
  const accentColor = palette[0] ?? "#0f766e"
  const alertColor = palette[3] ?? "#ef4444"

  if (props.scope === "world" && props.mapView === "3d") {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: panelColor,
        borderColor,
        textStyle: { color: textColor },
        formatter: formatTooltip
      },
      globe: {
        baseTexture: globeTexture.value,
        baseColor: "rgba(8, 19, 31, 0.22)",
        globeOuterRadius: 138,
        shading: "color",
        viewControl: {
          autoRotate: false,
          distance: 142,
          rotateSensitivity: [1, 1],
          zoomSensitivity: 0,
          panSensitivity: 0
        },
        light: {
          ambient: { intensity: 0.8 },
          main: { intensity: 0.6 }
        }
      },
      series: [
        {
          type: "lines3D",
          coordinateSystem: "globe",
          polyline: true,
          silent: true,
          data: globeBorderLines,
          lineStyle: {
            color: withAlpha(accentColor, 0.72),
            width: 1,
            opacity: 0.72
          }
        },
        {
          type: "scatter3D",
          coordinateSystem: "globe",
          data: (props.geo?.points ?? []).map((point) => [point.longitude, point.latitude, point.value, point.name]),
          symbolSize: 7,
          itemStyle: { color: alertColor }
        }
      ]
    }
  }

  return {
    color: palette,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: panelColor,
      borderColor,
      textStyle: { color: textColor },
      formatter: formatTooltip
    },
    visualMap: {
      show: false,
      min: 0,
      max: maxRegionValue.value,
      inRange: { color: [withAlpha(accentColor, 0.18), accentColor] }
    },
    series: [
      {
        type: "map",
        map: chartMapName.value,
        roam: false,
        zoom: 1,
        layoutCenter: ["50%", "50%"],
        layoutSize: props.scope === "china" ? "118%" : "112%",
        data: chartData.value,
        selectedMode: false,
        itemStyle: {
          areaColor: withAlpha(accentColor, 0.08),
          borderColor: borderColor,
          borderWidth: 0.7
        },
        label: {
          show: false,
          color: textColor
        },
        emphasis: {
          label: {
            show: true,
            color: textColor,
            fontSize: 11
          },
          itemStyle: { areaColor: alertColor }
        }
      }
    ]
  }
})

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
}

function normalizeWorldMap(input: unknown): GeoJsonFeatureCollection {
  const collection = toFeatureCollection(input)
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => {
      const properties = feature.properties ?? {}
      const code = String(properties.A3 ?? feature.id ?? "").toUpperCase()
      const country = code ? whereAlpha3(code) : undefined
      const name = (country?.alpha2 ? regionDisplayNames.of(country.alpha2) : undefined) ?? country?.country ?? stringFrom(properties.name) ?? code

      return {
        ...feature,
        properties: {
          ...properties,
          code,
          name
        }
      }
    })
  }
}

function normalizeChinaMap(input: unknown): GeoJsonFeatureCollection {
  const collection = toFeatureCollection(input)
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => {
      const properties = feature.properties ?? {}
      const code = String(properties.id ?? feature.id ?? properties.adcode ?? "")
      const name = stringFrom(properties.name) ?? code

      return {
        ...feature,
        properties: {
          ...properties,
          code,
          name
        }
      }
    })
  }
}

function toFeatureCollection(input: unknown): GeoJsonFeatureCollection {
  const candidate = input as Partial<GeoJsonFeatureCollection>
  return {
    type: "FeatureCollection",
    features: Array.isArray(candidate.features) ? candidate.features : []
  }
}

function collectRegions(collection: GeoJsonFeatureCollection): MapRegion[] {
  return collection.features.map((feature) => {
    const properties = feature.properties ?? {}
    return {
      code: String(properties.code ?? feature.id ?? ""),
      name: stringFrom(properties.name) ?? String(feature.id ?? "")
    }
  })
}

function toMapDatum(item: GeoRank, regions: readonly MapRegion[]): MapDatum {
  const region = findRegion(item, regions)
  return {
    name: region?.name ?? item.name,
    value: item.count,
    count: item.count,
    blocked: item.blocked,
    code: item.code,
    displayName: region?.name ?? item.name
  }
}

function findRegion(item: GeoRank, regions: readonly MapRegion[]) {
  const code = normalizeKey(item.code)
  const name = normalizeRegionName(item.name)
  const countryCode = findCountry(item)?.alpha3
  const normalizedCountryCode = countryCode ? normalizeKey(countryCode) : ""
  return (
    regions.find((region) => normalizeKey(region.code) === code) ??
    regions.find((region) => normalizedCountryCode && normalizeKey(region.code) === normalizedCountryCode) ??
    regions.find((region) => normalizeRegionName(region.name) === name)
  )
}

function findCountry(item: GeoRank) {
  const code = item.code.trim()
  return whereAlpha3(code) ?? whereAlpha2(code) ?? whereCountry(item.name)
}

function normalizeRegionName(value: string) {
  return normalizeKey(
    value
      .replace(/省|市|特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区/g, "")
      .replace(/\s+/g, "")
  )
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase()
}

function stringFrom(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function formatTooltip(params: TooltipParams) {
  const value = Array.isArray(params.value) ? Number(params.value[2] ?? 0) : Number(params.data?.count ?? params.value ?? 0)
  const name = Array.isArray(params.value) ? String(params.value[3] ?? params.name ?? "") : params.data?.displayName ?? params.name ?? ""
  const blocked = Number(params.data?.blocked ?? 0)
  const metricLabel = props.metric === "blocked" ? "拦截数量" : "访问数量"
  const lines = [`${name || "未知地区"}`, `${metricLabel}: ${formatNumber(Number.isFinite(value) ? value : 0)}`]
  if (blocked > 0 && props.metric !== "blocked") {
    lines.push(`拦截数量: ${formatNumber(blocked)}`)
  }
  return lines.join("<br />")
}

function createGlobeTexture(
  collection: GeoJsonFeatureCollection,
  colors: { landColor: string; borderColor: string; waterColor: string }
) {
  if (typeof document === "undefined") {
    return undefined
  }

  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1024
  const context = canvas.getContext("2d")
  if (!context) {
    return undefined
  }

  context.fillStyle = colors.waterColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = colors.landColor
  context.strokeStyle = colors.borderColor
  context.lineWidth = 1.5

  for (const feature of collection.features) {
    drawGeometry(context, feature.geometry, canvas.width, canvas.height)
  }

  return canvas.toDataURL("image/png")
}

function drawGeometry(context: CanvasRenderingContext2D, geometry: GeoJsonGeometry, width: number, height: number) {
  if (isPolygonGeometry(geometry)) {
    drawPolygon(context, geometry.coordinates, width, height)
    return
  }
  if (isMultiPolygonGeometry(geometry)) {
    for (const polygon of geometry.coordinates) {
      drawPolygon(context, polygon, width, height)
    }
  }
}

function isPolygonGeometry(geometry: GeoJsonGeometry): geometry is { type: "Polygon"; coordinates: PolygonCoordinates } {
  return geometry.type === "Polygon" && Array.isArray(geometry.coordinates)
}

function isMultiPolygonGeometry(geometry: GeoJsonGeometry): geometry is { type: "MultiPolygon"; coordinates: MultiPolygonCoordinates } {
  return geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)
}

function buildGlobeBorderLines(collection: GeoJsonFeatureCollection): GlobeLine[] {
  const lines: GlobeLine[] = []
  for (const feature of collection.features) {
    if (isPolygonGeometry(feature.geometry)) {
      pushPolygonLines(lines, feature.geometry.coordinates)
      continue
    }
    if (isMultiPolygonGeometry(feature.geometry)) {
      for (const polygon of feature.geometry.coordinates) {
        pushPolygonLines(lines, polygon)
      }
    }
  }
  return lines
}

function pushPolygonLines(lines: GlobeLine[], polygon: PolygonCoordinates) {
  for (const ring of polygon) {
    if (ring.length < 2) {
      continue
    }
    const sampleStep = Math.max(1, Math.ceil(ring.length / 120))
    const coords = ring
      .filter((_, index) => index % sampleStep === 0)
      .map(([longitude, latitude]) => [longitude, latitude, 0] as [number, number, number])
    if (coords.length > 1) {
      lines.push({ coords })
    }
  }
}

function drawPolygon(context: CanvasRenderingContext2D, polygon: PolygonCoordinates, width: number, height: number) {
  context.beginPath()
  for (const ring of polygon) {
    drawRing(context, ring, width, height)
  }
  context.fill()
  context.stroke()
}

function drawRing(context: CanvasRenderingContext2D, ring: LinearRing, width: number, height: number) {
  ring.forEach(([longitude, latitude], index) => {
    const x = ((longitude + 180) / 360) * width
    const y = ((90 - latitude) / 180) * height
    if (index === 0) {
      context.moveTo(x, y)
      return
    }
    context.lineTo(x, y)
  })
  context.closePath()
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex = color.length === 4 ? color.slice(1).split("").map((char) => `${char}${char}`).join("") : color.slice(1)
    const red = Number.parseInt(hex.slice(0, 2), 16)
    const green = Number.parseInt(hex.slice(2, 4), 16)
    const blue = Number.parseInt(hex.slice(4, 6), 16)
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }
  return color
}
</script>

<template>
  <section class="geo-panel">
    <div class="panel-heading">
      <div>
        <div class="panel-title">地理位置</div>
        <div class="panel-subtitle">{{ scope === "china" ? "中国省级分布" : "世界访问分布" }}</div>
      </div>
      <div class="geo-controls">
        <NButtonGroup size="small">
          <NButton :type="mapView === '3d' ? 'primary' : 'default'" :disabled="!canUse3D" @click="emit('updateMapView', '3d')">3D</NButton>
          <NButton :type="mapView === '2d' ? 'primary' : 'default'" @click="emit('updateMapView', '2d')">2D</NButton>
        </NButtonGroup>
        <NButtonGroup size="small">
          <NButton :type="scope === 'world' ? 'primary' : 'default'" @click="emit('updateScope', 'world')">世界</NButton>
          <NButton :type="scope === 'china' ? 'primary' : 'default'" @click="emit('updateScope', 'china')">中国</NButton>
        </NButtonGroup>
        <NButtonGroup size="small">
          <NButton :type="metric === 'requests' ? 'primary' : 'default'" @click="emit('updateMetric', 'requests')">访问</NButton>
          <NButton :type="metric === 'blocked' ? 'primary' : 'default'" @click="emit('updateMetric', 'blocked')">仅拦截</NButton>
        </NButtonGroup>
      </div>
    </div>

    <div class="geo-content geo-content--immersive">
      <div class="map-wrap">
        <VChart class="map-chart" :option="chartOption" :loading="loading" autoresize />
      </div>
      <aside class="geo-ranking" :class="{ 'geo-ranking--empty': ranking.length === 0 }">
        <NEmpty v-if="ranking.length === 0" :description="emptyDescription" />
        <div v-for="item in displayRanking" v-else :key="item.code || item.name" class="rank-row">
          <span>{{ item.displayName }}</span>
          <strong>{{ formatNumber(item.count) }}</strong>
          <NProgress type="line" :show-indicator="false" :percentage="Math.min(100, item.count)" />
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.geo-panel {
  min-height: 420px;
  padding: 18px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
  box-shadow: var(--lw-shadow);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.panel-title {
  color: var(--lw-text);
  font-weight: 800;
}

.panel-subtitle {
  margin-top: 4px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.geo-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.geo-content {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 260px);
  gap: 18px;
  min-height: 430px;
}

.geo-content--immersive {
  grid-template-columns: 1fr;
}

.map-wrap {
  min-height: 430px;
  height: 100%;
}

.map-chart {
  width: 100%;
  min-height: 430px;
  height: 100%;
}

.geo-content--immersive .map-wrap,
.geo-content--immersive .map-chart {
  min-height: 500px;
}

.geo-ranking {
  display: grid;
  align-content: center;
  gap: 12px;
  min-height: 320px;
  padding: 14px;
  background: var(--lw-panel-muted);
}

.geo-content--immersive .geo-ranking {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  width: min(240px, 28%);
  max-height: calc(100% - 28px);
  overflow: auto;
  border: 1px solid var(--lw-border);
  background: color-mix(in srgb, var(--lw-panel-muted) 86%, transparent);
  backdrop-filter: blur(8px);
}

.geo-content--immersive .geo-ranking--empty {
  width: min(190px, 24%);
  min-height: 140px;
}

.rank-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  color: var(--lw-text);
  font-size: 13px;
}

.rank-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row :deep(.n-progress) {
  grid-column: 1 / -1;
}

@media (max-width: 1360px) {
  .geo-content {
    grid-template-columns: 1fr;
  }

  .map-wrap,
  .map-chart {
    min-height: 460px;
  }

  .geo-ranking {
    align-content: start;
    min-height: auto;
  }
}

@media (max-width: 980px) {
  .panel-heading {
    grid-template-columns: 1fr;
  }

  .panel-heading {
    display: grid;
  }

  .geo-controls {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .geo-content,
  .map-wrap,
  .map-chart {
    min-height: 360px;
  }

  .geo-content--immersive .geo-ranking {
    position: static;
    width: auto;
    max-height: none;
  }
}
</style>
