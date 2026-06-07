<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  applyRulePackageUpdate,
  createRuleAccountSource,
  createRuleContributionTarget,
  createRuleFeedback,
  createRuleCatalog,
  createRuleProvider,
  createRuleTrustKey,
  decideRuleFeedbackSuggestion,
  decideRuleReviewQueueItem,
  executeRuleContributionPush,
  exportRulePackage,
  getRuleAccountSources,
  getRuleCatalogs,
  getRuleCatalogPackages,
  getRuleContributionPushes,
  getRuleContributionTargets,
  getRuleFeedback,
  getRuleFeedbackSuggestions,
  getRulePackages,
  getRuleProviderPackages,
  getRuleProviders,
  getRuleReviewQueue,
  getRules,
  getRuleTrustKeys,
  importRuleProviderPackage,
  importRulePackage,
  previewRuleProviderPackage,
  previewRuleContributionPush,
  previewRemoteRulePackage,
  previewRulePackage,
  previewRulePackageExport,
  previewRulePackageUpdate,
  refreshRuleAccountSource,
  retryRuleProvider,
  syncRuleProvider,
  syncRuleCatalog,
  testRuleFeedbackSuggestion,
  testRule,
  validateRuleProvider,
  type RuleCommunityAccountSource,
  type RuleContributionPushAttempt,
  type RuleContributionTarget,
  type RuleFeedback,
  type RuleFeedbackSuggestion,
  type Rule,
  type RuleCatalogPackage,
  type RuleCatalogSource,
  type RulePackageExportArtifact,
  type RulePackageExportPreview,
  type RulePackageMetadata,
  type RulePackagePreview,
  type RulePackageUpdatePreview,
  type RuleProviderAdapter,
  type RuleProviderPackage,
  type RuleTestResult,
  type RuleTrustKey
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const packagesResource = useApiResource(getRulePackages)
const rulesResource = useApiResource(getRules)
const catalogsResource = useApiResource(getRuleCatalogs)
const trustKeysResource = useApiResource(getRuleTrustKeys)
const providersResource = useApiResource(getRuleProviders)
const accountSourcesResource = useApiResource(getRuleAccountSources)
const contributionTargetsResource = useApiResource(getRuleContributionTargets)
const contributionPushesResource = useApiResource(getRuleContributionPushes)
const reviewQueueResource = useApiResource(getRuleReviewQueue)
const feedbackResource = useApiResource(getRuleFeedback)
const feedbackSuggestionsResource = useApiResource(getRuleFeedbackSuggestions)

const activeCatalogID = shallowRef<number | null>(null)
const catalogPackages = shallowRef<RuleCatalogPackage[]>([])
const catalogLoading = shallowRef(false)
const activeProviderID = shallowRef<number | null>(null)
const providerPackages = shallowRef<RuleProviderPackage[]>([])
const providerLoading = shallowRef(false)
const packageJSON = shallowRef("")
const preview = shallowRef<RulePackagePreview | null>(null)
const remotePreview = shallowRef<RulePackagePreview | null>(null)
const providerPreview = shallowRef<RulePackagePreview | null>(null)
const updatePreview = shallowRef<RulePackageUpdatePreview | null>(null)
const exportPreview = shallowRef<RulePackageExportPreview | null>(null)
const exportArtifact = shallowRef<RulePackageExportArtifact | null>(null)
const testResult = shallowRef<RuleTestResult | null>(null)
const busy = shallowRef("")

const catalogForm = reactive({
  name: "",
  source: "",
  enabled: true,
  timeoutSec: 5
})

const trustForm = reactive({
  keyID: "",
  algorithm: "local",
  owner: "",
  publicKey: "",
  enabled: true,
  revoked: false,
  expiresAt: ""
})

const providerForm = reactive({
  name: "",
  providerType: "https-catalog",
  endpoint: "",
  authMode: "none",
  credentialAlias: "default",
  credentialSecret: "",
  enabled: true,
  timeoutSec: 5,
  retryMaxAttempts: 3,
  retryBackoffSec: 60
})

const exportForm = reactive({
  packageID: "",
  name: "",
  version: "v1",
  author: "",
  license: "Apache-2.0",
  signingKeyID: "",
  ruleIDs: [] as number[]
})

const testForm = reactive({
  ruleID: null as number | null,
  method: "GET",
  path: "/search",
  query: "q=" + "<scr" + "ipt>alert(1)</scr" + "ipt>",
  headers: "",
  body: "",
  uploadFilename: "",
  uploadMime: "",
  uploadSize: 0
})

const accountForm = reactive({
  name: "",
  providerType: "https-catalog",
  providerAdapterID: null as number | null,
  endpoint: "",
  credentialAlias: "default",
  credentialSecret: "",
  enabled: true,
  timeoutSec: 5
})

const contributionForm = reactive({
  name: "",
  provider: "https",
  endpoint: "",
  channel: "main",
  credentialAlias: "default",
  credentialSecret: "",
  enabled: true
})

const selectedPushTargetID = shallowRef<number | null>(null)

const feedbackForm = reactive({
  ruleID: null as number | null,
  reason: "",
  severity: "medium",
  path: ""
})

const packages = computed<RulePackageMetadata[]>(() =>
  (packagesResource.data.value ?? []).map((item) => ({ ...item, warnings: [...(item.warnings ?? [])] }))
)
const rules = computed<Rule[]>(() =>
  (rulesResource.data.value ?? []).map((rule) => ({
    ...rule,
    export_ineligible_reasons: [...(rule.export_ineligible_reasons ?? [])]
  }))
)
const importedRules = computed<Rule[]>(() => rules.value.filter((rule) => rule.package_id))
const catalogs = computed<RuleCatalogSource[]>(() => [...(catalogsResource.data.value ?? [])])
const trustKeys = computed<RuleTrustKey[]>(() => [...(trustKeysResource.data.value ?? [])])
const providers = computed<RuleProviderAdapter[]>(() => [...(providersResource.data.value ?? [])])
const accountSources = computed<RuleCommunityAccountSource[]>(() => [...(accountSourcesResource.data.value ?? [])])
const contributionTargets = computed<RuleContributionTarget[]>(() => [...(contributionTargetsResource.data.value ?? [])])
const contributionPushes = computed<RuleContributionPushAttempt[]>(() => [...(contributionPushesResource.data.value ?? [])])
const reviewQueue = computed(() => [...(reviewQueueResource.data.value ?? [])])
const feedbackItems = computed<RuleFeedback[]>(() => [...(feedbackResource.data.value ?? [])])
const feedbackSuggestions = computed<RuleFeedbackSuggestion[]>(() =>
  (feedbackSuggestionsResource.data.value ?? []).map((item) => ({
    ...item,
    test_result: item.test_result
      ? {
          ...item.test_result,
          evaluated_values: [...(item.test_result.evaluated_values ?? [])],
          diagnostics: { ...(item.test_result.diagnostics ?? {}) }
        }
      : undefined
  }))
)

const canWrite = computed(() => authStore.canWrite)
const exportRuleOptions = computed(() =>
  rules.value.map((rule) => ({
    label: `${rule.name} #${rule.id}`,
    value: rule.id
  }))
)
const testRuleOptions = computed(() =>
  rules.value.map((rule) => ({
    label: `${rule.name} #${rule.id}`,
    value: rule.id
  }))
)
const trustKeyOptions = computed(() =>
  trustKeys.value.map((key) => ({
    label: `${key.key_id} / ${key.algorithm}`,
    value: key.key_id
  }))
)
const contributionTargetOptions = computed(() =>
  contributionTargets.value.map((target) => ({
    label: `${target.name} #${target.id}`,
    value: target.id
  }))
)
const providerOptions = computed(() =>
  providers.value.map((provider) => ({
    label: `${provider.name} #${provider.id}`,
    value: provider.id
  }))
)

const pushBlocked = computed(() => !exportArtifact.value || !selectedPushTargetID.value)

const packageColumns: DataTableColumns<RulePackageMetadata> = [
  { title: "包 ID", key: "id" },
  { title: "版本", key: "version" },
  { title: "规则数", key: "rule_count" },
  {
    title: "签名",
    key: "signature_status",
    render: (row) => statusTag(row.signature_status || "unsigned")
  },
  { title: "兼容性", key: "compatibility" }
]

const ruleColumns: DataTableColumns<Rule> = [
  { title: "规则", key: "name" },
  { title: "来源包", key: "package_id" },
  { title: "包版本", key: "package_version" },
  { title: "目录", key: "remote_catalog_id", render: (row) => row.remote_catalog_id || "-" },
  { title: "更新", key: "pending_update_state", render: (row) => statusTag(row.pending_update_state || "current") },
  { title: "签名", key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  {
    title: "测试",
    key: "last_test_status",
    render: (row) => statusTag(row.last_test_status || "untested")
  },
  { title: "状态", key: "enabled", render: (row) => (row.enabled ? "启用" : "停用") }
]

const catalogColumns: DataTableColumns<RuleCatalogSource> = [
  { title: "目录", key: "name" },
  { title: "来源", key: "source", ellipsis: { tooltip: true } },
  { title: "状态", key: "status", render: (row) => statusTag(row.status) },
  { title: "包数", key: "package_count" },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(
        NButton,
        {
          size: "small",
          disabled: !canWrite.value,
          loading: busy.value === `sync-${row.id}`,
          onClick: () => runCatalogSync(row)
        },
        { default: () => "同步" }
      )
  }
]

const catalogPackageColumns: DataTableColumns<RuleCatalogPackage> = [
  { title: "包 ID", key: "package_id" },
  { title: "版本", key: "version" },
  { title: "签名", key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: "兼容性", key: "compatibility" },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => runRemotePreview(row) },
            { default: () => "预览" }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => runUpdatePreview(row) },
            { default: () => "更新预览" }
          ),
          h(
            NButton,
            {
              size: "small",
              type: "primary",
              disabled: !canWrite.value,
              loading: busy.value === `apply-${row.catalog_id}-${row.package_id}`,
              onClick: () => runApplyUpdate(row)
            },
            { default: () => "应用" }
          )
        ]
      })
  }
]

const providerColumns: DataTableColumns<RuleProviderAdapter> = [
  { title: "Provider", key: "name" },
  { title: "类型", key: "provider_type" },
  { title: "认证", key: "auth_mode", render: (row) => statusTag(row.auth_mode || "none") },
  { title: "健康", key: "health_status", render: (row) => statusTag(row.health_status || "never-synced") },
  { title: "同步", key: "sync_status", render: (row) => statusTag(row.sync_status || "never-synced") },
  { title: "包数", key: "package_count" },
  { title: "重试", key: "attempt_count", render: (row) => (row.retry_exhausted ? "exhausted" : String(row.attempt_count || 0)) },
  { title: "凭据", key: "credential", render: (row) => `${row.credential?.alias || "-"} / ${row.credential?.last_four || "-"}` },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: "small",
              disabled: !canWrite.value,
              loading: busy.value === `validate-provider-${row.id}`,
              onClick: () => runProviderValidate(row)
            },
            { default: () => "验证" }
          ),
          h(
            NButton,
            {
              size: "small",
              disabled: !canWrite.value || !row.enabled,
              loading: busy.value === `sync-provider-${row.id}`,
              onClick: () => runProviderSync(row)
            },
            { default: () => "同步" }
          ),
          h(
            NButton,
            {
              size: "small",
              disabled: !canWrite.value || !row.enabled,
              loading: busy.value === `retry-provider-${row.id}`,
              onClick: () => runProviderRetry(row)
            },
            { default: () => "重试" }
          )
        ]
      })
  }
]

const providerPackageColumns: DataTableColumns<RuleProviderPackage> = [
  { title: "包 ID", key: "package_id" },
  { title: "版本", key: "version" },
  { title: "Provider", key: "provider_name" },
  { title: "授权", key: "entitlement_state", render: (row) => statusTag(row.entitlement_state || "allowed") },
  { title: "签名", key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: "状态", key: "sync_status", render: (row) => statusTag(row.stale ? "stale" : row.sync_status) },
  {
    title: "操作",
    key: "actions",
    render: (row) => {
      const blocked = row.entitlement_state === "unauthorized" || row.entitlement_state === "denied" || row.stale
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value || blocked, onClick: () => runProviderPreview(row) },
            { default: () => "预览" }
          ),
          h(
            NButton,
            {
              size: "small",
              type: "primary",
              disabled: !canWrite.value || blocked,
              loading: busy.value === `import-provider-${row.provider_id}-${row.package_id}`,
              onClick: () => runProviderImport(row)
            },
            { default: () => "导入" }
          )
        ]
      })
    }
  }
]

const trustColumns: DataTableColumns<RuleTrustKey> = [
  { title: "Key ID", key: "key_id" },
  { title: "算法", key: "algorithm" },
  { title: "所有者", key: "owner" },
  { title: "启用", key: "enabled", render: (row) => (row.enabled ? "是" : "否") },
  { title: "撤销", key: "revoked", render: (row) => (row.revoked ? "是" : "否") },
  { title: "过期时间", key: "expires_at", render: (row) => row.expires_at || "-" }
]

const accountSourceColumns: DataTableColumns<RuleCommunityAccountSource> = [
  { title: "规则源", key: "name" },
  { title: "提供方", key: "provider_type" },
  { title: "Provider", key: "provider_adapter_name", render: (row) => row.provider_adapter_name || "-" },
  { title: "Provider 健康", key: "provider_health", render: (row) => statusTag(row.provider_health || "-") },
  { title: "Provider 重试", key: "provider_retry_state", render: (row) => statusTag(row.provider_retry_state || "-") },
  { title: "订阅", key: "subscription_status", render: (row) => statusTag(row.subscription_status) },
  { title: "同步", key: "status", render: (row) => statusTag(row.status) },
  { title: "包数", key: "package_count" },
  { title: "待审", key: "recommendation_count" },
  { title: "凭据", key: "credential", render: (row) => `${row.credential?.alias || "-"} / ${row.credential?.last_four || "-"}` },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(
        NButton,
        {
          size: "small",
          disabled: !canWrite.value,
          loading: busy.value === `refresh-account-${row.id}`,
          onClick: () => runAccountRefresh(row)
        },
        { default: () => "刷新" }
      )
  }
]

const reviewQueueColumns: DataTableColumns<(typeof reviewQueue.value)[number]> = [
  { title: "类型", key: "item_type" },
  { title: "包", key: "package_id" },
  { title: "版本", key: "package_version" },
  { title: "来源", key: "source_identity" },
  { title: "签名", key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: "状态", key: "state", render: (row) => statusTag(row.state) },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value || row.state !== "queued", onClick: () => decideQueue(row.id, "approved") },
            { default: () => "批准" }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value || row.state !== "queued", onClick: () => decideQueue(row.id, "dismissed") },
            { default: () => "忽略" }
          )
        ]
      })
  }
]

const contributionTargetColumns: DataTableColumns<RuleContributionTarget> = [
  { title: "目标", key: "name" },
  { title: "提供方", key: "provider" },
  { title: "通道", key: "channel" },
  { title: "状态", key: "status", render: (row) => statusTag(row.status) },
  { title: "凭据", key: "credential", render: (row) => `${row.credential?.alias || "-"} / ${row.credential?.last_four || "-"}` }
]

const contributionPushColumns: DataTableColumns<RuleContributionPushAttempt> = [
  { title: "包", key: "package_id" },
  { title: "目标", key: "target_name" },
  { title: "状态", key: "status", render: (row) => statusTag(row.status) },
  { title: "远程引用", key: "remote_reference", render: (row) => row.remote_reference || "-" },
  { title: "操作者", key: "actor" }
]

const feedbackColumns: DataTableColumns<RuleFeedback> = [
  { title: "规则", key: "rule_id" },
  { title: "原因", key: "reason", ellipsis: { tooltip: true } },
  { title: "严重度", key: "severity", render: (row) => statusTag(row.severity) },
  { title: "状态", key: "status", render: (row) => statusTag(row.status) },
  { title: "操作者", key: "actor", render: (row) => row.actor || "-" }
]

const feedbackSuggestionColumns: DataTableColumns<RuleFeedbackSuggestion> = [
  { title: "规则", key: "rule_id" },
  { title: "建议", key: "proposed_change", ellipsis: { tooltip: true } },
  { title: "状态", key: "state", render: (row) => statusTag(row.state) },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: "small", disabled: !canWrite.value, onClick: () => runSuggestionTest(row.id) }, { default: () => "测试" }),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => decideSuggestion(row.id, "approved") },
            { default: () => "批准" }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => decideSuggestion(row.id, "rejected") },
            { default: () => "拒绝" }
          )
        ]
      })
  }
]

function statusTag(status: string) {
  const normalized = status || "-"
  const type =
    normalized === "verified" || normalized === "passed" || normalized === "synced" || normalized === "current"
      ? "success"
      : normalized === "invalid" || normalized === "revoked-key" || normalized === "failed"
        ? "error"
        : "warning"
  return h(NTag, { size: "small", type }, { default: () => normalized })
}

function parsePackagePayload() {
  const raw = packageJSON.value.trim()
  return raw ? JSON.parse(raw) : {}
}

async function runPreview() {
  busy.value = "local-preview"
  try {
    preview.value = await previewRulePackage(parsePackagePayload())
    message.success("规则包预览已生成")
  } finally {
    busy.value = ""
  }
}

async function runImport() {
  busy.value = "local-import"
  try {
    await importRulePackage(parsePackagePayload())
    message.success("规则包已导入")
    preview.value = null
    await refreshRuleData()
  } finally {
    busy.value = ""
  }
}

async function createCatalog() {
  busy.value = "create-catalog"
  try {
    const item = await createRuleCatalog({
      name: catalogForm.name,
      source: catalogForm.source,
      enabled: catalogForm.enabled,
      timeout_sec: catalogForm.timeoutSec
    })
    activeCatalogID.value = item.id
    message.success("社区目录已创建")
    await catalogsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runCatalogSync(row: RuleCatalogSource) {
  busy.value = `sync-${row.id}`
  try {
    catalogPackages.value = await syncRuleCatalog(row.id)
    activeCatalogID.value = row.id
    message.success("目录同步完成")
    await catalogsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function loadCatalogPackages() {
  if (!activeCatalogID.value) {
    catalogPackages.value = []
    return
  }
  catalogLoading.value = true
  try {
    catalogPackages.value = await getRuleCatalogPackages(activeCatalogID.value)
  } finally {
    catalogLoading.value = false
  }
}

async function runRemotePreview(row: RuleCatalogPackage) {
  remotePreview.value = await previewRemoteRulePackage(row.catalog_id, row.package_id)
  message.success("远程包预览完成")
}

async function runUpdatePreview(row: RuleCatalogPackage) {
  updatePreview.value = await previewRulePackageUpdate(row.catalog_id, row.package_id)
  message.success("更新预览完成")
}

async function runApplyUpdate(row: RuleCatalogPackage) {
  busy.value = `apply-${row.catalog_id}-${row.package_id}`
  try {
    await applyRulePackageUpdate(row.catalog_id, row.package_id)
    message.success("规则包更新已应用")
    await refreshRuleData()
  } finally {
    busy.value = ""
  }
}

async function createTrustKey() {
  busy.value = "create-trust"
  try {
    await createRuleTrustKey({
      key_id: trustForm.keyID,
      algorithm: trustForm.algorithm,
      owner: trustForm.owner,
      public_key: trustForm.publicKey,
      enabled: trustForm.enabled,
      revoked: trustForm.revoked,
      expires_at: trustForm.expiresAt || undefined
    })
    message.success("信任密钥已保存")
    await trustKeysResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function createProvider() {
  busy.value = "create-provider"
  try {
    const item = await createRuleProvider({
      name: providerForm.name,
      provider_type: providerForm.providerType,
      endpoint: providerForm.endpoint,
      auth_mode: providerForm.authMode,
      enabled: providerForm.enabled,
      timeout_sec: providerForm.timeoutSec,
      retry_policy: {
        max_attempts: providerForm.retryMaxAttempts,
        backoff_sec: providerForm.retryBackoffSec
      },
      credential: { alias: providerForm.credentialAlias },
      credential_secret: providerForm.credentialSecret
    })
    activeProviderID.value = item.id
    providerForm.credentialSecret = ""
    message.success("Provider 已保存")
    await providersResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runProviderValidate(row: RuleProviderAdapter) {
  busy.value = `validate-provider-${row.id}`
  try {
    await validateRuleProvider(row.id)
    message.success("Provider 凭据验证完成")
    await providersResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runProviderSync(row: RuleProviderAdapter) {
  busy.value = `sync-provider-${row.id}`
  try {
    const result = await syncRuleProvider(row.id)
    providerPackages.value = result.items
    activeProviderID.value = row.id
    providerPreview.value = null
    message.success("Provider 同步完成")
    await providersResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runProviderRetry(row: RuleProviderAdapter) {
  busy.value = `retry-provider-${row.id}`
  try {
    const result = await retryRuleProvider(row.id)
    providerPackages.value = result.items
    activeProviderID.value = row.id
    providerPreview.value = null
    message.success("Provider 重试完成")
    await providersResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function loadProviderPackages() {
  if (!activeProviderID.value) {
    providerPackages.value = []
    return
  }
  providerLoading.value = true
  try {
    providerPackages.value = await getRuleProviderPackages(activeProviderID.value)
  } finally {
    providerLoading.value = false
  }
}

async function runProviderPreview(row: RuleProviderPackage) {
  providerPreview.value = await previewRuleProviderPackage(row.provider_id, row.package_id)
  message.success("Provider 包预览完成")
}

async function runProviderImport(row: RuleProviderPackage) {
  busy.value = `import-provider-${row.provider_id}-${row.package_id}`
  try {
    await importRuleProviderPackage(row.provider_id, row.package_id)
    message.success("Provider 包已导入")
    await refreshRuleData()
  } finally {
    busy.value = ""
  }
}

async function runExportPreview() {
  busy.value = "export-preview"
  try {
    exportPreview.value = await previewRulePackageExport(exportPayload())
    exportArtifact.value = null
    message.success("导出预览已生成")
  } finally {
    busy.value = ""
  }
}

async function runExport() {
  busy.value = "export"
  try {
    exportArtifact.value = await exportRulePackage(exportPayload())
    message.success("导出包已生成")
  } finally {
    busy.value = ""
  }
}

async function runRuleTest() {
  if (!testForm.ruleID) {
    message.warning("请选择规则")
    return
  }
  busy.value = "rule-test"
  try {
    testResult.value = await testRule({
      rule_id: testForm.ruleID,
      sample: {
        method: testForm.method,
        path: testForm.path,
        query: parseKeyValues(testForm.query),
        headers: parseKeyValues(testForm.headers),
        body: testForm.body,
        upload_filename: testForm.uploadFilename,
        upload_mime: testForm.uploadMime,
        upload_size: testForm.uploadSize
      }
    })
    message.success("规则测试完成")
    await rulesResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function createAccountSource() {
  busy.value = "create-account"
  try {
    await createRuleAccountSource({
      name: accountForm.name,
      provider_type: accountForm.providerType,
      provider_adapter_id: accountForm.providerAdapterID ?? undefined,
      endpoint: accountForm.endpoint,
      enabled: accountForm.enabled,
      timeout_sec: accountForm.timeoutSec,
      credential: { alias: accountForm.credentialAlias },
      credential_secret: accountForm.credentialSecret
    })
    message.success("账号规则源已保存")
    accountForm.credentialSecret = ""
    await accountSourcesResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runAccountRefresh(row: RuleCommunityAccountSource) {
  busy.value = `refresh-account-${row.id}`
  try {
    await refreshRuleAccountSource(row.id)
    message.success("账号规则源刷新完成")
    await Promise.all([accountSourcesResource.refresh(), reviewQueueResource.refresh()])
  } finally {
    busy.value = ""
  }
}

async function createContributionTarget() {
  busy.value = "create-contribution-target"
  try {
    const item = await createRuleContributionTarget({
      name: contributionForm.name,
      provider: contributionForm.provider,
      endpoint: contributionForm.endpoint,
      channel: contributionForm.channel,
      enabled: contributionForm.enabled,
      credential: { alias: contributionForm.credentialAlias },
      credential_secret: contributionForm.credentialSecret
    })
    selectedPushTargetID.value = item.id
    contributionForm.credentialSecret = ""
    message.success("贡献推送目标已保存")
    await contributionTargetsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runContributionPush(previewOnly: boolean) {
  if (!exportArtifact.value || !selectedPushTargetID.value) {
    message.warning("请先生成导出包并选择推送目标")
    return
  }
  busy.value = previewOnly ? "push-preview" : "push-execute"
  try {
    const payload = { target_id: selectedPushTargetID.value, artifact: exportArtifact.value }
    if (previewOnly) {
      await previewRuleContributionPush(payload)
      message.success("推送预览已通过")
    } else {
      await executeRuleContributionPush(payload)
      message.success("贡献包已推送")
      await contributionPushesResource.refresh()
    }
  } finally {
    busy.value = ""
  }
}

async function decideQueue(id: number, state: string) {
  busy.value = `queue-${id}-${state}`
  try {
    await decideRuleReviewQueueItem(id, { state, reason: state === "dismissed" ? "operator dismissed" : "operator approved" })
    message.success("待审队列已更新")
    await reviewQueueResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function createFeedback() {
  if (!feedbackForm.ruleID) {
    message.warning("请选择规则")
    return
  }
  busy.value = "create-feedback"
  try {
    await createRuleFeedback({
      rule_id: feedbackForm.ruleID,
      reason: feedbackForm.reason,
      severity: feedbackForm.severity,
      redacted_sample: feedbackForm.path ? { path: feedbackForm.path } : undefined
    })
    message.success("误报反馈已提交")
    await Promise.all([feedbackResource.refresh(), feedbackSuggestionsResource.refresh()])
  } finally {
    busy.value = ""
  }
}

async function runSuggestionTest(id: number) {
  busy.value = `suggestion-test-${id}`
  try {
    await testRuleFeedbackSuggestion(id)
    message.success("候选建议测试完成")
    await feedbackSuggestionsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function decideSuggestion(id: number, state: string) {
  busy.value = `suggestion-${id}-${state}`
  try {
    await decideRuleFeedbackSuggestion(id, { state })
    message.success("候选建议已更新")
    await feedbackSuggestionsResource.refresh()
  } finally {
    busy.value = ""
  }
}

function exportPayload() {
  return {
    package_id: exportForm.packageID,
    name: exportForm.name,
    version: exportForm.version,
    author: exportForm.author,
    license: exportForm.license,
    rule_ids: exportForm.ruleIDs,
    signing_key_id: exportForm.signingKeyID || undefined
  }
}

async function refreshRuleData() {
  await Promise.all([
    packagesResource.refresh(),
    rulesResource.refresh(),
    catalogsResource.refresh(),
    providersResource.refresh(),
    accountSourcesResource.refresh(),
    contributionTargetsResource.refresh(),
    contributionPushesResource.refresh(),
    reviewQueueResource.refresh(),
    feedbackResource.refresh(),
    feedbackSuggestionsResource.refresh()
  ])
  await loadCatalogPackages()
  await loadProviderPackages()
}

function parseKeyValues(value: string) {
  const out: Record<string, string> = {}
  for (const line of value.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }
    const index = trimmed.indexOf("=")
    if (index <= 0) {
      continue
    }
    out[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return out
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">高级规则生态</h1>
        <p class="page-subtitle">规则包导入、社区目录、信任密钥、更新审核和贡献导出都由控制面完成。</p>
      </div>
    </div>

    <NAlert v-if="!canWrite" type="warning" class="mb">
      当前角色只能查看规则生态，不能同步目录、导入、更新、配置密钥或导出规则包。
    </NAlert>

    <NTabs type="line" animated>
      <NTabPane name="local" tab="本地规则包">
        <NGrid :cols="2" :x-gap="16" :y-gap="16" responsive="screen">
          <NGi>
            <section class="section section-pad">
              <div class="section-title">规则包</div>
              <NDataTable
                :loading="packagesResource.loading.value"
                :columns="packageColumns"
                :data="packages"
                :bordered="false"
              />
              <NEmpty v-if="!packagesResource.loading.value && packages.length === 0" description="暂无规则包" />
            </section>
          </NGi>

          <NGi>
            <section class="section section-pad">
              <div class="section-title">导入预览</div>
              <NInput
                v-model:value="packageJSON"
                type="textarea"
                :autosize="{ minRows: 8, maxRows: 14 }"
                placeholder="粘贴规则包 JSON；留空使用内置默认规则包"
              />
              <NSpace class="actions">
                <NButton :loading="busy === 'local-preview'" :disabled="!canWrite" @click="runPreview">预览</NButton>
                <NButton type="primary" :loading="busy === 'local-import'" :disabled="!canWrite" @click="runImport">
                  导入
                </NButton>
              </NSpace>
              <div v-if="preview" class="preview-grid">
                <NStatistic label="新增" :value="preview.added.length" />
                <NStatistic label="变更" :value="preview.changed.length" />
                <NStatistic label="跳过" :value="preview.skipped.length" />
                <NStatistic label="无效" :value="preview.invalid.length" />
              </div>
              <NAlert v-for="warning in preview?.warnings ?? []" :key="warning" type="warning" class="mt">
                {{ warning }}
              </NAlert>
            </section>
          </NGi>
        </NGrid>
      </NTabPane>

      <NTabPane name="catalogs" tab="社区目录">
        <section class="section section-pad">
          <div class="section-title">目录源</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="catalogForm.name" placeholder="目录名称" /></NGi>
            <NGi :span="2"><NInput v-model:value="catalogForm.source" placeholder="https://... 或本地 catalog.json" /></NGi>
            <NGi><NInputNumber v-model:value="catalogForm.timeoutSec" :min="1" :max="30" /></NGi>
          </NGrid>
          <NSpace class="mb">
            <NSwitch v-model:value="catalogForm.enabled" />
            <NButton type="primary" :loading="busy === 'create-catalog'" :disabled="!canWrite" @click="createCatalog">
              新增目录
            </NButton>
            <NSelect
              v-model:value="activeCatalogID"
              class="catalog-select"
              :options="catalogs.map((item) => ({ label: `${item.name} #${item.id}`, value: item.id }))"
              @update:value="loadCatalogPackages"
            />
          </NSpace>
          <NDataTable :loading="catalogsResource.loading.value" :columns="catalogColumns" :data="catalogs" :bordered="false" />
        </section>

        <section class="section section-pad">
          <div class="section-title">目录包</div>
          <NDataTable :loading="catalogLoading" :columns="catalogPackageColumns" :data="catalogPackages" :bordered="false" />
          <NEmpty v-if="!catalogLoading && catalogPackages.length === 0" description="暂无已同步目录包" />
          <div v-if="remotePreview || updatePreview" class="preview-grid">
            <NStatistic label="远程新增" :value="remotePreview?.added.length ?? updatePreview?.added.length ?? 0" />
            <NStatistic label="远程变更" :value="remotePreview?.changed.length ?? updatePreview?.changed.length ?? 0" />
            <NStatistic label="更新移除" :value="updatePreview?.removed.length ?? 0" />
            <NStatistic label="无效规则" :value="remotePreview?.invalid.length ?? updatePreview?.invalid.length ?? 0" />
          </div>
        </section>
      </NTabPane>

      <NTabPane name="providers" tab="外部 Provider">
        <section class="section section-pad">
          <div class="section-title">Provider 配置</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="providerForm.name" placeholder="Provider 名称" /></NGi>
            <NGi>
              <NSelect
                v-model:value="providerForm.providerType"
                :options="[{ label: 'https-catalog', value: 'https-catalog' }]"
              />
            </NGi>
            <NGi>
              <NSelect
                v-model:value="providerForm.authMode"
                :options="[
                  { label: 'none', value: 'none' },
                  { label: 'bearer-token', value: 'bearer-token' }
                ]"
              />
            </NGi>
            <NGi><NInputNumber v-model:value="providerForm.timeoutSec" :min="1" :max="30" /></NGi>
            <NGi :span="2"><NInput v-model:value="providerForm.endpoint" placeholder="https://... 或本地 catalog.json" /></NGi>
            <NGi><NInput v-model:value="providerForm.credentialAlias" placeholder="凭据别名" /></NGi>
            <NGi>
              <NInput
                v-model:value="providerForm.credentialSecret"
                type="password"
                show-password-on="click"
                placeholder="Bearer Token，仅写入"
              />
            </NGi>
            <NGi><NInputNumber v-model:value="providerForm.retryMaxAttempts" :min="1" :max="10" /></NGi>
            <NGi><NInputNumber v-model:value="providerForm.retryBackoffSec" :min="1" :max="3600" /></NGi>
            <NGi>
              <NSpace align="center">
                <NSwitch v-model:value="providerForm.enabled" />
                <NButton type="primary" :loading="busy === 'create-provider'" :disabled="!canWrite" @click="createProvider">
                  新增 Provider
                </NButton>
              </NSpace>
            </NGi>
          </NGrid>
          <NDataTable :loading="providersResource.loading.value" :columns="providerColumns" :data="providers" :bordered="false" />
          <NEmpty v-if="!providersResource.loading.value && providers.length === 0" description="暂无外部 Provider" />
        </section>

        <section class="section section-pad">
          <div class="section-title">Provider 包</div>
          <NSpace class="mb">
            <NSelect
              v-model:value="activeProviderID"
              class="catalog-select"
              clearable
              :options="providerOptions"
              placeholder="选择 Provider"
              @update:value="loadProviderPackages"
            />
            <NButton :disabled="!activeProviderID" :loading="providerLoading" @click="loadProviderPackages">刷新包列表</NButton>
          </NSpace>
          <NDataTable :loading="providerLoading" :columns="providerPackageColumns" :data="providerPackages" :bordered="false" />
          <NEmpty v-if="!providerLoading && providerPackages.length === 0" description="暂无 Provider 包" />
          <div v-if="providerPreview" class="preview-grid">
            <NStatistic label="新增" :value="providerPreview.added.length" />
            <NStatistic label="变更" :value="providerPreview.changed.length" />
            <NStatistic label="重试状态" :value="providerPreview.retry_state || 'ready'" />
            <NStatistic label="信任状态" :value="providerPreview.trust_status || providerPreview.package.signature_status" />
          </div>
          <NAlert v-if="providerPreview?.blocked" type="error" class="mt">
            {{ providerPreview.block_reason }}
          </NAlert>
          <NAlert
            v-for="warning in [...(providerPreview?.warnings ?? []), ...(providerPreview?.entitlement_warnings ?? [])]"
            :key="warning"
            type="warning"
            class="mt"
          >
            {{ warning }}
          </NAlert>
        </section>
      </NTabPane>

      <NTabPane name="trust" tab="信任密钥">
        <section class="section section-pad">
          <div class="section-title">信任密钥</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="trustForm.keyID" placeholder="Key ID" /></NGi>
            <NGi><NSelect v-model:value="trustForm.algorithm" :options="['local', 'ed25519', 'rsa', 'ecdsa'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="trustForm.owner" placeholder="所有者" /></NGi>
            <NGi><NInput v-model:value="trustForm.expiresAt" placeholder="过期时间 RFC3339，可空" /></NGi>
            <NGi :span="3"><NInput v-model:value="trustForm.publicKey" type="textarea" placeholder="公钥内容，不会在列表中回显" /></NGi>
            <NGi>
              <NSpace vertical>
                <NCheckbox v-model:checked="trustForm.enabled">启用</NCheckbox>
                <NCheckbox v-model:checked="trustForm.revoked">撤销</NCheckbox>
              </NSpace>
            </NGi>
          </NGrid>
          <NButton type="primary" :loading="busy === 'create-trust'" :disabled="!canWrite" @click="createTrustKey">
            保存密钥
          </NButton>
          <NDataTable class="mt" :loading="trustKeysResource.loading.value" :columns="trustColumns" :data="trustKeys" :bordered="false" />
        </section>
      </NTabPane>

      <NTabPane name="phase2" tab="规则社区二期">
        <section class="section section-pad">
          <div class="section-title">账号规则源</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="accountForm.name" placeholder="规则源名称" /></NGi>
            <NGi>
              <NSelect
                v-model:value="accountForm.providerType"
                :options="['https-catalog', 'litewaf-cloud', 'git', 'generic'].map((value) => ({ label: value, value }))"
              />
            </NGi>
            <NGi><NSelect v-model:value="accountForm.providerAdapterID" clearable :options="providerOptions" placeholder="绑定 Provider，可空" /></NGi>
            <NGi><NInput v-model:value="accountForm.endpoint" placeholder="https://... 或本地路径" /></NGi>
            <NGi><NInput v-model:value="accountForm.credentialAlias" placeholder="凭据别名" /></NGi>
            <NGi><NInput v-model:value="accountForm.credentialSecret" type="password" show-password-on="click" placeholder="凭据密钥，仅写入" /></NGi>
            <NGi><NInputNumber v-model:value="accountForm.timeoutSec" :min="1" :max="30" /></NGi>
            <NGi>
              <NSpace align="center">
                <NSwitch v-model:value="accountForm.enabled" />
                <NButton type="primary" :loading="busy === 'create-account'" :disabled="!canWrite" @click="createAccountSource">
                  新增规则源
                </NButton>
              </NSpace>
            </NGi>
          </NGrid>
          <NDataTable
            :loading="accountSourcesResource.loading.value"
            :columns="accountSourceColumns"
            :data="accountSources"
            :bordered="false"
          />
          <NEmpty v-if="!accountSourcesResource.loading.value && accountSources.length === 0" description="暂无账号规则源" />
        </section>

        <section class="section section-pad">
          <div class="section-title">自动导入建议队列</div>
          <NDataTable
            :loading="reviewQueueResource.loading.value"
            :columns="reviewQueueColumns"
            :data="reviewQueue"
            :bordered="false"
          />
          <NEmpty v-if="!reviewQueueResource.loading.value && reviewQueue.length === 0" description="暂无待审核建议" />
        </section>

        <section class="section section-pad">
          <div class="section-title">贡献推送</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="contributionForm.name" placeholder="目标名称" /></NGi>
            <NGi><NSelect v-model:value="contributionForm.provider" :options="['https', 'git', 'generic'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi :span="2"><NInput v-model:value="contributionForm.endpoint" placeholder="https://community.example.com/push" /></NGi>
            <NGi><NInput v-model:value="contributionForm.channel" placeholder="main" /></NGi>
            <NGi><NInput v-model:value="contributionForm.credentialAlias" placeholder="凭据别名" /></NGi>
            <NGi><NInput v-model:value="contributionForm.credentialSecret" type="password" show-password-on="click" placeholder="凭据密钥，仅写入" /></NGi>
            <NGi>
              <NSpace align="center">
                <NSwitch v-model:value="contributionForm.enabled" />
                <NButton
                  type="primary"
                  :loading="busy === 'create-contribution-target'"
                  :disabled="!canWrite"
                  @click="createContributionTarget"
                >
                  新增目标
                </NButton>
              </NSpace>
            </NGi>
          </NGrid>
          <NDataTable
            :loading="contributionTargetsResource.loading.value"
            :columns="contributionTargetColumns"
            :data="contributionTargets"
            :bordered="false"
          />
          <NSpace class="actions">
            <NSelect v-model:value="selectedPushTargetID" class="catalog-select" clearable :options="contributionTargetOptions" placeholder="选择推送目标" />
            <NButton :loading="busy === 'push-preview'" :disabled="!canWrite || pushBlocked" @click="runContributionPush(true)">
              推送预览
            </NButton>
            <NButton type="primary" :loading="busy === 'push-execute'" :disabled="!canWrite || pushBlocked" @click="runContributionPush(false)">
              执行推送
            </NButton>
          </NSpace>
          <NDataTable
            class="mt"
            :loading="contributionPushesResource.loading.value"
            :columns="contributionPushColumns"
            :data="contributionPushes"
            :bordered="false"
          />
        </section>

        <section class="section section-pad">
          <div class="section-title">误报反馈</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NSelect v-model:value="feedbackForm.ruleID" :options="testRuleOptions" filterable placeholder="关联规则" /></NGi>
            <NGi><NSelect v-model:value="feedbackForm.severity" :options="['low', 'medium', 'high'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="feedbackForm.path" placeholder="脱敏路径，可空" /></NGi>
            <NGi>
              <NButton type="primary" :loading="busy === 'create-feedback'" :disabled="!canWrite" @click="createFeedback">
                提交反馈
              </NButton>
            </NGi>
            <NGi :span="4"><NInput v-model:value="feedbackForm.reason" type="textarea" placeholder="误报原因，避免粘贴敏感请求内容" /></NGi>
          </NGrid>
          <NDataTable :loading="feedbackResource.loading.value" :columns="feedbackColumns" :data="feedbackItems" :bordered="false" />
          <NDataTable
            class="mt"
            :loading="feedbackSuggestionsResource.loading.value"
            :columns="feedbackSuggestionColumns"
            :data="feedbackSuggestions"
            :bordered="false"
          />
        </section>
      </NTabPane>

      <NTabPane name="rules" tab="规则与导出">
        <section class="section section-pad">
          <div class="section-title">已导入规则</div>
          <NDataTable :loading="rulesResource.loading.value" :columns="ruleColumns" :data="importedRules" :bordered="false" />
          <NEmpty v-if="!rulesResource.loading.value && importedRules.length === 0" description="暂无导入规则" />
        </section>

        <section class="section section-pad">
          <div class="section-title">贡献导出</div>
          <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
            <NGi><NInput v-model:value="exportForm.packageID" placeholder="包 ID" /></NGi>
            <NGi><NInput v-model:value="exportForm.name" placeholder="包名称" /></NGi>
            <NGi><NInput v-model:value="exportForm.version" placeholder="版本" /></NGi>
            <NGi><NInput v-model:value="exportForm.author" placeholder="作者" /></NGi>
            <NGi><NInput v-model:value="exportForm.license" placeholder="许可证" /></NGi>
            <NGi><NSelect v-model:value="exportForm.signingKeyID" clearable :options="trustKeyOptions" placeholder="签名 Key，可空" /></NGi>
            <NGi :span="3">
              <NSelect v-model:value="exportForm.ruleIDs" multiple filterable :options="exportRuleOptions" placeholder="选择要导出的规则" />
            </NGi>
          </NGrid>
          <NSpace class="actions">
            <NButton :loading="busy === 'export-preview'" :disabled="!canWrite" @click="runExportPreview">导出预览</NButton>
            <NButton type="primary" :loading="busy === 'export'" :disabled="!canWrite" @click="runExport">生成导出包</NButton>
          </NSpace>
          <div v-if="exportPreview" class="preview-grid">
            <NStatistic label="选择规则" :value="exportPreview.selected_rules.length" />
            <NStatistic label="无效规则" :value="exportPreview.invalid.length" />
            <NStatistic label="签名状态" :value="exportPreview.signing_status" />
            <NStatistic label="校验方式" :value="exportPreview.checksum_plan" />
          </div>
          <NInput
            v-if="exportArtifact"
            class="mt"
            type="textarea"
            readonly
            :value="exportArtifact.artifact"
            :autosize="{ minRows: 8, maxRows: 18 }"
          />
        </section>

        <section class="section section-pad">
          <div class="section-title">规则测试</div>
          <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
            <NGi><NSelect v-model:value="testForm.ruleID" :options="testRuleOptions" filterable placeholder="规则" /></NGi>
            <NGi><NSelect v-model:value="testForm.method" :options="['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="testForm.path" placeholder="路径" /></NGi>
            <NGi><NInput v-model:value="testForm.query" type="textarea" placeholder="q=test" /></NGi>
            <NGi><NInput v-model:value="testForm.headers" type="textarea" placeholder="x-demo=value" /></NGi>
            <NGi><NInput v-model:value="testForm.body" type="textarea" placeholder="请求体" /></NGi>
          </NGrid>
          <NSpace class="actions" align="center">
            <NButton type="primary" :loading="busy === 'rule-test'" :disabled="!canWrite" @click="runRuleTest">运行测试</NButton>
            <NTag v-if="testResult" :type="testResult.matched ? 'success' : 'default'">
              {{ testResult.matched ? "命中" : "未命中" }} / {{ testResult.status }}
            </NTag>
          </NSpace>
        </section>
      </NTabPane>
    </NTabs>
  </main>
</template>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-weight: 700;
}

.actions {
  margin-top: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.catalog-select {
  min-width: 240px;
}

.mb {
  margin-bottom: 12px;
}

.mt {
  margin-top: 12px;
}
</style>
