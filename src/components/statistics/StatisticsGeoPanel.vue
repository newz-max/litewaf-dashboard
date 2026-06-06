<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { registerMap, use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { MapChart, ScatterChart } from "echarts/charts"
import { GeoComponent, TooltipComponent, VisualMapComponent } from "echarts/components"
import "echarts-gl"
import worldMap from "@geo-maps/countries-land-10km/map.geo.json"
import chinaMap from "@/assets/maps/china-lite.geo.json"
import type { GeoPoint, GeoRank, StatisticsGeoReport } from "@/api/litewaf"
import type { StatisticsMapView, StatisticsMetric, StatisticsScope } from "@/composables/useStatisticsReport"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, MapChart, ScatterChart, GeoComponent, TooltipComponent, VisualMapComponent])
registerMap("litewaf-world", worldMap as any)
registerMap("litewaf-china", chinaMap as any)

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
const chartMapName = computed(() => (props.scope === "china" ? "litewaf-china" : "litewaf-world"))
const chartData = computed(() => ranking.value.map((item) => ({ name: item.name, value: item.count })))

const chartOption = computed(() => {
  const textColor = themeStore.chartTextColor
  const panelColor = themeStore.cssVars["--lw-panel"]
  const borderColor = themeStore.chartGridColor
  const palette = themeStore.chartPalette

  if (props.scope === "world" && props.mapView === "3d") {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: panelColor,
        borderColor,
        textStyle: { color: textColor }
      },
      globe: {
        baseColor: "rgba(25, 211, 181, 0.28)",
        globeOuterRadius: 105,
        shading: "color",
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 2,
          distance: 185,
          zoomSensitivity: 0.8
        },
        light: {
          ambient: { intensity: 0.8 },
          main: { intensity: 0.6 }
        }
      },
      series: [
        {
          type: "scatter3D",
          coordinateSystem: "globe",
          data: (props.geo?.points ?? []).map((point) => [point.longitude, point.latitude, point.value, point.name]),
          symbolSize: 7,
          itemStyle: { color: palette[0] }
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
      textStyle: { color: textColor }
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(...chartData.value.map((item) => Number(item.value)), 1),
      inRange: { color: ["#d8f8f5", palette[0]] }
    },
    series: [
      {
        type: "map",
        map: chartMapName.value,
        roam: true,
        zoom: props.scope === "china" ? 1.12 : 1.08,
        data: chartData.value,
        itemStyle: {
          areaColor: "rgba(15, 118, 110, 0.08)",
          borderColor: borderColor,
          borderWidth: 0.7
        },
        emphasis: {
          label: { color: textColor },
          itemStyle: { areaColor: palette[0] }
        }
      }
    ]
  }
})

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
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

    <div class="geo-content">
      <div class="map-wrap">
        <VChart class="map-chart" :option="chartOption" :loading="loading" autoresize />
      </div>
      <aside class="geo-ranking">
        <NEmpty v-if="ranking.length === 0" description="暂无地理统计" />
        <div v-for="item in ranking" v-else :key="item.code || item.name" class="rank-row">
          <span>{{ item.name }}</span>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(230px, 300px);
  gap: 18px;
}

.map-wrap {
  min-height: 350px;
}

.map-chart {
  width: 100%;
  height: 350px;
}

.geo-ranking {
  display: grid;
  align-content: center;
  gap: 12px;
  min-height: 320px;
  padding: 14px;
  background: var(--lw-panel-muted);
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

@media (max-width: 980px) {
  .panel-heading,
  .geo-content {
    grid-template-columns: 1fr;
  }

  .panel-heading {
    display: grid;
  }

  .geo-controls {
    justify-content: flex-start;
  }
}
</style>
