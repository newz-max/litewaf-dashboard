<script setup lang="ts">
import { computed, h, reactive } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { NButton, NSpace } from "naive-ui"
import { getAttackLogs, type AttackLog } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const filterKeys = [
  "application_id",
  "client_ip",
  "rule_id",
  "action",
  "disposition",
  "event_type",
  "module",
  "attack_type",
  "advanced_target",
  "challenge_result",
  "bot_result",
  "dynamic_result",
  "min_score"
] as const

type FilterKey = typeof filterKeys[number]

const filters = reactive(Object.fromEntries(filterKeys.map((key) => [key, queryString(key)])) as Record<typeof filterKeys[number], string>)

const logsResource = useApiResource(() => getAttackLogs(cleanFilters()))
const logs = computed(() => [...(logsResource.data.value ?? [])])

const eventTypeOptions = computed(() => [
  { label: t("logs.ruleEvent"), value: "rule" },
  { label: t("logs.ipAccessList"), value: "ip-access-list" },
  { label: t("logs.ccCompatibilityEvent"), value: "rate-limit" },
  { label: t("logs.scoreThreshold"), value: "score-threshold" },
  { label: t("logs.bodyInspection"), value: "body-inspection" },
  { label: t("logs.uploadInspection"), value: "upload-inspection" },
  { label: t("logs.dynamicBan"), value: "dynamic-ban" }
])

const moduleOptions = computed(() => [
  { label: t("shell.nav.attackProtection"), value: "attack-protection" },
  { label: t("shell.nav.ipAccessLists"), value: "ip-access-list" },
  { label: t("shell.nav.ccProtection"), value: "cc-protection" },
  { label: t("shell.nav.accessControl"), value: "access-control" },
  { label: t("shell.nav.uploadProtection"), value: "upload-protection" },
  { label: t("shell.nav.botProtection"), value: "bot-protection" },
  { label: t("shell.nav.dynamicProtection"), value: "dynamic-protection" }
])

const attackTypeOptions = computed(() => [
  { label: t("logs.sqlInjection"), value: "sqli" },
  { label: "XSS", value: "xss" },
  { label: "RCE", value: "rce" },
  { label: t("logs.pathTraversal"), value: "path-traversal" }
])

const advancedTargetOptions = computed(() => [
  { label: "Body", value: "body" },
  { label: "JSON Body", value: "body_json" },
  { label: t("rulesPage.uploadFilename"), value: "upload_filename" },
  { label: t("rulesPage.uploadExtension"), value: "upload_extension" },
  { label: t("rulesPage.uploadMime"), value: "upload_mime" },
  { label: t("rulesPage.uploadSize"), value: "upload_size" }
])

const challengeResultOptions = computed(() => [
  { label: t("logs.issued"), value: "issued" },
  { label: t("logs.passed"), value: "passed" },
  { label: t("logs.failure"), value: "failed" }
])

const botResultOptions = computed(() => [
  { label: t("logs.captchaIssued"), value: "captcha-issued" },
  { label: t("logs.captchaPassed"), value: "captcha-passed" },
  { label: t("logs.captchaFailed"), value: "captcha-failed" },
  { label: t("logs.behaviorPass"), value: "behavior-pass" },
  { label: t("logs.searchEngineBypass"), value: "search-engine-bypass" },
  { label: t("logs.deviceMismatch"), value: "device-mismatch" }
])

const dynamicResultOptions = computed(() => [
  { label: t("logs.tokenIssued"), value: "token-issued" },
  { label: t("logs.tokenPassed"), value: "token-passed" },
  { label: t("logs.tokenFailed"), value: "token-failed" },
  { label: t("logs.mutationApplied"), value: "mutation-applied" },
  { label: t("logs.mutationSkipped"), value: "mutation-skipped" },
  { label: t("logs.queueAdmitted"), value: "queue-admitted" },
  { label: t("logs.queueRejected"), value: "queue-rejected" }
])

const actionOptions = computed(() => [
  { label: t("common.block"), value: "block" },
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.allow"), value: "allow" }
])

const dispositionOptions = computed(() => [
  { label: t("logs.blocked"), value: "blocked" },
  { label: t("logs.rateLimited"), value: "rate-limited" },
  { label: t("logs.observed"), value: "observed" },
  { label: t("logs.rejected"), value: "rejected" }
])

const columns = computed(() => [
  { title: t("logs.time"), key: "time" },
  { title: t("logs.requestId"), key: "request_id" },
  { title: t("logs.site"), key: "application_id" },
  { title: t("logs.sourceIp"), key: "client_ip" },
  { title: t("logs.type"), key: "event_type" },
  { title: t("logs.module"), key: "module" },
  { title: t("logs.attackType"), key: "attack_type" },
  { title: t("logs.groupName"), key: "group_name" },
  { title: t("common.rule"), key: "rule_id" },
  { title: t("logs.ruleName"), key: "rule_name" },
  { title: t("logs.counterDimension"), key: "counter" },
  { title: t("logs.threshold"), key: "threshold" },
  { title: t("logs.window"), key: "window_sec" },
  { title: t("logs.challengeMode"), key: "challenge_mode" },
  { title: t("logs.challengeResult"), key: "challenge_result" },
  { title: t("logs.botResult"), key: "bot_result" },
  { title: t("logs.botReason"), key: "bot_reason" },
  { title: t("logs.deviceSignal"), key: "device_signal" },
  { title: t("logs.dynamicResult"), key: "advanced_target" },
  { title: t("logs.advancedTarget"), key: "advanced_target" },
  { title: t("logs.score"), key: "score" },
  { title: t("common.action"), key: "action" },
  { title: t("logs.disposition"), key: "disposition" },
  { title: "URI", key: "uri" },
  { title: t("logs.summary"), key: "summary" },
  { title: "Body", key: "body_metadata" },
  { title: t("logs.upload"), key: "upload_metadata" },
  { title: t("logs.ban"), key: "ban_reason" },
  {
    title: t("logs.drilldown"),
    key: "actions",
    render(row: AttackLog) {
      const path = moduleRoute(row.module)
      if (!path) {
        return null
      }
      return h(NSpace, { size: "small" }, {
        default: () => [
          h(
            RouterLink,
            { to: { path, query: row.rule_id > 0 ? { rule_id: row.rule_id } : {} } },
            { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => t("logs.viewModule") }) }
          )
        ]
      })
    }
  }
])

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== ""))
}

async function searchLogs() {
  await router.replace({ query: cleanFilters() })
  await logsResource.refresh()
}

function queryString(key: string) {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "")
}

function selectFilterValue(key: FilterKey) {
  return filters[key] || null
}

function updateSelectFilter(key: FilterKey, value: string | number | null) {
  filters[key] = value == null ? "" : String(value)
}

function moduleRoute(module: string) {
  const routes: Record<string, string> = {
    "cc-protection": "/cc-protection",
    "attack-protection": "/attack-protection",
    "ip-access-list": "/ip-access-lists",
    "access-control": "/access-control",
    "upload-protection": "/upload-protection",
    "bot-protection": "/bot-protection",
    "dynamic-protection": "/dynamic-protection"
  }
  return routes[module] ?? ""
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("logs.attackTitle") }}</h1>
        <p class="page-subtitle">{{ t("logs.attackSubtitle") }}</p>
      </div>
      <NButton @click="logsResource.refresh">{{ t("common.refresh") }}</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">{{ t("common.applicationId") }}</span>
          <NInput v-model:value="filters.application_id" :placeholder="t('logs.enterApplicationId')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.sourceIp") }}</span>
          <NInput v-model:value="filters.client_ip" :placeholder="t('logs.enterSourceIp')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("rulesPage.ruleId") }}</span>
          <NInput v-model:value="filters.rule_id" :placeholder="t('logs.enterRuleId')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.eventType") }}</span>
          <NSelect
            :value="selectFilterValue('event_type')"
            clearable
            :placeholder="t('logs.selectEventType')"
            @update:value="updateSelectFilter('event_type', $event)"
            :options="eventTypeOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.protectionModule") }}</span>
          <NSelect
            :value="selectFilterValue('module')"
            clearable
            :placeholder="t('logs.selectProtectionModule')"
            @update:value="updateSelectFilter('module', $event)"
            :options="moduleOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.attackType") }}</span>
          <NSelect
            :value="selectFilterValue('attack_type')"
            clearable
            :placeholder="t('logs.selectAttackType')"
            @update:value="updateSelectFilter('attack_type', $event)"
            :options="attackTypeOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.advancedTarget") }}</span>
          <NSelect
            :value="selectFilterValue('advanced_target')"
            clearable
            :placeholder="t('logs.selectAdvancedTarget')"
            @update:value="updateSelectFilter('advanced_target', $event)"
            :options="advancedTargetOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.challengeResult") }}</span>
          <NSelect
            :value="selectFilterValue('challenge_result')"
            clearable
            :placeholder="t('logs.selectChallengeResult')"
            @update:value="updateSelectFilter('challenge_result', $event)"
            :options="challengeResultOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.botResult") }}</span>
          <NSelect
            :value="selectFilterValue('bot_result')"
            clearable
            :placeholder="t('logs.selectBotResult')"
            @update:value="updateSelectFilter('bot_result', $event)"
            :options="botResultOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.dynamicResult") }}</span>
          <NSelect
            :value="selectFilterValue('dynamic_result')"
            clearable
            :placeholder="t('logs.selectDynamicResult')"
            @update:value="updateSelectFilter('dynamic_result', $event)"
            :options="dynamicResultOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.minScore") }}</span>
          <NInput v-model:value="filters.min_score" :placeholder="t('logs.enterMinScore')" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.executionAction") }}</span>
          <NSelect
            :value="selectFilterValue('action')"
            clearable
            :placeholder="t('logs.selectAction')"
            @update:value="updateSelectFilter('action', $event)"
            :options="actionOptions"
          />
        </div>
        <div class="query-field">
          <span class="query-label">{{ t("logs.dispositionResult") }}</span>
          <NSelect
            :value="selectFilterValue('disposition')"
            clearable
            :placeholder="t('logs.selectDispositionResult')"
            @update:value="updateSelectFilter('disposition', $event)"
            :options="dispositionOptions"
          />
        </div>
        <NButton type="primary" @click="searchLogs">{{ t("common.query") }}</NButton>
      </div>

      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="logsResource.loading.value"
        :columns="columns"
        :data="logs"
        :bordered="false"
      />
      <NEmpty v-if="!logsResource.loading.value && logs.length === 0" :description="t('logs.noAttackLogs')" />
      <NAlert v-if="logsResource.error.value" type="error" style="margin-top: 12px">
        {{ logsResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
