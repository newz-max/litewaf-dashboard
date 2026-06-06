<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, LineChart } from "echarts/charts"
import { GridComponent, TooltipComponent } from "echarts/components"
import type { TimeSeriesPoint } from "@/api/litewaf"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent])

const props = defineProps<{
  title: string
  points: readonly TimeSeriesPoint[]
  kind: "bar" | "line"
  tone?: "blue" | "red" | "teal"
  emptyDescription: string
}>()

const themeStore = useThemeStore()
const hasData = computed(() => props.points.length > 0)
const color = computed(() => {
  if (props.tone === "red") {
    return themeStore.chartPalette[3] ?? "#ef4444"
  }
  if (props.tone === "blue") {
    return themeStore.chartPalette[1] ?? "#2563eb"
  }
  return themeStore.chartPalette[0] ?? "#0f766e"
})

const option = computed(() => ({
  color: [color.value],
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    backgroundColor: themeStore.cssVars["--lw-panel"],
    borderColor: themeStore.chartGridColor,
    textStyle: { color: themeStore.chartTextColor }
  },
  grid: { left: 34, right: 14, top: 20, bottom: 30 },
  xAxis: {
    type: "category",
    data: props.points.map((point) => shortTime(point.time)),
    axisLabel: { color: themeStore.chartTextColor },
    axisLine: { lineStyle: { color: themeStore.chartGridColor } },
    axisTick: { show: false }
  },
  yAxis: {
    type: "value",
    axisLabel: { color: themeStore.chartTextColor },
    splitLine: { lineStyle: { color: themeStore.chartGridColor } }
  },
  series: [
    {
      type: props.kind,
      smooth: props.kind === "line",
      symbol: props.kind === "line" ? "none" : "circle",
      barMaxWidth: 28,
      data: props.points.map((point) => point.value),
      areaStyle: props.kind === "line" ? { opacity: 0.08 } : undefined
    }
  ]
}))

function shortTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}
</script>

<template>
  <section class="trend-panel">
    <div class="panel-title">{{ title }}</div>
    <VChart v-if="hasData" class="trend-chart" :option="option" autoresize />
    <NEmpty v-else :description="emptyDescription" />
  </section>
</template>

<style scoped>
.trend-panel {
  display: grid;
  min-height: 210px;
  padding: 16px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
  box-shadow: var(--lw-shadow);
}

.panel-title {
  color: var(--lw-text);
  font-weight: 800;
}

.trend-chart {
  width: 100%;
  height: 160px;
}
</style>
