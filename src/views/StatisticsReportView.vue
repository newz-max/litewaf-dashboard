<script setup lang="ts">
import { computed } from "vue"
import { getApplications } from "@/api/litewaf"
import StatisticsBreakdownPanel from "@/components/statistics/StatisticsBreakdownPanel.vue"
import StatisticsGeoPanel from "@/components/statistics/StatisticsGeoPanel.vue"
import StatisticsMetricGrid from "@/components/statistics/StatisticsMetricGrid.vue"
import StatisticsTrendPanel from "@/components/statistics/StatisticsTrendPanel.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useStatisticsReport, type StatisticsMapView, type StatisticsMetric, type StatisticsScope } from "@/composables/useStatisticsReport"

const applicationsResource = useApiResource(getApplications)
const { filters, report, resource, refresh } = useStatisticsReport()

const applicationOptions = computed(() => [
  { label: "全部应用", value: 0 },
  ...(applicationsResource.data.value ?? []).map((item) => ({ label: item.name, value: item.id }))
])

const isLoading = computed(() => applicationsResource.loading.value || resource.loading.value)
const errorMessage = computed(() => applicationsResource.error.value || resource.error.value)
const hasAnyData = computed(() => {
  const item = report.value
  if (!item) {
    return false
  }
  return (
    item.cards.requests > 0 ||
    item.cards.blocked > 0 ||
    item.geo.ranking.length > 0 ||
    item.qps.length > 0 ||
    item.visits.length > 0 ||
    item.blocks.length > 0 ||
    item.clients.os.length > 0 ||
    item.statuses.length > 0 ||
    item.referers.domains.length > 0
  )
})

function setScope(value: StatisticsScope) {
  filters.scope = value
}

function setMapView(value: StatisticsMapView) {
  if (filters.scope === "china" && value === "3d") {
    filters.mapView = "2d"
    return
  }
  filters.mapView = value
}

function setMetric(value: StatisticsMetric) {
  filters.metric = value
}
</script>

<template>
  <main class="page statistics-page">
    <div class="page-header report-header">
      <div>
        <h1 class="page-title">统计报表</h1>
        <p class="page-subtitle">流量、地域、客户端、响应状态和来源维度的真实统计。</p>
      </div>
      <NButton type="primary" :loading="isLoading" @click="refresh">刷新</NButton>
    </div>

    <section class="report-tabs">
      <NButton type="primary" size="small">流量分析</NButton>
      <NButton size="small" quaternary disabled>安全态势</NButton>
      <NButton size="small" quaternary disabled>防护报告</NButton>
      <NButton size="small" quaternary disabled>防护大屏</NButton>
    </section>

    <section class="filter-bar">
      <NSelect v-model:value="filters.applicationId" :options="applicationOptions" class="filter-control" />
      <NSelect
        v-model:value="filters.range"
        :options="[
          { label: '近 1 小时', value: '1h' },
          { label: '近 24 小时', value: '24h' },
          { label: '近 7 天', value: '7d' },
          { label: '近 30 天', value: '30d' }
        ]"
        class="filter-control"
      />
    </section>

    <NAlert v-if="errorMessage" type="error">{{ errorMessage }}</NAlert>
    <NAlert v-else-if="!isLoading && !hasAnyData" type="info">当前筛选条件下暂无统计数据。</NAlert>

    <StatisticsMetricGrid :cards="report?.cards" />

    <section class="main-report-grid">
      <StatisticsGeoPanel
        class="geo-panel-item"
        :geo="report?.geo"
        :scope="filters.scope"
        :map-view="filters.mapView"
        :metric="filters.metric"
        :loading="isLoading"
        @update-scope="setScope"
        @update-map-view="setMapView"
        @update-metric="setMetric"
      />
      <div class="side-trends">
        <StatisticsTrendPanel title="实时 QPS" :points="report?.qps ?? []" kind="bar" empty-description="暂无 QPS 数据" />
        <StatisticsTrendPanel title="访问情况" :points="report?.visits ?? []" kind="line" tone="blue" empty-description="暂无访问趋势" />
        <StatisticsTrendPanel title="拦截情况" :points="report?.blocks ?? []" kind="line" tone="red" empty-description="暂无拦截趋势" />
      </div>
    </section>

    <section class="breakdown-grid">
      <StatisticsBreakdownPanel title="客户端系统" :items="report?.clients.os ?? []" empty-description="暂无客户端系统统计" />
      <StatisticsBreakdownPanel title="浏览器 / 客户端" :items="report?.clients.browsers ?? []" empty-description="暂无浏览器统计" />
      <StatisticsBreakdownPanel title="响应状态" :items="report?.statuses ?? []" empty-description="暂无响应状态统计" />
      <StatisticsBreakdownPanel title="外部来源域名" :items="report?.referers.domains ?? []" mode="list" empty-description="暂无来源域名" />
      <StatisticsBreakdownPanel title="外部来源页面" :items="report?.referers.pages ?? []" mode="list" empty-description="暂无来源页面" />
      <StatisticsBreakdownPanel title="User-Agent" :items="report?.clients.user_agents ?? []" mode="list" empty-description="暂无 User-Agent 统计" />
    </section>
  </main>
</template>

<style scoped>
.statistics-page {
  min-width: 0;
}

.report-header {
  align-items: flex-start;
}

.report-tabs,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
  box-shadow: var(--lw-shadow);
}

.filter-bar {
  justify-content: flex-end;
}

.filter-control {
  width: 180px;
}

.main-report-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
  gap: 16px;
}

.side-trends {
  display: grid;
  gap: 16px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1180px) {
  .main-report-grid,
  .breakdown-grid {
    grid-template-columns: 1fr 1fr;
  }

  .geo-panel-item {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .filter-bar,
  .main-report-grid,
  .breakdown-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    display: grid;
  }

  .filter-control {
    width: 100%;
  }
}
</style>
