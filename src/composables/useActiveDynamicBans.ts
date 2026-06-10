import { computed, reactive, readonly, shallowRef } from "vue"
import { clearDynamicBan, getDynamicBans, type DynamicBan, type DynamicBanClearResult } from "@/api/litewaf"
import { i18n } from "@/i18n"

export interface DynamicBanFilters {
  application_id: string
  client_ip: string
  status: string
}

const defaultFilters: DynamicBanFilters = {
  application_id: "",
  client_ip: "",
  status: "active"
}

export function useActiveDynamicBans() {
  const filters = reactive<DynamicBanFilters>({ ...defaultFilters })
  const items = shallowRef<DynamicBan[]>([])
  const loading = shallowRef(false)
  const error = shallowRef("")
  const clearingKey = shallowRef("")
  const lastClear = shallowRef<DynamicBanClearResult | null>(null)

  const activeCount = computed(() => items.value.filter((item) => item.status === "active").length)
  const hasRows = computed(() => items.value.length > 0)

  function params() {
    return Object.fromEntries(
      Object.entries(filters)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value !== "")
    )
  }

  async function refresh() {
    loading.value = true
    error.value = ""
    try {
      items.value = await getDynamicBans(params())
    } catch (err) {
      error.value = err instanceof Error ? err.message : i18n.global.t("common.requestFailed")
    } finally {
      loading.value = false
    }
  }

  async function clearBan(item: DynamicBan) {
    clearingKey.value = rowKey(item)
    error.value = ""
    try {
      lastClear.value = await clearDynamicBan({ application_id: item.application_id, client_ip: item.client_ip })
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : i18n.global.t("dynamicBans.clearFailed")
    } finally {
      clearingKey.value = ""
    }
  }

  function resetFilters() {
    Object.assign(filters, defaultFilters)
  }

  return {
    filters,
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    clearingKey: readonly(clearingKey),
    lastClear: readonly(lastClear),
    activeCount,
    hasRows,
    refresh,
    clearBan,
    resetFilters,
    rowKey
  }
}

function rowKey(item: Pick<DynamicBan, "application_id" | "client_ip">) {
  return `${item.application_id}:${item.client_ip}`
}
