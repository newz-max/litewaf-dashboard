<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, PieChart } from "echarts/charts"
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { getObservabilitySummary, getRules, getSites } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

use([CanvasRenderer, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const sitesResource = useApiResource(getSites)
const rulesResource = useApiResource(getRules)
const summaryResource = useApiResource(getObservabilitySummary)

const summary = computed(() => summaryResource.data.value)
const topIps = computed(() => summary.value?.top_ips ?? [])
const attackTypes = computed(() => summary.value?.attack_types ?? [])
const topUris = computed(() => summary.value?.top_uris ?? [])
const topRules = computed(() => summary.value?.top_rules ?? [])

const metrics = computed(() => [
  { label: "防护站点", value: String(sitesResource.data.value?.length ?? 0), note: "来自控制面接口" },
  { label: "规则数量", value: String(rulesResource.data.value?.length ?? 0), note: "已加载规则" },
  { label: "请求总数", value: String(summary.value?.requests ?? 0), note: "来自访问日志" },
  { label: "拦截/拒绝", value: String(summary.value?.blocked_requests ?? 0), note: "来自观测汇总" },
  { label: "WAF 命中", value: String(summary.value?.waf_matches ?? 0), note: "规则与控制命中" },
  { label: "限流次数", value: String(summary.value?.rate_limited ?? 0), note: "来自访问和事件日志" },
  { label: "评分阻断", value: String(summary.value?.score_blocks ?? 0), note: "累计风险分" },
  { label: "Body 检测", value: String(summary.value?.body_detections ?? 0), note: "请求体命中" },
  { label: "上传检测", value: String(summary.value?.upload_detections ?? 0), note: "上传元数据" },
  { label: "动态封禁", value: String(summary.value?.dynamic_bans ?? 0), note: "临时来源封禁" },
  {
    label: "访问控制",
    value: String((summary.value?.access_control ?? []).reduce((total, item) => total + item.count, 0)),
    note: "放行/观察/阻断"
  },
  {
    label: "上传防护",
    value: String((summary.value?.upload_protection ?? []).reduce((total, item) => total + item.count, 0)),
    note: "扩展名/大小处置"
  },
  {
    label: "Bot 验证",
    value: String((summary.value?.bot_protection ?? []).reduce((total, item) => total + item.count, 0)),
    note: "挑战/通过/失败"
  }
])

const topIpOption = computed(() => {
  const rows = topIps.value
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 16, top: 20, bottom: 32 },
    xAxis: { type: "category", data: rows.map((item) => item.key) },
    yAxis: { type: "value" },
    series: [
      {
        name: "请求",
        type: "bar",
        data: rows.map((item) => item.count),
        itemStyle: { color: "#0f766e" }
      }
    ]
  }
})

const attackTypeOption = computed(() => ({
  tooltip: { trigger: "item" },
  legend: { bottom: 0 },
  series: [
    {
      type: "pie",
      radius: ["46%", "70%"],
      data: attackTypes.value.map((item) => ({ name: item.key, value: item.count }))
    }
  ]
}))
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">安全态势</h1>
        <p class="page-subtitle">观察 LiteWaf 网关流量、防护效果和攻击分布。</p>
      </div>
      <NButton type="primary" @click="summaryResource.refresh">刷新态势</NButton>
    </div>

    <NAlert
      v-if="sitesResource.error.value || rulesResource.error.value || summaryResource.error.value"
      type="error"
    >
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
        <div class="panel-title">Top 来源 IP</div>
        <VChart v-if="topIps.length > 0" class="chart" :option="topIpOption" autoresize />
        <NEmpty v-else description="暂无来源统计" />
      </section>

      <section class="section section-pad chart-panel">
        <div class="panel-title">攻击类型分布</div>
        <VChart
          v-if="attackTypes.length > 0"
          class="chart"
          :option="attackTypeOption"
          autoresize
        />
        <NEmpty v-else description="暂无攻击类型统计" />
      </section>
    </div>

    <section class="section section-pad">
      <div class="panel-title">Top URI / 规则</div>
      <div class="rank-grid">
        <NList>
          <NListItem v-for="item in topUris" :key="item.key">
            <span>{{ item.key }}</span>
            <template #suffix>{{ item.count }}</template>
          </NListItem>
          <NEmpty v-if="topUris.length === 0" description="暂无 URI 统计" />
        </NList>
        <NList>
          <NListItem v-for="item in topRules" :key="item.key">
            <span>规则 {{ item.key }}</span>
            <template #suffix>{{ item.count }}</template>
          </NListItem>
          <NEmpty v-if="topRules.length === 0" description="暂无规则统计" />
        </NList>
      </div>
    </section>
  </main>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.85fr);
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

.rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1080px) {
  .dashboard-grid,
  .rank-grid {
    grid-template-columns: 1fr;
  }
}
</style>
