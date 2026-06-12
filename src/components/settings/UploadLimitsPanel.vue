<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { UploadLimitSummary } from "@/api/litewaf"
import { formatBytes, uploadLimitRows } from "./uploadLimitFormatters"

const policyDetailLimit = 5

const props = defineProps<{
  summary?: UploadLimitSummary
  loading: boolean
  error?: string
}>()

const { t } = useI18n()

const uploadLimitItems = computed(() => uploadLimitRows(t, props.summary))
const bodyInspectionPolicyLimits = computed(() => props.summary?.body_inspection_limit.policy_limits ?? [])
const visiblePolicyLimits = computed(() => bodyInspectionPolicyLimits.value.slice(0, policyDetailLimit))
const hiddenPolicyLimitCount = computed(() => Math.max(bodyInspectionPolicyLimits.value.length - visiblePolicyLimits.value.length, 0))
</script>

<template>
  <section class="section section-pad">
    <div class="section-title">{{ t("settings.uploadLimits.title") }}</div>
    <NSpin :show="props.loading">
      <NAlert v-if="props.error" type="error" class="upload-limit-guidance">
        {{ props.error }}
      </NAlert>
      <NEmpty
        v-else-if="uploadLimitItems.length === 0 && !props.loading"
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
          <NCollapse
            v-if="item.policyDetails && bodyInspectionPolicyLimits.length > 0"
            class="upload-limit-policy-collapse"
          >
            <NCollapseItem :title="t('settings.uploadLimits.policyDetails')" name="body-inspection-policies">
              <div class="upload-limit-policy-list">
                <div
                  v-for="policy in visiblePolicyLimits"
                  :key="policy.policy_id"
                  class="upload-limit-policy-row"
                >
                  <span class="upload-limit-policy-name">{{ policy.policy_name }}</span>
                  <span>{{ formatBytes(policy.max_bytes) }}</span>
                  <span>{{ t("settings.uploadLimits.policyApplications", { count: policy.applications }) }}</span>
                  <span>{{ t("settings.uploadLimits.policyRules", { count: policy.rules }) }}</span>
                </div>
                <div v-if="hiddenPolicyLimitCount > 0" class="upload-limit-policy-more">
                  {{ t("settings.uploadLimits.policyMore", { count: hiddenPolicyLimitCount }) }}
                </div>
              </div>
            </NCollapseItem>
          </NCollapse>
        </div>
        <NAlert type="info" class="upload-limit-guidance">
          {{ t("settings.uploadLimits.guidance") }}
        </NAlert>
        <NAlert
          v-for="warning in props.summary?.warnings ?? []"
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

.upload-limit-meta,
.upload-limit-policy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--text-color-3);
  font-size: 13px;
}

.upload-limit-policy-collapse {
  margin-top: 2px;
}

.upload-limit-policy-list {
  display: grid;
  gap: 8px;
}

.upload-limit-policy-name {
  color: var(--text-color);
  font-weight: 680;
}

.upload-limit-policy-more {
  color: var(--text-color-3);
  font-size: 13px;
}

.upload-limit-guidance {
  margin-top: 2px;
}
</style>
