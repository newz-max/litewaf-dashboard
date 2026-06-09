<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { NButton, NSpace, NTag } from "naive-ui"
import type { DataTableColumns } from "naive-ui"
import { getBlockedRejectedRecords, type BlockedRejectedRecord } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

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

const dispositionOptions = [
  { label: "已阻断", value: "blocked" },
  { label: "已拒绝", value: "rejected" }
]

const sourceOptions = [
  { label: "WAF 事件", value: "waf-event" },
  { label: "动态封禁", value: "dynamic-ban" },
  { label: "访问日志", value: "access-log" },
  { label: "未归类", value: "unclassified" }
]

const actionOptions = [
  { label: "block", value: "block" },
  { label: "ban", value: "ban" },
  { label: "log-only", value: "log-only" }
]

const schemeOptions = [
  { label: "HTTP", value: "http" },
  { label: "HTTPS", value: "https" }
]

const columns: DataTableColumns<BlockedRejectedRecord> = [
  { title: "时间", key: "time", minWidth: 180 },
  { title: "请求 ID", key: "request_id", minWidth: 170 },
  { title: "应用", key: "application_id", width: 90 },
  { title: "监听", key: "listener", width: 110, render: renderListener },
  { title: "Host", key: "host", minWidth: 170 },
  { title: "URI", key: "uri", minWidth: 220 },
  { title: "状态", key: "status", width: 90 },
  { title: "来源 IP", key: "client_ip", minWidth: 150 },
  { title: "处置", key: "disposition", width: 100, render: renderDisposition },
  { title: "触发来源", key: "explanation_source", width: 120, render: renderSource },
  { title: "关联", key: "correlation_type", width: 110, render: renderCorrelation },
  { title: "模块", key: "module", minWidth: 140 },
  { title: "动作", key: "action", width: 90 },
  { title: "规则", key: "rule", minWidth: 180, render: renderRule },
  { title: "原因", key: "reason", minWidth: 260, render: renderReason },
  {
    title: "回跳",
    key: "actions",
    fixed: "right",
    width: 260,
    render(row: BlockedRejectedRecord) {
      return h(NSpace, { size: "small" }, { default: () => drilldownLinks(row) })
    }
  }
]

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
  const label = row.disposition === "blocked" ? "已阻断" : "已拒绝"
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function renderSource(row: BlockedRejectedRecord) {
  const labels: Record<string, string> = {
    "waf-event": "WAF 事件",
    "dynamic-ban": "动态封禁",
    "access-log": "访问日志",
    unclassified: "未归类"
  }
  const type = row.explanation_source === "waf-event" ? "error" : row.explanation_source === "unclassified" ? "warning" : "info"
  return h(NTag, { type, size: "small" }, { default: () => labels[row.explanation_source] ?? row.explanation_source })
}

function renderCorrelation(row: BlockedRejectedRecord) {
  const labels: Record<string, string> = {
    "request-id": "请求 ID",
    fallback: "回退匹配",
    none: "无关联"
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
    h(RouterLink, { to: { path: "/access-logs", query: accessLogQuery(row) } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => "访问日志" }) })
  ]
  if (row.explanation_source === "waf-event") {
    links.push(h(RouterLink, { to: { path: "/attack-logs", query: attackLogQuery(row) } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => "攻击日志" }) }))
  }
  if (row.explanation_source === "dynamic-ban") {
    links.push(h(RouterLink, { to: { path: "/dynamic-bans", query: dynamicBanQuery(row) } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => "动态封禁" }) }))
  }
  const path = row.module ? moduleRoute(row.module) : ""
  if (path) {
    links.push(h(RouterLink, { to: { path, query: row.rule_id && row.rule_id > 0 ? { rule_id: row.rule_id } : {} } }, { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => "模块" }) }))
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
        <h1 class="page-title">拦截 / 拒绝记录</h1>
        <p class="page-subtitle">从最终处置出发查看被阻断或拒绝的请求，以及可用的触发原因。</p>
      </div>
      <NButton @click="recordsResource.refresh">刷新</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">应用 ID</span>
          <NInput v-model:value="filters.application_id" placeholder="输入应用 ID" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">监听端口</span>
          <NInput v-model:value="filters.listener_port" placeholder="输入监听端口" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">访问协议</span>
          <NSelect
            :value="selectFilterValue('scheme')"
            :options="schemeOptions"
            clearable
            placeholder="选择访问协议"
            @update:value="updateSelectFilter('scheme', $event)"
          />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">Host</span>
          <NInput v-model:value="filters.host" placeholder="输入 Host" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">来源 IP</span>
          <NInput v-model:value="filters.client_ip" placeholder="输入来源 IP" clearable />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">请求 URI</span>
          <NInput v-model:value="filters.uri" placeholder="输入请求 URI" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">状态码</span>
          <NInput v-model:value="filters.status" placeholder="输入状态码" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">处置结果</span>
          <NSelect
            :value="selectFilterValue('disposition')"
            :options="dispositionOptions"
            clearable
            placeholder="选择处置结果"
            @update:value="updateSelectFilter('disposition', $event)"
          />
        </div>
        <div class="query-field">
          <span class="query-label">防护模块</span>
          <NInput v-model:value="filters.module" placeholder="输入防护模块" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">执行动作</span>
          <NSelect
            :value="selectFilterValue('action')"
            :options="actionOptions"
            clearable
            placeholder="选择执行动作"
            @update:value="updateSelectFilter('action', $event)"
          />
        </div>
        <div class="query-field">
          <span class="query-label">触发来源</span>
          <NSelect
            :value="selectFilterValue('trigger_source')"
            :options="sourceOptions"
            clearable
            placeholder="选择触发来源"
            @update:value="updateSelectFilter('trigger_source', $event)"
          />
        </div>
        <div class="query-field query-time-range">
          <span class="query-label">时间范围</span>
          <NDatePicker
            v-model:value="timeRange"
            type="datetimerange"
            clearable
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </div>
        <NButton type="primary" @click="searchRecords">查询</NButton>
        <NButton @click="resetFilters">重置</NButton>
      </div>

      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="recordsResource.loading.value"
        :columns="columns"
        :data="records"
        :bordered="false"
        :scroll-x="2200"
      />
      <NEmpty v-if="!recordsResource.loading.value && records.length === 0" description="暂无拦截或拒绝记录" />
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
