<script setup lang="ts">
import { computed, h, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { NButton, NSpace, useMessage } from "naive-ui"
import {
  createPolicy,
  deletePolicy,
  getApplications,
  getPolicies,
  getRules,
  updatePolicy,
  type Policy,
  type PolicyInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const message = useMessage()
const { t } = useI18n()
const policiesResource = useApiResource(getPolicies)
const applicationsResource = useApiResource(getApplications)
const rulesResource = useApiResource(getRules)
const policies = computed(() => [...(policiesResource.data.value ?? [])])
const showForm = ref(false)
const saving = ref(false)
const editingID = ref<number | null>(null)

const form = reactive<PolicyInput>({
  name: "",
  risk_threshold: 100,
  default_action: "block",
  normalization_enabled: true,
  normalization_decode_passes: 2,
  normalization_max_value_bytes: 4096,
  body_inspection_enabled: false,
  body_inspection_content_types: ["application/json", "application/x-www-form-urlencoded"],
  body_inspection_path_prefixes: ["/"],
  body_inspection_max_bytes: 65536,
  oversized_body_action: "log-only",
  upload_inspection_enabled: false,
  upload_max_bytes: 10485760,
  upload_size_action: "block",
  dynamic_ban_enabled: false,
  dynamic_ban_duration_sec: 300,
  dynamic_ban_score_threshold: 200,
  dynamic_ban_trigger_count: 3,
  dynamic_ban_window_sec: 60,
  enabled: true,
  application_ids: [],
  rule_ids: []
})

const applicationOptions = computed(() =>
  (applicationsResource.data.value ?? []).map((application) => ({
    label: `${application.name} (${application.hosts.map((host) => host.host).join(", ")})`,
    value: application.id
  }))
)
const ruleOptions = computed(() =>
  (rulesResource.data.value ?? []).map((rule) => ({ label: `${rule.name} #${rule.id}`, value: rule.id }))
)
const actionOptions = computed(() => [
  { label: t("common.block"), value: "block" },
  { label: t("common.logOnly"), value: "log-only" },
  { label: t("common.allow"), value: "pass" }
])
const contentTypeOptions = [
  { label: "JSON", value: "application/json" },
  { label: "Form", value: "application/x-www-form-urlencoded" },
  { label: "Multipart", value: "multipart/form-data" },
  { label: "Text", value: "text/plain" }
]
const bodyPathOptions = computed(() =>
  form.body_inspection_path_prefixes.map((value) => ({ label: value, value }))
)

const columns = computed(() => [
  { title: t("policies.columns.policyId"), key: "id" },
  { title: t("policies.columns.name"), key: "name" },
  { title: t("policies.columns.riskThreshold"), key: "risk_threshold" },
  { title: t("policies.columns.defaultAction"), key: "default_action" },
  { title: t("policies.columns.body"), key: "body_inspection_enabled", render: (row: Policy) => (row.body_inspection_enabled ? t("common.enabled") : t("common.disabled")) },
  { title: t("policies.columns.upload"), key: "upload_inspection_enabled", render: (row: Policy) => (row.upload_inspection_enabled ? t("common.enabled") : t("common.disabled")) },
  { title: t("policies.columns.dynamicBan"), key: "dynamic_ban_enabled", render: (row: Policy) => (row.dynamic_ban_enabled ? t("common.enabled") : t("common.disabled")) },
  { title: t("policies.columns.applicationCount"), key: "application_ids", render: (row: Policy) => row.application_ids.length },
  { title: t("policies.columns.ruleCount"), key: "rule_ids", render: (row: Policy) => row.rule_ids.length },
  { title: t("policies.columns.status"), key: "enabled", render: (row: Policy) => (row.enabled ? t("common.enabled") : t("common.disabled")) },
  {
    title: t("policies.columns.actions"),
    key: "actions",
    render: (row: Policy) =>
      h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(NButton, { size: "small", quaternary: true, onClick: () => editPolicy(row) }, { default: () => t("common.edit") }),
            h(NButton, { size: "small", quaternary: true, onClick: () => removePolicy(row.id) }, { default: () => t("common.delete") })
          ]
        }
      )
  }
])

function resetForm() {
  editingID.value = null
  Object.assign(form, {
    name: "",
    risk_threshold: 100,
    default_action: "block",
    normalization_enabled: true,
    normalization_decode_passes: 2,
    normalization_max_value_bytes: 4096,
    body_inspection_enabled: false,
    body_inspection_content_types: ["application/json", "application/x-www-form-urlencoded"],
    body_inspection_path_prefixes: ["/"],
    body_inspection_max_bytes: 65536,
    oversized_body_action: "log-only",
    upload_inspection_enabled: false,
    upload_max_bytes: 10485760,
    upload_size_action: "block",
    dynamic_ban_enabled: false,
    dynamic_ban_duration_sec: 300,
    dynamic_ban_score_threshold: 200,
    dynamic_ban_trigger_count: 3,
    dynamic_ban_window_sec: 60,
    enabled: true,
    application_ids: [],
    rule_ids: []
  })
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function editPolicy(policy: Policy) {
  editingID.value = policy.id
  Object.assign(form, {
    name: policy.name,
    risk_threshold: policy.risk_threshold,
    default_action: policy.default_action,
    normalization_enabled: policy.normalization_enabled,
    normalization_decode_passes: policy.normalization_decode_passes,
    normalization_max_value_bytes: policy.normalization_max_value_bytes,
    body_inspection_enabled: policy.body_inspection_enabled,
    body_inspection_content_types: [...(policy.body_inspection_content_types ?? [])],
    body_inspection_path_prefixes: [...(policy.body_inspection_path_prefixes ?? [])],
    body_inspection_max_bytes: policy.body_inspection_max_bytes,
    oversized_body_action: policy.oversized_body_action,
    upload_inspection_enabled: policy.upload_inspection_enabled,
    upload_max_bytes: policy.upload_max_bytes,
    upload_size_action: policy.upload_size_action,
    dynamic_ban_enabled: policy.dynamic_ban_enabled,
    dynamic_ban_duration_sec: policy.dynamic_ban_duration_sec,
    dynamic_ban_score_threshold: policy.dynamic_ban_score_threshold,
    dynamic_ban_trigger_count: policy.dynamic_ban_trigger_count,
    dynamic_ban_window_sec: policy.dynamic_ban_window_sec,
    enabled: policy.enabled,
    application_ids: [...policy.application_ids],
    rule_ids: [...policy.rule_ids]
  })
  showForm.value = true
}

async function savePolicy() {
  saving.value = true
  try {
    if (editingID.value) {
      await updatePolicy(editingID.value, form)
    } else {
      await createPolicy(form)
    }
    message.success(t("policies.saved"))
    showForm.value = false
    await policiesResource.refresh()
  } finally {
    saving.value = false
  }
}

async function removePolicy(id: number) {
  await deletePolicy(id)
  message.success(t("policies.deleted"))
  await policiesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("policies.title") }}</h1>
        <p class="page-subtitle">{{ t("policies.subtitle") }}</p>
      </div>
      <NButton type="primary" @click="openCreate">{{ t("policies.createPolicy") }}</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="policiesResource.loading.value"
        :columns="columns"
        :data="policies"
        :bordered="false"
      />
      <NEmpty v-if="!policiesResource.loading.value && policies.length === 0" :description="t('policies.empty')" />
      <NAlert v-if="policiesResource.error.value" type="error" style="margin-top: 12px">
        {{ policiesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="showForm" :width="480">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editingID ? t('policies.editPolicy') : t('policies.createPolicy')">
        <NForm label-placement="top">
          <NFormItem :label="t('policies.form.name')">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem :label="t('policies.form.applications')">
            <NSelect v-model:value="form.application_ids" multiple :options="applicationOptions" />
          </NFormItem>
          <NFormItem :label="t('policies.form.rules')">
            <NSelect v-model:value="form.rule_ids" multiple :options="ruleOptions" />
          </NFormItem>
          <NFormItem :label="t('policies.form.riskThreshold')">
            <NInputNumber v-model:value="form.risk_threshold" :min="1" :max="1000" />
          </NFormItem>
          <NFormItem :label="t('policies.form.defaultAction')">
            <NSelect v-model:value="form.default_action" :options="actionOptions" />
          </NFormItem>
          <NDivider />
          <NFormItem :label="t('policies.form.normalization')">
            <NSwitch v-model:value="form.normalization_enabled" />
          </NFormItem>
          <NFormItem :label="t('policies.form.decodePasses')">
            <NInputNumber v-model:value="form.normalization_decode_passes" :min="1" :max="5" />
          </NFormItem>
          <NFormItem :label="t('policies.form.normalizationMaxBytes')">
            <NInputNumber v-model:value="form.normalization_max_value_bytes" :min="128" :max="65536" />
          </NFormItem>
          <NDivider />
          <NFormItem :label="t('policies.form.bodyInspection')">
            <NSwitch v-model:value="form.body_inspection_enabled" />
          </NFormItem>
          <NFormItem :label="t('policies.form.bodyTypes')">
            <NSelect v-model:value="form.body_inspection_content_types" multiple tag :options="contentTypeOptions" />
          </NFormItem>
          <NFormItem :label="t('policies.form.pathPrefixes')">
            <NSelect v-model:value="form.body_inspection_path_prefixes" multiple tag :options="bodyPathOptions" />
          </NFormItem>
          <NFormItem :label="t('policies.form.bodyMaxBytes')">
            <NInputNumber v-model:value="form.body_inspection_max_bytes" :min="1" :max="1048576" />
          </NFormItem>
          <NFormItem :label="t('policies.form.oversizedBodyAction')">
            <NSelect v-model:value="form.oversized_body_action" :options="actionOptions" />
          </NFormItem>
          <NDivider />
          <NFormItem :label="t('policies.form.uploadInspection')">
            <NSwitch v-model:value="form.upload_inspection_enabled" />
          </NFormItem>
          <NFormItem :label="t('policies.form.uploadMaxBytes')">
            <NInputNumber v-model:value="form.upload_max_bytes" :min="1" :max="1073741824" />
          </NFormItem>
          <NFormItem :label="t('policies.form.uploadSizeAction')">
            <NSelect v-model:value="form.upload_size_action" :options="actionOptions" />
          </NFormItem>
          <NDivider />
          <NFormItem :label="t('policies.form.dynamicBan')">
            <NSwitch v-model:value="form.dynamic_ban_enabled" />
          </NFormItem>
          <NFormItem :label="t('policies.form.banDurationSec')">
            <NInputNumber v-model:value="form.dynamic_ban_duration_sec" :min="1" :max="86400" />
          </NFormItem>
          <NFormItem :label="t('policies.form.banScoreThreshold')">
            <NInputNumber v-model:value="form.dynamic_ban_score_threshold" :min="1" :max="10000" />
          </NFormItem>
          <NFormItem :label="t('policies.form.triggerCount')">
            <NInputNumber v-model:value="form.dynamic_ban_trigger_count" :min="1" :max="1000" />
          </NFormItem>
          <NFormItem :label="t('policies.form.windowSec')">
            <NInputNumber v-model:value="form.dynamic_ban_window_sec" :min="1" :max="86400" />
          </NFormItem>
          <NFormItem :label="t('policies.form.enabled')">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">{{ t("common.cancel") }}</NButton>
            <NButton type="primary" :loading="saving" @click="savePolicy">{{ t("common.save") }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>
