import { computed, onMounted, onUnmounted, reactive, shallowRef, watch } from "vue"
import { getStatisticsReport, type TimeSeriesPoint } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const STATISTICS_REFRESH_INTERVAL_MS = 5000

export type StatisticsScope = "world" | "china"
export type StatisticsMapView = "3d" | "2d"
export type StatisticsMetric = "requests" | "blocked"

export interface StatisticsReportFilters {
  applicationId: number
  range: "1h" | "24h" | "7d" | "30d"
  scope: StatisticsScope
  mapView: StatisticsMapView
  metric: StatisticsMetric
}

export function useStatisticsReport() {
  const filters = reactive<StatisticsReportFilters>({
    applicationId: 0,
    range: "24h",
    scope: "world",
    mapView: "3d",
    metric: "requests"
  })

  const params = computed(() => {
    const output: Record<string, string | number> = {
      range: filters.range,
      scope: filters.scope,
      map_view: filters.scope === "china" ? "2d" : filters.mapView,
      metric: filters.metric
    }
    if (filters.applicationId > 0) {
      output.application_id = filters.applicationId
    }
    return output
  })

  const resource = useApiResource(() => getStatisticsReport(params.value))
  const qpsPoints = shallowRef<readonly TimeSeriesPoint[]>([])
  const report = computed(() => {
    const current = resource.data.value
    if (!current) {
      return current
    }
    return { ...current, qps: qpsPoints.value }
  })
  let refreshTimer: ReturnType<typeof window.setInterval> | undefined
  let backgroundRefreshPromise: Promise<void> | null = null

  async function refreshReport() {
    if (resource.loading.value) {
      return
    }
    if (backgroundRefreshPromise) {
      await backgroundRefreshPromise
    }
    await resource.refresh()
  }

  function refreshRealtimeQps() {
    if (resource.loading.value || backgroundRefreshPromise) {
      return
    }

    const requestParams = params.value
    const requestKey = JSON.stringify(requestParams)
    backgroundRefreshPromise = getStatisticsReport(requestParams)
      .then((latest) => {
        if (JSON.stringify(params.value) === requestKey) {
          qpsPoints.value = latest.qps
        }
      })
      .finally(() => {
        backgroundRefreshPromise = null
      })
  }

  watch(
    () => resource.data.value?.qps,
    (latestQps) => {
      qpsPoints.value = latestQps ?? []
    }
  )

  watch(
    () => filters.scope,
    () => {
      void refreshReport()
    }
  )

  watch(
    () => [filters.applicationId, filters.range, filters.mapView, filters.metric],
    () => {
      void refreshReport()
    }
  )

  onMounted(() => {
    refreshTimer = window.setInterval(() => {
      refreshRealtimeQps()
    }, STATISTICS_REFRESH_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (refreshTimer !== undefined) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    filters,
    params,
    report,
    resource,
    refresh: refreshReport
  }
}
