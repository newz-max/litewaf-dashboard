<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createAccessControlRule,
  deleteAccessControlRule,
  getAccessControlRules,
  updateAccessControlRule,
  type ProtectionRule,
  type ProtectionRuleInput
} from "@/api/litewaf"
import ModulePageHeader from "@/components/operations/ModulePageHeader.vue"
import ModuleRiskGuidance from "@/components/operations/ModuleRiskGuidance.vue"
import ModuleStateBlock from "@/components/operations/ModuleStateBlock.vue"
import ModuleStatusSummary from "@/components/operations/ModuleStatusSummary.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"
import { useI18n } from "vue-i18n"
import { protectionGuides, protectionRiskPrompts, riskPromptText } from "@/utils/protectionGuidance"

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const resource = useApiResource(getAccessControlRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const guidanceItems = computed(() => protectionGuides(t, "access-control"))
const formRiskPrompts = computed(() => protectionRiskPrompts(form, t))
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const blockCount = computed(() => items.value.filter((item) => item.action.type === "block").length)
const allowCount = computed(() => items.value.filter((item) => item.action.type === "allow").length)
const headerTags = computed(() => [
  { label: t("common.rules"), value: items.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: t("common.allow"), value: allowCount.value, tone: allowCount.value > 0 ? "warning" as const : "default" as const }
])
const statusItems = computed(() => [
  { label: t("common.totalRules"), value: items.value.length, note: t("modules.access.totalRulesNote"), tone: "info" as const },
  { label: t("common.enabledRules"), value: enabledCount.value, note: t("modules.access.enabledRulesNote"), tone: "success" as const },
  { label: t("modules.access.blockRules"), value: blockCount.value, note: t("modules.access.blockRulesNote"), tone: blockCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: t("modules.access.allowRules"), value: allowCount.value, note: t("modules.access.allowRulesNote"), tone: allowCount.value > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.value.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk, t), tone: "warning" as const })))

const templateOptions = computed(() => [
  { label: t("modules.access.adminPathBlock"), value: "admin" },
  { label: t("modules.access.hostRestriction"), value: "host" }
])

const targetOptions = computed(() => [
  { label: t("modules.access.matchPath"), value: "path" },
  { label: t("common.header"), value: "header" },
  { label: t("common.host"), value: "host" }
])

const pathMatchOptions = computed(() => [
  { label: t("common.exact"), value: "exact" },
  { label: t("common.prefix"), value: "prefix" }
])

const operatorOptions = computed(() => {
  switch (form.match.target) {
    case "header":
      return [
        { label: t("common.exact"), value: "exact" },
        { label: t("common.contains"), value: "contains" }
      ]
    case "host":
      return [
        { label: t("common.exact"), value: "exact" },
        { label: t("common.suffix"), value: "suffix" }
      ]
    default:
      return []
  }
})

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const actionOptions = computed(() => [
  { label: t("common.allow"), value: "allow" },
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" }
])

const columns = computed<DataTableColumns<ProtectionRule>>(() => [
  { title: t("common.name"), key: "name", minWidth: 160 },
  {
    title: t("common.effectiveApplication"),
    key: "application_id",
    width: 92,
    render(row) {
      return row.application_id > 0 ? `#${row.application_id}` : t("common.global")
    }
  },
  {
    title: t("table.target"),
    key: "match.target",
    minWidth: 180,
    render(row) {
      return formatMatch(row)
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
    title: t("common.action"),
    key: "action.type",
    width: 100,
    render(row) {
      return formatAction(row.action.type)
    }
  },
  {
    title: t("common.priority"),
    key: "priority",
    width: 88
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
      return formatTime(row.updated_at)
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

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "access-control",
    category: "access-control",
    application_id: 0,
    enabled: true,
    priority: 100,
    match: {
      target: "path",
      path: "/admin",
      path_match: "prefix",
      methods: [],
      value: "",
      operator: "prefix",
      header_name: "",
      host: ""
    },
    limit: {
      counter: "",
      threshold: 0,
      window_sec: 0,
      ban_duration_sec: 0
    },
    action: {
      type: "block"
    }
  }
}

function assignForm(payload: ProtectionRuleInput) {
  Object.assign(form, {
    ...payload,
    match: { ...payload.match, methods: [...payload.match.methods] },
    limit: { ...payload.limit },
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
      target: item.match.target || "path",
      path: item.match.path || "",
      path_match: item.match.path_match || item.match.operator || "exact",
      methods: [...item.match.methods],
      value: item.match.value || "",
      operator: item.match.operator || item.match.path_match || "exact",
      header_name: item.match.header_name || "",
      host: item.match.host || ""
    },
    limit: item.limit,
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    admin: {
      ...emptyForm(),
      name: t("modules.access.adminPathBlock"),
      match: { target: "path", path: "/admin", path_match: "prefix", operator: "prefix", methods: [] },
      action: { type: "block" }
    },
    host: {
      ...emptyForm(),
      name: t("modules.access.hostRestriction"),
      match: { target: "host", host: "example.com", value: "example.com", operator: "exact", methods: [] },
      action: { type: "block" }
    }
  }
  assignForm(templates[value] ?? emptyForm())
}

function handleTargetChange(value: string) {
  form.match.target = value
  form.match.methods = []
  if (value === "path") {
    form.match.path = form.match.path || "/admin"
    form.match.path_match = "prefix"
    form.match.operator = "prefix"
    return
  }
  if (value === "header") {
    form.match.operator = "contains"
    return
  }
  if (value === "host") {
    form.match.operator = "exact"
    return
  }
  form.match.operator = ""
}

function validateForm() {
  const target = form.match.target
  if (!form.name.trim()) {
    return t("common.ruleNameRequired")
  }
  if (Number(form.priority ?? 0) < 0) {
    return t("common.invalidPriorityZero")
  }
  if (target === "path" && !String(form.match.path || "").startsWith("/")) {
    return t("common.pathMustStartSlash")
  }
  if (target === "ip" || target === "cidr") {
    return t("modules.access.ipCidrIndependent")
  }
  if (target === "header" && (!form.match.header_name?.trim() || !form.match.value?.trim())) {
    return t("modules.access.headerNameValueRequired")
  }
  if (target === "host" && !form.match.host?.trim()) {
    return t("modules.access.hostRequired")
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
  try {
    if (editing.value) {
      await updateAccessControlRule(editing.value.id, form)
      message.success(t("common.updated", { name: t("modules.access.title") }))
    } else {
      await createAccessControlRule(form)
      message.success(t("common.created", { name: t("modules.access.title") }))
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

function confirmRiskIfNeeded() {
  const risks = formRiskPrompts.value
  if (risks.length === 0) {
    return Promise.resolve(true)
  }
  return new Promise<boolean>((resolve) => {
    dialog.warning({
      title: t("common.highRiskConfirm", { name: t("modules.access.title") }),
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
  await deleteAccessControlRule(item.id)
  message.success(t("common.deleted", { name: t("modules.access.title") }))
  await resource.refresh()
}

function hStatus(enabled: boolean) {
  return h(
    NTag,
    { type: enabled ? "success" : "default", size: "small" },
    { default: () => (enabled ? t("common.enabled") : t("common.disabled")) }
  )
}

function formatMatch(row: ProtectionRule) {
  const target = row.match.target
  if (target === "path") {
    return t("modules.access.pathSummary", { mode: row.match.path_match === "prefix" ? t("common.prefix") : t("common.exact"), path: row.match.path })
  }
  if (target === "header") {
    return t("modules.access.headerSummary", { name: row.match.header_name, operator: row.match.operator === "contains" ? t("common.contains") : t("common.equals"), value: row.match.value })
  }
  if (target === "host") {
    return t("modules.access.hostSummary", { operator: row.match.operator === "suffix" ? t("common.suffix") : t("common.equals"), host: row.match.host || row.match.value })
  }
  return t("modules.access.unsupportedTarget")
}

function hSource(row: ProtectionRule) {
  const status = row.migration_status ?? ""
  const label = status === "legacy-only" ? t("common.legacy") : status === "migrated" ? t("common.migrated") : t("common.native")
  const type = status === "legacy-only" ? "warning" : status === "migrated" ? "info" : "success"
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    allow: t("common.allow"),
    "log-only": t("common.observation"),
    block: t("common.block")
  }
  return labels[value] ?? value
}

function formatTime(value?: string) {
  if (!value) {
    return "-"
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <main class="page">
    <ModulePageHeader
      :title="t('modules.access.title')"
      :subtitle="t('modules.access.subtitle')"
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
      :title="t('modules.access.loadingFailed')"
      :description="resource.error.value"
      :action-label="t('common.retry')"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" :empty-description="t('modules.access.emptyGuidance')" />
    </section>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1140"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        :description="t('modules.access.emptyRules')"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? t('moduleCommon.editRule', { name: t('modules.access.title') }) : t('moduleCommon.createRule', { name: t('modules.access.title') })" closable>
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
          <NFormItem :label="t('table.target')">
            <NSelect :value="form.match.target" :options="targetOptions" @update:value="handleTargetChange" />
          </NFormItem>
          <template v-if="form.match.target === 'path'">
            <NFormItem :label="t('common.path')">
              <NInput v-model:value="form.match.path" />
            </NFormItem>
            <NFormItem :label="t('table.pathMatch')">
              <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
            </NFormItem>
            <NFormItem :label="t('common.methods')">
              <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" :placeholder="t('common.allMethods')" />
            </NFormItem>
          </template>
          <template v-else-if="form.match.target === 'header'">
            <NFormItem :label="t('modules.access.headerName')">
              <NInput v-model:value="form.match.header_name" />
            </NFormItem>
            <NFormItem :label="t('table.pathMatch')">
              <NSelect v-model:value="form.match.operator" :options="operatorOptions" />
            </NFormItem>
            <NFormItem :label="t('modules.access.headerValue')">
              <NInput v-model:value="form.match.value" />
            </NFormItem>
          </template>
          <template v-else-if="form.match.target === 'host'">
            <NFormItem :label="t('table.pathMatch')">
              <NSelect v-model:value="form.match.operator" :options="operatorOptions" />
            </NFormItem>
            <NFormItem :label="t('common.host')">
              <NInput v-model:value="form.match.host" />
            </NFormItem>
          </template>
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
