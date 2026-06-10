<script setup lang="ts">
import { computed, h, onMounted } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage } from "naive-ui"
import { useAuthStore } from "@/stores/auth"
import { type DynamicBan } from "@/api/litewaf"
import { useActiveDynamicBans } from "@/composables/useActiveDynamicBans"
import { formatDateTime } from "@/utils/dateTime"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const authStore = useAuthStore()
const dialog = useDialog()
const message = useMessage()
const bans = useActiveDynamicBans()
const tableRows = computed(() => [...bans.items.value])

const statusOptions = computed(() => [
  { label: t("dynamicBans.active"), value: "active" },
  { label: t("dynamicBans.cleared"), value: "cleared" },
  { label: t("dynamicBans.expired"), value: "expired" }
])

const columns = computed(() => [
  { title: t("logs.site"), key: "application_id", width: 90 },
  { title: t("logs.sourceIp"), key: "client_ip", minWidth: 150 },
  { title: t("common.status"), key: "status", width: 100, render: renderStatus },
  { title: t("dynamicBans.reason"), key: "ban_reason", minWidth: 180 },
  { title: t("common.source"), key: "source", minWidth: 160 },
  { title: t("dynamicBans.remaining"), key: "ban_remaining_sec", width: 110, render: (row: DynamicBan) => formatDuration(row.ban_remaining_sec) },
  { title: t("dynamicBans.banDuration"), key: "ban_duration_sec", width: 110, render: (row: DynamicBan) => formatDuration(row.ban_duration_sec) },
  { title: t("dynamicBans.createdAt"), key: "time", minWidth: 180, render: (row: DynamicBan) => formatDateTime(row.time) },
  { title: t("dynamicBans.expiresAt"), key: "expires_at", minWidth: 180, render: (row: DynamicBan) => formatDateTime(row.expires_at) },
  {
    title: t("common.actions"),
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
        { default: () => t("dynamicBans.clear") }
      )
    }
  }
])

onMounted(bans.refresh)

function renderStatus(row: DynamicBan) {
  const type = row.status === "active" ? "error" : row.status === "cleared" ? "success" : "default"
  const label = row.status === "active" ? t("dynamicBans.active") : row.status === "cleared" ? t("dynamicBans.cleared") : t("dynamicBans.expired")
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

function confirmClear(row: DynamicBan) {
  dialog.warning({
    title: t("dynamicBans.confirmClear"),
    content: t("dynamicBans.confirmClearContent", { applicationId: row.application_id, clientIp: row.client_ip }),
    positiveText: t("dynamicBans.clear"),
    negativeText: t("common.cancel"),
    onPositiveClick: async () => {
      await bans.clearBan(row)
      if (!bans.error.value) {
        message.success(t("dynamicBans.clearSubmitted"))
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
  bans.resetPage()
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
        <h1 class="page-title">{{ t("dynamicBans.title") }}</h1>
        <p class="page-subtitle">{{ t("dynamicBans.subtitle") }}</p>
      </div>
      <NSpace>
        <NTag type="error">{{ t("dynamicBans.active") }} {{ bans.activeCount.value }}</NTag>
        <NButton @click="bans.refresh">{{ t("common.refresh") }}</NButton>
      </NSpace>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">{{ t("common.applicationId") }}</span>
          <NInput v-model:value="bans.filters.application_id" :placeholder="t('logs.enterApplicationId')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.sourceIp") }}</span>
          <NInput v-model:value="bans.filters.client_ip" :placeholder="t('logs.enterSourceIp')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("dynamicBans.banStatus") }}</span>
          <NSelect
            :value="statusFilterValue()"
            :options="statusOptions"
            clearable
            :placeholder="t('dynamicBans.selectStatus')"
            @update:value="updateStatusFilter"
          />
        </div>
        <NButton type="primary" @click="applyFilters">{{ t("common.query") }}</NButton>
        <NButton @click="resetFilters">{{ t("common.reset") }}</NButton>
      </div>

      <NAlert v-if="bans.lastClear.value" type="success" class="result-alert">
        {{ bans.lastClear.value.client_ip }}: {{ bans.lastClear.value.status }} / revision {{ bans.lastClear.value.revision }}
      </NAlert>
      <NAlert v-if="bans.error.value" type="error" class="result-alert">
        {{ bans.error.value }}
      </NAlert>

      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="bans.loading.value"
        :columns="columns"
        :data="tableRows"
        :bordered="false"
        :row-key="bans.rowKey"
        :pagination="bans.tablePagination.value"
      />
      <NEmpty v-if="!bans.loading.value && !bans.hasRows.value" :description="t('dynamicBans.empty')" />
    </section>
  </main>
</template>

<style scoped>
.result-alert {
  margin-bottom: 12px;
}
</style>
