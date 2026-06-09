<script setup lang="ts">
import { computed } from "vue"
import { getApplications } from "@/api/litewaf"
import StatisticsBreakdownPanel from "@/components/statistics/StatisticsBreakdownPanel.vue"
import StatisticsGeoPanel from "@/components/statistics/StatisticsGeoPanel.vue"
import StatisticsMetricGrid from "@/components/statistics/StatisticsMetricGrid.vue"
import StatisticsTrendPanel from "@/components/statistics/StatisticsTrendPanel.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useStatisticsReport, type StatisticsMapView, type StatisticsMetric, type StatisticsScope } from "@/composables/useStatisticsReport"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const applicationsResource = useApiResource(getApplications)
const { filters, report, resource, refresh } = useStatisticsReport()

const applicationOptions = computed(() => [
  { label: t("statistics.allApplications"), value: 0 },
  ...(applicationsResource.data.value ?? []).map((item) => ({ label: item.name, value: item.id }))
])
const rangeOptions = computed(() => [
  { label: t("statistics.range1h"), value: "1h" },
  { label: t("statistics.range24h"), value: "24h" },
  { label: t("statistics.range7d"), value: "7d" },
  { label: t("statistics.range30d"), value: "30d" }
])

const isLoading = computed(() => applicationsResource.loading.value || resource.loading.value)
const errorMessage = computed(() => applicationsResource.error.value || resource.error.value)
const effectiveMapView = computed<StatisticsMapView>(() => (filters.scope === "china" ? "2d" : filters.mapView))
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
        <h1 class="page-title">{{ t("statistics.reportTitle") }}</h1>
        <p class="page-subtitle">{{ t("statistics.reportSubtitle") }}</p>
      </div>
      <NButton type="primary" :loading="isLoading" @click="refresh">{{ t("common.refresh") }}</NButton>
    </div>

    <section class="report-tabs">
      <NButton type="primary" size="small">{{ t("statistics.trafficAnalysis") }}</NButton>
      <NButton size="small" quaternary disabled>{{ t("statistics.securityPosture") }}</NButton>
      <NButton size="small" quaternary disabled>{{ t("statistics.protectionReport") }}</NButton>
      <NButton size="small" quaternary disabled>{{ t("statistics.protectionScreen") }}</NButton>
    </section>

    <section class="filter-bar">
      <NSelect v-model:value="filters.applicationId" :options="applicationOptions" class="filter-control" />
      <NSelect
        v-model:value="filters.range"
        :options="rangeOptions"
        class="filter-control"
      />
    </section>

    <NAlert v-if="errorMessage" type="error">{{ errorMessage }}</NAlert>
    <NAlert v-else-if="!isLoading && !hasAnyData" type="info">{{ t("statistics.emptyFiltered") }}</NAlert>

    <StatisticsMetricGrid :cards="report?.cards" />

    <section class="main-report-grid">
      <StatisticsGeoPanel
        class="geo-panel-item"
        :geo="report?.geo"
        :scope="filters.scope"
        :map-view="effectiveMapView"
        :metric="filters.metric"
        :loading="isLoading"
        @update-scope="setScope"
        @update-map-view="setMapView"
        @update-metric="setMetric"
      />
      <div class="side-trends">
        <StatisticsTrendPanel :title="t('statistics.realtimeQps')" :points="report?.qps ?? []" kind="bar" :empty-description="t('statistics.noQps')" />
        <StatisticsTrendPanel :title="t('statistics.visitsTrend')" :points="report?.visits ?? []" kind="line" tone="blue" :empty-description="t('statistics.noVisits')" />
        <StatisticsTrendPanel :title="t('statistics.blocksTrend')" :points="report?.blocks ?? []" kind="line" tone="red" :empty-description="t('statistics.noBlocks')" />
      </div>
    </section>

    <section class="breakdown-grid">
      <StatisticsBreakdownPanel :title="t('statistics.clientOs')" :items="report?.clients.os ?? []" :empty-description="t('statistics.noClientOs')" />
      <StatisticsBreakdownPanel :title="t('statistics.browserClient')" :items="report?.clients.browsers ?? []" :empty-description="t('statistics.noBrowser')" />
      <StatisticsBreakdownPanel :title="t('statistics.responseStatus')" :items="report?.statuses ?? []" :empty-description="t('statistics.noResponseStatus')" />
      <StatisticsBreakdownPanel :title="t('statistics.externalRefererDomains')" :items="report?.referers.domains ?? []" mode="list" :empty-description="t('statistics.noRefererDomains')" />
      <StatisticsBreakdownPanel :title="t('statistics.externalRefererPages')" :items="report?.referers.pages ?? []" mode="list" :empty-description="t('statistics.noRefererPages')" />
      <StatisticsBreakdownPanel :title="t('statistics.userAgent')" :items="report?.clients.user_agents ?? []" mode="list" :empty-description="t('statistics.noUserAgent')" />
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

@media (max-width: 1380px) {
  .main-report-grid {
    grid-template-columns: 1fr;
  }

  .side-trends {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
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
  .side-trends,
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
