<script setup lang="ts">
import { computed } from "vue"
import VChart from "vue-echarts"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, PieChart } from "echarts/charts"
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { getApplications, getObservabilitySummary, getRules, type SummaryCount, type TimeSeriesPoint } from "@/api/litewaf"
import OperationsCountList from "@/components/operations/OperationsCountList.vue"
import PostureMetricCard, { type PostureMetric } from "@/components/operations/PostureMetricCard.vue"
import { useApiResource } from "@/composables/useApiResource"
import { getActiveLocale } from "@/i18n"
import { useThemeStore } from "@/stores/theme"
import { useI18n } from "vue-i18n"

use([CanvasRenderer, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

interface EvidencePanel {
  title: string
  items: readonly SummaryCount[]
  emptyDescription: string
  itemPrefix?: string
}

const themeStore = useThemeStore()
const { t } = useI18n()
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
    { label: t("dashboard.applications"), message: applicationsResource.error.value },
    { label: t("dashboard.rules"), message: rulesResource.error.value },
    { label: t("dashboard.observability"), message: summaryResource.error.value }
  ].filter((item) => item.message)
)
const hasApiError = computed(() => apiErrors.value.length > 0)

function sumCounts(items: readonly SummaryCount[]) {
  return items.reduce((total, item) => total + item.count, 0)
}

function normalizeTrend(points: readonly TimeSeriesPoint[] | undefined) {
  return (points ?? []).map((point) => ({ time: point.time, value: point.value }))
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
const requestTrend = computed(() => normalizeTrend(summary.value?.request_trend))
const blockedTrend = computed(() => normalizeTrend(summary.value?.blocked_trend))
const wafMatchTrend = computed(() => normalizeTrend(summary.value?.waf_match_trend))

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
    label: t("dashboard.totalRequests"),
    value: totalRequests.value,
    note: t("dashboard.totalRequestsNote"),
    tone: "info",
    featured: true,
    trend: requestTrend.value
  },
  {
    label: t("dashboard.blockedRejected"),
    value: blockedRequests.value,
    note: t("dashboard.blockedRejectedNote"),
    tone: blockedRequests.value > 0 ? "danger" : "neutral",
    featured: true,
    trend: blockedTrend.value
  },
  {
    label: t("dashboard.wafMatches"),
    value: wafMatches.value,
    note: t("dashboard.wafMatchesNote"),
    tone: wafMatches.value > 0 ? "warning" : "neutral",
    featured: true,
    trend: wafMatchTrend.value
  },
  {
    label: t("dashboard.applications"),
    value: applicationCount.value,
    note: t("dashboard.applicationCountNote"),
    tone: applicationCount.value > 0 ? "success" : "neutral",
    featured: false
  }
])

const secondaryMetrics = computed<PostureMetric[]>(() => [
  { label: t("dashboard.ruleCount"), value: ruleCount.value, note: t("dashboard.ruleCountNote"), tone: "info" },
  { label: t("dashboard.rateLimited"), value: rateLimited.value, note: t("dashboard.rateLimitedNote"), tone: "warning" },
  { label: t("dashboard.scoreBlocks"), value: scoreBlocks.value, note: t("dashboard.scoreBlocksNote"), tone: "danger" },
  { label: t("dashboard.bodyDetections"), value: bodyDetections.value, note: t("dashboard.bodyDetectionsNote"), tone: "warning" },
  { label: t("dashboard.uploadDetections"), value: uploadDetections.value, note: t("dashboard.uploadDetectionsNote"), tone: "warning" },
  { label: t("dashboard.dynamicBans"), value: dynamicBans.value, note: t("dashboard.dynamicBansNote"), tone: "danger" },
  { label: t("dashboard.ipAccessList"), value: ipAccessListTotal.value, note: t("dashboard.ipAccessListNote"), tone: "success" },
  { label: t("dashboard.accessControl"), value: accessControlTotal.value, note: t("dashboard.accessControlNote"), tone: "info" },
  { label: t("dashboard.attackProtection"), value: attackProtectionTotal.value, note: t("dashboard.attackProtectionNote"), tone: "danger" },
  { label: t("dashboard.uploadProtection"), value: uploadProtectionTotal.value, note: t("dashboard.uploadProtectionNote"), tone: "warning" },
  { label: t("dashboard.botProtection"), value: botProtectionTotal.value, note: t("dashboard.botProtectionNote"), tone: "info" },
  { label: t("dashboard.dynamicProtection"), value: dynamicProtectionTotal.value, note: t("dashboard.dynamicProtectionNote"), tone: "success" }
])

const evidencePanels = computed<EvidencePanel[]>(() => [
  { title: t("dashboard.topSourceIp"), items: topIps.value, emptyDescription: t("dashboard.noSourceStats") },
  { title: t("dashboard.topUri"), items: topUris.value, emptyDescription: t("dashboard.noUriStats") },
  { title: t("dashboard.topRules"), items: topRules.value, emptyDescription: t("dashboard.noRuleStats"), itemPrefix: t("dashboard.rulePrefix") }
])

const topIpBarColor = computed(() => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: themeStore.cssVars["--lw-accent-strong"] },
    { offset: 0.45, color: themeStore.chartPalette[0] ?? themeStore.cssVars["--lw-accent"] },
    { offset: 1, color: themeStore.cssVars["--lw-accent"] }
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
      name: t("dashboard.requestSeries"),
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
      name: t("dashboard.attackTypeSeries"),
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

function formatCount(value: number) {
  return new Intl.NumberFormat(getActiveLocale()).format(value)
}
</script>

<template>
  <main class="page posture-home">
    <div class="page-header posture-header">
      <div>
        <h1 class="page-title">{{ t("dashboard.title") }}</h1>
        <p class="page-subtitle">{{ t("dashboard.subtitle") }}</p>
      </div>
      <NButton type="primary" :loading="isLoading" @click="refreshDashboard">{{ t("common.refreshDashboard") }}</NButton>
    </div>

    <section class="posture-hero">
      <div class="posture-hero-copy">
        <div class="hero-kicker">{{ t("dashboard.heroKicker") }}</div>
        <h2>{{ t("dashboard.heroTitle") }}</h2>
        <p>{{ t("dashboard.heroText") }}</p>
      </div>
      <div class="hero-status">
        <NTag :type="hasApiError ? 'error' : hasSummaryData ? 'success' : 'default'" size="small">
          {{ hasApiError ? t("common.apiError") : hasSummaryData ? t("dashboard.hasObservability") : t("dashboard.waitingTraffic") }}
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
      {{ t("dashboard.empty") }}
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
            <div class="panel-title">{{ t("dashboard.topSourceIp") }}</div>
            <div class="panel-subtitle">{{ t("dashboard.byRequests") }}</div>
          </div>
          <NTag size="small" type="info">{{ t("dashboard.items", { count: formatCount(topIps.length) }) }}</NTag>
        </div>
        <VChart v-if="topIps.length > 0" class="chart" :option="topIpOption" autoresize />
        <NEmpty v-else :description="t('dashboard.noSourceStats')" />
      </section>

      <section class="section section-pad chart-panel">
        <div class="panel-heading">
          <div>
            <div class="panel-title">{{ t("dashboard.attackTypeDistribution") }}</div>
            <div class="panel-subtitle">{{ t("dashboard.attackTypeSubtitle") }}</div>
          </div>
          <NTag size="small" type="warning">{{ t("dashboard.categories", { count: formatCount(attackTypes.length) }) }}</NTag>
        </div>
        <VChart v-if="attackTypes.length > 0" class="chart" :option="attackTypeOption" autoresize />
        <NEmpty v-else :description="t('dashboard.noAttackTypeStats')" />
      </section>
    </div>

    <section class="section section-pad evidence-section">
      <div class="panel-heading">
        <div>
          <div class="panel-title">{{ t("dashboard.operationEvidence") }}</div>
          <div class="panel-subtitle">{{ t("dashboard.evidenceSubtitle") }}</div>
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
  border: 1px solid color-mix(in srgb, var(--lw-accent) 42%, var(--lw-border));
  border-radius: 6px;
  background:
    radial-gradient(circle at 31% 52%, color-mix(in srgb, var(--lw-accent) 16%, transparent), transparent 88px),
    radial-gradient(circle at 72% 72%, color-mix(in srgb, var(--lw-success) 12%, transparent), transparent 4px),
    linear-gradient(120deg, color-mix(in srgb, var(--lw-panel-muted) 84%, transparent), color-mix(in srgb, var(--lw-panel) 92%, var(--lw-bg))),
    var(--lw-panel);
  box-shadow:
    inset 0 0 54px color-mix(in srgb, var(--lw-accent) 8%, transparent),
    var(--lw-shadow);
  padding: 18px 20px;
}

.posture-hero::before {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(110deg, transparent 0 38%, color-mix(in srgb, var(--lw-accent) 10%, transparent) 38.2% 38.45%, transparent 38.8%),
    linear-gradient(140deg, transparent 0 64%, color-mix(in srgb, var(--lw-success) 8%, transparent) 64.2% 64.45%, transparent 64.8%),
    repeating-linear-gradient(0deg, color-mix(in srgb, var(--lw-border-strong) 8%, transparent) 0 1px, transparent 1px 32px);
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
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--lw-accent-strong) 58%, transparent), color-mix(in srgb, var(--lw-accent) 26%, transparent) 28%, transparent 60%),
    linear-gradient(145deg, color-mix(in srgb, var(--lw-success) 14%, transparent), color-mix(in srgb, var(--lw-accent) 24%, transparent));
  clip-path: polygon(50% 0, 82% 14%, 72% 70%, 50% 100%, 28% 70%, 18% 14%);
  filter: drop-shadow(0 0 22px color-mix(in srgb, var(--lw-accent) 46%, transparent));
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
    radial-gradient(circle at 94% 0, color-mix(in srgb, var(--lw-accent) 10%, transparent), transparent 34%),
    linear-gradient(145deg, color-mix(in srgb, var(--lw-panel-muted) 84%, transparent), var(--lw-panel)),
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
