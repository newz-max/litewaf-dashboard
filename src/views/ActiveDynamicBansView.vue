<script setup lang="ts">
import { computed, h, onMounted } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage } from "naive-ui"
import { useAuthStore } from "@/stores/auth"
import { type DynamicBan } from "@/api/litewaf"
import { useActiveDynamicBans } from "@/composables/useActiveDynamicBans"

const authStore = useAuthStore()
const dialog = useDialog()
const message = useMessage()
const bans = useActiveDynamicBans()
const tableRows = computed(() => [...bans.items.value])

const statusOptions = [
  { label: "活跃", value: "active" },
  { label: "已解封", value: "cleared" },
  { label: "已过期", value: "expired" }
]

const columns = computed(() => [
  { title: "站点", key: "application_id", width: 90 },
  { title: "来源 IP", key: "client_ip", minWidth: 150 },
  { title: "状态", key: "status", width: 100, render: renderStatus },
  { title: "原因", key: "ban_reason", minWidth: 180 },
  { title: "来源", key: "source", minWidth: 160 },
  { title: "剩余", key: "ban_remaining_sec", width: 110, render: (row: DynamicBan) => formatDuration(row.ban_remaining_sec) },
  { title: "封禁时长", key: "ban_duration_sec", width: 110, render: (row: DynamicBan) => formatDuration(row.ban_duration_sec) },
  { title: "创建时间", key: "time", minWidth: 180 },
  { title: "过期时间", key: "expires_at", minWidth: 180, render: (row: DynamicBan) => formatTime(row.expires_at) },
  {
    title: "操作",
    key: "actions",
    width: 110,
    render(row: DynamicBan) {
      if (!authStore.canWrite || row.status !== "active") {
        return null
      }
      const key = bans.rowKey(row)
      return h(
        NButton,
        {
          size: "small",
          type: "warning",
          ghost: true,
          loading: bans.clearingKey.value === key,
          onClick: () => confirmClear(row)
        },
        { default: () => "解封" }
      )
    }
  }
])

onMounted(bans.refresh)

function renderStatus(row: DynamicBan) {
  const type = row.status === "active" ? "error" : row.status === "cleared" ? "success" : "default"
  const label = row.status === "active" ? "活跃" : row.status === "cleared" ? "已解封" : "已过期"
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function formatDuration(value: number) {
  const seconds = Number(value || 0)
  if (seconds <= 0) {
    return "0s"
  }
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) {
    return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const minuteRest = minutes % 60
  return minuteRest > 0 ? `${hours}h ${minuteRest}m` : `${hours}h`
}

function formatTime(value: string) {
  if (!value) {
    return ""
  }
  return new Date(value).toLocaleString()
}

function confirmClear(row: DynamicBan) {
  dialog.warning({
    title: "确认解封",
    content: `站点 ${row.application_id} / ${row.client_ip}`,
    positiveText: "解封",
    negativeText: "取消",
    onPositiveClick: async () => {
      await bans.clearBan(row)
      if (!bans.error.value) {
        message.success("解封请求已提交")
      }
    }
  })
}

function statusFilterValue() {
  return bans.filters.status || null
}

function updateStatusFilter(value: string | number | null) {
  bans.filters.status = value == null ? "" : String(value)
}

async function applyFilters() {
  await bans.refresh()
}

async function resetFilters() {
  bans.resetFilters()
  await bans.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">动态封禁</h1>
        <p class="page-subtitle">查看和处理规则触发的临时来源封禁。</p>
      </div>
      <NSpace>
        <NTag type="error">活跃 {{ bans.activeCount.value }}</NTag>
        <NButton @click="bans.refresh">刷新</NButton>
      </NSpace>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">应用 ID</span>
          <NInput v-model:value="bans.filters.application_id" placeholder="输入应用 ID" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">来源 IP</span>
          <NInput v-model:value="bans.filters.client_ip" placeholder="输入来源 IP" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">封禁状态</span>
          <NSelect
            :value="statusFilterValue()"
            :options="statusOptions"
            clearable
            placeholder="选择状态"
            @update:value="updateStatusFilter"
          />
        </div>
        <NButton type="primary" @click="applyFilters">查询</NButton>
        <NButton @click="resetFilters">重置</NButton>
      </div>

      <NAlert v-if="bans.lastClear.value" type="success" class="result-alert">
        {{ bans.lastClear.value.client_ip }}: {{ bans.lastClear.value.status }} / revision {{ bans.lastClear.value.revision }}
      </NAlert>
      <NAlert v-if="bans.error.value" type="error" class="result-alert">
        {{ bans.error.value }}
      </NAlert>

      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="bans.loading.value"
        :columns="columns"
        :data="tableRows"
        :bordered="false"
        :row-key="bans.rowKey"
      />
      <NEmpty v-if="!bans.loading.value && !bans.hasRows.value" description="暂无动态封禁" />
    </section>
  </main>
</template>

<style scoped>
.result-alert {
  margin-bottom: 12px;
}
</style>
