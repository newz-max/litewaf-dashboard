<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { useI18n } from "vue-i18n"
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
import { formatDateTime } from "@/utils/dateTime"

const message = useMessage()
const { t } = useI18n()
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

const packageColumns = computed<DataTableColumns<RulePackageMetadata>>(() => [
  { title: t("ruleEcosystem.columns.packageId"), key: "id" },
  { title: t("ruleEcosystem.columns.version"), key: "version" },
  { title: t("ruleEcosystem.columns.ruleCount"), key: "rule_count" },
  {
    title: t("ruleEcosystem.columns.signature"),
    key: "signature_status",
    render: (row) => statusTag(row.signature_status || "unsigned")
  },
  { title: t("ruleEcosystem.columns.compatibility"), key: "compatibility" }
])

const ruleColumns = computed<DataTableColumns<Rule>>(() => [
  { title: t("ruleEcosystem.columns.rule"), key: "name" },
  { title: t("ruleEcosystem.columns.sourcePackage"), key: "package_id" },
  { title: t("ruleEcosystem.columns.packageVersion"), key: "package_version" },
  { title: t("ruleEcosystem.columns.catalog"), key: "remote_catalog_id", render: (row) => row.remote_catalog_id || "-" },
  { title: t("ruleEcosystem.columns.update"), key: "pending_update_state", render: (row) => statusTag(row.pending_update_state || "current") },
  { title: t("ruleEcosystem.columns.signature"), key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  {
    title: t("ruleEcosystem.columns.test"),
    key: "last_test_status",
    render: (row) => statusTag(row.last_test_status || "untested")
  },
  { title: t("ruleEcosystem.columns.status"), key: "enabled", render: (row) => (row.enabled ? t("common.enabled") : t("common.disabled")) }
])

const catalogColumns = computed<DataTableColumns<RuleCatalogSource>>(() => [
  { title: t("ruleEcosystem.columns.catalog"), key: "name" },
  { title: t("ruleEcosystem.columns.source"), key: "source", ellipsis: { tooltip: true } },
  { title: t("ruleEcosystem.columns.status"), key: "status", render: (row) => statusTag(row.status) },
  { title: t("ruleEcosystem.columns.packageCount"), key: "package_count" },
  {
    title: t("ruleEcosystem.columns.actions"),
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
        { default: () => t("ruleEcosystem.actions.sync") }
      )
  }
])

const catalogPackageColumns = computed<DataTableColumns<RuleCatalogPackage>>(() => [
  { title: t("ruleEcosystem.columns.packageId"), key: "package_id" },
  { title: t("ruleEcosystem.columns.version"), key: "version" },
  { title: t("ruleEcosystem.columns.signature"), key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: t("ruleEcosystem.columns.compatibility"), key: "compatibility" },
  {
    title: t("ruleEcosystem.columns.actions"),
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => runRemotePreview(row) },
            { default: () => t("ruleEcosystem.actions.preview") }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => runUpdatePreview(row) },
            { default: () => t("ruleEcosystem.actions.updatePreview") }
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
            { default: () => t("ruleEcosystem.actions.apply") }
          )
        ]
      })
  }
])

const providerColumns = computed<DataTableColumns<RuleProviderAdapter>>(() => [
  { title: "Provider", key: "name" },
  { title: t("ruleEcosystem.columns.type"), key: "provider_type" },
  { title: t("ruleEcosystem.columns.auth"), key: "auth_mode", render: (row) => statusTag(row.auth_mode || "none") },
  { title: t("ruleEcosystem.columns.health"), key: "health_status", render: (row) => statusTag(row.health_status || "never-synced") },
  { title: t("ruleEcosystem.columns.sync"), key: "sync_status", render: (row) => statusTag(row.sync_status || "never-synced") },
  { title: t("ruleEcosystem.columns.packageCount"), key: "package_count" },
  { title: t("ruleEcosystem.columns.retry"), key: "attempt_count", render: (row) => (row.retry_exhausted ? "exhausted" : String(row.attempt_count || 0)) },
  { title: t("ruleEcosystem.columns.credential"), key: "credential", render: (row) => `${row.credential?.alias || "-"} / ${row.credential?.last_four || "-"}` },
  {
    title: t("ruleEcosystem.columns.actions"),
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
            { default: () => t("ruleEcosystem.actions.validate") }
          ),
          h(
            NButton,
            {
              size: "small",
              disabled: !canWrite.value || !row.enabled,
              loading: busy.value === `sync-provider-${row.id}`,
              onClick: () => runProviderSync(row)
            },
            { default: () => t("ruleEcosystem.actions.sync") }
          ),
          h(
            NButton,
            {
              size: "small",
              disabled: !canWrite.value || !row.enabled,
              loading: busy.value === `retry-provider-${row.id}`,
              onClick: () => runProviderRetry(row)
            },
            { default: () => t("ruleEcosystem.actions.retry") }
          )
        ]
      })
  }
])

const providerPackageColumns = computed<DataTableColumns<RuleProviderPackage>>(() => [
  { title: t("ruleEcosystem.columns.packageId"), key: "package_id" },
  { title: t("ruleEcosystem.columns.version"), key: "version" },
  { title: "Provider", key: "provider_name" },
  { title: t("ruleEcosystem.columns.authorization"), key: "entitlement_state", render: (row) => statusTag(row.entitlement_state || "allowed") },
  { title: t("ruleEcosystem.columns.signature"), key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: t("ruleEcosystem.columns.status"), key: "sync_status", render: (row) => statusTag(row.stale ? "stale" : row.sync_status) },
  {
    title: t("ruleEcosystem.columns.actions"),
    key: "actions",
    render: (row) => {
      const blocked = row.entitlement_state === "unauthorized" || row.entitlement_state === "denied" || row.stale
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value || blocked, onClick: () => runProviderPreview(row) },
            { default: () => t("ruleEcosystem.actions.preview") }
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
            { default: () => t("ruleEcosystem.actions.import") }
          )
        ]
      })
    }
  }
])

const trustColumns = computed<DataTableColumns<RuleTrustKey>>(() => [
  { title: "Key ID", key: "key_id" },
  { title: t("ruleEcosystem.columns.algorithm"), key: "algorithm" },
  { title: t("ruleEcosystem.columns.owner"), key: "owner" },
  { title: t("ruleEcosystem.columns.enabled"), key: "enabled", render: (row) => (row.enabled ? t("ruleEcosystem.yes") : t("ruleEcosystem.no")) },
  { title: t("ruleEcosystem.columns.revoked"), key: "revoked", render: (row) => (row.revoked ? t("ruleEcosystem.yes") : t("ruleEcosystem.no")) },
  { title: t("ruleEcosystem.columns.expiresAt"), key: "expires_at", render: (row) => formatDateTime(row.expires_at) }
])

const accountSourceColumns = computed<DataTableColumns<RuleCommunityAccountSource>>(() => [
  { title: t("ruleEcosystem.columns.ruleSource"), key: "name" },
  { title: t("ruleEcosystem.columns.provider"), key: "provider_type" },
  { title: "Provider", key: "provider_adapter_name", render: (row) => row.provider_adapter_name || "-" },
  { title: t("ruleEcosystem.columns.providerHealth"), key: "provider_health", render: (row) => statusTag(row.provider_health || "-") },
  { title: t("ruleEcosystem.columns.providerRetry"), key: "provider_retry_state", render: (row) => statusTag(row.provider_retry_state || "-") },
  { title: t("ruleEcosystem.columns.subscription"), key: "subscription_status", render: (row) => statusTag(row.subscription_status) },
  { title: t("ruleEcosystem.columns.sync"), key: "status", render: (row) => statusTag(row.status) },
  { title: t("ruleEcosystem.columns.packageCount"), key: "package_count" },
  { title: t("ruleEcosystem.columns.pendingReview"), key: "recommendation_count" },
  { title: t("ruleEcosystem.columns.credential"), key: "credential", render: (row) => `${row.credential?.alias || "-"} / ${row.credential?.last_four || "-"}` },
  {
    title: t("ruleEcosystem.columns.actions"),
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
        { default: () => t("ruleEcosystem.actions.refresh") }
      )
  }
])

const reviewQueueColumns = computed<DataTableColumns<(typeof reviewQueue.value)[number]>>(() => [
  { title: t("ruleEcosystem.columns.itemType"), key: "item_type" },
  { title: t("ruleEcosystem.columns.package"), key: "package_id" },
  { title: t("ruleEcosystem.columns.version"), key: "package_version" },
  { title: t("ruleEcosystem.columns.sourceIdentity"), key: "source_identity" },
  { title: t("ruleEcosystem.columns.signature"), key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: t("ruleEcosystem.columns.status"), key: "state", render: (row) => statusTag(row.state) },
  {
    title: t("ruleEcosystem.columns.actions"),
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value || row.state !== "queued", onClick: () => decideQueue(row.id, "approved") },
            { default: () => t("ruleEcosystem.actions.approve") }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value || row.state !== "queued", onClick: () => decideQueue(row.id, "dismissed") },
            { default: () => t("ruleEcosystem.actions.ignore") }
          )
        ]
      })
  }
])

const contributionTargetColumns = computed<DataTableColumns<RuleContributionTarget>>(() => [
  { title: t("ruleEcosystem.columns.target"), key: "name" },
  { title: t("ruleEcosystem.columns.provider"), key: "provider" },
  { title: t("ruleEcosystem.columns.channel"), key: "channel" },
  { title: t("ruleEcosystem.columns.status"), key: "status", render: (row) => statusTag(row.status) },
  { title: t("ruleEcosystem.columns.credential"), key: "credential", render: (row) => `${row.credential?.alias || "-"} / ${row.credential?.last_four || "-"}` }
])

const contributionPushColumns = computed<DataTableColumns<RuleContributionPushAttempt>>(() => [
  { title: t("ruleEcosystem.columns.package"), key: "package_id" },
  { title: t("ruleEcosystem.columns.target"), key: "target_name" },
  { title: t("ruleEcosystem.columns.status"), key: "status", render: (row) => statusTag(row.status) },
  { title: t("ruleEcosystem.columns.remoteReference"), key: "remote_reference", render: (row) => row.remote_reference || "-" },
  { title: t("ruleEcosystem.columns.actor"), key: "actor" }
])

const feedbackColumns = computed<DataTableColumns<RuleFeedback>>(() => [
  { title: t("ruleEcosystem.columns.rule"), key: "rule_id" },
  { title: t("ruleEcosystem.columns.reason"), key: "reason", ellipsis: { tooltip: true } },
  { title: t("ruleEcosystem.columns.severity"), key: "severity", render: (row) => statusTag(row.severity) },
  { title: t("ruleEcosystem.columns.status"), key: "status", render: (row) => statusTag(row.status) },
  { title: t("ruleEcosystem.columns.actor"), key: "actor", render: (row) => row.actor || "-" }
])

const feedbackSuggestionColumns = computed<DataTableColumns<RuleFeedbackSuggestion>>(() => [
  { title: t("ruleEcosystem.columns.rule"), key: "rule_id" },
  { title: t("ruleEcosystem.columns.recommendation"), key: "proposed_change", ellipsis: { tooltip: true } },
  { title: t("ruleEcosystem.columns.status"), key: "state", render: (row) => statusTag(row.state) },
  {
    title: t("ruleEcosystem.columns.actions"),
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: "small", disabled: !canWrite.value, onClick: () => runSuggestionTest(row.id) }, { default: () => t("ruleEcosystem.actions.test") }),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => decideSuggestion(row.id, "approved") },
            { default: () => t("ruleEcosystem.actions.approve") }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => decideSuggestion(row.id, "rejected") },
            { default: () => t("ruleEcosystem.actions.reject") }
          )
        ]
      })
  }
])

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
    message.success(t("ruleEcosystem.messages.previewGenerated"))
  } finally {
    busy.value = ""
  }
}

async function runImport() {
  busy.value = "local-import"
  try {
    await importRulePackage(parsePackagePayload())
    message.success(t("ruleEcosystem.messages.packageImported"))
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
    message.success(t("ruleEcosystem.messages.catalogCreated"))
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
    message.success(t("ruleEcosystem.messages.catalogSynced"))
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
  message.success(t("ruleEcosystem.messages.remotePreviewDone"))
}

async function runUpdatePreview(row: RuleCatalogPackage) {
  updatePreview.value = await previewRulePackageUpdate(row.catalog_id, row.package_id)
  message.success(t("ruleEcosystem.messages.updatePreviewDone"))
}

async function runApplyUpdate(row: RuleCatalogPackage) {
  busy.value = `apply-${row.catalog_id}-${row.package_id}`
  try {
    await applyRulePackageUpdate(row.catalog_id, row.package_id)
    message.success(t("ruleEcosystem.messages.updateApplied"))
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
    message.success(t("ruleEcosystem.messages.trustKeySaved"))
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
    message.success(t("ruleEcosystem.messages.providerSaved"))
    await providersResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runProviderValidate(row: RuleProviderAdapter) {
  busy.value = `validate-provider-${row.id}`
  try {
    await validateRuleProvider(row.id)
    message.success(t("ruleEcosystem.messages.providerValidated"))
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
    message.success(t("ruleEcosystem.messages.providerSynced"))
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
    message.success(t("ruleEcosystem.messages.providerRetried"))
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
  message.success(t("ruleEcosystem.messages.providerPreviewDone"))
}

async function runProviderImport(row: RuleProviderPackage) {
  busy.value = `import-provider-${row.provider_id}-${row.package_id}`
  try {
    await importRuleProviderPackage(row.provider_id, row.package_id)
    message.success(t("ruleEcosystem.messages.providerImported"))
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
    message.success(t("ruleEcosystem.messages.exportPreviewDone"))
  } finally {
    busy.value = ""
  }
}

async function runExport() {
  busy.value = "export"
  try {
    exportArtifact.value = await exportRulePackage(exportPayload())
    message.success(t("ruleEcosystem.messages.exportGenerated"))
  } finally {
    busy.value = ""
  }
}

async function runRuleTest() {
  if (!testForm.ruleID) {
    message.warning(t("ruleEcosystem.messages.selectRule"))
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
    message.success(t("ruleEcosystem.messages.ruleTestDone"))
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
    message.success(t("ruleEcosystem.messages.accountSourceSaved"))
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
    message.success(t("ruleEcosystem.messages.accountSourceRefreshed"))
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
    message.success(t("ruleEcosystem.messages.contributionTargetSaved"))
    await contributionTargetsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runContributionPush(previewOnly: boolean) {
  if (!exportArtifact.value || !selectedPushTargetID.value) {
    message.warning(t("ruleEcosystem.messages.pushRequiresArtifact"))
    return
  }
  busy.value = previewOnly ? "push-preview" : "push-execute"
  try {
    const payload = { target_id: selectedPushTargetID.value, artifact: exportArtifact.value }
    if (previewOnly) {
      await previewRuleContributionPush(payload)
      message.success(t("ruleEcosystem.messages.pushPreviewPassed"))
    } else {
      await executeRuleContributionPush(payload)
      message.success(t("ruleEcosystem.messages.contributionPushed"))
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
    message.success(t("ruleEcosystem.messages.reviewQueueUpdated"))
    await reviewQueueResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function createFeedback() {
  if (!feedbackForm.ruleID) {
    message.warning(t("ruleEcosystem.messages.selectRule"))
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
    message.success(t("ruleEcosystem.messages.feedbackSubmitted"))
    await Promise.all([feedbackResource.refresh(), feedbackSuggestionsResource.refresh()])
  } finally {
    busy.value = ""
  }
}

async function runSuggestionTest(id: number) {
  busy.value = `suggestion-test-${id}`
  try {
    await testRuleFeedbackSuggestion(id)
    message.success(t("ruleEcosystem.messages.suggestionTestDone"))
    await feedbackSuggestionsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function decideSuggestion(id: number, state: string) {
  busy.value = `suggestion-${id}-${state}`
  try {
    await decideRuleFeedbackSuggestion(id, { state })
    message.success(t("ruleEcosystem.messages.suggestionUpdated"))
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
        <h1 class="page-title">{{ t("ruleEcosystem.title") }}</h1>
        <p class="page-subtitle">{{ t("ruleEcosystem.subtitle") }}</p>
      </div>
    </div>

    <NAlert v-if="!canWrite" type="warning" class="mb">
      {{ t("ruleEcosystem.readOnlyNotice") }}
    </NAlert>

    <NTabs type="line" animated>
      <NTabPane name="local" :tab="t('ruleEcosystem.tabs.local')">
        <NGrid :cols="2" :x-gap="16" :y-gap="16" responsive="screen">
          <NGi>
            <section class="section section-pad">
              <div class="section-title">{{ t("ruleEcosystem.sections.packages") }}</div>
              <LwDataTable
                :scrollbar-props="{ trigger: 'hover' }"
                :loading="packagesResource.loading.value"
                :columns="packageColumns"
                :data="packages"
                :bordered="false"
              />
              <NEmpty v-if="!packagesResource.loading.value && packages.length === 0" :description="t('ruleEcosystem.empty.packages')" />
            </section>
          </NGi>

          <NGi>
            <section class="section section-pad">
              <div class="section-title">{{ t("ruleEcosystem.sections.importPreview") }}</div>
              <NInput
                v-model:value="packageJSON"
                type="textarea"
                :autosize="{ minRows: 8, maxRows: 14 }"
                :placeholder="t('ruleEcosystem.placeholders.packageJson')"
              />
              <NSpace class="actions">
                <NButton :loading="busy === 'local-preview'" :disabled="!canWrite" @click="runPreview">{{ t("ruleEcosystem.actions.preview") }}</NButton>
                <NButton type="primary" :loading="busy === 'local-import'" :disabled="!canWrite" @click="runImport">
                  {{ t("ruleEcosystem.actions.import") }}
                </NButton>
              </NSpace>
              <div v-if="preview" class="preview-grid">
                <NStatistic :label="t('ruleEcosystem.stats.added')" :value="preview.added.length" />
                <NStatistic :label="t('ruleEcosystem.stats.changed')" :value="preview.changed.length" />
                <NStatistic :label="t('ruleEcosystem.stats.skipped')" :value="preview.skipped.length" />
                <NStatistic :label="t('ruleEcosystem.stats.invalid')" :value="preview.invalid.length" />
              </div>
              <NAlert v-for="warning in preview?.warnings ?? []" :key="warning" type="warning" class="mt">
                {{ warning }}
              </NAlert>
            </section>
          </NGi>
        </NGrid>
      </NTabPane>

      <NTabPane name="catalogs" :tab="t('ruleEcosystem.tabs.catalogs')">
        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.catalogSources") }}</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="catalogForm.name" :placeholder="t('ruleEcosystem.placeholders.catalogName')" /></NGi>
            <NGi :span="2"><NInput v-model:value="catalogForm.source" :placeholder="t('ruleEcosystem.placeholders.catalogSource')" /></NGi>
            <NGi><NInputNumber v-model:value="catalogForm.timeoutSec" :min="1" :max="30" /></NGi>
          </NGrid>
          <NSpace class="mb">
            <NSwitch v-model:value="catalogForm.enabled" />
            <NButton type="primary" :loading="busy === 'create-catalog'" :disabled="!canWrite" @click="createCatalog">
              {{ t("ruleEcosystem.actions.createCatalog") }}
            </NButton>
            <NSelect
              v-model:value="activeCatalogID"
              class="catalog-select"
              :options="catalogs.map((item) => ({ label: `${item.name} #${item.id}`, value: item.id }))"
              @update:value="loadCatalogPackages"
            />
          </NSpace>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="catalogsResource.loading.value" :columns="catalogColumns" :data="catalogs" :bordered="false" />
        </section>

        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.catalogPackages") }}</div>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="catalogLoading" :columns="catalogPackageColumns" :data="catalogPackages" :bordered="false" />
          <NEmpty v-if="!catalogLoading && catalogPackages.length === 0" :description="t('ruleEcosystem.empty.catalogPackages')" />
          <div v-if="remotePreview || updatePreview" class="preview-grid">
            <NStatistic :label="t('ruleEcosystem.stats.remoteAdded')" :value="remotePreview?.added.length ?? updatePreview?.added.length ?? 0" />
            <NStatistic :label="t('ruleEcosystem.stats.remoteChanged')" :value="remotePreview?.changed.length ?? updatePreview?.changed.length ?? 0" />
            <NStatistic :label="t('ruleEcosystem.stats.updateRemoved')" :value="updatePreview?.removed.length ?? 0" />
            <NStatistic :label="t('ruleEcosystem.stats.invalidRules')" :value="remotePreview?.invalid.length ?? updatePreview?.invalid.length ?? 0" />
          </div>
        </section>
      </NTabPane>

      <NTabPane name="providers" :tab="t('ruleEcosystem.tabs.providers')">
        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.providerConfig") }}</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="providerForm.name" :placeholder="t('ruleEcosystem.placeholders.providerName')" /></NGi>
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
            <NGi :span="2"><NInput v-model:value="providerForm.endpoint" :placeholder="t('ruleEcosystem.placeholders.providerEndpoint')" /></NGi>
            <NGi><NInput v-model:value="providerForm.credentialAlias" :placeholder="t('ruleEcosystem.placeholders.credentialAlias')" /></NGi>
            <NGi>
              <NInput
                v-model:value="providerForm.credentialSecret"
                type="password"
                show-password-on="click"
                :placeholder="t('ruleEcosystem.placeholders.bearerTokenWriteOnly')"
              />
            </NGi>
            <NGi><NInputNumber v-model:value="providerForm.retryMaxAttempts" :min="1" :max="10" /></NGi>
            <NGi><NInputNumber v-model:value="providerForm.retryBackoffSec" :min="1" :max="3600" /></NGi>
            <NGi>
              <NSpace align="center">
                <NSwitch v-model:value="providerForm.enabled" />
                <NButton type="primary" :loading="busy === 'create-provider'" :disabled="!canWrite" @click="createProvider">
                  {{ t("ruleEcosystem.actions.createProvider") }}
                </NButton>
              </NSpace>
            </NGi>
          </NGrid>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="providersResource.loading.value" :columns="providerColumns" :data="providers" :bordered="false" />
          <NEmpty v-if="!providersResource.loading.value && providers.length === 0" :description="t('ruleEcosystem.empty.providers')" />
        </section>

        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.providerPackages") }}</div>
          <NSpace class="mb">
            <NSelect
              v-model:value="activeProviderID"
              class="catalog-select"
              clearable
              :options="providerOptions"
              :placeholder="t('ruleEcosystem.placeholders.selectProvider')"
              @update:value="loadProviderPackages"
            />
            <NButton :disabled="!activeProviderID" :loading="providerLoading" @click="loadProviderPackages">{{ t("ruleEcosystem.actions.refreshPackages") }}</NButton>
          </NSpace>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="providerLoading" :columns="providerPackageColumns" :data="providerPackages" :bordered="false" />
          <NEmpty v-if="!providerLoading && providerPackages.length === 0" :description="t('ruleEcosystem.empty.providerPackages')" />
          <div v-if="providerPreview" class="preview-grid">
            <NStatistic :label="t('ruleEcosystem.stats.added')" :value="providerPreview.added.length" />
            <NStatistic :label="t('ruleEcosystem.stats.changed')" :value="providerPreview.changed.length" />
            <NStatistic :label="t('ruleEcosystem.stats.retryState')" :value="providerPreview.retry_state || 'ready'" />
            <NStatistic :label="t('ruleEcosystem.stats.trustState')" :value="providerPreview.trust_status || providerPreview.package.signature_status" />
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

      <NTabPane name="trust" :tab="t('ruleEcosystem.tabs.trust')">
        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.trustKeys") }}</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="trustForm.keyID" placeholder="Key ID" /></NGi>
            <NGi><NSelect v-model:value="trustForm.algorithm" :options="['local', 'ed25519', 'rsa', 'ecdsa'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="trustForm.owner" :placeholder="t('ruleEcosystem.placeholders.owner')" /></NGi>
            <NGi><NInput v-model:value="trustForm.expiresAt" :placeholder="t('ruleEcosystem.placeholders.expiresAt')" /></NGi>
            <NGi :span="3"><NInput v-model:value="trustForm.publicKey" type="textarea" :placeholder="t('ruleEcosystem.placeholders.publicKey')" /></NGi>
            <NGi>
              <NSpace vertical>
                <NCheckbox v-model:checked="trustForm.enabled">{{ t("ruleEcosystem.columns.enabled") }}</NCheckbox>
                <NCheckbox v-model:checked="trustForm.revoked">{{ t("ruleEcosystem.columns.revoked") }}</NCheckbox>
              </NSpace>
            </NGi>
          </NGrid>
          <NButton type="primary" :loading="busy === 'create-trust'" :disabled="!canWrite" @click="createTrustKey">
            {{ t("ruleEcosystem.actions.saveKey") }}
          </NButton>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" class="mt" :loading="trustKeysResource.loading.value" :columns="trustColumns" :data="trustKeys" :bordered="false" />
        </section>
      </NTabPane>

      <NTabPane name="phase2" :tab="t('ruleEcosystem.tabs.phase2')">
        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.accountSources") }}</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="accountForm.name" :placeholder="t('ruleEcosystem.placeholders.accountSourceName')" /></NGi>
            <NGi>
              <NSelect
                v-model:value="accountForm.providerType"
                :options="['https-catalog', 'litewaf-cloud', 'git', 'generic'].map((value) => ({ label: value, value }))"
              />
            </NGi>
            <NGi><NSelect v-model:value="accountForm.providerAdapterID" clearable :options="providerOptions" :placeholder="t('ruleEcosystem.placeholders.optionalProvider')" /></NGi>
            <NGi><NInput v-model:value="accountForm.endpoint" :placeholder="t('ruleEcosystem.placeholders.localPath')" /></NGi>
            <NGi><NInput v-model:value="accountForm.credentialAlias" :placeholder="t('ruleEcosystem.placeholders.credentialAlias')" /></NGi>
            <NGi><NInput v-model:value="accountForm.credentialSecret" type="password" show-password-on="click" :placeholder="t('ruleEcosystem.placeholders.credentialSecretWriteOnly')" /></NGi>
            <NGi><NInputNumber v-model:value="accountForm.timeoutSec" :min="1" :max="30" /></NGi>
            <NGi>
              <NSpace align="center">
                <NSwitch v-model:value="accountForm.enabled" />
                <NButton type="primary" :loading="busy === 'create-account'" :disabled="!canWrite" @click="createAccountSource">
                  {{ t("ruleEcosystem.actions.createRuleSource") }}
                </NButton>
              </NSpace>
            </NGi>
          </NGrid>
          <LwDataTable
            :scrollbar-props="{ trigger: 'hover' }"
            :loading="accountSourcesResource.loading.value"
            :columns="accountSourceColumns"
            :data="accountSources"
            :bordered="false"
          />
          <NEmpty v-if="!accountSourcesResource.loading.value && accountSources.length === 0" :description="t('ruleEcosystem.empty.accountSources')" />
        </section>

        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.reviewQueue") }}</div>
          <LwDataTable
            :scrollbar-props="{ trigger: 'hover' }"
            :loading="reviewQueueResource.loading.value"
            :columns="reviewQueueColumns"
            :data="reviewQueue"
            :bordered="false"
          />
          <NEmpty v-if="!reviewQueueResource.loading.value && reviewQueue.length === 0" :description="t('ruleEcosystem.empty.reviewQueue')" />
        </section>

        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.contributionPush") }}</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="contributionForm.name" :placeholder="t('ruleEcosystem.placeholders.targetName')" /></NGi>
            <NGi><NSelect v-model:value="contributionForm.provider" :options="['https', 'git', 'generic'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi :span="2"><NInput v-model:value="contributionForm.endpoint" placeholder="https://community.example.com/push" /></NGi>
            <NGi><NInput v-model:value="contributionForm.channel" placeholder="main" /></NGi>
            <NGi><NInput v-model:value="contributionForm.credentialAlias" :placeholder="t('ruleEcosystem.placeholders.credentialAlias')" /></NGi>
            <NGi><NInput v-model:value="contributionForm.credentialSecret" type="password" show-password-on="click" :placeholder="t('ruleEcosystem.placeholders.credentialSecretWriteOnly')" /></NGi>
            <NGi>
              <NSpace align="center">
                <NSwitch v-model:value="contributionForm.enabled" />
                <NButton
                  type="primary"
                  :loading="busy === 'create-contribution-target'"
                  :disabled="!canWrite"
                  @click="createContributionTarget"
                >
                  {{ t("ruleEcosystem.actions.createTarget") }}
                </NButton>
              </NSpace>
            </NGi>
          </NGrid>
          <LwDataTable
            :scrollbar-props="{ trigger: 'hover' }"
            :loading="contributionTargetsResource.loading.value"
            :columns="contributionTargetColumns"
            :data="contributionTargets"
            :bordered="false"
          />
          <NSpace class="actions">
            <NSelect v-model:value="selectedPushTargetID" class="catalog-select" clearable :options="contributionTargetOptions" :placeholder="t('ruleEcosystem.placeholders.selectPushTarget')" />
            <NButton :loading="busy === 'push-preview'" :disabled="!canWrite || pushBlocked" @click="runContributionPush(true)">
              {{ t("ruleEcosystem.actions.pushPreview") }}
            </NButton>
            <NButton type="primary" :loading="busy === 'push-execute'" :disabled="!canWrite || pushBlocked" @click="runContributionPush(false)">
              {{ t("ruleEcosystem.actions.executePush") }}
            </NButton>
          </NSpace>
          <LwDataTable
            :scrollbar-props="{ trigger: 'hover' }"
            class="mt"
            :loading="contributionPushesResource.loading.value"
            :columns="contributionPushColumns"
            :data="contributionPushes"
            :bordered="false"
          />
        </section>

        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.falsePositiveFeedback") }}</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NSelect v-model:value="feedbackForm.ruleID" :options="testRuleOptions" filterable :placeholder="t('ruleEcosystem.placeholders.relatedRule')" /></NGi>
            <NGi><NSelect v-model:value="feedbackForm.severity" :options="['low', 'medium', 'high'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="feedbackForm.path" :placeholder="t('ruleEcosystem.placeholders.redactedPath')" /></NGi>
            <NGi>
              <NButton type="primary" :loading="busy === 'create-feedback'" :disabled="!canWrite" @click="createFeedback">
                {{ t("ruleEcosystem.actions.submitFeedback") }}
              </NButton>
            </NGi>
            <NGi :span="4"><NInput v-model:value="feedbackForm.reason" type="textarea" :placeholder="t('ruleEcosystem.placeholders.falsePositiveReason')" /></NGi>
          </NGrid>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="feedbackResource.loading.value" :columns="feedbackColumns" :data="feedbackItems" :bordered="false" />
          <LwDataTable
            :scrollbar-props="{ trigger: 'hover' }"
            class="mt"
            :loading="feedbackSuggestionsResource.loading.value"
            :columns="feedbackSuggestionColumns"
            :data="feedbackSuggestions"
            :bordered="false"
          />
        </section>
      </NTabPane>

      <NTabPane name="rules" :tab="t('ruleEcosystem.tabs.rules')">
        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.importedRules") }}</div>
          <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :loading="rulesResource.loading.value" :columns="ruleColumns" :data="importedRules" :bordered="false" />
          <NEmpty v-if="!rulesResource.loading.value && importedRules.length === 0" :description="t('ruleEcosystem.empty.importedRules')" />
        </section>

        <section class="section section-pad">
          <div class="section-title">{{ t("ruleEcosystem.sections.contributionExport") }}</div>
          <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
            <NGi><NInput v-model:value="exportForm.packageID" :placeholder="t('ruleEcosystem.columns.packageId')" /></NGi>
            <NGi><NInput v-model:value="exportForm.name" :placeholder="t('ruleEcosystem.placeholders.packageName')" /></NGi>
            <NGi><NInput v-model:value="exportForm.version" :placeholder="t('ruleEcosystem.columns.version')" /></NGi>
            <NGi><NInput v-model:value="exportForm.author" :placeholder="t('ruleEcosystem.placeholders.author')" /></NGi>
            <NGi><NInput v-model:value="exportForm.license" :placeholder="t('ruleEcosystem.placeholders.license')" /></NGi>
            <NGi><NSelect v-model:value="exportForm.signingKeyID" clearable :options="trustKeyOptions" :placeholder="t('ruleEcosystem.placeholders.optionalSigningKey')" /></NGi>
            <NGi :span="3">
              <NSelect v-model:value="exportForm.ruleIDs" multiple filterable :options="exportRuleOptions" :placeholder="t('ruleEcosystem.placeholders.selectExportRules')" />
            </NGi>
          </NGrid>
          <NSpace class="actions">
            <NButton :loading="busy === 'export-preview'" :disabled="!canWrite" @click="runExportPreview">{{ t("ruleEcosystem.actions.exportPreview") }}</NButton>
            <NButton type="primary" :loading="busy === 'export'" :disabled="!canWrite" @click="runExport">{{ t("ruleEcosystem.actions.generateExport") }}</NButton>
          </NSpace>
          <div v-if="exportPreview" class="preview-grid">
            <NStatistic :label="t('ruleEcosystem.stats.selectedRules')" :value="exportPreview.selected_rules.length" />
            <NStatistic :label="t('ruleEcosystem.stats.invalidRules')" :value="exportPreview.invalid.length" />
            <NStatistic :label="t('ruleEcosystem.stats.signingStatus')" :value="exportPreview.signing_status" />
            <NStatistic :label="t('ruleEcosystem.stats.checksumPlan')" :value="exportPreview.checksum_plan" />
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
          <div class="section-title">{{ t("ruleEcosystem.sections.ruleTest") }}</div>
          <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
            <NGi><NSelect v-model:value="testForm.ruleID" :options="testRuleOptions" filterable :placeholder="t('ruleEcosystem.placeholders.rule')" /></NGi>
            <NGi><NSelect v-model:value="testForm.method" :options="['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="testForm.path" :placeholder="t('ruleEcosystem.placeholders.path')" /></NGi>
            <NGi><NInput v-model:value="testForm.query" type="textarea" placeholder="q=test" /></NGi>
            <NGi><NInput v-model:value="testForm.headers" type="textarea" placeholder="x-demo=value" /></NGi>
            <NGi><NInput v-model:value="testForm.body" type="textarea" :placeholder="t('ruleEcosystem.placeholders.body')" /></NGi>
          </NGrid>
          <NSpace class="actions" align="center">
            <NButton type="primary" :loading="busy === 'rule-test'" :disabled="!canWrite" @click="runRuleTest">{{ t("ruleEcosystem.actions.runTest") }}</NButton>
            <NTag v-if="testResult" :type="testResult.matched ? 'success' : 'default'">
              {{ testResult.matched ? t("ruleEcosystem.matched") : t("ruleEcosystem.notMatched") }} / {{ testResult.status }}
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
