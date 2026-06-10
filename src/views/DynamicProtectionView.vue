<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createDynamicProtectionRule,
  deleteDynamicProtectionRule,
  getDynamicProtectionRules,
  updateDynamicProtectionRule,
  type ProtectionRule,
  type ProtectionRuleDynamic,
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
const resource = useApiResource(getDynamicProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const guidanceItems = computed(() => protectionGuides(t, "dynamic-protection"))
const formRiskPrompts = computed(() => protectionRiskPrompts(form, t))
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const tokenCount = computed(() => items.value.filter((item) => item.category === "dynamic-token").length)
const waitingRoomCount = computed(() => items.value.filter((item) => item.category === "waiting-room").length)
const headerTags = computed(() => [
  { label: t("common.rules"), value: items.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: t("modules.dynamic.waitingRoom"), value: waitingRoomCount.value, tone: "warning" as const }
])
const statusItems = computed(() => [
  { label: t("common.totalRules"), value: items.value.length, note: t("modules.dynamic.totalRulesNote"), tone: "info" as const },
  { label: t("common.enabledRules"), value: enabledCount.value, note: t("modules.dynamic.enabledRulesNote"), tone: "success" as const },
  { label: t("modules.dynamic.dynamicToken"), value: tokenCount.value, note: t("modules.dynamic.dynamicTokenNote"), tone: tokenCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: t("modules.dynamic.waitingRoom"), value: waitingRoomCount.value, note: t("modules.dynamic.waitingRoomNote"), tone: waitingRoomCount.value > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.value.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk, t), tone: "warning" as const })))

const templateOptions = computed(() => [
  { label: t("modules.dynamic.adminDynamicToken"), value: "admin-token" },
  { label: t("modules.dynamic.htmlTokenInjection"), value: "html-mutation" },
  { label: t("modules.dynamic.siteWaitingRoom"), value: "waiting-room" },
  { label: t("modules.dynamic.observeDynamicProtection"), value: "observe" }
])

const categoryOptions = computed(() => [
  { label: t("modules.dynamic.dynamicToken"), value: "dynamic-token" },
  { label: t("modules.dynamic.pageMutation"), value: "page-mutation" },
  { label: t("modules.dynamic.waitingRoom"), value: "waiting-room" }
])

const pathMatchOptions = computed(() => [
  { label: t("common.exact"), value: "exact" },
  { label: t("common.prefix"), value: "prefix" }
])

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const tokenPlacementOptions = [
  { label: "Cookie", value: "cookie" },
  { label: "Header", value: "header" },
  { label: "Query", value: "query" }
]

const failureActionOptions = computed(() => [
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" }
])

const mutationMarkerOptions = computed(() => [
  { label: t("modules.dynamic.headEnd"), value: "head-end" },
  { label: t("modules.dynamic.bodyEnd"), value: "body-end" }
])

const overflowActionOptions = computed(() => [
  { label: t("modules.dynamic.enterWaitingRoom"), value: "waiting-room" },
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" }
])

function defaultDynamic(): ProtectionRuleDynamic {
  return {
    mode: "dynamic-token",
    token_ttl_sec: 300,
    token_placement: "cookie",
    failure_action: "block",
    mutation_marker: "body-end",
    mutation_max_bytes: 262144,
    queue_capacity: 100,
    admission_ttl_sec: 300,
    retry_interval_sec: 5,
    overflow_action: "waiting-room"
  }
}

const columns = computed<DataTableColumns<ProtectionRule>>(() => [
  { title: t("common.name"), key: "name", minWidth: 170 },
  {
    title: t("table.type"),
    key: "category",
    width: 112,
    render(row) {
      return formatCategory(row.category)
    }
  },
  {
    title: t("common.effectiveApplication"),
    key: "application_id",
    width: 92,
    render(row) {
      return row.application_id > 0 ? `#${row.application_id}` : t("common.global")
    }
  },
  {
    title: t("common.path"),
    key: "match.path",
    minWidth: 150,
    render(row) {
      return row.match.path
    }
  },
  {
    title: t("common.methods"),
    key: "match.methods",
    minWidth: 118,
    render(row) {
      return row.match.methods.length > 0 ? row.match.methods.join(", ") : t("common.all")
    }
  },
  {
    title: t("table.keyConfig"),
    key: "dynamic",
    minWidth: 210,
    render(row) {
      return formatDynamic(row)
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
              { size: "small", type: "error", disabled: !authStore.canWrite, onClick: () => remove(row) },
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
    module: "dynamic-protection",
    category: "dynamic-token",
    application_id: 0,
    enabled: true,
    priority: 100,
    match: {
      path: "/admin",
      path_match: "prefix",
      methods: []
    },
    limit: {
      counter: "",
      threshold: 0,
      window_sec: 0,
      ban_duration_sec: 0
    },
    dynamic: defaultDynamic(),
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
    dynamic: { ...defaultDynamic(), ...(payload.dynamic ?? {}) },
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
      path: item.match.path || "/",
      path_match: item.match.path_match || "prefix",
      methods: [...item.match.methods]
    },
    limit: item.limit,
    dynamic: { ...defaultDynamic(), ...(item.dynamic ?? {}), mode: item.category },
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const base = emptyForm()
  const templates: Record<string, ProtectionRuleInput> = {
    "admin-token": {
      ...base,
      name: t("modules.dynamic.adminDynamicToken"),
      category: "dynamic-token",
      match: { path: "/admin", path_match: "prefix", methods: [] },
      dynamic: { ...base.dynamic!, mode: "dynamic-token", token_ttl_sec: 600, token_placement: "cookie", failure_action: "block" },
      action: { type: "block" }
    },
    "html-mutation": {
      ...base,
      name: t("modules.dynamic.htmlTokenInjection"),
      category: "page-mutation",
      match: { path: "/", path_match: "prefix", methods: ["GET"] },
      dynamic: { ...base.dynamic!, mode: "page-mutation", mutation_marker: "body-end", mutation_max_bytes: 262144 },
      action: { type: "log-only" }
    },
    "waiting-room": {
      ...base,
      name: t("modules.dynamic.siteWaitingRoom"),
      category: "waiting-room",
      match: { path: "/", path_match: "prefix", methods: [] },
      dynamic: { ...base.dynamic!, mode: "waiting-room", queue_capacity: 100, admission_ttl_sec: 300, retry_interval_sec: 5, overflow_action: "waiting-room" },
      action: { type: "waiting-room" }
    },
    observe: {
      ...base,
      name: t("modules.dynamic.observeDynamicProtection"),
      category: "dynamic-token",
      match: { path: "/", path_match: "prefix", methods: [] },
      dynamic: { ...base.dynamic!, mode: "dynamic-token", token_ttl_sec: 300, token_placement: "cookie", failure_action: "log-only" },
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
    return t("common.pathMustStartSlash")
  }
  if (Number(form.priority ?? 0) < 0) {
    return t("common.invalidPriorityZero")
  }
  const dynamic = form.dynamic
  if (!dynamic) {
    return t("modules.dynamic.dynamicConfigRequired")
  }
  if (form.category === "dynamic-token" && (Number(dynamic.token_ttl_sec) <= 0 || Number(dynamic.token_ttl_sec) > 86400)) {
    return t("modules.dynamic.tokenTtlInvalid")
  }
  if (form.category === "page-mutation" && (Number(dynamic.mutation_max_bytes) <= 0 || Number(dynamic.mutation_max_bytes) > 1048576)) {
    return t("modules.dynamic.pageMutationSizeInvalid")
  }
  if (form.category === "waiting-room" && (Number(dynamic.queue_capacity) <= 0 || Number(dynamic.admission_ttl_sec) <= 0 || Number(dynamic.retry_interval_sec) <= 0)) {
    return t("modules.dynamic.waitingRoomConfigInvalid")
  }
  return ""
}

function syncCategoryAction() {
  if (!form.dynamic) {
    return
  }
  form.dynamic.mode = form.category || "dynamic-token"
  if (form.category === "waiting-room") {
    form.action.type = form.dynamic.overflow_action || "waiting-room"
  } else if (form.category === "page-mutation") {
    form.action.type = "log-only"
  } else {
    form.action.type = form.dynamic.failure_action || "block"
  }
}

async function save() {
  syncCategoryAction()
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
      await updateDynamicProtectionRule(editing.value.id, form)
      message.success(t("common.updated", { name: t("modules.dynamic.title") }))
    } else {
      await createDynamicProtectionRule(form)
      message.success(t("common.created", { name: t("modules.dynamic.title") }))
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
      title: t("common.highRiskConfirm", { name: t("modules.dynamic.title") }),
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
  await deleteDynamicProtectionRule(item.id)
  message.success(t("common.deleted", { name: t("modules.dynamic.title") }))
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

function formatCategory(value: string) {
  const labels: Record<string, string> = {
    "dynamic-token": t("modules.dynamic.dynamicToken"),
    "page-mutation": t("modules.dynamic.pageMutation"),
    "waiting-room": t("modules.dynamic.waitingRoom")
  }
  return labels[value] ?? value
}

function formatDynamic(row: ProtectionRule) {
  const dynamic = row.dynamic
  if (!dynamic) {
    return "-"
  }
  if (row.category === "page-mutation") {
    return `${formatMarker(dynamic.mutation_marker)} / ${dynamic.mutation_max_bytes}B`
  }
  if (row.category === "waiting-room") {
    return t("modules.dynamic.waitingRoomSummary", { capacity: dynamic.queue_capacity, ttl: dynamic.admission_ttl_sec, retry: dynamic.retry_interval_sec })
  }
  return `${formatPlacement(dynamic.token_placement)} / TTL ${dynamic.token_ttl_sec}s`
}

function formatPlacement(value: string) {
  const labels: Record<string, string> = {
    cookie: "Cookie",
    header: "Header",
    query: "Query"
  }
  return labels[value] ?? value
}

function formatMarker(value: string) {
  return value === "head-end" ? t("modules.dynamic.headEnd") : t("modules.dynamic.bodyEnd")
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": t("common.observation"),
    block: t("common.block"),
    allow: t("common.allow"),
    "waiting-room": t("modules.dynamic.waitingRoom")
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
      :title="t('modules.dynamic.title')"
      :subtitle="t('modules.dynamic.subtitle')"
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
      :title="t('modules.dynamic.loadingFailed')"
      :description="resource.error.value"
      :action-label="t('common.retry')"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" :empty-description="t('modules.dynamic.emptyGuidance')" />
    </section>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1440"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        :description="t('modules.dynamic.emptyRules')"
      />
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="formVisible" :width="560">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? t('moduleCommon.editRule', { name: t('modules.dynamic.title') }) : t('moduleCommon.createRule', { name: t('modules.dynamic.title') })" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem v-if="!editing" :label="t('common.template')">
            <NSelect :options="templateOptions" :placeholder="t('moduleCommon.chooseTemplate')" @update:value="applyTemplate" />
          </NFormItem>
          <NFormItem :label="t('common.ruleName')">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem :label="t('table.type')">
            <NSelect v-model:value="form.category" :options="categoryOptions" @update:value="syncCategoryAction" />
          </NFormItem>
          <NFormItem :label="t('common.applicationId')">
            <NInputNumber v-model:value="form.application_id" :min="0" />
          </NFormItem>
          <NFormItem :label="t('common.path')">
            <NInput v-model:value="form.match.path" />
          </NFormItem>
          <NFormItem :label="t('table.pathMatch')">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem :label="t('common.methods')">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" :placeholder="t('common.allMethods')" />
          </NFormItem>

          <template v-if="form.category === 'dynamic-token'">
            <NFormItem :label="t('modules.dynamic.tokenLocation')">
              <NSelect v-model:value="form.dynamic!.token_placement" :options="tokenPlacementOptions" />
            </NFormItem>
            <NFormItem :label="t('modules.dynamic.tokenTtlSeconds')">
              <NInputNumber v-model:value="form.dynamic!.token_ttl_sec" :min="1" :max="86400" />
            </NFormItem>
            <NFormItem :label="t('table.failureAction')">
              <NSelect
                v-model:value="form.dynamic!.failure_action"
                :options="failureActionOptions"
                @update:value="syncCategoryAction"
              />
            </NFormItem>
          </template>

          <template v-if="form.category === 'page-mutation'">
            <NFormItem :label="t('modules.dynamic.injectionPosition')">
              <NSelect v-model:value="form.dynamic!.mutation_marker" :options="mutationMarkerOptions" />
            </NFormItem>
            <NFormItem :label="t('modules.dynamic.responseSizeLimitBytes')">
              <NInputNumber v-model:value="form.dynamic!.mutation_max_bytes" :min="1" :max="1048576" />
            </NFormItem>
          </template>

          <template v-if="form.category === 'waiting-room'">
            <NFormItem :label="t('modules.dynamic.queueCapacity')">
              <NInputNumber v-model:value="form.dynamic!.queue_capacity" :min="1" :max="100000" />
            </NFormItem>
            <NFormItem :label="t('modules.dynamic.admissionTtlSeconds')">
              <NInputNumber v-model:value="form.dynamic!.admission_ttl_sec" :min="1" :max="86400" />
            </NFormItem>
            <NFormItem :label="t('modules.dynamic.retryIntervalSeconds')">
              <NInputNumber v-model:value="form.dynamic!.retry_interval_sec" :min="1" :max="86400" />
            </NFormItem>
            <NFormItem :label="t('modules.dynamic.overflowAction')">
              <NSelect
                v-model:value="form.dynamic!.overflow_action"
                :options="overflowActionOptions"
                @update:value="syncCategoryAction"
              />
            </NFormItem>
          </template>

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
