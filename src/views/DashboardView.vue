<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { LineChart, PieChart } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from "echarts/components"
import { getAttackLogs, getRules, getSites } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

use([CanvasRenderer, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const sitesResource = useApiResource(getSites)
const rulesResource = useApiResource(getRules)
const logsResource = useApiResource(getAttackLogs)

const metrics = computed(() => [
  { label: "防护站点", value: String(sitesResource.data.value?.length ?? 0), note: "来自控制面接口" },
  { label: "规则数量", value: String(rulesResource.data.value?.length ?? 0), note: "已加载规则" },
  { label: "攻击日志", value: String(logsResource.data.value?.length ?? 0), note: "当前查询结果" },
  { label: "实时 QPS", value: "-", note: "等待指标接口接入" }
])

const trendOption = computed(() => ({
  tooltip: { trigger: "axis" },
  grid: { left: 36, right: 16, top: 24, bottom: 28 },
  xAxis: {
    type: "category",
    data: []
  },
  yAxis: { type: "value" },
  series: [
    {
      name: "请求",
      type: "line",
      smooth: true,
      data: [],
      lineStyle: { color: "#0f766e", width: 3 },
      areaStyle: { color: "rgba(15, 118, 110, 0.14)" }
    },
    {
      name: "拦截",
      type: "line",
      smooth: true,
      data: [],
      lineStyle: { color: "#b42318", width: 2 }
    }
  ]
}))

const attackTypeOption = computed(() => ({
  tooltip: { trigger: "item" },
  legend: { bottom: 0 },
  series: [
    {
      type: "pie",
      radius: ["46%", "70%"],
      data: []
    }
  ]
}))
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">安全态势</h1>
        <p class="page-subtitle">实时观察 LiteWaf 网关流量、防护效果和攻击分布。</p>
      </div>
      <NButton type="primary" @click="logsResource.refresh">刷新态势</NButton>
    </div>

    <NAlert v-if="sitesResource.error.value || rulesResource.error.value || logsResource.error.value" type="error">
      控制面接口暂不可用，请确认 litewaf-api 已启动。
    </NAlert>

    <section class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <div class="metric-label">{{ metric.label }}</div>
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-note">{{ metric.note }}</div>
      </article>
    </section>

    <div class="dashboard-grid">
      <section class="section section-pad chart-panel">
        <div class="panel-title">流量与拦截趋势</div>
        <VChart class="chart" :option="trendOption" autoresize />
      </section>

      <section class="section section-pad chart-panel">
        <div class="panel-title">攻击类型分布</div>
        <VChart class="chart" :option="attackTypeOption" autoresize />
      </section>
    </div>

    <section class="section section-pad">
      <div class="panel-title">Top 来源</div>
      <NEmpty description="等待攻击来源统计接口接入" />
    </section>
  </main>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
  gap: 16px;
}

.panel-title {
  margin-bottom: 12px;
  font-weight: 700;
}

.chart-panel {
  min-height: 340px;
}

.chart {
  width: 100%;
  height: 280px;
}

@media (max-width: 1080px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
