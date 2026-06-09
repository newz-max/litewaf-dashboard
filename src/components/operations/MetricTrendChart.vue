<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { LineChart } from "echarts/charts"
import { GridComponent, TooltipComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const props = defineProps<{
  points: readonly number[]
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
  size?: "normal" | "large"
}>()

const themeStore = useThemeStore()
const sourcePoints = computed(() => {
  const points = props.points.length > 1 ? props.points : [0, props.points[0] ?? 0]
  return points.map((value) => Math.max(value, 0))
})
const lineColor = computed(() => {
  if (props.tone === "success") {
    return themeStore.cssVars["--lw-success"]
  }
  if (props.tone === "warning") {
    return themeStore.cssVars["--lw-warning"]
  }
  if (props.tone === "danger") {
    return themeStore.cssVars["--lw-danger"]
  }
  if (props.tone === "info") {
    return themeStore.cssVars["--lw-info"]
  }
  return themeStore.cssVars["--lw-accent"] || themeStore.chartPalette[0]
})
const axisLabels = computed(() => sourcePoints.value.map((_, index) => `T-${sourcePoints.value.length - index - 1}`))
const grid = computed(() =>
  props.size === "large"
    ? { left: 10, right: 10, top: 18, bottom: 18, containLabel: false }
    : { left: 4, right: 4, top: 8, bottom: 8, containLabel: false }
)
const option = computed(() => ({
  color: [lineColor.value],
  backgroundColor: "transparent",
  animationDuration: 420,
  tooltip: {
    trigger: "axis",
    backgroundColor: themeStore.cssVars["--lw-panel"],
    borderColor: themeStore.chartGridColor,
    textStyle: { color: themeStore.chartTextColor },
    valueFormatter: (value: number) => String(value)
  },
  grid: grid.value,
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: axisLabels.value,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false }
  },
  yAxis: {
    type: "value",
    minInterval: 1,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: {
      lineStyle: {
        color: themeStore.chartGridColor,
        opacity: props.size === "large" ? 0.4 : 0.22
      }
    }
  },
  series: [
    {
      name: "趋势",
      type: "line",
      data: sourcePoints.value,
      smooth: true,
      symbol: props.size === "large" ? "circle" : "none",
      symbolSize: props.size === "large" ? 6 : 0,
      lineStyle: {
        width: props.size === "large" ? 3 : 2,
        shadowBlur: props.size === "large" ? 10 : 6,
        shadowColor: lineColor.value
      },
      itemStyle: { color: lineColor.value },
      areaStyle: {
        opacity: props.size === "large" ? 0.18 : 0.1
      }
    }
  ]
}))
</script>

<template>
  <VChart class="metric-trend-chart" :option="option" autoresize />
</template>

<style scoped>
.metric-trend-chart {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 52px;
}
</style>
