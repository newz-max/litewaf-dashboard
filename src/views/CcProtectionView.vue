<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createCCProtectionRule,
  deleteCCProtectionRule,
  getCCProtectionRules,
  previewCCProtection,
  updateCCProtectionRule,
  type CCProtectionPreviewMatch,
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
const resource = useApiResource(getCCProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const previewing = shallowRef(false)
const previewResult = shallowRef<CCProtectionPreviewMatch[] | null>(null)
const guidanceItems = computed(() => protectionGuides(t, "cc-protection"))
const formRiskPrompts = computed(() => protectionRiskPrompts(form, t))
const previewForm = reactive({
  application_id: 0,
  path: "/api/v1/login",
  method: "GET",
  client_ip: "198.51.100.10",
  session_id: "",
  device_id: "",
  status: 0,
  attack_matched: false,
  include_disabled: false
})

const templateOptions = computed(() => [
  { label: t("modules.cc.loginBruteforce"), value: "login" },
  { label: t("modules.cc.apiRateLimit"), value: "api" },
  { label: t("modules.cc.siteCcProtection"), value: "site" },
  { label: t("modules.cc.notFoundScanRate"), value: "glob404" },
  { label: t("modules.cc.sessionLimit"), value: "session" }
])

const pathMatchOptions = computed(() => [
  { label: t("common.exact"), value: "exact" },
  { label: t("common.prefix"), value: "prefix" },
  { label: "Glob", value: "glob" }
])

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const counterOptions = computed(() => [
  { label: t("common.clientIp"), value: "client_ip" },
  { label: t("modules.cc.clientIpPath"), value: "client_ip_path" },
  { label: t("common.global"), value: "global" },
  { label: t("modules.cc.notFoundFrequency"), value: "not_found_frequency" },
  { label: t("modules.cc.attackFrequency"), value: "attack_frequency" },
  { label: t("modules.cc.session"), value: "session" },
  { label: t("modules.cc.device"), value: "device" }
])

const sessionSourceOptions = [
  { label: "Cookie", value: "cookie" },
  { label: "Header", value: "header" }
]

const deviceStrategyOptions = computed(() => [
  { label: t("modules.cc.coarseSignal"), value: "coarse" }
])

const actionOptions = computed(() => [
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" },
  { label: t("modules.cc.rateLimit"), value: "rate-limit" },
  { label: t("modules.cc.temporaryBan"), value: "ban" }
])

type CCRiskRule = {
  readonly name: string
  readonly enabled: boolean
  readonly action: { readonly type: string }
  readonly limit: { readonly threshold: number; readonly window_sec: number }
  readonly match: { readonly path?: string; readonly path_match?: string }
}

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
    title: t("common.path"),
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
      return formatPathMatch(row.match.path_match ?? "exact")
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
    title: t("table.counter"),
    key: "limit.counter",
    width: 120,
    render(row) {
      return formatCounter(row.limit.counter)
    }
  },
  {
    title: t("table.thresholdWindow"),
    key: "limit.threshold",
    minWidth: 120,
    render(row) {
      return t("common.timesPerSeconds", { times: row.limit.threshold, seconds: row.limit.window_sec })
    }
  },
  {
    title: t("common.action"),
    key: "action.type",
    width: 108,
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

const previewColumns = computed<DataTableColumns<CCProtectionPreviewMatch>>(() => [
  { title: t("common.rule"), key: "rule_name", minWidth: 160 },
  {
    title: t("table.counter"),
    key: "counter",
    width: 128,
    render(row) {
      return formatCounter(row.counter)
    }
  },
  {
    title: t("table.thresholdWindow"),
    key: "threshold",
    width: 120,
    render(row) {
      return `${row.threshold} / ${row.window_sec}s`
    }
  },
  {
    title: t("common.action"),
    key: "action",
    width: 92,
    render(row) {
      return formatAction(row.action)
    }
  },
  {
    title: t("table.previewStatus"),
    key: "partial",
    width: 108,
    render(row) {
      return h(
        NTag,
        { size: "small", type: row.partial ? "warning" : "success" },
        { default: () => (row.partial ? t("moduleCommon.partial") : t("moduleCommon.complete")) }
      )
    }
  },
  { title: t("table.counterKey"), key: "counter_key", minWidth: 220 }
])

const activeRiskWarnings = computed(() => {
  const warnings: string[] = []
  for (const item of items.value) {
    warnings.push(...ruleWarnings(item))
  }
  return warnings
})

const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const blockingCount = computed(() => items.value.filter((item) => ["block", "ban", "rate-limit"].includes(item.action.type)).length)
const headerTags = computed(() => [
  { label: t("common.rules"), value: items.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: t("modules.cc.risk"), value: activeRiskWarnings.value.length, tone: activeRiskWarnings.value.length > 0 ? "warning" as const : "default" as const }
])
const statusItems = computed(() => [
  { label: t("common.totalRules"), value: items.value.length, note: t("modules.cc.totalRulesNote"), tone: "info" as const },
  { label: t("common.enabledRules"), value: enabledCount.value, note: t("modules.cc.enabledRulesNote"), tone: "success" as const },
  { label: t("modules.cc.blockingRateLimit"), value: blockingCount.value, note: t("modules.cc.blockingRateLimitNote"), tone: blockingCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: t("modules.cc.highRiskHints"), value: activeRiskWarnings.value.length, note: t("modules.cc.highRiskHintsNote"), tone: activeRiskWarnings.value.length > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.value.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const activeRiskAlerts = computed(() => activeRiskWarnings.value.map((warning) => ({ title: warning, tone: "warning" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk, t), tone: "warning" as const })))

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "cc-protection",
    category: "rate-limit",
    application_id: 0,
    enabled: true,
    priority: 100,
    match: {
      path: "/",
      path_match: "prefix",
      methods: []
    },
    limit: {
      counter: "client_ip",
      threshold: 300,
      window_sec: 60,
      ban_duration_sec: 300,
      session_source: "",
      session_name: "",
      device_strategy: ""
    },
    action: {
      type: "rate-limit"
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
    match: item.match,
    limit: item.limit,
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    login: {
      ...emptyForm(),
      name: t("modules.cc.loginBruteforce"),
      match: { path: "/api/login", path_match: "exact", methods: ["POST"] },
      limit: { counter: "client_ip", threshold: 10, window_sec: 60, ban_duration_sec: 600 },
      action: { type: "ban" }
    },
    api: {
      ...emptyForm(),
      name: t("modules.cc.apiRateLimit"),
      match: { path: "/api/", path_match: "prefix", methods: [] },
      limit: { counter: "client_ip_path", threshold: 120, window_sec: 60, ban_duration_sec: 60 },
      action: { type: "rate-limit" }
    },
    site: {
      ...emptyForm(),
      name: t("modules.cc.siteCcProtection"),
      match: { path: "/", path_match: "prefix", methods: [] },
      limit: { counter: "client_ip", threshold: 300, window_sec: 60, ban_duration_sec: 300 },
      action: { type: "rate-limit" }
    },
    glob404: {
      ...emptyForm(),
      name: t("modules.cc.notFoundScanRate"),
      match: { path: "/api/*", path_match: "glob", methods: [] },
      limit: { counter: "not_found_frequency", threshold: 20, window_sec: 60, ban_duration_sec: 300 },
      action: { type: "rate-limit" }
    },
    session: {
      ...emptyForm(),
      name: t("modules.cc.sessionLimit"),
      match: { path: "/api/login", path_match: "exact", methods: ["POST"] },
      limit: { counter: "session", session_source: "cookie", session_name: "sid", threshold: 8, window_sec: 60, ban_duration_sec: 300 },
      action: { type: "block" }
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
  if (form.match.path_match === "glob" && String(form.match.path || "").includes("**")) {
    return t("modules.cc.globPathInvalid")
  }
  if (form.limit.counter === "session" && !form.limit.session_name?.trim()) {
    return t("modules.cc.sessionNameRequired")
  }
  if (form.limit.threshold <= 0 || form.limit.window_sec <= 0) {
    return t("modules.cc.thresholdWindowInvalid")
  }
  if (form.limit.ban_duration_sec < 0) {
    return t("modules.cc.banDurationInvalid")
  }
  return ""
}

async function runPreview() {
  if (!previewForm.path.startsWith("/")) {
    message.error(t("modules.cc.previewPathInvalid"))
    return
  }
  previewing.value = true
  try {
    const result = await previewCCProtection({
      application_id: previewForm.application_id,
      path: previewForm.path,
      method: previewForm.method,
      client_ip: previewForm.client_ip,
      session_id: previewForm.session_id,
      device_id: previewForm.device_id,
      status: previewForm.status || undefined,
      attack_matched: previewForm.attack_matched,
      include_disabled: previewForm.include_disabled
    })
    previewResult.value = result.matches
  } finally {
    previewing.value = false
  }
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
      await updateCCProtectionRule(editing.value.id, form)
      message.success(t("common.updated", { name: t("modules.cc.title") }))
    } else {
      await createCCProtectionRule(form)
      message.success(t("common.created", { name: t("modules.cc.title") }))
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
      title: t("common.highRiskConfirm", { name: t("modules.cc.title") }),
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
  await deleteCCProtectionRule(item.id)
  message.success(t("common.deleted", { name: t("modules.cc.title") }))
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

function formatPathMatch(value: string) {
  const labels: Record<string, string> = {
    exact: t("common.exact"),
    prefix: t("common.prefix"),
    glob: "Glob"
  }
  return labels[value] ?? value
}

function formatCounter(value: string) {
  const labels: Record<string, string> = {
    client_ip: t("common.clientIp"),
    client_ip_path: t("modules.cc.clientIpPath"),
    global: t("common.global"),
    not_found_frequency: t("modules.cc.notFoundFrequency"),
    attack_frequency: t("modules.cc.attackFrequency"),
    session: t("modules.cc.session"),
    device: t("modules.cc.device")
  }
  return labels[value] ?? value
}

function ruleWarnings(item: CCRiskRule) {
  if (!item.enabled) {
    return []
  }
  const warnings: string[] = []
  const blocking = ["block", "ban", "rate-limit"].includes(item.action.type)
  const lowThreshold = item.limit.threshold > 0 && item.limit.threshold < 60 && item.limit.window_sec <= 60
  if (blocking && lowThreshold && item.match.path === "/" && ["prefix", "glob"].includes(item.match.path_match ?? "exact")) {
    warnings.push(t("modules.cc.lowThresholdRisk", { name: item.name }))
  }
  if (blocking && lowThreshold && item.match.path_match === "glob" && String(item.match.path).startsWith("/*")) {
    warnings.push(t("modules.cc.broadGlobRisk", { name: item.name }))
  }
  return warnings
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": t("common.observation"),
    block: t("common.block"),
    "rate-limit": t("modules.cc.rateLimit"),
    ban: t("modules.cc.temporaryBan")
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
      :title="t('modules.cc.title')"
      :subtitle="t('modules.cc.subtitle')"
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
      :title="t('modules.cc.loadingFailed')"
      :description="resource.error.value"
      :action-label="t('common.retry')"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section v-if="activeRiskAlerts.length" class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('moduleCommon.currentConfigRisk')" :items="activeRiskAlerts" />
    </section>

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" :empty-description="t('modules.cc.emptyGuidance')" />
    </section>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1390"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        :description="t('modules.cc.emptyRules')"
      />
    </section>

    <section class="section section-pad preview-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">{{ t("moduleCommon.simulatePreview") }}</h2>
        </div>
        <NButton :loading="previewing" @click="runPreview">{{ t("moduleCommon.runPreview") }}</NButton>
      </div>
      <NForm class="preview-form" label-placement="top">
        <NFormItem :label="t('common.applicationId')">
          <NInputNumber v-model:value="previewForm.application_id" :min="0" />
        </NFormItem>
        <NFormItem :label="t('common.path')">
          <NInput v-model:value="previewForm.path" />
        </NFormItem>
        <NFormItem :label="t('common.methods')">
          <NSelect v-model:value="previewForm.method" :options="methodOptions" />
        </NFormItem>
        <NFormItem :label="t('common.clientIp')">
          <NInput v-model:value="previewForm.client_ip" />
        </NFormItem>
        <NFormItem :label="t('modules.cc.sessionSample')">
          <NInput v-model:value="previewForm.session_id" />
        </NFormItem>
        <NFormItem :label="t('modules.cc.deviceSample')">
          <NInput v-model:value="previewForm.device_id" />
        </NFormItem>
        <NFormItem :label="t('modules.cc.responseStatus')">
          <NInputNumber v-model:value="previewForm.status" :min="0" />
        </NFormItem>
        <NFormItem :label="t('modules.cc.attackMatched')">
          <NSwitch v-model:value="previewForm.attack_matched" />
        </NFormItem>
      </NForm>
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        v-if="previewResult && previewResult.length > 0"
        :columns="previewColumns"
        :data="previewResult"
        :bordered="false"
        :scroll-x="820"
      />
      <NEmpty v-else-if="previewResult" :description="t('moduleCommon.noMatchedCcRules')" />
      <div v-if="previewResult?.some((item) => item.partial)" class="preview-warnings">
        <NAlert
          v-for="item in previewResult.filter((row) => row.partial)"
          :key="`${item.rule_id}-${item.counter}`"
          type="warning"
        >
          {{ t("modules.cc.previewPartial", { rule: item.rule_name, counter: formatCounter(item.counter) }) }}
        </NAlert>
      </div>
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="formVisible" :width="520">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? t('moduleCommon.editRule', { name: t('modules.cc.title') }) : t('moduleCommon.createRule', { name: t('modules.cc.title') })" closable>
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
          <NFormItem :label="t('common.path')">
            <NInput v-model:value="form.match.path" />
          </NFormItem>
          <NFormItem :label="t('table.pathMatch')">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem :label="t('common.methods')">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" :placeholder="t('common.allMethods')" />
          </NFormItem>
          <NFormItem :label="t('table.counter')">
            <NSelect v-model:value="form.limit.counter" :options="counterOptions" />
          </NFormItem>
          <NFormItem v-if="form.limit.counter === 'session'" :label="t('modules.cc.sessionSource')">
            <NSelect v-model:value="form.limit.session_source" :options="sessionSourceOptions" />
          </NFormItem>
          <NFormItem v-if="form.limit.counter === 'session'" :label="t('common.cookieHeaderName')">
            <NInput v-model:value="form.limit.session_name" />
          </NFormItem>
          <NFormItem v-if="form.limit.counter === 'device'" :label="t('modules.cc.deviceStrategy')">
            <NSelect v-model:value="form.limit.device_strategy" :options="deviceStrategyOptions" />
          </NFormItem>
          <NFormItem :label="t('modules.cc.frequencyThreshold')">
            <NInputNumber v-model:value="form.limit.threshold" :min="1" />
          </NFormItem>
          <NFormItem :label="t('modules.cc.windowSeconds')">
            <NInputNumber v-model:value="form.limit.window_sec" :min="1" />
          </NFormItem>
          <NFormItem :label="t('common.action')">
            <NSelect v-model:value="form.action.type" :options="actionOptions" />
          </NFormItem>
          <NFormItem :label="t('modules.cc.banMitigationSeconds')">
            <NInputNumber v-model:value="form.limit.ban_duration_sec" :min="0" />
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

.preview-section {
  margin-top: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.preview-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px 12px;
  margin-bottom: 12px;
}

.preview-warnings {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
</style>
