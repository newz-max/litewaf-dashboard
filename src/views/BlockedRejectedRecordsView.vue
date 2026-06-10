<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { NButton, NSpace, NTag } from "naive-ui"
import type { DataTableColumns } from "naive-ui"
import { getBlockedRejectedRecords, type BlockedRejectedRecord } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const filterKeys = [
  "application_id",
  "listener_port",
  "scheme",
  "host",
  "client_ip",
  "status",
  "uri",
  "disposition",
  "module",
  "action",
  "trigger_source"
] as const

type FilterKey = typeof filterKeys[number]

const filters = reactive(Object.fromEntries(filterKeys.map((key) => [key, queryString(key)])) as Record<typeof filterKeys[number], string>)
const timeRange = shallowRef<[number, number] | null>(initialTimeRange())

const recordsResource = useApiResource(() => getBlockedRejectedRecords(cleanFilters()))
const records = computed(() => [...(recordsResource.data.value ?? [])])

const dispositionOptions = computed(() => [
  { label: t("logs.blocked"), value: "blocked" },
  { label: t("logs.rejected"), value: "rejected" }
])

const sourceOptions = computed(() => [
  { label: t("logs.wafEvent"), value: "waf-event" },
  { label: t("logs.dynamicBan"), value: "dynamic-ban" },
  { label: t("logs.accessLog"), value: "access-log" },
  { label: t("logs.unclassified"), value: "unclassified" }
])

const actionOptions = [
  { label: "block", value: "block" },
  { label: "ban", value: "ban" },
  { label: "log-only", value: "log-only" }
]

const schemeOptions = [
  { label: "HTTP", value: "http" },
  { label: "HTTPS", value: "https" }
]

const columns = computed<DataTableColumns<BlockedRejectedRecord>>(() => [
  { title: t("logs.time"), key: "time", minWidth: 180 },
  { title: t("logs.requestId"), key: "request_id", minWidth: 170 },
  { title: t("logs.application"), key: "application_id", width: 90 },
  { title: t("logs.listener"), key: "listener", width: 110, render: renderListener },
  { title: "Host", key: "host", minWidth: 170 },
  { title: "URI", key: "uri", minWidth: 220 },
  { title: t("common.status"), key: "status", width: 90 },
  { title: t("logs.sourceIp"), key: "client_ip", minWidth: 150 },
  { title: t("logs.disposition"), key: "disposition", width: 100, render: renderDisposition },
  { title: t("logs.triggerSource"), key: "explanation_source", width: 120, render: renderSource },
  { title: t("logs.correlation"), key: "correlation_type", width: 110, render: renderCorrelation },
  { title: t("logs.module"), key: "module", minWidth: 140 },
  { title: t("common.action"), key: "action", width: 90 },
  { title: t("common.rule"), key: "rule", minWidth: 180, render: renderRule },
  { title: t("logs.reason"), key: "reason", minWidth: 260, render: renderReason },
  {
    title: t("logs.drilldown"),
    key: "actions",
    fixed: "right",
    width: 260,
    render(row: BlockedRejectedRecord) {
      return h(NSpace, { size: "small" }, { default: () => drilldownLinks(row) })
    }
  }
])

function cleanFilters() {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(filters)) {
    const trimmed = value.trim()
    if (trimmed !== "") {
      params[key] = trimmed
    }
  }
  if (timeRange.value) {
    params.since = new Date(timeRange.value[0]).toISOString()
    params.until = new Date(timeRange.value[1]).toISOString()
  }
  return params
}

async function searchRecords() {
  await router.replace({ query: cleanFilters() })
  await recordsResource.refresh()
}

async function resetFilters() {
  for (const key of filterKeys) {
    filters[key] = ""
  }
  timeRange.value = null
  await router.replace({ query: {} })
  await recordsResource.refresh()
}

function queryString(key: string) {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "")
}

function selectFilterValue(key: FilterKey) {
  return filters[key] || null
}

function updateSelectFilter(key: FilterKey, value: string | number | null) {
  filters[key] = value == null ? "" : String(value)
}

function initialTimeRange() {
  const since = queryString("since")
  const until = queryString("until")
  const sinceTime = since ? Date.parse(since) : Number.NaN
  const untilTime = until ? Date.parse(until) : Number.NaN
  return Number.isFinite(sinceTime) && Number.isFinite(untilTime) ? [sinceTime, untilTime] as [number, number] : null
}

function renderListener(row: BlockedRejectedRecord) {
  const port = row.listener_port ? `:${row.listener_port}` : ""
  return `${row.scheme || "-"}${port}`
}

function renderDisposition(row: BlockedRejectedRecord) {
  const type = row.disposition === "blocked" ? "error" : "warning"
  const label = row.disposition === "blocked" ? t("logs.blocked") : t("logs.rejected")
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function renderSource(row: BlockedRejectedRecord) {
  const labels: Record<string, string> = {
    "waf-event": t("logs.wafEvent"),
    "dynamic-ban": t("logs.dynamicBan"),
    "access-log": t("logs.accessLog"),
    unclassified: t("logs.unclassified")
  }
  const type = row.explanation_source === "waf-event" ? "error" : row.explanation_source === "unclassified" ? "warning" : "info"
  return h(NTag, { type, size: "small" }, { default: () => labels[row.explanation_source] ?? row.explanation_source })
}

function renderCorrelation(row: BlockedRejectedRecord) {
  const labels: Record<string, string> = {
    "request-id": t("logs.requestIdCorrelation"),
    fallback: t("logs.fallbackMatch"),
    none: t("logs.noCorrelation")
  }
  return labels[row.correlation_type] ?? row.correlation_type
}

function renderRule(row: BlockedRejectedRecord) {
  if (row.rule_id && row.rule_id > 0) {
    return row.rule_name ? `${row.rule_id} / ${row.rule_name}` : String(row.rule_id)
  }
  return row.rule_name || ""
}

function renderReason(row: BlockedRejectedRecord) {
  return row.reason || row.summary || row.dynamic_ban_reason || row.reason_code || ""
}

function drilldownLinks(row: BlockedRejectedRecord) {
  const links = [
    h(RouterLink, { to: { path: "/access-logs", query: accessLogQuery(row) } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => t("logs.accessLog") }) })
  ]
  if (row.explanation_source === "waf-event") {
    links.push(h(RouterLink, { to: { path: "/attack-logs", query: attackLogQuery(row) } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => t("logs.attackLog") }) }))
  }
  if (row.explanation_source === "dynamic-ban") {
    links.push(h(RouterLink, { to: { path: "/dynamic-bans", query: dynamicBanQuery(row) } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => t("logs.dynamicBan") }) }))
  }
  const path = row.module ? moduleRoute(row.module) : ""
  if (path) {
    links.push(h(RouterLink, { to: { path, query: row.rule_id && row.rule_id > 0 ? { rule_id: row.rule_id } : {} } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => t("logs.moduleButton") }) }))
  }
  return links
}

function accessLogQuery(row: BlockedRejectedRecord) {
  return cleanObject({
    application_id: row.application_id,
    listener_port: row.listener_port || "",
    scheme: row.scheme || "",
    host: row.host,
    client_ip: row.client_ip,
    uri: row.uri,
    status: row.status,
    disposition: row.disposition
  })
}

function attackLogQuery(row: BlockedRejectedRecord) {
  return cleanObject({
    application_id: row.application_id,
    listener_port: row.listener_port || "",
    scheme: row.scheme || "",
    client_ip: row.client_ip,
    rule_id: row.rule_id && row.rule_id > 0 ? row.rule_id : "",
    module: row.module || "",
    action: row.action || "",
    disposition: row.disposition
  })
}

function dynamicBanQuery(row: BlockedRejectedRecord) {
  return cleanObject({
    application_id: row.application_id,
    listener_port: row.listener_port || "",
    scheme: row.scheme || "",
    client_ip: row.client_ip,
    status: row.dynamic_ban_status || "active"
  })
}

function cleanObject(input: Record<string, string | number>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => String(value).trim() !== ""))
}

function moduleRoute(module: string) {
  const routes: Record<string, string> = {
    "cc-protection": "/cc-protection",
    "attack-protection": "/attack-protection",
    "ip-access-list": "/ip-access-lists",
    "access-control": "/access-control",
    "upload-protection": "/upload-protection",
    "bot-protection": "/bot-protection",
    "dynamic-protection": "/dynamic-protection"
  }
  return routes[module] ?? ""
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("logs.blockedRejectedTitle") }}</h1>
        <p class="page-subtitle">{{ t("logs.blockedRejectedSubtitle") }}</p>
      </div>
      <NButton @click="recordsResource.refresh">{{ t("common.refresh") }}</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">{{ t("common.applicationId") }}</span>
          <NInput v-model:value="filters.application_id" :placeholder="t('logs.enterApplicationId')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.listenerPort") }}</span>
          <NInput v-model:value="filters.listener_port" :placeholder="t('logs.enterListenerPort')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.accessProtocol") }}</span>
          <NSelect
            :value="selectFilterValue('scheme')"
            :options="schemeOptions"
            clearable
            :placeholder="t('logs.selectAccessProtocol')"
            @update:value="updateSelectFilter('scheme', $event)"
          />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">Host</span>
          <NInput v-model:value="filters.host" :placeholder="t('logs.enterHost')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.sourceIp") }}</span>
          <NInput v-model:value="filters.client_ip" :placeholder="t('logs.enterSourceIp')" clearable />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">{{ t("logs.requestUri") }}</span>
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
            :options="dispositionOptions"
            clearable
            :placeholder="t('logs.selectDispositionResult')"
            @update:value="updateSelectFilter('disposition', $event)"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.protectionModule") }}</span>
          <NInput v-model:value="filters.module" :placeholder="t('logs.enterProtectionModule')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.executionAction") }}</span>
          <NSelect
            :value="selectFilterValue('action')"
            :options="actionOptions"
            clearable
            :placeholder="t('logs.selectAction')"
            @update:value="updateSelectFilter('action', $event)"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.triggerSource") }}</span>
          <NSelect
            :value="selectFilterValue('trigger_source')"
            :options="sourceOptions"
            clearable
            :placeholder="t('logs.selectTriggerSource')"
            @update:value="updateSelectFilter('trigger_source', $event)"
          />
        </div>
        <div class="query-field query-time-range">
          <span class="query-label">{{ t("logs.timeRange") }}</span>
          <NDatePicker
            v-model:value="timeRange"
            type="datetimerange"
            clearable
            :start-placeholder="t('logs.startTime')"
            :end-placeholder="t('logs.endTime')"
          />
        </div>
        <NButton type="primary" @click="searchRecords">{{ t("common.query") }}</NButton>
        <NButton @click="resetFilters">{{ t("common.reset") }}</NButton>
      </div>

      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="recordsResource.loading.value"
        :columns="columns"
        :data="records"
        :bordered="false"
        :scroll-x="2200"
      />
      <NEmpty v-if="!recordsResource.loading.value && records.length === 0" :description="t('logs.noBlockedRejectedRecords')" />
      <NAlert v-if="recordsResource.error.value" type="error" class="result-alert">
        {{ recordsResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>

<style scoped>
.result-alert {
  margin-top: 12px;
}
</style>
