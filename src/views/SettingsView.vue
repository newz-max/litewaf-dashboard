<script setup lang="ts">
import { computed } from "vue"
import { getVersion, type UploadLimitSummary } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import ThemeSettingsPanel from "@/components/theme/ThemeSettingsPanel.vue"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const versionResource = useApiResource(getVersion)
const uploadLimits = computed(() => versionResource.data.value?.upload_limits)
const settings = computed(() => {
  const version = versionResource.data.value

  if (!version) {
    return []
  }

  return [
    { key: t("settings.appName"), value: version.name },
    { key: t("settings.version"), value: version.version },
    { key: t("settings.environment"), value: version.env },
    { key: t("settings.gatewayClientMaxBodySize"), value: version.gateway_client_max_body_size }
  ]
})

interface UploadLimitRow {
  key: string
  layer: string
  name: string
  value: string
  source: string
  stage: string
  eventVisible: string
}

function formatBytes(value?: number) {
  if (!value || value <= 0) {
    return "-"
  }
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MiB`
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KiB`
  }
  return `${value} B`
}

function formatEventVisible(value: boolean) {
  return value ? t("settings.uploadLimits.eventVisibleYes") : t("settings.uploadLimits.eventVisibleNo")
}

function formatStage(value: string) {
  return t(`settings.uploadLimits.stages.${value}`)
}

function formatSource(value: string) {
  return t(`settings.uploadLimits.sources.${value}`)
}

function uploadLimitRows(summary?: UploadLimitSummary): UploadLimitRow[] {
  if (!summary) {
    return []
  }

  return [
    {
      key: "gateway_client_max_body_size",
      layer: summary.gateway_client_max_body_size.layer,
      name: t("settings.uploadLimits.gateway"),
      value: summary.gateway_client_max_body_size.value,
      source: formatSource(summary.gateway_client_max_body_size.source),
      stage: formatStage(summary.gateway_client_max_body_size.stage),
      eventVisible: formatEventVisible(summary.gateway_client_max_body_size.event_visible)
    },
    {
      key: "body_inspection_limit",
      layer: summary.body_inspection_limit.layer,
      name: t("settings.uploadLimits.bodyInspection"),
      value: t("settings.uploadLimits.policyDerived", {
        enabled: summary.body_inspection_limit.enabled_policies ?? 0,
        min: formatBytes(summary.body_inspection_limit.min_bytes),
        max: formatBytes(summary.body_inspection_limit.max_bytes)
      }),
      source: formatSource(summary.body_inspection_limit.source),
      stage: formatStage(summary.body_inspection_limit.stage),
      eventVisible: formatEventVisible(summary.body_inspection_limit.event_visible)
    },
    {
      key: "upload_protection",
      layer: summary.upload_protection.layer,
      name: t("settings.uploadLimits.uploadProtection"),
      value: t("settings.uploadLimits.ruleSummary", {
        enabled: summary.upload_protection.enabled_rules,
        size: summary.upload_protection.size_rules,
        max: formatBytes(summary.upload_protection.max_bytes)
      }),
      source: formatSource(summary.upload_protection.source),
      stage: formatStage(summary.upload_protection.stage),
      eventVisible: formatEventVisible(summary.upload_protection.event_visible)
    }
  ]
}

const uploadLimitItems = computed(() => uploadLimitRows(uploadLimits.value))
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("settings.title") }}</h1>
        <p class="page-subtitle">{{ t("settings.subtitle") }}</p>
      </div>
    </div>

    <ThemeSettingsPanel />

    <section class="section section-pad">
      <div class="section-title">{{ t("settings.runtimeInfo") }}</div>
      <NSpin :show="versionResource.loading.value">
        <NEmpty v-if="settings.length === 0 && !versionResource.loading.value" :description="t('settings.emptyRuntimeInfo')" />
        <NDescriptions v-else bordered :column="1" label-placement="left">
          <NDescriptionsItem
            v-for="item in settings"
            :key="item.key"
            :label="item.key"
          >
            {{ item.value }}
          </NDescriptionsItem>
        </NDescriptions>
      </NSpin>
      <NAlert v-if="versionResource.error.value" type="error" style="margin-top: 12px">
        {{ versionResource.error.value }}
      </NAlert>
    </section>

    <section class="section section-pad">
      <div class="section-title">{{ t("settings.uploadLimits.title") }}</div>
      <NSpin :show="versionResource.loading.value">
        <NEmpty
          v-if="uploadLimitItems.length === 0 && !versionResource.loading.value"
          :description="t('settings.uploadLimits.empty')"
        />
        <div v-else class="upload-limit-panel">
          <div
            v-for="item in uploadLimitItems"
            :key="item.key"
            class="upload-limit-row"
          >
            <div class="upload-limit-main">
              <NTag size="small" type="info">{{ item.layer }}</NTag>
              <div>
                <div class="upload-limit-name">{{ item.name }}</div>
                <div class="upload-limit-value">{{ item.value }}</div>
              </div>
            </div>
            <div class="upload-limit-meta">
              <span>{{ t("settings.uploadLimits.source", { value: item.source }) }}</span>
              <span>{{ t("settings.uploadLimits.stage", { value: item.stage }) }}</span>
              <span>{{ t("settings.uploadLimits.eventVisible", { value: item.eventVisible }) }}</span>
            </div>
          </div>
          <NAlert type="info" class="upload-limit-guidance">
            {{ t("settings.uploadLimits.guidance") }}
          </NAlert>
          <NAlert
            v-for="warning in uploadLimits?.warnings ?? []"
            :key="warning.code"
            type="warning"
            class="upload-limit-guidance"
          >
            <strong>{{ warning.message }}</strong>
            <div v-if="warning.impact">{{ warning.impact }}</div>
            <div v-if="warning.recommendation">{{ warning.recommendation }}</div>
          </NAlert>
        </div>
      </NSpin>
    </section>
  </main>
</template>

<style scoped>
.section-title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 760;
}

.upload-limit-panel {
  display: grid;
  gap: 10px;
}

.upload-limit-row {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.upload-limit-main {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.upload-limit-name {
  font-weight: 720;
}

.upload-limit-value {
  margin-top: 2px;
  color: var(--text-color-2);
}

.upload-limit-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--text-color-3);
  font-size: 13px;
}

.upload-limit-guidance {
  margin-top: 2px;
}
</style>
