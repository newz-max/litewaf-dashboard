import { onMounted, readonly, shallowRef } from "vue"
import { i18n } from "@/i18n"

export function useApiResource<T>(loader: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef("")

  async function refresh() {
    loading.value = true
    error.value = ""

    try {
      data.value = await loader()
    } catch (err) {
      error.value = err instanceof Error ? err.message : i18n.global.t("common.requestFailed")
    } finally {
      loading.value = false
    }
  }

  onMounted(refresh)

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    refresh
  }
}
