<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createBotProtectionRule,
  deleteBotProtectionRule,
  getBotProtectionRules,
  updateBotProtectionRule,
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
import { formatDateTime } from "@/utils/dateTime"
import { formatPathMatch, pathMatchOptions as createPathMatchOptions, validateGlobPath } from "@/utils/pathMatch"
import { protectionGuides, protectionRiskPrompts, riskPromptText } from "@/utils/protectionGuidance"

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const resource = useApiResource(getBotProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const guidanceItems = computed(() => protectionGuides(t, "bot-protection"))
const formRiskPrompts = computed(() => protectionRiskPrompts(form, t))
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const captchaCount = computed(() => items.value.filter((item) => item.challenge?.mode === "captcha").length)
const behaviorCount = computed(() => items.value.filter((item) => item.challenge?.behavior_enabled).length)
const headerTags = computed(() => [
  { label: t("common.rules"), value: items.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: "Captcha", value: captchaCount.value, tone: "warning" as const }
])
const statusItems = computed(() => [
  { label: t("common.totalRules"), value: items.value.length, note: t("modules.bot.totalRulesNote"), tone: "info" as const },
  { label: t("common.enabledRules"), value: enabledCount.value, note: t("modules.bot.enabledRulesNote"), tone: "success" as const },
  { label: t("modules.bot.localCaptcha"), value: captchaCount.value, note: t("modules.bot.localCaptchaNote"), tone: captchaCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: t("modules.bot.behaviorScore"), value: behaviorCount.value, note: t("modules.bot.behaviorScoreNote"), tone: behaviorCount.value > 0 ? "warning" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.value.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk, t), tone: "warning" as const })))

const templateOptions = computed(() => [
  { label: t("modules.bot.adminPathChallenge"), value: "admin" },
  { label: t("modules.bot.loginPathChallenge"), value: "login" },
  { label: t("modules.bot.localCaptcha"), value: "captcha" },
  { label: t("modules.bot.searchEngineBypass"), value: "crawler" },
  { label: t("modules.bot.observeBotBehavior"), value: "observe" }
])

const pathMatchOptions = computed(() => createPathMatchOptions(t))

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const failureActionOptions = computed(() => [
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" }
])

const challengeModeOptions = [
  { label: "JS Challenge", value: "js-challenge" },
  { label: t("modules.bot.localCaptcha"), value: "captcha" }
]

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
    title: t("table.challengeMode"),
    key: "challenge.mode",
    width: 126,
    render(row) {
      return formatChallengeMode(row.challenge?.mode)
    }
  },
  {
    title: t("table.enhancements"),
    key: "challenge.enhancements",
    minWidth: 210,
    render(row) {
      return formatEnhancements(row.challenge)
    }
  },
  {
    title: t("table.ttl"),
    key: "challenge.verify_ttl_sec",
    width: 104,
    render(row) {
      return `${row.challenge?.verify_ttl_sec ?? 0}s`
    }
  },
  {
    title: t("table.failureAction"),
    key: "challenge.failure_action",
    width: 96,
    render(row) {
      return formatAction(row.challenge?.failure_action ?? row.action.type)
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

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "bot-protection",
    category: "challenge",
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
    challenge: {
      mode: "js-challenge",
      verify_ttl_sec: 300,
      failure_action: "block",
      behavior_enabled: false,
      behavior_threshold: 60,
      device_binding: false,
      search_engine_bypass: false,
      failure_message: "",
      privacy_notice: ""
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
    challenge: { ...(payload.challenge ?? emptyForm().challenge) },
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
      path: item.match.path || "/admin",
      path_match: item.match.path_match || "prefix",
      methods: [...item.match.methods]
    },
    limit: item.limit,
    challenge: {
      mode: item.challenge?.mode ?? "js-challenge",
      verify_ttl_sec: item.challenge?.verify_ttl_sec ?? 300,
      failure_action: item.challenge?.failure_action ?? item.action.type,
      behavior_enabled: item.challenge?.behavior_enabled ?? false,
      behavior_threshold: item.challenge?.behavior_threshold ?? 60,
      device_binding: item.challenge?.device_binding ?? false,
      search_engine_bypass: item.challenge?.search_engine_bypass ?? false,
      failure_message: item.challenge?.failure_message ?? "",
      privacy_notice: item.challenge?.privacy_notice ?? ""
    },
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    admin: {
      ...emptyForm(),
      name: t("modules.bot.adminPathJsChallenge"),
      match: { path: "/admin", path_match: "prefix", methods: [] },
      challenge: { ...emptyForm().challenge!, mode: "js-challenge", verify_ttl_sec: 600, failure_action: "block" },
      action: { type: "block" }
    },
    login: {
      ...emptyForm(),
      name: t("modules.bot.loginPathJsChallenge"),
      match: { path: "/login", path_match: "exact", methods: ["GET", "POST"] },
      challenge: { ...emptyForm().challenge!, mode: "js-challenge", verify_ttl_sec: 300, failure_action: "block" },
      action: { type: "block" }
    },
    captcha: {
      ...emptyForm(),
      name: t("modules.bot.sensitivePathCaptcha"),
      match: { path: "/checkout", path_match: "prefix", methods: ["GET", "POST"] },
      challenge: {
        ...emptyForm().challenge!,
        mode: "captcha",
        verify_ttl_sec: 300,
        failure_action: "block",
        behavior_enabled: true,
        behavior_threshold: 60,
        device_binding: true,
        failure_message: t("modules.bot.captchaFailureMessage"),
        privacy_notice: t("modules.bot.captchaPrivacyNotice")
      },
      action: { type: "block" }
    },
    crawler: {
      ...emptyForm(),
      name: t("modules.bot.searchEngineBypass"),
      match: { path: "/", path_match: "prefix", methods: [] },
      challenge: { ...emptyForm().challenge!, search_engine_bypass: true, failure_action: "log-only" },
      action: { type: "log-only" }
    },
    observe: {
      ...emptyForm(),
      name: t("modules.bot.observeBotBehavior"),
      match: { path: "/", path_match: "prefix", methods: [] },
      challenge: { ...emptyForm().challenge!, mode: "js-challenge", verify_ttl_sec: 300, failure_action: "log-only" },
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
  const globError = validateGlobPath(String(form.match.path || ""), form.match.path_match, t)
  if (globError) {
    return globError
  }
  if (Number(form.priority ?? 0) < 0) {
    return t("common.invalidPriorityZero")
  }
  if (!["js-challenge", "captcha"].includes(form.challenge?.mode ?? "")) {
    return t("modules.bot.challengeModeInvalid")
  }
  if (Number(form.challenge?.verify_ttl_sec ?? 0) <= 0 || Number(form.challenge?.verify_ttl_sec ?? 0) > 86400) {
    return t("modules.bot.challengeTtlInvalid")
  }
  if (form.challenge?.behavior_enabled && (Number(form.challenge.behavior_threshold ?? 0) <= 0 || Number(form.challenge.behavior_threshold ?? 0) > 100)) {
    return t("modules.bot.behaviorThresholdInvalid")
  }
  if ((form.challenge?.failure_message?.length ?? 0) > 240) {
    return t("modules.bot.failureMessageTooLong")
  }
  if ((form.challenge?.privacy_notice?.length ?? 0) > 360) {
    return t("modules.bot.privacyNoticeTooLong")
  }
  return ""
}

async function save() {
  const error = validateForm()
  if (error) {
    message.error(error)
    return
  }
  const failureAction = form.challenge?.failure_action ?? "block"
  form.action.type = failureAction
  if (!(await confirmRiskIfNeeded())) {
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await updateBotProtectionRule(editing.value.id, form)
      message.success(t("common.updated", { name: t("modules.bot.title") }))
    } else {
      await createBotProtectionRule(form)
      message.success(t("common.created", { name: t("modules.bot.title") }))
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
      title: t("common.highRiskConfirm", { name: t("modules.bot.title") }),
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
  await deleteBotProtectionRule(item.id)
  message.success(t("common.deleted", { name: t("modules.bot.title") }))
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

function formatChallengeMode(value?: string) {
  if (value === "js-challenge") {
    return "JS Challenge"
  }
  if (value === "captcha") {
    return t("modules.bot.localCaptcha")
  }
  return value || "-"
}

function formatEnhancements(challenge?: ProtectionRule["challenge"]) {
  const items: string[] = []
  if (challenge?.behavior_enabled) {
    items.push(t("modules.bot.behaviorScoreThreshold", { threshold: challenge.behavior_threshold ?? 0 }))
  }
  if (challenge?.device_binding) {
    items.push(t("modules.bot.deviceBinding"))
  }
  if (challenge?.search_engine_bypass) {
    items.push(t("modules.bot.searchEngineBypass"))
  }
  if (challenge?.failure_message) {
    items.push(t("modules.bot.failureMessage"))
  }
  if (challenge?.privacy_notice) {
    items.push(t("modules.bot.privacyNotice"))
  }
  return items.length > 0 ? items.join(" / ") : t("common.noneEnabled")
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": t("common.observation"),
    block: t("common.block")
  }
  return labels[value] ?? value
}

</script>

<template>
  <main class="page">
    <ModulePageHeader
      :title="t('modules.bot.title')"
      :subtitle="t('modules.bot.subtitle')"
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
      :title="t('modules.bot.loadingFailed')"
      :description="resource.error.value"
      :action-label="t('common.retry')"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" :empty-description="t('modules.bot.emptyGuidance')" />
    </section>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1320"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        :description="t('modules.bot.emptyRules')"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? t('moduleCommon.editRule', { name: t('modules.bot.title') }) : t('moduleCommon.createRule', { name: t('modules.bot.title') })" closable>
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
          <NFormItem :label="t('table.challengeMode')">
            <NSelect
              v-model:value="form.challenge!.mode"
              :options="challengeModeOptions"
            />
          </NFormItem>
          <NFormItem :label="t('modules.bot.challengeTtlSeconds')">
            <NInputNumber v-model:value="form.challenge!.verify_ttl_sec" :min="1" :max="86400" />
          </NFormItem>
          <NFormItem :label="t('table.failureAction')">
            <NSelect v-model:value="form.challenge!.failure_action" :options="failureActionOptions" />
          </NFormItem>
          <NFormItem :label="t('modules.bot.behaviorScore')">
            <NSpace align="center">
              <NSwitch v-model:value="form.challenge!.behavior_enabled" />
              <NInputNumber
                v-model:value="form.challenge!.behavior_threshold"
                :min="1"
                :max="100"
                :disabled="!form.challenge!.behavior_enabled"
              />
            </NSpace>
          </NFormItem>
          <NFormItem :label="t('modules.bot.deviceBinding')">
            <NSwitch v-model:value="form.challenge!.device_binding" />
          </NFormItem>
          <NFormItem :label="t('modules.bot.searchEngineBypass')">
            <NSwitch v-model:value="form.challenge!.search_engine_bypass" />
          </NFormItem>
          <NFormItem :label="t('modules.bot.failureMessage')">
            <NInput
              v-model:value="form.challenge!.failure_message"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 3 }"
              maxlength="240"
              show-count
            />
          </NFormItem>
          <NFormItem :label="t('modules.bot.privacyNotice')">
            <NInput
              v-model:value="form.challenge!.privacy_notice"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 3 }"
              maxlength="360"
              show-count
            />
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
