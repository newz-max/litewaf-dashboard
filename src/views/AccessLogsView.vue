<script setup lang="ts">
import { computed, reactive } from "vue"
import { getAccessLogs } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

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

const columns = [
  { title: "时间", key: "time" },
  { title: "请求 ID", key: "request_id" },
  { title: "站点", key: "application_id" },
  { title: "Host", key: "host" },
  { title: "方法", key: "method" },
  { title: "URI", key: "uri" },
  { title: "状态", key: "status" },
  { title: "耗时 ms", key: "duration_ms" },
  { title: "来源 IP", key: "client_ip" },
  { title: "处置", key: "disposition" }
]

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
        <h1 class="page-title">访问日志</h1>
        <p class="page-subtitle">查询网关请求、响应状态、耗时和最终处置。</p>
      </div>
      <NButton @click="logsResource.refresh">刷新</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">应用 ID</span>
          <NInput v-model:value="filters.application_id" placeholder="输入应用 ID" clearable />
        </div>
        <div class="query-field query-field-wide">
          <span class="query-label">Host</span>
          <NInput v-model:value="filters.host" placeholder="输入 Host" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">来源 IP</span>
          <NInput v-model:value="filters.client_ip" placeholder="输入来源 IP" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">请求方法</span>
          <NSelect
            :value="selectFilterValue('method')"
            clearable
            placeholder="选择方法"
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
          <NInput v-model:value="filters.uri" placeholder="输入 URI" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">状态码</span>
          <NInput v-model:value="filters.status" placeholder="输入状态码" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">处置结果</span>
          <NSelect
            :value="selectFilterValue('disposition')"
            clearable
            placeholder="选择处置"
            @update:value="updateSelectFilter('disposition', $event)"
            :options="[
              { label: '已代理', value: 'proxied' },
              { label: '已阻断', value: 'blocked' },
              { label: '已限流', value: 'rate-limited' },
              { label: '已拒绝', value: 'rejected' }
            ]"
          />
        </div>
        <NButton type="primary" @click="logsResource.refresh">查询</NButton>
      </div>

      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="logsResource.loading.value"
        :columns="columns"
        :data="logs"
        :bordered="false"
      />
      <NEmpty v-if="!logsResource.loading.value && logs.length === 0" description="暂无访问日志" />
      <NAlert v-if="logsResource.error.value" type="error" style="margin-top: 12px">
        {{ logsResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
