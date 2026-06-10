<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue"
import { useI18n } from "vue-i18n"
import { useMessage, type DataTableColumns } from "naive-ui"
import {
  createRateLimit,
  deleteRateLimit,
  getRateLimits,
  updateRateLimit,
  type RateLimitInput,
  type RateLimitRule
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const { t } = useI18n()
const authStore = useAuthStore()
const resource = useApiResource(getRateLimits)
const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<RateLimitRule | null>(null)
const legacyFormVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<RateLimitInput>(emptyForm())

const columns = computed<DataTableColumns<RateLimitRule>>(() => [
  { title: t("rateLimits.columns.name"), key: "name" },
  { title: t("rateLimits.columns.scope"), key: "scope" },
  { title: t("rateLimits.columns.matchValue"), key: "match_value" },
  { title: t("rateLimits.columns.threshold"), key: "threshold" },
  { title: t("rateLimits.columns.windowSec"), key: "window_sec" },
  { title: t("rateLimits.columns.action"), key: "action" },
  { title: t("rateLimits.columns.banDurationSec"), key: "ban_duration_sec" },
  { title: t("rateLimits.columns.violationThreshold"), key: "violation_threshold" },
  { title: t("rateLimits.columns.violationWindowSec"), key: "violation_window_sec" },
  { title: t("rateLimits.columns.applicationId"), key: "application_id" },
  { title: t("rateLimits.columns.enabled"), key: "enabled", render: (row) => (row.enabled ? t("common.enabled") : t("common.disabled")) }
])
const scopeOptions = computed(() => [
  { label: "IP", value: "ip" },
  { label: "URI", value: "uri" },
  { label: t("rateLimits.site"), value: "site" }
])
const actionOptions = computed(() => [
  { label: t("common.block"), value: "block" },
  { label: t("common.logOnly"), value: "log-only" }
])

function emptyForm(): RateLimitInput {
  return {
    name: "",
    scope: "ip",
    match_value: "",
    threshold: 60,
    window_sec: 60,
    action: "block",
    ban_duration_sec: 0,
    violation_threshold: 0,
    violation_window_sec: 0,
    application_id: 0,
    enabled: true
  }
}

function assignForm(payload: RateLimitInput) {
  Object.assign(form, payload)
}

function startEdit(item: RateLimitRule) {
  editing.value = item
  assignForm({ ...item })
  legacyFormVisible.value = true
}

function openLegacyCreate() {
  editing.value = null
  assignForm(emptyForm())
  legacyFormVisible.value = true
}

function resetForm() {
  editing.value = null
  assignForm(emptyForm())
  legacyFormVisible.value = false
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await updateRateLimit(editing.value.id, form)
      message.success(t("rateLimits.updated"))
    } else {
      await createRateLimit(form)
      message.success(t("rateLimits.created"))
    }
    resetForm()
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function remove(item: RateLimitRule) {
  await deleteRateLimit(item.id)
  message.success(t("rateLimits.deleted"))
  await resource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("rateLimits.title") }}</h1>
        <p class="page-subtitle">{{ t("rateLimits.subtitle") }}</p>
      </div>
    </div>

    <section class="section section-pad">
      <NAlert class="compat-alert" type="warning">
        <template #header>{{ t("rateLimits.legacyHeader") }}</template>
        {{ t("rateLimits.legacyDescription") }}
        <div class="compat-actions">
          <RouterLink class="compat-link" to="/cc-protection">
            <NButton type="primary" size="small">{{ t("rateLimits.goCcProtection") }}</NButton>
          </RouterLink>
          <NButton v-if="authStore.canWrite" size="small" secondary @click="openLegacyCreate">
            {{ t("rateLimits.legacyCreate") }}
          </NButton>
        </div>
      </NAlert>

      <NAlert v-if="resource.error.value" class="view-alert" type="error">
        {{ resource.error.value }}
      </NAlert>

      <NAlert v-if="legacyFormVisible" class="compat-alert" type="warning">
        <template #header>{{ editing ? t("rateLimits.editingHeader") : t("rateLimits.createHeader") }}</template>
        {{ t("rateLimits.formNotice") }}
      </NAlert>

      <NForm v-if="authStore.canWrite && legacyFormVisible" class="form-grid" label-placement="top">
        <NFormItem :label="t('rateLimits.fields.name')"><NInput v-model:value="form.name" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.scope')">
          <NSelect v-model:value="form.scope" :options="scopeOptions" />
        </NFormItem>
        <NFormItem :label="t('rateLimits.fields.matchValue')"><NInput v-model:value="form.match_value" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.threshold')"><NInputNumber v-model:value="form.threshold" :min="1" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.windowSec')"><NInputNumber v-model:value="form.window_sec" :min="1" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.action')">
          <NSelect v-model:value="form.action" :options="actionOptions" />
        </NFormItem>
        <NFormItem :label="t('rateLimits.fields.banDurationSec')"><NInputNumber v-model:value="form.ban_duration_sec" :min="0" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.violationThreshold')"><NInputNumber v-model:value="form.violation_threshold" :min="0" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.violationWindowSec')"><NInputNumber v-model:value="form.violation_window_sec" :min="0" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.applicationId')"><NInputNumber v-model:value="form.application_id" :min="0" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.enabled')"><NSwitch v-model:value="form.enabled" /></NFormItem>
        <NFormItem :label="t('rateLimits.fields.operations')">
          <NSpace>
            <NButton type="warning" :loading="saving" @click="save">{{ editing ? t("rateLimits.saveEdit") : t("rateLimits.createRule") }}</NButton>
            <NButton @click="resetForm">{{ t("rateLimits.collapseForm") }}</NButton>
          </NSpace>
        </NFormItem>
      </NForm>

      <NDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="resource.loading.value" :columns="columns" :data="items" :bordered="false" />
      <NSpace v-if="authStore.canWrite" class="row-actions">
        <NButton v-for="item in items" :key="`edit-${item.id}`" size="small" @click="startEdit(item)">
          {{ t("rateLimits.editItem", { id: item.id }) }}
        </NButton>
        <NButton v-for="item in items" :key="`delete-${item.id}`" size="small" type="error" @click="remove(item)">
          {{ t("rateLimits.deleteItem", { id: item.id }) }}
        </NButton>
      </NSpace>
      <NEmpty v-if="!resource.loading.value && !resource.error.value && items.length === 0" :description="t('rateLimits.empty')" />
    </section>
  </main>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.compat-alert {
  margin-bottom: 16px;
}

.view-alert {
  margin-bottom: 16px;
}

.compat-link {
  text-decoration: none;
}

.compat-actions {
  margin-top: 12px;
}

.row-actions {
  margin-top: 12px;
}
</style>
