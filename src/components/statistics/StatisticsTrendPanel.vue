<script setup lang="ts">
import { computed, nextTick, shallowRef, watch } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, LineChart } from "echarts/charts"
import { GridComponent, TooltipComponent } from "echarts/components"
import type { EChartsOption, SetOptionOpts } from "echarts"
import type { TimeSeriesPoint } from "@/api/litewaf"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent])

const props = withDefaults(defineProps<{
  title: string
  points: readonly TimeSeriesPoint[]
  kind: "bar" | "line"
  tone?: "blue" | "red" | "teal"
  timeFormat?: "minute" | "second"
  updateMode?: "reactive" | "rolling"
  emptyDescription: string
}>(), {
  updateMode: "reactive"
})

const themeStore = useThemeStore()
const chartRef = shallowRef<InstanceType<typeof VChart> | null>(null)
const isRolling = computed(() => props.updateMode === "rolling")
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

const option = computed<EChartsOption>(() => ({
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
    data: props.points.map((point) => formatTime(point.time)),
    axisLabel: { color: themeStore.chartTextColor, interval: props.timeFormat === "second" ? 0 : "auto", hideOverlap: true },
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

const rollingOption = computed<EChartsOption>(() => {
  const points = props.points
    .map((point) => ({ time: toTimestamp(point.time), value: point.value }))
    .filter((point) => Number.isFinite(point.time))
  const minTime = points[0]?.time
  const maxTime = points[points.length - 1]?.time

  return {
    color: [color.value],
    backgroundColor: "transparent",
    animation: true,
    animationDurationUpdate: 300,
    animationEasingUpdate: "linear",
    tooltip: {
      trigger: "axis",
      backgroundColor: themeStore.cssVars["--lw-panel"],
      borderColor: themeStore.chartGridColor,
      textStyle: { color: themeStore.chartTextColor },
      valueFormatter: (value) => String(value)
    },
    grid: { left: 34, right: 14, top: 20, bottom: 30 },
    xAxis: {
      id: "rolling-time-axis",
      type: "time",
      min: minTime,
      max: maxTime,
      minInterval: 5000,
      axisLabel: {
        color: themeStore.chartTextColor,
        hideOverlap: true,
        formatter: (value: number | string) => formatAxisTime(value, true)
      },
      axisLine: { lineStyle: { color: themeStore.chartGridColor } },
      axisTick: { show: false }
    },
    yAxis: {
      id: "rolling-value-axis",
      type: "value",
      axisLabel: { color: themeStore.chartTextColor },
      splitLine: { lineStyle: { color: themeStore.chartGridColor } }
    },
    series: [
      {
        id: "rolling-series",
        type: props.kind,
        smooth: props.kind === "line",
        symbol: props.kind === "line" ? "none" : "circle",
        barMaxWidth: 28,
        data: points.map((point) => [point.time, point.value]),
        areaStyle: props.kind === "line" ? { opacity: 0.08 } : undefined
      }
    ]
  }
})

watch(
  () => [isRolling.value, hasData.value, rollingOption.value, chartRef.value] as const,
  async ([rolling, ready, nextOption]) => {
    if (!rolling || !ready) {
      return
    }
    await nextTick()
    chartRef.value?.setOption(nextOption, {
      notMerge: false,
      lazyUpdate: true,
      silent: true
    } satisfies SetOptionOpts)
  },
  { immediate: true }
)

function toTimestamp(value: string) {
  return new Date(value).getTime()
}

function formatTime(value: string) {
  return formatAxisTime(value, props.timeFormat === "second")
}

function formatAxisTime(value: string | number, includeSeconds: boolean) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  if (includeSeconds) {
    return `${hour}:${minute}:${String(date.getSeconds()).padStart(2, "0")}`
  }
  return `${hour}:${minute}`
}
</script>

<template>
  <section class="trend-panel">
    <div class="panel-title">{{ title }}</div>
    <VChart v-if="hasData && isRolling" ref="chartRef" class="trend-chart" manual-update autoresize />
    <VChart v-else-if="hasData" class="trend-chart" :option="option" autoresize />
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
