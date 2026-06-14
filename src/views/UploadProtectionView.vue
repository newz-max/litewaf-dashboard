<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createUploadProtectionRule,
  deleteUploadProtectionRule,
  getUploadProtectionRules,
  updateUploadProtectionRule,
  type ProtectionRule,
  type ProtectionRuleDraft,
  type UploadProtectionRuleInput
} from "@/api/litewaf"
import ModulePageHeader from "@/components/operations/ModulePageHeader.vue"
import ModuleRiskGuidance from "@/components/operations/ModuleRiskGuidance.vue"
import ModuleStateBlock from "@/components/operations/ModuleStateBlock.vue"
import ModuleStatusSummary from "@/components/operations/ModuleStatusSummary.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"
import { useI18n } from "vue-i18n"
import { formatDateTime } from "@/utils/dateTime"
import { formatPathMatch, pathMatchOptions as createPathMatchOptions, validateGlobPath } from "@/utils/pathMatch"
import { protectionGuides, protectionRiskPrompts, riskPromptText } from "@/utils/protectionGuidance"

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const resource = useApiResource(getUploadProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleDraft>(emptyForm())
const guidanceItems = computed(() => protectionGuides(t, "upload-protection"))
const formRiskPrompts = computed(() => protectionRiskPrompts(form, t))
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const extensionRuleCount = computed(() => items.value.filter((item) => (item.upload?.extensions ?? []).length > 0).length)
const sizeLimitCount = computed(() => items.value.filter((item) => Number(item.upload?.max_bytes ?? 0) > 0).length)
const headerTags = computed(() => [
  { label: t("common.rules"), value: items.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: t("modules.upload.extensionRules"), value: extensionRuleCount.value, tone: "warning" as const }
])
const statusItems = computed(() => [
  { label: t("common.totalRules"), value: items.value.length, note: t("modules.upload.totalRulesNote"), tone: "info" as const },
  { label: t("common.enabledRules"), value: enabledCount.value, note: t("modules.upload.enabledRulesNote"), tone: "success" as const },
  { label: t("modules.upload.extensionRules"), value: extensionRuleCount.value, note: t("modules.upload.extensionRulesNote"), tone: extensionRuleCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: t("modules.upload.sizeLimitRules"), value: sizeLimitCount.value, note: t("modules.upload.sizeLimitRulesNote"), tone: sizeLimitCount.value > 0 ? "warning" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.value.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk, t), tone: "warning" as const })))

const templateOptions = computed(() => [
  { label: t("modules.upload.dangerousScriptExtensions"), value: "script" },
  { label: t("modules.upload.avatarSizeLimit"), value: "avatar" },
  { label: t("modules.upload.observeUploads"), value: "observe" }
])

const pathMatchOptions = computed(() => createPathMatchOptions(t))

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const actionOptions = computed(() => [
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" }
])

const columns = computed<DataTableColumns<ProtectionRule>>(() => [
  { title: t("common.name"), key: "name", minWidth: 170 },
  {
    title: t("common.effectiveApplication"),
    key: "application_id",
    width: 92,
    render(row) {
      return row.application_id > 0 ? `#${row.application_id}` : t("common.global")
    }
  },
  {
    title: t("table.uploadPath"),
    key: "match.path",
    minWidth: 160,
    render(row) {
      return row.match.path
    }
  },
  {
    title: t("table.pathMatch"),
    key: "match.path_match",
    width: 96,
    render(row) {
      return formatPathMatch(row.match.path_match ?? "prefix", t)
    }
  },
  {
    title: t("common.methods"),
    key: "match.methods",
    minWidth: 120,
    render(row) {
      return row.match.methods.length > 0 ? row.match.methods.join(", ") : t("common.all")
    }
  },
  {
    title: t("table.dangerousExtensions"),
    key: "upload.extensions",
    minWidth: 150,
    render(row) {
      return row.upload?.extensions.length ? row.upload.extensions.map((item) => `.${item}`).join(", ") : "-"
    }
  },
  {
    title: t("table.sizeLimit"),
    key: "upload.max_bytes",
    width: 118,
    render(row) {
      return row.upload?.max_bytes ? formatBytes(row.upload.max_bytes) : "-"
    }
  },
  {
    title: t("common.action"),
    key: "action.type",
    width: 96,
    render(row) {
      return formatAction(row.action.type)
    }
  },
  {
    title: t("common.enabled"),
    key: "enabled",
    width: 84,
    render(row) {
      return hStatus(row.enabled)
    }
  },
  {
    title: t("common.source"),
    key: "migration_status",
    width: 104,
    render(row) {
      return hSource(row)
    }
  },
  {
    title: t("common.updatedAt"),
    key: "updated_at",
    minWidth: 160,
    render(row) {
      return formatDateTime(row.updated_at)
    }
  },
  {
    title: t("common.actions"),
    key: "actions",
    fixed: "right",
    width: 150,
    render(row) {
      return h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(
              NButton,
              { size: "small", disabled: !authStore.canWrite, onClick: () => startEdit(row) },
              { default: () => t("common.edit") }
            ),
            h(
              NButton,
              {
                size: "small",
                type: "error",
                disabled: !authStore.canWrite,
                onClick: () => remove(row)
              },
              { default: () => t("common.delete") }
            )
          ]
        }
      )
    }
  }
])

function emptyForm(): ProtectionRuleDraft {
  return {
    name: "",
    module: "upload-protection",
    category: "upload",
    application_id: 0,
    enabled: true,
    priority: 100,
    match: {
      path: "/upload",
      path_match: "prefix",
      methods: ["POST"]
    },
    limit: {
      counter: "",
      threshold: 0,
      window_sec: 0,
      ban_duration_sec: 0
    },
    upload: {
      extensions: ["php", "jsp", "asp", "aspx"],
      max_bytes: 0
    },
    action: {
      type: "block"
    }
  }
}

function assignForm(payload: ProtectionRuleDraft) {
  Object.assign(form, {
    ...payload,
    match: { ...payload.match, methods: [...payload.match.methods] },
    limit: { ...payload.limit },
    upload: {
      extensions: [...(payload.upload?.extensions ?? [])],
      max_bytes: payload.upload?.max_bytes ?? 0
    },
    action: { ...payload.action }
  })
}

function openCreate() {
  editing.value = null
  assignForm(emptyForm())
  formVisible.value = true
}

function startEdit(item: ProtectionRule) {
  editing.value = item
  assignForm({
    name: item.name,
    module: item.module,
    category: item.category,
    application_id: item.application_id,
    enabled: item.enabled,
    priority: item.priority,
    match: {
      path: item.match.path || "/upload",
      path_match: item.match.path_match || "prefix",
      methods: [...item.match.methods]
    },
    limit: item.limit,
    upload: {
      extensions: [...(item.upload?.extensions ?? [])],
      max_bytes: item.upload?.max_bytes ?? 0
    },
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleDraft> = {
    script: {
      ...emptyForm(),
      name: t("modules.upload.dangerousScriptExtensionsBlock"),
      match: { path: "/upload", path_match: "prefix", methods: ["POST"] },
      upload: { extensions: ["php", "jsp", "asp", "aspx", "jspx"], max_bytes: 0 },
      action: { type: "block" }
    },
    avatar: {
      ...emptyForm(),
      name: t("modules.upload.avatarSizeLimit"),
      match: { path: "/upload/avatar", path_match: "prefix", methods: ["POST", "PUT"] },
      upload: { extensions: [], max_bytes: 1048576 },
      action: { type: "block" }
    },
    observe: {
      ...emptyForm(),
      name: t("modules.upload.observeUploads"),
      match: { path: "/upload", path_match: "prefix", methods: ["POST", "PUT"] },
      upload: { extensions: ["php", "jsp", "exe"], max_bytes: 10485760 },
      action: { type: "log-only" }
    }
  }
  assignForm(templates[value] ?? emptyForm())
}

function validateForm() {
  if (!form.name.trim()) {
    return t("common.ruleNameRequired")
  }
  if (!String(form.match.path || "").startsWith("/")) {
    return t("modules.upload.uploadPathMustStartSlash")
  }
  const globError = validateGlobPath(String(form.match.path || ""), form.match.path_match, t)
  if (globError) {
    return globError
  }
  if (Number(form.priority ?? 0) < 0) {
    return t("common.invalidPriorityZero")
  }
  if (!form.upload?.extensions.length && Number(form.upload?.max_bytes ?? 0) <= 0) {
    return t("modules.upload.extensionOrSizeRequired")
  }
  if (Number(form.upload?.max_bytes ?? 0) < 0) {
    return t("modules.upload.sizeLimitInvalid")
  }
  if ((form.upload?.extensions ?? []).some((item) => item.includes("/") || item.includes("\\") || item.includes(".."))) {
    return t("modules.upload.extensionInvalid")
  }
  return ""
}

async function save() {
  const error = validateForm()
  if (error) {
    message.error(error)
    return
  }
  if (!(await confirmRiskIfNeeded())) {
    return
  }
  saving.value = true
  const payload = buildPayload()
  try {
    if (editing.value) {
      await updateUploadProtectionRule(editing.value.id, payload)
      message.success(t("common.updated", { name: t("modules.upload.title") }))
    } else {
      await createUploadProtectionRule(payload)
      message.success(t("common.created", { name: t("modules.upload.title") }))
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

function buildPayload(): UploadProtectionRuleInput {
  return {
    name: form.name,
    module: form.module,
    category: form.category,
    application_id: form.application_id,
    enabled: form.enabled,
    priority: form.priority,
    match: { ...form.match, methods: [...form.match.methods] },
    limit: { ...form.limit },
    upload: {
      extensions: [...(form.upload?.extensions ?? [])],
      max_bytes: form.upload?.max_bytes ?? 0
    },
    action: { ...form.action }
  }
}

function confirmRiskIfNeeded() {
  const risks = formRiskPrompts.value
  if (risks.length === 0) {
    return Promise.resolve(true)
  }
  return new Promise<boolean>((resolve) => {
    dialog.warning({
      title: t("common.highRiskConfirm", { name: t("modules.upload.title") }),
      content: () => h("div", { class: "risk-confirm" }, risks.map((risk) => h("p", { key: risk.message }, riskPromptText(risk, t)))),
      positiveText: t("common.confirmSave"),
      negativeText: t("common.cancel"),
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false)
    })
  })
}

async function remove(item: ProtectionRule) {
  await deleteUploadProtectionRule(item.id)
  message.success(t("common.deleted", { name: t("modules.upload.title") }))
  await resource.refresh()
}

function hStatus(enabled: boolean) {
  return h(
    NTag,
    { type: enabled ? "success" : "default", size: "small" },
    { default: () => (enabled ? t("common.enabled") : t("common.disabled")) }
  )
}

function hSource(row: ProtectionRule) {
  const status = row.migration_status ?? ""
  const label = status === "legacy-only" ? t("common.legacy") : status === "migrated" ? t("common.migrated") : t("common.native")
  const type = status === "legacy-only" ? "warning" : status === "migrated" ? "info" : "success"
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": t("common.observation"),
    block: t("common.block")
  }
  return labels[value] ?? value
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MiB`
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KiB`
  }
  return `${value} B`
}

</script>

<template>
  <main class="page">
    <ModulePageHeader
      :title="t('modules.upload.title')"
      :subtitle="t('modules.upload.subtitle')"
      :eyebrow="t('moduleCommon.protectionModule')"
      :tags="headerTags"
    >
      <template #actions>
      <NSpace>
        <NButton :loading="resource.loading.value" @click="resource.refresh">{{ t("common.refresh") }}</NButton>
        <NButton type="primary" :disabled="!authStore.canWrite" @click="openCreate">{{ t("common.createRule") }}</NButton>
      </NSpace>
      </template>
    </ModulePageHeader>

    <ModuleStateBlock
      v-if="resource.error.value"
      state="error"
      :title="t('modules.upload.loadingFailed')"
      :description="resource.error.value"
      :action-label="t('common.retry')"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" :empty-description="t('modules.upload.emptyGuidance')" />
    </section>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1360"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        :description="t('modules.upload.emptyRules')"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? t('moduleCommon.editRule', { name: t('modules.upload.title') }) : t('moduleCommon.createRule', { name: t('modules.upload.title') })" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem v-if="!editing" :label="t('common.template')">
            <NSelect :options="templateOptions" :placeholder="t('moduleCommon.chooseTemplate')" @update:value="applyTemplate" />
          </NFormItem>
          <NFormItem :label="t('common.ruleName')">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem :label="t('common.applicationId')">
            <NInputNumber v-model:value="form.application_id" :min="0" />
          </NFormItem>
          <NFormItem :label="t('table.uploadPath')">
            <NInput v-model:value="form.match.path" />
          </NFormItem>
          <NFormItem :label="t('table.pathMatch')">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem :label="t('common.methods')">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" :placeholder="t('common.allMethods')" />
          </NFormItem>
          <NFormItem :label="t('table.dangerousExtensions')">
            <NDynamicTags v-model:value="form.upload!.extensions" />
          </NFormItem>
          <NFormItem :label="t('modules.upload.sizeLimitBytes')">
            <NInputNumber v-model:value="form.upload!.max_bytes" :min="0" :max="1073741824" />
          </NFormItem>
          <NFormItem :label="t('common.action')">
            <NSelect v-model:value="form.action.type" :options="actionOptions" />
          </NFormItem>
          <NFormItem :label="t('common.priority')">
            <NInputNumber v-model:value="form.priority" :min="0" />
          </NFormItem>
          <NFormItem :label="t('common.enabled')">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
          <ModuleRiskGuidance
            v-if="formRiskAlerts.length > 0"
            class="risk-prompt-list"
            :title="t('common.saveBeforeRiskConfirm')"
            :items="formRiskAlerts"
          />
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="formVisible = false">{{ t("common.cancel") }}</NButton>
            <NButton type="primary" :loading="saving" @click="save">{{ t("common.save") }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>

<style scoped>
.view-alert {
  margin-bottom: 16px;
}

.guidance-section {
  margin-bottom: 16px;
}

.guidance-grid,
.risk-prompt-list {
  display: grid;
  gap: 8px;
}

.rule-form {
  display: grid;
  gap: 4px;
}
</style>
