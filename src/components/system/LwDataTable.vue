<script setup lang="ts">
import { computed, useAttrs } from "vue"
import { NDataTable, type DataTableColumns, type DataTableProps } from "naive-ui"

defineOptions({
  inheritAttrs: false
})

type ScrollbarProps = Record<string, unknown>
type TablePagination = DataTableProps["pagination"]

const props = withDefaults(
  defineProps<{
    columns: DataTableColumns<any>
    scrollX?: number | string
    scrollbarProps?: ScrollbarProps
    pagination?: TablePagination
  }>(),
  {
    scrollX: "max-content"
  }
)

const attrs = useAttrs()
const defaultScrollbarProps = { trigger: "hover" } as const
const defaultPagination = {
  pageSize: 20,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true
} satisfies Exclude<TablePagination, false>
const resolvedScrollbarProps = computed(() => props.scrollbarProps ?? defaultScrollbarProps)
const resolvedPagination = computed(() => props.pagination ?? defaultPagination)
</script>

<template>
  <NDataTable
    v-bind="attrs"
    class="lw-data-table"
    :columns="columns"
    :scroll-x="scrollX"
    :scrollbar-props="resolvedScrollbarProps"
    :pagination="resolvedPagination"
  >
    <slot />
  </NDataTable>
</template>

<style scoped>
.lw-data-table {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.lw-data-table :deep(.n-data-table-wrapper),
.lw-data-table :deep(.n-data-table-base-table),
.lw-data-table :deep(.n-data-table-base-table-body),
.lw-data-table :deep(.n-scrollbar),
.lw-data-table :deep(.n-scrollbar-container),
.lw-data-table :deep(.n-scrollbar-content) {
  max-width: 100%;
  min-width: 0;
}
</style>
