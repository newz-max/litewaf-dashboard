<script setup lang="ts">
import { computed, reactive } from "vue"
import { getAccessLogs } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const filters = reactive({
  site_id: "",
  host: "",
  client_ip: "",
  method: "",
  uri: "",
  status: "",
  disposition: ""
})

const logsResource = useApiResource(() => getAccessLogs(cleanFilters()))
const logs = computed(() => [...(logsResource.data.value ?? [])])

const columns = [
  { title: "时间", key: "time" },
  { title: "请求 ID", key: "request_id" },
  { title: "站点", key: "site_id" },
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
      <NSpace class="toolbar">
        <NInput v-model:value="filters.site_id" placeholder="站点 ID" clearable />
        <NInput v-model:value="filters.host" placeholder="Host" clearable />
        <NInput v-model:value="filters.client_ip" placeholder="来源 IP" clearable />
        <NSelect
          v-model:value="filters.method"
          clearable
          placeholder="方法"
          :options="[
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' }
          ]"
        />
        <NInput v-model:value="filters.uri" placeholder="URI" clearable />
        <NInput v-model:value="filters.status" placeholder="状态码" clearable />
        <NSelect
          v-model:value="filters.disposition"
          clearable
          placeholder="处置"
          :options="[
            { label: '已代理', value: 'proxied' },
            { label: '已阻断', value: 'blocked' },
            { label: '已限流', value: 'rate-limited' },
            { label: '已拒绝', value: 'rejected' }
          ]"
        />
        <NButton type="primary" @click="logsResource.refresh">查询</NButton>
      </NSpace>

      <NDataTable
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

<style scoped>
.toolbar {
  margin-bottom: 14px;
}
</style>
