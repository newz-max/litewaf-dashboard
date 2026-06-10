<script setup lang="ts">
import { computed, reactive } from "vue"
import { getAccessLogs } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const filters = reactive({
  application_id: "",
  host: "",
  client_ip: "",
  method: "",
  uri: "",
  status: "",
  disposition: ""
})

type SelectFilterKey = "method" | "disposition"

const logsResource = useApiResource(() => getAccessLogs(cleanFilters()))
const logs = computed(() => [...(logsResource.data.value ?? [])])

const dispositionOptions = computed(() => [
  { label: t("logs.proxied"), value: "proxied" },
  { label: t("logs.blocked"), value: "blocked" },
  { label: t("logs.rateLimited"), value: "rate-limited" },
  { label: t("logs.rejected"), value: "rejected" }
])

const columns = computed(() => [
  { title: t("logs.time"), key: "time" },
  { title: t("logs.requestId"), key: "request_id" },
  { title: t("logs.site"), key: "application_id" },
  { title: "Host", key: "host" },
  { title: t("logs.method"), key: "method" },
  { title: "URI", key: "uri" },
  { title: t("common.status"), key: "status" },
  { title: t("logs.durationMs"), key: "duration_ms" },
  { title: t("logs.sourceIp"), key: "client_ip" },
  { title: t("logs.disposition"), key: "disposition" }
])

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== ""))
}

function selectFilterValue(key: SelectFilterKey) {
  return filters[key] || null
}

function updateSelectFilter(key: SelectFilterKey, value: string | number | null) {
  filters[key] = value == null ? "" : String(value)
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("logs.accessTitle") }}</h1>
        <p class="page-subtitle">{{ t("logs.accessSubtitle") }}</p>
      </div>
      <NButton @click="logsResource.refresh">{{ t("common.refresh") }}</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">{{ t("common.applicationId") }}</span>
          <NInput v-model:value="filters.application_id" :placeholder="t('logs.enterApplicationId')" clearable />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">Host</span>
          <NInput v-model:value="filters.host" :placeholder="t('logs.enterHost')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.sourceIp") }}</span>
          <NInput v-model:value="filters.client_ip" :placeholder="t('logs.enterSourceIp')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.requestMethod") }}</span>
          <NSelect
            :value="selectFilterValue('method')"
            clearable
            :placeholder="t('logs.selectMethod')"
            @update:value="updateSelectFilter('method', $event)"
            :options="[
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'DELETE', value: 'DELETE' }
            ]"
          />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">URI</span>
          <NInput v-model:value="filters.uri" :placeholder="t('logs.enterRequestUri')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.statusCode") }}</span>
          <NInput v-model:value="filters.status" :placeholder="t('logs.enterStatusCode')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.dispositionResult") }}</span>
          <NSelect
            :value="selectFilterValue('disposition')"
            clearable
            :placeholder="t('logs.selectDisposition')"
            @update:value="updateSelectFilter('disposition', $event)"
            :options="dispositionOptions"
          />
        </div>
        <NButton type="primary" @click="logsResource.refresh">{{ t("common.query") }}</NButton>
      </div>

      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="logsResource.loading.value"
        :columns="columns"
        :data="logs"
        :bordered="false"
      />
      <NEmpty v-if="!logsResource.loading.value && logs.length === 0" :description="t('logs.noAccessLogs')" />
      <NAlert v-if="logsResource.error.value" type="error" style="margin-top: 12px">
        {{ logsResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
