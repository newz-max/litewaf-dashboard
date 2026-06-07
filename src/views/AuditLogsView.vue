<script setup lang="ts">
import { computed, reactive } from "vue"
import { getAuditLogs } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const filters = reactive({
  action: "",
  resource_type: "",
  result: ""
})

const auditResource = useApiResource(() => getAuditLogs(cleanFilters()))
const logs = computed(() => [...(auditResource.data.value ?? [])])

const columns = [
  { title: "时间", key: "time" },
  { title: "操作者", key: "actor" },
  { title: "角色", key: "role" },
  { title: "动作", key: "action" },
  { title: "资源", key: "resource_type" },
  { title: "资源 ID", key: "resource_id" },
  { title: "结果", key: "result" },
  { title: "说明", key: "message" }
]

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== ""))
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">审计日志</h1>
        <p class="page-subtitle">查询管理操作、发布和回滚记录。</p>
      </div>
      <NButton @click="auditResource.refresh">刷新</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <NInput v-model:value="filters.action" placeholder="动作" clearable />
        <NInput v-model:value="filters.resource_type" placeholder="资源类型" clearable />
        <NSelect
          v-model:value="filters.result"
          clearable
          placeholder="结果"
          :options="[
            { label: '成功', value: 'success' },
            { label: '失败', value: 'failure' }
          ]"
        />
        <NButton type="primary" @click="auditResource.refresh">查询</NButton>
      </div>

      <NDataTable
        :loading="auditResource.loading.value"
        :columns="columns"
        :data="logs"
        :bordered="false"
      />
      <NEmpty v-if="!auditResource.loading.value && logs.length === 0" description="暂无审计日志" />
      <NAlert v-if="auditResource.error.value" type="error" style="margin-top: 12px">
        {{ auditResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
