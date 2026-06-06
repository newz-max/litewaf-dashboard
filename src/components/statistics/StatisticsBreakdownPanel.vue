<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { PieChart } from "echarts/charts"
import { LegendComponent, TooltipComponent } from "echarts/components"
import type { SummaryCount } from "@/api/litewaf"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, PieChart, LegendComponent, TooltipComponent])

const props = defineProps<{
  title: string
  items: readonly SummaryCount[]
  emptyDescription: string
  mode?: "donut" | "list"
}>()

const themeStore = useThemeStore()
const hasData = computed(() => props.items.length > 0)
const option = computed(() => ({
  color: themeStore.chartPalette,
  backgroundColor: "transparent",
  tooltip: {
    trigger: "item",
    backgroundColor: themeStore.cssVars["--lw-panel"],
    borderColor: themeStore.chartGridColor,
    textStyle: { color: themeStore.chartTextColor }
  },
  legend: {
    bottom: 0,
    textStyle: { color: themeStore.chartTextColor }
  },
  series: [
    {
      type: "pie",
      radius: ["48%", "70%"],
      center: ["50%", "42%"],
      label: { color: themeStore.chartTextColor },
      labelLine: { lineStyle: { color: themeStore.chartGridColor } },
      data: props.items.map((item) => ({ name: item.key, value: item.count }))
    }
  ]
}))

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
  <section class="breakdown-panel">
    <div class="panel-title">{{ title }}</div>
    <VChart v-if="hasData && mode !== 'list'" class="breakdown-chart" :option="option" autoresize />
    <div v-else-if="hasData" class="rank-list">
      <div v-for="item in items" :key="item.key" class="rank-row">
        <span>{{ item.key }}</span>
        <strong>{{ formatNumber(item.count) }}</strong>
      </div>
    </div>
    <NEmpty v-else :description="emptyDescription" />
  </section>
</template>

<style scoped>
.breakdown-panel {
  display: grid;
  min-height: 240px;
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

.breakdown-chart {
  width: 100%;
  height: 190px;
}

.rank-list {
  display: grid;
  align-content: start;
  gap: 10px;
  margin-top: 12px;
}

.rank-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  color: var(--lw-text);
  font-size: 13px;
}

.rank-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
