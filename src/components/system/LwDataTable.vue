<script setup lang="ts">
import { computed, useAttrs } from "vue"
import { NDataTable, type DataTableColumns } from "naive-ui"

defineOptions({
  inheritAttrs: false
})

type ScrollbarProps = Record<string, unknown>

const props = withDefaults(
  defineProps<{
    columns: DataTableColumns<any>
    scrollX?: number | string
    scrollbarProps?: ScrollbarProps
  }>(),
  {
    scrollX: "max-content"
  }
)

const attrs = useAttrs()
const defaultScrollbarProps = { trigger: "hover" } as const
const resolvedScrollbarProps = computed(() => props.scrollbarProps ?? defaultScrollbarProps)
</script>

<template>
  <NDataTable
    v-bind="attrs"
    class="lw-data-table"
    :columns="columns"
    :scroll-x="scrollX"
    :scrollbar-props="resolvedScrollbarProps"
  >
    <slot />
  </NDataTable>
</template>
