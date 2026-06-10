<script setup lang="ts">
import { computed, reactive } from "vue"
import { getAuditLogsPage, type AuditLog } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useRemotePagination } from "@/composables/useRemotePagination"
import { formatDateTime } from "@/utils/dateTime"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const filters = reactive({
  action: "",
  resource_type: "",
  result: ""
})

const pagination = useRemotePagination()
const auditResource = useApiResource(fetchAuditLogsPage)
pagination.setOnChange(auditResource.refresh)
const tablePagination = pagination.tablePagination
const logs = computed(() => [...(auditResource.data.value?.items ?? [])])

const resultOptions = computed(() => [
  { label: t("logs.success"), value: "success" },
  { label: t("logs.failure"), value: "failure" }
])

const columns = computed(() => [
  { title: t("logs.time"), key: "time", render: (row: AuditLog) => formatDateTime(row.time) },
  { title: t("logs.actor"), key: "actor" },
  { title: t("logs.role"), key: "role" },
  { title: t("common.action"), key: "action" },
  { title: t("logs.resource"), key: "resource_type" },
  { title: t("logs.resourceId"), key: "resource_id" },
  { title: t("logs.result"), key: "result" },
  { title: t("logs.message"), key: "message" }
])

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== ""))
}

async function fetchAuditLogsPage() {
  const result = await getAuditLogsPage({ ...cleanFilters(), ...pagination.params() })
  if (pagination.setItemCount(result.total)) {
    const clampedResult = await getAuditLogsPage({ ...cleanFilters(), ...pagination.params() })
    pagination.setItemCount(clampedResult.total)
    return clampedResult
  }
  return result
}

async function searchLogs() {
  pagination.resetPage()
  await auditResource.refresh()
}

function selectResultValue() {
  return filters.result || null
}

function updateResultFilter(value: string | number | null) {
  filters.result = value == null ? "" : String(value)
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("logs.auditTitle") }}</h1>
        <p class="page-subtitle">{{ t("logs.auditSubtitle") }}</p>
      </div>
      <NButton @click="auditResource.refresh">{{ t("common.refresh") }}</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">{{ t("logs.operationAction") }}</span>
          <NInput v-model:value="filters.action" :placeholder="t('logs.enterAction')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.resourceType") }}</span>
          <NInput v-model:value="filters.resource_type" :placeholder="t('logs.enterResourceType')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.operationResult") }}</span>
          <NSelect
            :value="selectResultValue()"
            clearable
            :placeholder="t('logs.selectResult')"
            @update:value="updateResultFilter"
            :options="resultOptions"
          />
        </div>
        <NButton type="primary" @click="searchLogs">{{ t("common.query") }}</NButton>
      </div>

      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="auditResource.loading.value"
        :columns="columns"
        :data="logs"
        :bordered="false"
        :pagination="tablePagination"
      />
      <NEmpty v-if="!auditResource.loading.value && logs.length === 0" :description="t('logs.noAuditLogs')" />
      <NAlert v-if="auditResource.error.value" type="error" style="margin-top: 12px">
        {{ auditResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
