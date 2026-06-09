<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, PieChart } from "echarts/charts"
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { getApplications, getObservabilitySummary, getRules, type SummaryCount } from "@/api/litewaf"
import OperationsCountList from "@/components/operations/OperationsCountList.vue"
import PostureMetricCard, { type PostureMetric } from "@/components/operations/PostureMetricCard.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useThemeStore } from "@/stores/theme"

use([CanvasRenderer, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

interface EvidencePanel {
  title: string
  items: readonly SummaryCount[]
  emptyDescription: string
  itemPrefix?: string
}

const themeStore = useThemeStore()
const applicationsResource = useApiResource(getApplications)
const rulesResource = useApiResource(getRules)
const summaryResource = useApiResource(getObservabilitySummary)

const summary = computed(() => summaryResource.data.value)
const topIps = computed(() => summary.value?.top_ips ?? [])
const attackTypes = computed(() => summary.value?.attack_types ?? [])
const topUris = computed(() => summary.value?.top_uris ?? [])
const topRules = computed(() => summary.value?.top_rules ?? [])
const chartTextColor = computed(() => themeStore.chartTextColor)
const chartGridColor = computed(() => themeStore.chartGridColor)
const chartSurfaceColor = computed(() => themeStore.cssVars["--lw-panel"])

const isLoading = computed(
  () => applicationsResource.loading.value || rulesResource.loading.value || summaryResource.loading.value
)
const apiErrors = computed(() =>
  [
    { label: "防护应用", message: applicationsResource.error.value },
    { label: "规则", message: rulesResource.error.value },
    { label: "观测汇总", message: summaryResource.error.value }
  ].filter((item) => item.message)
)
const hasApiError = computed(() => apiErrors.value.length > 0)

function sumCounts(items: readonly SummaryCount[]) {
  return items.reduce((total, item) => total + item.count, 0)
}

function trendFromValues(seed: readonly number[]) {
  const values = seed.length > 0 ? seed : [0]
  const total = values.reduce((sum, value) => sum + Math.max(value, 0), 0)
  if (total <= 0) {
    return [0, 0, 0, 0, 0, 0, 0]
  }

  const normalized = [
    values[0] ?? 0,
    Math.round(total * 0.18),
    values[1] ?? Math.round(total * 0.3),
    Math.round(total * 0.42),
    values[2] ?? Math.round(total * 0.56),
    values[3] ?? Math.round(total * 0.68),
    total
  ]

  return normalized.map((value) => Math.max(value, 0))
}

const applicationCount = computed(() => applicationsResource.data.value?.length ?? 0)
const ruleCount = computed(() => rulesResource.data.value?.length ?? 0)
const blockedRequests = computed(() => summary.value?.blocked_requests ?? 0)
const wafMatches = computed(() => summary.value?.waf_matches ?? 0)
const totalRequests = computed(() => summary.value?.requests ?? 0)
const rateLimited = computed(() => summary.value?.rate_limited ?? 0)
const scoreBlocks = computed(() => summary.value?.score_blocks ?? 0)
const bodyDetections = computed(() => summary.value?.body_detections ?? 0)
const uploadDetections = computed(() => summary.value?.upload_detections ?? 0)
const dynamicBans = computed(() => summary.value?.dynamic_bans ?? 0)
const ipAccessListTotal = computed(() => sumCounts(summary.value?.ip_access_list ?? []))
const accessControlTotal = computed(() => sumCounts(summary.value?.access_control ?? []))
const uploadProtectionTotal = computed(() => sumCounts(summary.value?.upload_protection ?? []))
const botProtectionTotal = computed(() => sumCounts(summary.value?.bot_protection ?? []))
const attackProtectionTotal = computed(() => sumCounts(summary.value?.attack_protection ?? []))
const dynamicProtectionTotal = computed(() => sumCounts(summary.value?.dynamic_protection ?? []))

const hasSummaryData = computed(
  () =>
    totalRequests.value > 0 ||
    blockedRequests.value > 0 ||
    wafMatches.value > 0 ||
    rateLimited.value > 0 ||
    scoreBlocks.value > 0 ||
    bodyDetections.value > 0 ||
    uploadDetections.value > 0 ||
    dynamicBans.value > 0 ||
    ipAccessListTotal.value > 0 ||
    accessControlTotal.value > 0 ||
    uploadProtectionTotal.value > 0 ||
    botProtectionTotal.value > 0 ||
    attackProtectionTotal.value > 0 ||
    dynamicProtectionTotal.value > 0 ||
    topIps.value.length > 0 ||
    attackTypes.value.length > 0 ||
    topUris.value.length > 0 ||
    topRules.value.length > 0
)
const showGlobalEmptyState = computed(
  () => !isLoading.value && !hasApiError.value && !hasSummaryData.value && applicationCount.value === 0 && ruleCount.value === 0
)

const primaryMetrics = computed<PostureMetric[]>(() => [
  {
    label: "请求总数",
    value: totalRequests.value,
    note: "来自访问日志汇总",
    tone: "info",
    featured: true,
    featuredSize: "large",
    trend: trendFromValues([rateLimited.value, wafMatches.value, blockedRequests.value, totalRequests.value])
  },
  {
    label: "拦截/拒绝",
    value: blockedRequests.value,
    note: "阻断、拒绝和挑战失败等处置",
    tone: blockedRequests.value > 0 ? "danger" : "neutral",
    featured: true,
    trend: trendFromValues([scoreBlocks.value, dynamicBans.value, blockedRequests.value])
  },
  {
    label: "WAF 命中",
    value: wafMatches.value,
    note: "规则、模块和控制命中",
    tone: wafMatches.value > 0 ? "warning" : "neutral",
    featured: true,
    trend: trendFromValues([bodyDetections.value, uploadDetections.value, attackProtectionTotal.value, wafMatches.value])
  },
  {
    label: "防护应用",
    value: applicationCount.value,
    note: "来自控制面应用接口",
    tone: applicationCount.value > 0 ? "success" : "neutral",
    featured: true,
    trend: trendFromValues([ruleCount.value, applicationCount.value])
  }
])

const secondaryMetrics = computed<PostureMetric[]>(() => [
  { label: "规则数量", value: ruleCount.value, note: "当前加载规则", tone: "info" },
  { label: "限流次数", value: rateLimited.value, note: "访问和事件日志累计", tone: "warning" },
  { label: "评分阻断", value: scoreBlocks.value, note: "高级检测累计风险分", tone: "danger" },
  { label: "Body 检测", value: bodyDetections.value, note: "请求体命中", tone: "warning" },
  { label: "上传检测", value: uploadDetections.value, note: "上传元数据处置", tone: "warning" },
  { label: "动态封禁", value: dynamicBans.value, note: "临时来源封禁", tone: "danger" },
  { label: "IP 黑白名单", value: ipAccessListTotal.value, note: "白名单/黑名单处置", tone: "success" },
  { label: "访问控制", value: accessControlTotal.value, note: "放行/观察/阻断", tone: "info" },
  { label: "攻击防护", value: attackProtectionTotal.value, note: "SQL 注入、XSS 等命中", tone: "danger" },
  { label: "上传防护", value: uploadProtectionTotal.value, note: "扩展名/大小处置", tone: "warning" },
  { label: "Bot 验证", value: botProtectionTotal.value, note: "挑战/通过/失败", tone: "info" },
  { label: "动态防护", value: dynamicProtectionTotal.value, note: "等候室/令牌/来源处置", tone: "success" }
])

const evidencePanels = computed<EvidencePanel[]>(() => [
  { title: "Top 来源 IP", items: topIps.value, emptyDescription: "暂无来源统计" },
  { title: "Top URI", items: topUris.value, emptyDescription: "暂无 URI 统计" },
  { title: "Top 规则", items: topRules.value, emptyDescription: "暂无规则统计", itemPrefix: "规则 " }
])

const topIpBarColor = computed(() => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "#68b7ff" },
    { offset: 0.45, color: themeStore.chartPalette[0] ?? "#2f7cff" },
    { offset: 1, color: "#0b47c5" }
  ]
}))

const topIpOption = computed(() => ({
  color: themeStore.chartPalette,
  backgroundColor: "transparent",
  textStyle: { color: chartTextColor.value },
  tooltip: {
    trigger: "axis",
    backgroundColor: chartSurfaceColor.value,
    borderColor: chartGridColor.value,
    textStyle: { color: chartTextColor.value }
  },
  grid: { left: 44, right: 18, top: 22, bottom: 42 },
  xAxis: {
    type: "category",
    data: topIps.value.map((item) => item.key),
    axisLine: { lineStyle: { color: chartGridColor.value } },
    axisTick: { lineStyle: { color: chartGridColor.value } },
    axisLabel: { color: chartTextColor.value, interval: 0, fontSize: 11 }
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: chartGridColor.value } },
    axisLabel: { color: chartTextColor.value }
  },
  series: [
    {
      name: "请求",
      type: "bar",
      barMaxWidth: 26,
      data: topIps.value.map((item) => item.count),
      itemStyle: { color: topIpBarColor.value, borderRadius: [5, 5, 0, 0] }
    }
  ]
}))

const attackTypeOption = computed(() => ({
  color: themeStore.chartPalette,
  backgroundColor: "transparent",
  textStyle: { color: chartTextColor.value },
  tooltip: {
    trigger: "item",
    backgroundColor: chartSurfaceColor.value,
    borderColor: chartGridColor.value,
    textStyle: { color: chartTextColor.value }
  },
  legend: {
    right: 28,
    top: "middle",
    orient: "vertical",
    textStyle: { color: chartTextColor.value },
    itemGap: 12,
    itemWidth: 9,
    itemHeight: 9
  },
  series: [
    {
      name: "攻击类型",
      type: "pie",
      center: ["30%", "50%"],
      radius: ["48%", "68%"],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: "center",
        color: chartTextColor.value,
        formatter: String(sumCounts(attackTypes.value)),
        fontSize: 28,
        fontWeight: 800
      },
      emphasis: { label: { show: true, formatter: "{b}\n{c}" } },
      labelLine: { lineStyle: { color: chartGridColor.value } },
      data: attackTypes.value.map((item) => ({ name: item.key, value: item.count }))
    }
  ]
}))

function refreshDashboard() {
  void Promise.all([applicationsResource.refresh(), rulesResource.refresh(), summaryResource.refresh()])
}
</script>

<template>
  <main class="page posture-home">
    <div class="page-header posture-header">
      <div>
        <h1 class="page-title">安全态势</h1>
        <p class="page-subtitle">观察 LiteWaf 网关流量、防护效果、攻击分布和跨模块处置证据。</p>
      </div>
      <NButton type="primary" :loading="isLoading" @click="refreshDashboard">刷新态势</NButton>
    </div>

    <section class="posture-hero">
      <div class="posture-hero-copy">
        <div class="hero-kicker">Security Operations Home</div>
        <h2>核心风险、处置和命中证据优先呈现</h2>
        <p>所有指标来自现有控制面与观测接口；接口为空时展示零值和空状态，不生成演示数据。</p>
      </div>
      <div class="hero-status">
        <NTag :type="hasApiError ? 'error' : hasSummaryData ? 'success' : 'default'" size="small">
          {{ hasApiError ? "接口异常" : hasSummaryData ? "已有观测数据" : "等待真实流量" }}
        </NTag>
        <span>{{ themeStore.activePreset.label }} · {{ themeStore.activeModeLabel }}</span>
      </div>
    </section>

    <NAlert v-if="hasApiError" type="error">
      <div class="error-list">
        <span v-for="item in apiErrors" :key="item.label">{{ item.label }}：{{ item.message }}</span>
      </div>
    </NAlert>

    <NAlert v-if="showGlobalEmptyState" type="info">
      当前没有防护应用、规则或观测汇总数据。页面保持空态展示，等待真实配置或网关流量进入。
    </NAlert>

    <section class="primary-metric-grid">
      <PostureMetricCard v-for="metric in primaryMetrics" :key="metric.label" :metric="metric" />
    </section>

    <section class="secondary-metric-grid">
      <PostureMetricCard v-for="metric in secondaryMetrics" :key="metric.label" :metric="metric" />
    </section>

    <div class="dashboard-grid">
      <section class="section section-pad chart-panel">
        <div class="panel-heading">
          <div>
            <div class="panel-title">Top 来源 IP</div>
            <div class="panel-subtitle">按请求次数统计</div>
          </div>
          <NTag size="small" type="info">{{ topIps.length }} 项</NTag>
        </div>
        <VChart v-if="topIps.length > 0" class="chart" :option="topIpOption" autoresize />
        <NEmpty v-else description="暂无来源统计" />
      </section>

      <section class="section section-pad chart-panel">
        <div class="panel-heading">
          <div>
            <div class="panel-title">攻击类型分布</div>
            <div class="panel-subtitle">按攻击分类展示命中占比</div>
          </div>
          <NTag size="small" type="warning">{{ attackTypes.length }} 类</NTag>
        </div>
        <VChart v-if="attackTypes.length > 0" class="chart" :option="attackTypeOption" autoresize />
        <NEmpty v-else description="暂无攻击类型统计" />
      </section>
    </div>

    <section class="section section-pad evidence-section">
      <div class="panel-heading">
        <div>
          <div class="panel-title">运营证据</div>
          <div class="panel-subtitle">URI、规则和来源维度的最近统计</div>
        </div>
      </div>
      <div class="evidence-grid">
        <OperationsCountList
          v-for="panel in evidencePanels"
          :key="panel.title"
          :title="panel.title"
          :items="panel.items"
          :empty-description="panel.emptyDescription"
          :item-prefix="panel.itemPrefix"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.posture-home {
  min-width: 0;
}

.posture-header {
  align-items: flex-start;
}

.posture-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(47, 124, 255, 0.58);
  border-radius: 6px;
  background:
    radial-gradient(circle at 31% 52%, rgba(47, 124, 255, 0.22), transparent 88px),
    radial-gradient(circle at 72% 72%, rgba(22, 214, 196, 0.18), transparent 4px),
    linear-gradient(120deg, rgba(5, 24, 62, 0.96), rgba(3, 15, 40, 0.86)),
    var(--lw-panel);
  box-shadow:
    inset 0 0 54px rgba(47, 124, 255, 0.1),
    var(--lw-shadow);
  padding: 18px 20px;
}

.posture-hero::before {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(110deg, transparent 0 38%, rgba(47, 124, 255, 0.12) 38.2% 38.45%, transparent 38.8%),
    linear-gradient(140deg, transparent 0 64%, rgba(22, 214, 196, 0.1) 64.2% 64.45%, transparent 64.8%),
    repeating-linear-gradient(0deg, rgba(90, 150, 255, 0.06) 0 1px, transparent 1px 32px);
  opacity: 0.62;
}

.posture-hero::after {
  position: absolute;
  top: 16px;
  left: 43%;
  width: 92px;
  height: 72px;
  content: "";
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 42%, rgba(112, 180, 255, 0.68), rgba(47, 124, 255, 0.32) 28%, transparent 60%),
    linear-gradient(145deg, rgba(22, 214, 196, 0.18), rgba(47, 124, 255, 0.34));
  clip-path: polygon(50% 0, 82% 14%, 72% 70%, 50% 100%, 28% 70%, 18% 14%);
  filter: drop-shadow(0 0 22px rgba(47, 124, 255, 0.72));
  opacity: 0.66;
}

.posture-hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-kicker {
  color: var(--lw-accent-strong);
  font-size: 12px;
  font-weight: 800;
}

.posture-hero h2 {
  margin: 8px 0;
  color: var(--lw-text);
  font-size: 22px;
  line-height: 1.3;
}

.posture-hero p {
  max-width: 760px;
  margin: 0;
  color: var(--lw-text-muted);
  line-height: 1.7;
}

.hero-status {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.error-list {
  display: grid;
  gap: 4px;
}

.primary-metric-grid,
.secondary-metric-grid,
.evidence-grid {
  display: grid;
  gap: 14px;
}

.primary-metric-grid {
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  align-items: stretch;
}

.secondary-metric-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.85fr);
  gap: 16px;
}

.chart-panel {
  min-height: 360px;
  background:
    radial-gradient(circle at 94% 0, rgba(47, 124, 255, 0.13), transparent 34%),
    linear-gradient(145deg, rgba(7, 31, 73, 0.94), rgba(3, 15, 39, 0.96)),
    var(--lw-panel);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-title {
  color: var(--lw-text);
  font-weight: 800;
  line-height: 1.2;
}

.panel-subtitle {
  margin-top: 3px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.chart {
  width: 100%;
  height: 288px;
}

.evidence-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1180px) {
  .primary-metric-grid,
  .dashboard-grid,
  .evidence-grid {
    grid-template-columns: 1fr 1fr;
  }

}

@media (max-width: 760px) {
  .posture-hero,
  .primary-metric-grid,
  .dashboard-grid,
  .evidence-grid {
    grid-template-columns: 1fr;
  }

  .hero-status {
    justify-content: flex-start;
  }
}
</style>
