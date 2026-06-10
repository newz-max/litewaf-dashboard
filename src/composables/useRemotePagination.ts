import { computed, readonly, shallowRef } from "vue"
import type { DataTableProps } from "naive-ui"

type RemotePaginationParams = {
  limit: number
  offset: number
}

type PaginationChangeHandler = () => void | Promise<void>

export interface UseRemotePaginationOptions {
  defaultPageSize?: number
  onChange?: PaginationChangeHandler
}

export const tablePageSizes = [10, 20, 50, 100] as const

export function useRemotePagination(options: UseRemotePaginationOptions = {}) {
  const page = shallowRef(1)
  const pageSize = shallowRef(options.defaultPageSize ?? 20)
  const itemCount = shallowRef(0)
  let onChange = options.onChange

  const limit = computed(() => pageSize.value)
  const offset = computed(() => (page.value - 1) * pageSize.value)

  const tablePagination = computed<DataTableProps["pagination"]>(() => ({
    page: page.value,
    pageSize: pageSize.value,
    itemCount: itemCount.value,
    pageSizes: [...tablePageSizes],
    showSizePicker: true,
    onUpdatePage,
    onUpdatePageSize
  }))

  function params(): RemotePaginationParams {
    return {
      limit: limit.value,
      offset: offset.value
    }
  }

  function setOnChange(handler: PaginationChangeHandler) {
    onChange = handler
  }

  function setItemCount(total: number) {
    itemCount.value = Math.max(0, Number(total) || 0)
    const maxPage = Math.max(1, Math.ceil(itemCount.value / pageSize.value))
    if (page.value <= maxPage) {
      return false
    }
    page.value = maxPage
    return true
  }

  function resetPage() {
    page.value = 1
  }

  async function onUpdatePage(nextPage: number) {
    const normalizedPage = Math.max(1, Number(nextPage) || 1)
    if (page.value === normalizedPage) {
      return
    }
    page.value = normalizedPage
    await onChange?.()
  }

  async function onUpdatePageSize(nextPageSize: number) {
    const normalizedPageSize = tablePageSizes.includes(nextPageSize as typeof tablePageSizes[number])
      ? nextPageSize
      : 20
    if (pageSize.value === normalizedPageSize && page.value === 1) {
      return
    }
    pageSize.value = normalizedPageSize
    page.value = 1
    await onChange?.()
  }

  return {
    page: readonly(page),
    pageSize: readonly(pageSize),
    itemCount: readonly(itemCount),
    limit,
    offset,
    tablePagination,
    params,
    setOnChange,
    setItemCount,
    resetPage
  }
}
