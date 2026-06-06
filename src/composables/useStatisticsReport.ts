import { computed, reactive, watch } from "vue"
import { getStatisticsReport } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

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
  const report = computed(() => resource.data.value)

  watch(
    () => filters.scope,
    (scope) => {
      if (scope === "china") {
        filters.mapView = "2d"
      } else {
        filters.mapView = "3d"
      }
      void resource.refresh()
    }
  )

  watch(
    () => [filters.applicationId, filters.range, filters.mapView, filters.metric],
    () => {
      void resource.refresh()
    }
  )

  return {
    filters,
    params,
    report,
    resource,
    refresh: resource.refresh
  }
}
