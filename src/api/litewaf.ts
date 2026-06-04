import { apiClient } from "@/api/client"

export interface ListResponse<T> {
  items: T[]
}

export interface ItemResponse<T> {
  item: T
}

export interface LoginUser {
  id: number
  username: string
  role: string
}

export interface LoginResponse {
  access_token: string
  expires_at: string
  user: LoginUser
}

export interface Site {
  id: number
  name: string
  host: string
  upstream: string
  mode: string
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface SiteInput {
  name: string
  host: string
  upstream: string
  mode: string
  enabled: boolean
}

export interface Rule {
  id: number
  name: string
  type: string
  target: string
  action: string
  expression: string
  score: number
  enabled: boolean
  module?: string
  category?: string
  attack_type?: string
  group?: string
  priority?: number
  package_id?: string
  package_version?: string
  package_rule_id?: string
  source_checksum?: string
  signature_status?: string
  review_status?: string
  last_test_status?: string
  remote_catalog_id?: string
  provider_id?: number
  provider_name?: string
  provider_package_ref?: string
  last_synced_version?: string
  pending_update_state?: string
  local_override_state?: string
  export_eligible?: boolean
  export_ineligible_reasons?: string[]
  created_at?: string
  updated_at?: string
}

export interface RuleInput {
  name: string
  type: string
  target: string
  action: string
  expression: string
  score: number
  enabled: boolean
  module?: string
  category?: string
  attack_type?: string
  group?: string
  priority?: number
  package_id?: string
  package_version?: string
  package_rule_id?: string
  source_checksum?: string
  signature_status?: string
  review_status?: string
  last_test_status?: string
  remote_catalog_id?: string
  provider_id?: number
  provider_name?: string
  provider_package_ref?: string
  last_synced_version?: string
  pending_update_state?: string
  local_override_state?: string
  export_eligible?: boolean
  export_ineligible_reasons?: string[]
}

export interface Policy {
  id: number
  name: string
  risk_threshold: number
  default_action: string
  normalization_enabled: boolean
  normalization_decode_passes: number
  normalization_max_value_bytes: number
  body_inspection_enabled: boolean
  body_inspection_content_types: string[]
  body_inspection_path_prefixes: string[]
  body_inspection_max_bytes: number
  oversized_body_action: string
  upload_inspection_enabled: boolean
  upload_max_bytes: number
  upload_size_action: string
  dynamic_ban_enabled: boolean
  dynamic_ban_duration_sec: number
  dynamic_ban_score_threshold: number
  dynamic_ban_trigger_count: number
  dynamic_ban_window_sec: number
  enabled: boolean
  site_ids: number[]
  rule_ids: number[]
  created_at?: string
  updated_at?: string
}

export interface PolicyInput {
  name: string
  risk_threshold: number
  default_action: string
  normalization_enabled: boolean
  normalization_decode_passes: number
  normalization_max_value_bytes: number
  body_inspection_enabled: boolean
  body_inspection_content_types: string[]
  body_inspection_path_prefixes: string[]
  body_inspection_max_bytes: number
  oversized_body_action: string
  upload_inspection_enabled: boolean
  upload_max_bytes: number
  upload_size_action: string
  dynamic_ban_enabled: boolean
  dynamic_ban_duration_sec: number
  dynamic_ban_score_threshold: number
  dynamic_ban_trigger_count: number
  dynamic_ban_window_sec: number
  enabled: boolean
  site_ids: number[]
  rule_ids: number[]
}

export interface AttackLog {
  id: number
  request_id: string
  created_at?: string
  time?: string
  site_id: number
  event_type: string
  client_ip: string
  method: string
  uri: string
  rule_id: number
  rule_type: string
  target: string
  action: string
  disposition: string
  summary: string
  access_list_id: number
  rate_limit_id: number
  module: string
  category: string
  rule_name: string
  attack_type: string
  group_name: string
  counter: string
  window_sec: number
  advanced_target: string
  normalized_value: string
  score: number
  threshold: number
  matched_rule_ids: string
  body_metadata: string
  upload_metadata: string
  ban_reason: string
  ban_duration_sec: number
  ban_remaining_sec: number
  challenge_mode: string
  challenge_result: string
  package_id?: string
  package_version?: string
  package_rule_id?: string
}

export interface AccessLog {
  id: number
  request_id: string
  site_id: number
  host: string
  method: string
  uri: string
  status: number
  upstream_status: number
  duration_ms: number
  client_ip: string
  user_agent: string
  disposition: string
  created_at?: string
  time?: string
}

export interface ObservabilitySummary {
  requests: number
  blocked_requests: number
  waf_matches: number
  rate_limited: number
  score_blocks: number
  body_detections: number
  upload_detections: number
  dynamic_bans: number
  access_control: SummaryCount[]
  top_ips: SummaryCount[]
  top_uris: SummaryCount[]
  top_rules: SummaryCount[]
  attack_types: SummaryCount[]
  attack_protection: SummaryCount[]
  upload_protection: SummaryCount[]
  bot_protection: SummaryCount[]
  dynamic_protection: SummaryCount[]
}

export interface SummaryCount {
  key: string
  count: number
}

export interface ProtectionModuleRisk {
  module: string
  label: string
  message: string
}

export interface ProtectionModuleOverview {
  key: string
  label: string
  category: string
  route: string
  log_module?: string
  rules: number
  enabled: number
  observe: number
  block: number
  allow?: number
  compatibility_source?: string
  warnings: string[]
  evidence: SummaryCount[]
}

export interface ProtectionOverview {
  modules: ProtectionModuleOverview[]
  risks: ProtectionModuleRisk[]
}

export interface ReleaseRecord {
  id?: number
  version: string
  operator?: string
  status?: string
  created_at?: string
  time?: string
  note?: string
  checksum?: string
  config_path?: string
}

export interface PublishPreview {
  summary: {
    sites: number
    rules: number
    policies: number
    access_lists: number
    access_control?: {
      rules: number
      enabled: number
      allow: number
      block: number
      log_only: number
      warnings: string[]
    }
    cc_protection?: {
      rules: number
      enabled: number
      warnings: string[]
    }
    upload_protection?: {
      rules: number
      enabled: number
      extension_rules: number
      size_rules: number
      block: number
      log_only: number
      warnings: string[]
    }
  bot_protection?: {
    rules: number
    enabled: number
    challenges: number
    block: number
    log_only: number
    warnings: string[]
  }
  dynamic_protection?: {
    rules: number
    enabled: number
    dynamic_tokens: number
    page_mutations: number
    waiting_rooms: number
    block: number
    log_only: number
    waiting_room_action: number
    warnings: string[]
  }
    rule_ecosystem?: {
    packages: number
    package_ids: string[]
    signature_status: Record<string, number>
    disabled_imported: number
    untested_blocking: number
    catalog_sources?: number
    catalog_packages?: number
    remote_origin_packages?: number
    provider_adapters?: number
    provider_packages?: number
    provider_origin_packages?: number
    stale_provider_packages?: number
    pending_updates?: number
    warnings: string[]
    gateway_hot_path: string
    remote_sync_enabled: boolean
    }
    rate_limits: number
    advanced_protection?: number
    module_matrix?: ProtectionModuleOverview[]
    risk_warnings?: ProtectionModuleRisk[]
    compatibility_diagnostics?: PublishCompatibilityDiagnostics
  }
}

export interface CompatibilityCounts {
  protection_rules: number
  native: number
  migrated: number
  legacy_fallback: number
  legacy_store: number
  deduplicated: number
}

export interface PublishCompatibilityDiagnostics {
  protection_rules: number
  rate_limits: number
  access_lists: number
  legacy_modules: Record<string, number>
  by_module: Record<string, CompatibilityCounts>
  deduplicated: number
  warnings: string[]
}

export interface ProtectionRuleHealthSummary {
  total: number
  enabled: number
  disabled: number
  by_module: Record<string, number>
  by_category: Record<string, number>
  by_source: Record<string, number>
  by_migration_status: Record<string, number>
  by_site: Record<string, number>
}

export interface LegacyProtectionStoreState {
  store: string
  module: string
  category: string
  total: number
  enabled: number
  migrated: number
  missing: number
  orphaned: number
  duplicates: number
  conflicts: number
  missing_samples: string[]
  orphan_samples: string[]
}

export interface ProtectionRuleHealthIssue {
  type: string
  severity: string
  store?: string
  module?: string
  count: number
  samples: string[]
  message: string
  recommendation: string
}

export interface BackfillHealthState {
  status: string
  last_run_at?: string
  created: number
  updated: number
  skipped: number
  failed: number
  command: string
  recommendation: string
}

export interface ProtectionRuleMigrationHealth {
  generated_at: string
  protection_rules: ProtectionRuleHealthSummary
  legacy_stores: LegacyProtectionStoreState[]
  issues: ProtectionRuleHealthIssue[]
  backfill: BackfillHealthState
  remediation_hints: string[]
}

export interface RulePackageSignature {
  key_id?: string
  checksum?: string
  signature?: string
  expires_at?: string
}

export interface RulePackageMetadata {
  id: string
  name: string
  version: string
  author: string
  license: string
  compatibility: string
  checksum?: string
  signature?: RulePackageSignature
  signature_status: string
  rule_count: number
  warnings: string[]
  created_at?: string
  updated_at?: string
}

export interface RulePackagePreview {
  package: RulePackageMetadata
  added: Rule[]
  changed: Rule[]
  skipped: Rule[]
  invalid: Array<{ rule_id: string; message: string }>
  default_enabled: boolean
  warnings: string[]
  compatibility_status?: string
  source_catalog_id?: string
  provider_id?: number
  provider_name?: string
  provider_package_ref?: string
  entitlement_warnings?: string[]
  retry_state?: string
  trust_status?: string
  blocked?: boolean
  block_reason?: string
}

export interface RulePackageImportResult {
  package: RulePackageMetadata
  imported: Rule[]
  changed: Rule[]
  skipped: Rule[]
  invalid: Array<{ rule_id: string; message: string }>
}

export interface RuleCatalogSource {
  id: number
  name: string
  source: string
  enabled: boolean
  timeout_sec: number
  status: string
  last_sync_at?: string
  last_error?: string
  package_count: number
  created_at?: string
  updated_at?: string
}

export interface RuleCatalogSourceInput {
  name: string
  source: string
  enabled: boolean
  timeout_sec: number
}

export interface RuleCatalogPackage {
  id: number
  catalog_id: number
  package_id: string
  name: string
  version: string
  compatibility: string
  checksum: string
  signature?: RulePackageSignature
  signature_status: string
  updated_at_text: string
  manifest_url: string
  source_identity: string
  sync_status: string
  stale: boolean
  last_synced_at?: string
}

export interface RuleProviderRetryPolicy {
  max_attempts: number
  backoff_sec: number
}

export interface RuleProviderAdapter {
  id: number
  name: string
  provider_type: string
  endpoint: string
  auth_mode: string
  enabled: boolean
  timeout_sec: number
  retry_policy: RuleProviderRetryPolicy
  credential: RuleAccountCredential
  health_status: string
  sync_status: string
  last_sync_at?: string
  last_failed_sync_at?: string
  last_error?: string
  attempt_count: number
  next_retry_at?: string
  retry_exhausted: boolean
  package_count: number
  created_at?: string
  updated_at?: string
}

export interface RuleProviderAdapterInput {
  name: string
  provider_type: string
  endpoint: string
  auth_mode: string
  enabled: boolean
  timeout_sec: number
  retry_policy: RuleProviderRetryPolicy
  credential: Partial<RuleAccountCredential>
  credential_secret?: string
}

export interface RuleProviderPackage {
  id: number
  provider_id: number
  provider_name: string
  provider_type: string
  provider_package_ref: string
  package_id: string
  name: string
  version: string
  compatibility: string
  checksum: string
  signature?: RulePackageSignature
  signature_status: string
  updated_at_text: string
  manifest_url: string
  source_identity: string
  entitlement_state: string
  sync_status: string
  stale: boolean
  last_synced_at?: string
}

export interface RuleTrustKey {
  id: number
  key_id: string
  algorithm: string
  owner: string
  enabled: boolean
  revoked: boolean
  expires_at?: string
  created_at?: string
  updated_at?: string
}

export interface RuleTrustKeyInput {
  key_id: string
  algorithm: string
  owner: string
  public_key?: string
  enabled: boolean
  revoked: boolean
  expires_at?: string
}

export interface RulePackageUpdatePreview {
  package: RulePackageMetadata
  current_version: string
  candidate_version: string
  current_checksum: string
  candidate_checksum: string
  source_catalog_id: number
  added: Rule[]
  changed: Rule[]
  removed: Rule[]
  unchanged: Rule[]
  skipped: Rule[]
  invalid: Array<{ rule_id: string; message: string }>
  warnings: string[]
  signature_status: string
}

export interface RulePackageExportRequest {
  package_id: string
  name: string
  version: string
  author: string
  license: string
  compatibility?: string
  rule_ids: number[]
  signing_key_id?: string
}

export interface RulePackageExportPreview {
  package: RulePackageMetadata
  selected_rules: Rule[]
  invalid: Array<{ rule_id: string; message: string }>
  warnings: string[]
  checksum_plan: string
  signing_status: string
}

export interface RulePackageExportArtifact {
  package: RulePackageMetadata
  artifact: string
  checksum: string
  rule_count: number
  guidance: string[]
  created_at: string
}

export interface RuleAccountCredential {
  alias: string
  fingerprint?: string
  last_four?: string
  expires_at?: string
  last_validated_at?: string
  status: string
}

export interface RuleCommunityAccountSource {
  id: number
  name: string
  provider_type: string
  provider_adapter_id?: number
  provider_adapter_name?: string
  provider_health?: string
  provider_retry_state?: string
  endpoint: string
  enabled: boolean
  timeout_sec: number
  credential: RuleAccountCredential
  subscription_status: string
  entitlement_summary: string
  package_count: number
  status: string
  last_sync_at?: string
  last_error?: string
  recommendation_count: number
}

export interface RuleCommunityAccountSourceInput {
  name: string
  provider_type: string
  provider_adapter_id?: number
  endpoint: string
  enabled: boolean
  timeout_sec: number
  credential: Partial<RuleAccountCredential>
  credential_secret?: string
  subscription_status?: string
  entitlement_summary?: string
  package_count?: number
}

export interface RuleContributionTarget {
  id: number
  name: string
  provider: string
  endpoint: string
  channel: string
  enabled: boolean
  credential: RuleAccountCredential
  status: string
  last_push_at?: string
  last_error?: string
}

export interface RuleContributionTargetInput {
  name: string
  provider: string
  endpoint: string
  channel: string
  enabled: boolean
  credential: Partial<RuleAccountCredential>
  credential_secret?: string
}

export interface RuleContributionPushAttempt {
  id?: number
  target_id: number
  target_name: string
  package_id: string
  package_version: string
  checksum: string
  status: string
  remote_reference?: string
  error?: string
  actor: string
  preview_only: boolean
  created_at?: string
}

export interface RuleReviewQueueItem {
  id: number
  item_type: string
  package_id: string
  package_version: string
  current_version?: string
  source_identity: string
  recommendation: string
  risk_summary: string
  signature_status: string
  compatibility_status: string
  state: string
  decision_reason?: string
  actor?: string
}

export interface RuleFeedback {
  id: number
  rule_id: number
  package_id?: string
  package_rule_id?: string
  attack_log_id?: number
  reason: string
  severity: string
  status: string
  redacted_sample?: Record<string, string>
  actor?: string
}

export interface RuleFeedbackInput {
  rule_id?: number
  package_id?: string
  package_rule_id?: string
  attack_log_id?: number
  reason: string
  severity: string
  redacted_sample?: Record<string, string>
}

export interface RuleFeedbackSuggestion {
  id: number
  feedback_id: number
  rule_id: number
  proposed_change: string
  risk_warning: string
  confidence: string
  state: string
  test_result?: RuleTestResult
  actor?: string
}

export interface RuleTestSample {
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  body: string
  upload_filename: string
  upload_mime: string
  upload_size: number
}

export interface RuleTestResult {
  rule_id: number
  matched: boolean
  target: string
  evaluated_values: string[]
  action: string
  score: number
  status: string
  diagnostics: Record<string, string>
}

export interface AuditLog {
  id: number
  actor: string
  role: string
  action: string
  resource_type: string
  resource_id: string
  result: string
  remote_addr: string
  user_agent: string
  message: string
  created_at?: string
  time?: string
}

export interface AccessListEntry {
  id: number
  name: string
  kind: string
  target: string
  value: string
  match_operator?: string
  header_name?: string
  action: string
  site_id: number
  enabled: boolean
  priority?: number
  created_at?: string
  updated_at?: string
}

export interface AccessListInput {
  name: string
  kind: string
  target: string
  value: string
  match_operator?: string
  header_name?: string
  action: string
  site_id: number
  enabled: boolean
  priority?: number
}

export interface RateLimitRule {
  id: number
  name: string
  scope: string
  match_value: string
  threshold: number
  window_sec: number
  action: string
  ban_duration_sec: number
  violation_threshold: number
  violation_window_sec: number
  site_id: number
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface RateLimitInput {
  name: string
  scope: string
  match_value: string
  threshold: number
  window_sec: number
  action: string
  ban_duration_sec: number
  violation_threshold: number
  violation_window_sec: number
  site_id: number
  enabled: boolean
}

export interface ProtectionRuleMatch {
  path?: string
  path_match?: string
  methods: string[]
  target?: string
  value?: string
  operator?: string
  header_name?: string
  host?: string
}

export interface ProtectionRuleLimit {
  counter: string
  threshold: number
  window_sec: number
  ban_duration_sec: number
}

export interface ProtectionRuleUpload {
  extensions: string[]
  max_bytes: number
}

export interface ProtectionRuleChallenge {
  mode: string
  verify_ttl_sec: number
  failure_action: string
}

export interface ProtectionRuleDynamic {
  mode: string
  token_ttl_sec: number
  token_placement: string
  failure_action: string
  mutation_marker: string
  mutation_max_bytes: number
  queue_capacity: number
  admission_ttl_sec: number
  retry_interval_sec: number
  overflow_action: string
}

export interface ProtectionRuleAction {
  type: string
}

export interface ProtectionRule {
  id: number
  name: string
  module: string
  category: string
  site_id: number
  enabled: boolean
  priority: number
  match: ProtectionRuleMatch
  limit: ProtectionRuleLimit
  upload?: ProtectionRuleUpload
  challenge?: ProtectionRuleChallenge
  dynamic?: ProtectionRuleDynamic
  action: ProtectionRuleAction
  source?: string
  migration_status?: string
  legacy_ref?: string
  created_at?: string
  updated_at?: string
}

export interface ProtectionRuleInput {
  name: string
  module?: string
  category?: string
  site_id: number
  enabled: boolean
  priority?: number
  match: ProtectionRuleMatch
  limit: ProtectionRuleLimit
  upload?: ProtectionRuleUpload
  challenge?: ProtectionRuleChallenge
  dynamic?: ProtectionRuleDynamic
  action: ProtectionRuleAction
}

export interface AttackProtectionRuleRef {
  id: number
  name: string
  type: string
  target: string
  action: string
  score: number
  enabled: boolean
  attack_type: string
  group: string
}

export interface AttackProtectionGroup {
  id: string
  name: string
  module: string
  category: string
  attack_type: string
  action: string
  enabled: boolean
  priority: number
  rule_count: number
  enabled_rule_count: number
  rules: AttackProtectionRuleRef[]
  updated_at?: string
}

export interface AttackProtectionGroupInput {
  action: string
  enabled: boolean
  priority: number
}

export interface VersionInfo {
  name: string
  version: string
  env: string
}

export function getVersion() {
  return apiClient.get<VersionInfo>("/api/v1/version").then((response) => response.data)
}

export function login(payload: { username: string; password: string }) {
  return apiClient.post<LoginResponse>("/api/v1/auth/login", payload).then((response) => response.data)
}

export function getSites() {
  return apiClient.get<ListResponse<Site>>("/api/v1/sites").then((response) => response.data.items)
}

export function createSite(payload: SiteInput) {
  return apiClient.post<ItemResponse<Site>>("/api/v1/sites", payload).then((response) => response.data.item)
}

export function updateSite(id: number, payload: SiteInput) {
  return apiClient.put<ItemResponse<Site>>(`/api/v1/sites/${id}`, payload).then((response) => response.data.item)
}

export function deleteSite(id: number) {
  return apiClient.delete(`/api/v1/sites/${id}`)
}

export function getRules() {
  return apiClient.get<ListResponse<Rule>>("/api/v1/rules").then((response) => response.data.items)
}

export function createRule(payload: RuleInput) {
  return apiClient.post<ItemResponse<Rule>>("/api/v1/rules", payload).then((response) => response.data.item)
}

export function updateRule(id: number, payload: RuleInput) {
  return apiClient.put<ItemResponse<Rule>>(`/api/v1/rules/${id}`, payload).then((response) => response.data.item)
}

export function deleteRule(id: number) {
  return apiClient.delete(`/api/v1/rules/${id}`)
}

export function getRulePackages() {
  return apiClient
    .get<ListResponse<RulePackageMetadata>>("/api/v1/rule-packages")
    .then((response) => response.data.items)
}

export function previewRulePackage(payload: unknown = {}) {
  return apiClient
    .post<ItemResponse<RulePackagePreview>>("/api/v1/rule-packages/preview", { package: payload })
    .then((response) => response.data.item)
}

export function importRulePackage(payload: unknown = {}) {
  return apiClient
    .post<ItemResponse<RulePackageImportResult>>("/api/v1/rule-packages/import", { package: payload })
    .then((response) => response.data.item)
}

export function deleteRulePackage(id: string) {
  return apiClient.delete(`/api/v1/rule-packages/${encodeURIComponent(id)}`)
}

export function getRuleCatalogs() {
  return apiClient
    .get<ListResponse<RuleCatalogSource>>("/api/v1/rule-community/catalogs")
    .then((response) => response.data.items)
}

export function createRuleCatalog(payload: RuleCatalogSourceInput) {
  return apiClient
    .post<ItemResponse<RuleCatalogSource>>("/api/v1/rule-community/catalogs", payload)
    .then((response) => response.data.item)
}

export function syncRuleCatalog(id: number) {
  return apiClient
    .post<ListResponse<RuleCatalogPackage>>(`/api/v1/rule-community/catalogs/${id}/sync`, {})
    .then((response) => response.data.items)
}

export function getRuleCatalogPackages(catalogId: number) {
  return apiClient
    .get<ListResponse<RuleCatalogPackage>>(`/api/v1/rule-community/catalogs/${catalogId}/packages`)
    .then((response) => response.data.items)
}

export function previewRemoteRulePackage(catalogId: number, packageId: string) {
  return apiClient
    .post<ItemResponse<RulePackagePreview>>(
      `/api/v1/rule-community/catalogs/${catalogId}/packages/${encodeURIComponent(packageId)}/preview`,
      {}
    )
    .then((response) => response.data.item)
}

export function previewRulePackageUpdate(catalogId: number, packageId: string) {
  return apiClient
    .post<ItemResponse<RulePackageUpdatePreview>>(
      `/api/v1/rule-community/catalogs/${catalogId}/packages/${encodeURIComponent(packageId)}/update-preview`,
      {}
    )
    .then((response) => response.data.item)
}

export function applyRulePackageUpdate(catalogId: number, packageId: string) {
  return apiClient
    .post<ItemResponse<RulePackageImportResult>>(
      `/api/v1/rule-community/catalogs/${catalogId}/packages/${encodeURIComponent(packageId)}/apply-update`,
      {}
    )
    .then((response) => response.data.item)
}

export function getRuleTrustKeys() {
  return apiClient
    .get<ListResponse<RuleTrustKey>>("/api/v1/rule-community/trust-keys")
    .then((response) => response.data.items)
}

export function createRuleTrustKey(payload: RuleTrustKeyInput) {
  return apiClient
    .post<ItemResponse<RuleTrustKey>>("/api/v1/rule-community/trust-keys", payload)
    .then((response) => response.data.item)
}

export function getRuleProviders() {
  return apiClient
    .get<ListResponse<RuleProviderAdapter>>("/api/v1/rule-community/providers")
    .then((response) => response.data.items)
}

export function createRuleProvider(payload: RuleProviderAdapterInput) {
  return apiClient
    .post<ItemResponse<RuleProviderAdapter>>("/api/v1/rule-community/providers", payload)
    .then((response) => response.data.item)
}

export function updateRuleProvider(id: number, payload: RuleProviderAdapterInput) {
  return apiClient
    .put<ItemResponse<RuleProviderAdapter>>(`/api/v1/rule-community/providers/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteRuleProvider(id: number) {
  return apiClient.delete(`/api/v1/rule-community/providers/${id}`)
}

export function validateRuleProvider(id: number) {
  return apiClient
    .post<ItemResponse<RuleProviderAdapter>>(`/api/v1/rule-community/providers/${id}/validate`, {})
    .then((response) => response.data.item)
}

export function syncRuleProvider(id: number) {
  return apiClient
    .post<ListResponse<RuleProviderPackage> & ItemResponse<RuleProviderAdapter>>(
      `/api/v1/rule-community/providers/${id}/sync`,
      {}
    )
    .then((response) => response.data)
}

export function retryRuleProvider(id: number) {
  return apiClient
    .post<ListResponse<RuleProviderPackage> & ItemResponse<RuleProviderAdapter>>(
      `/api/v1/rule-community/providers/${id}/retry`,
      {}
    )
    .then((response) => response.data)
}

export function getRuleProviderPackages(providerId: number) {
  return apiClient
    .get<ListResponse<RuleProviderPackage>>(`/api/v1/rule-community/providers/${providerId}/packages`)
    .then((response) => response.data.items)
}

export function previewRuleProviderPackage(providerId: number, packageId: string) {
  return apiClient
    .post<ItemResponse<RulePackagePreview>>(
      `/api/v1/rule-community/providers/${providerId}/packages/${encodeURIComponent(packageId)}/preview`,
      {}
    )
    .then((response) => response.data.item)
}

export function importRuleProviderPackage(providerId: number, packageId: string) {
  return apiClient
    .post<ItemResponse<RulePackageImportResult>>(
      `/api/v1/rule-community/providers/${providerId}/packages/${encodeURIComponent(packageId)}/import`,
      {}
    )
    .then((response) => response.data.item)
}

export function previewRulePackageExport(payload: RulePackageExportRequest) {
  return apiClient
    .post<ItemResponse<RulePackageExportPreview>>("/api/v1/rule-community/export/preview", payload)
    .then((response) => response.data.item)
}

export function exportRulePackage(payload: RulePackageExportRequest) {
  return apiClient
    .post<ItemResponse<RulePackageExportArtifact>>("/api/v1/rule-community/export", payload)
    .then((response) => response.data.item)
}

export function getRuleAccountSources() {
  return apiClient
    .get<ListResponse<RuleCommunityAccountSource>>("/api/v1/rule-community/account-sources")
    .then((response) => response.data.items)
}

export function createRuleAccountSource(payload: RuleCommunityAccountSourceInput) {
  return apiClient
    .post<ItemResponse<RuleCommunityAccountSource>>("/api/v1/rule-community/account-sources", payload)
    .then((response) => response.data.item)
}

export function refreshRuleAccountSource(id: number) {
  return apiClient
    .post<ItemResponse<RuleCommunityAccountSource>>(`/api/v1/rule-community/account-sources/${id}/refresh`, {})
    .then((response) => response.data.item)
}

export function getRuleContributionTargets() {
  return apiClient
    .get<ListResponse<RuleContributionTarget>>("/api/v1/rule-community/contribution-targets")
    .then((response) => response.data.items)
}

export function createRuleContributionTarget(payload: RuleContributionTargetInput) {
  return apiClient
    .post<ItemResponse<RuleContributionTarget>>("/api/v1/rule-community/contribution-targets", payload)
    .then((response) => response.data.item)
}

export function getRuleContributionPushes() {
  return apiClient
    .get<ListResponse<RuleContributionPushAttempt>>("/api/v1/rule-community/contribution-pushes")
    .then((response) => response.data.items)
}

export function previewRuleContributionPush(payload: { target_id: number; artifact: RulePackageExportArtifact }) {
  return apiClient
    .post<ItemResponse<RuleContributionPushAttempt>>("/api/v1/rule-community/contribution-pushes/preview", payload)
    .then((response) => response.data.item)
}

export function executeRuleContributionPush(payload: { target_id: number; artifact: RulePackageExportArtifact }) {
  return apiClient
    .post<ItemResponse<RuleContributionPushAttempt>>("/api/v1/rule-community/contribution-pushes", payload)
    .then((response) => response.data.item)
}

export function getRuleReviewQueue() {
  return apiClient
    .get<ListResponse<RuleReviewQueueItem>>("/api/v1/rule-community/review-queue")
    .then((response) => response.data.items)
}

export function decideRuleReviewQueueItem(id: number, payload: { state: string; reason?: string }) {
  return apiClient
    .put<ItemResponse<RuleReviewQueueItem>>(`/api/v1/rule-community/review-queue/${id}`, payload)
    .then((response) => response.data.item)
}

export function getRuleFeedback() {
  return apiClient
    .get<ListResponse<RuleFeedback>>("/api/v1/rule-community/feedback")
    .then((response) => response.data.items)
}

export function createRuleFeedback(payload: RuleFeedbackInput) {
  return apiClient
    .post<ItemResponse<RuleFeedback>>("/api/v1/rule-community/feedback", payload)
    .then((response) => response.data.item)
}

export function getRuleFeedbackSuggestions() {
  return apiClient
    .get<ListResponse<RuleFeedbackSuggestion>>("/api/v1/rule-community/feedback-suggestions")
    .then((response) => response.data.items)
}

export function testRuleFeedbackSuggestion(id: number) {
  return apiClient
    .post<ItemResponse<RuleFeedbackSuggestion>>(`/api/v1/rule-community/feedback-suggestions/${id}/test`, {})
    .then((response) => response.data.item)
}

export function decideRuleFeedbackSuggestion(id: number, payload: { state: string }) {
  return apiClient
    .put<ItemResponse<RuleFeedbackSuggestion>>(`/api/v1/rule-community/feedback-suggestions/${id}`, payload)
    .then((response) => response.data.item)
}

export function testRule(payload: { rule_id?: number; rule?: RuleInput; sample: RuleTestSample }) {
  return apiClient
    .post<ItemResponse<RuleTestResult>>("/api/v1/rules/test", payload)
    .then((response) => response.data.item)
}

export function getPolicies() {
  return apiClient.get<ListResponse<Policy>>("/api/v1/policies").then((response) => response.data.items)
}

export function createPolicy(payload: PolicyInput) {
  return apiClient.post<ItemResponse<Policy>>("/api/v1/policies", payload).then((response) => response.data.item)
}

export function updatePolicy(id: number, payload: PolicyInput) {
  return apiClient
    .put<ItemResponse<Policy>>(`/api/v1/policies/${id}`, payload)
    .then((response) => response.data.item)
}

export function deletePolicy(id: number) {
  return apiClient.delete(`/api/v1/policies/${id}`)
}

export function getAttackLogs(params: Record<string, string | number> = {}) {
  return apiClient
    .get<ListResponse<AttackLog>>("/api/v1/attack-logs", { params })
    .then((response) => response.data.items)
}

export function getAccessLogs(params: Record<string, string | number> = {}) {
  return apiClient
    .get<ListResponse<AccessLog>>("/api/v1/access-logs", { params })
    .then((response) => response.data.items)
}

export function getObservabilitySummary(params: Record<string, string | number> = {}) {
  return apiClient
    .get<ItemResponse<ObservabilitySummary>>("/api/v1/observability/summary", { params })
    .then((response) => response.data.item)
}

export function getProtectionOverview(params: Record<string, string | number> = {}) {
  return apiClient
    .get<ItemResponse<ProtectionOverview>>("/api/v1/protection/overview", { params })
    .then((response) => response.data.item)
}

export function getProtectionMigrationHealth() {
  return apiClient
    .get<ItemResponse<ProtectionRuleMigrationHealth>>("/api/v1/protection/migration-health")
    .then((response) => response.data.item)
}

export function getReleases() {
  return apiClient
    .get<ListResponse<ReleaseRecord>>("/api/v1/releases")
    .then((response) => response.data.items)
}

export function publishRelease(payload: { operator?: string; note?: string } = {}) {
  return apiClient
    .post<ItemResponse<ReleaseRecord>>("/api/v1/releases", payload)
    .then((response) => response.data.item)
}

export function previewRelease() {
  return apiClient.get<PublishPreview>("/api/v1/releases/preview").then((response) => response.data)
}

export function rollbackRelease(version: string) {
  return apiClient
    .post<ItemResponse<ReleaseRecord>>(`/api/v1/releases/${encodeURIComponent(version)}/rollback`, {})
    .then((response) => response.data.item)
}

export function getAuditLogs(params: Record<string, string> = {}) {
  return apiClient
    .get<ListResponse<AuditLog>>("/api/v1/audit-logs", { params })
    .then((response) => response.data.items)
}

export function getAccessLists() {
  return apiClient
    .get<ListResponse<AccessListEntry>>("/api/v1/access-lists")
    .then((response) => response.data.items)
}

export function createAccessList(payload: AccessListInput) {
  return apiClient
    .post<ItemResponse<AccessListEntry>>("/api/v1/access-lists", payload)
    .then((response) => response.data.item)
}

export function updateAccessList(id: number, payload: AccessListInput) {
  return apiClient
    .put<ItemResponse<AccessListEntry>>(`/api/v1/access-lists/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteAccessList(id: number) {
  return apiClient.delete(`/api/v1/access-lists/${id}`)
}

export function getRateLimits() {
  return apiClient
    .get<ListResponse<RateLimitRule>>("/api/v1/rate-limits")
    .then((response) => response.data.items)
}

export function createRateLimit(payload: RateLimitInput) {
  return apiClient
    .post<ItemResponse<RateLimitRule>>("/api/v1/rate-limits", payload)
    .then((response) => response.data.item)
}

export function updateRateLimit(id: number, payload: RateLimitInput) {
  return apiClient
    .put<ItemResponse<RateLimitRule>>(`/api/v1/rate-limits/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteRateLimit(id: number) {
  return apiClient.delete(`/api/v1/rate-limits/${id}`)
}

export function getCCProtectionRules(params: Record<string, string | number | boolean> = {}) {
  return apiClient
    .get<ListResponse<ProtectionRule>>("/api/v1/cc-protection/rules", { params })
    .then((response) => response.data.items)
}

export function createCCProtectionRule(payload: ProtectionRuleInput) {
  return apiClient
    .post<ItemResponse<ProtectionRule>>("/api/v1/cc-protection/rules", payload)
    .then((response) => response.data.item)
}

export function updateCCProtectionRule(id: number, payload: ProtectionRuleInput) {
  return apiClient
    .put<ItemResponse<ProtectionRule>>(`/api/v1/cc-protection/rules/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteCCProtectionRule(id: number) {
  return apiClient.delete(`/api/v1/cc-protection/rules/${id}`)
}

export function getAccessControlRules(params: Record<string, string | number | boolean> = {}) {
  return apiClient
    .get<ListResponse<ProtectionRule>>("/api/v1/access-control/rules", { params })
    .then((response) => response.data.items)
}

export function createAccessControlRule(payload: ProtectionRuleInput) {
  return apiClient
    .post<ItemResponse<ProtectionRule>>("/api/v1/access-control/rules", payload)
    .then((response) => response.data.item)
}

export function updateAccessControlRule(id: number, payload: ProtectionRuleInput) {
  return apiClient
    .put<ItemResponse<ProtectionRule>>(`/api/v1/access-control/rules/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteAccessControlRule(id: number) {
  return apiClient.delete(`/api/v1/access-control/rules/${id}`)
}

export function getUploadProtectionRules(params: Record<string, string | number | boolean> = {}) {
  return apiClient
    .get<ListResponse<ProtectionRule>>("/api/v1/upload-protection/rules", { params })
    .then((response) => response.data.items)
}

export function createUploadProtectionRule(payload: ProtectionRuleInput) {
  return apiClient
    .post<ItemResponse<ProtectionRule>>("/api/v1/upload-protection/rules", payload)
    .then((response) => response.data.item)
}

export function updateUploadProtectionRule(id: number, payload: ProtectionRuleInput) {
  return apiClient
    .put<ItemResponse<ProtectionRule>>(`/api/v1/upload-protection/rules/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteUploadProtectionRule(id: number) {
  return apiClient.delete(`/api/v1/upload-protection/rules/${id}`)
}

export function getBotProtectionRules(params: Record<string, string | number | boolean> = {}) {
  return apiClient
    .get<ListResponse<ProtectionRule>>("/api/v1/bot-protection/rules", { params })
    .then((response) => response.data.items)
}

export function createBotProtectionRule(payload: ProtectionRuleInput) {
  return apiClient
    .post<ItemResponse<ProtectionRule>>("/api/v1/bot-protection/rules", payload)
    .then((response) => response.data.item)
}

export function updateBotProtectionRule(id: number, payload: ProtectionRuleInput) {
  return apiClient
    .put<ItemResponse<ProtectionRule>>(`/api/v1/bot-protection/rules/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteBotProtectionRule(id: number) {
  return apiClient.delete(`/api/v1/bot-protection/rules/${id}`)
}

export function getDynamicProtectionRules(params: Record<string, string | number | boolean> = {}) {
  return apiClient
    .get<ListResponse<ProtectionRule>>("/api/v1/dynamic-protection/rules", { params })
    .then((response) => response.data.items)
}

export function createDynamicProtectionRule(payload: ProtectionRuleInput) {
  return apiClient
    .post<ItemResponse<ProtectionRule>>("/api/v1/dynamic-protection/rules", payload)
    .then((response) => response.data.item)
}

export function updateDynamicProtectionRule(id: number, payload: ProtectionRuleInput) {
  return apiClient
    .put<ItemResponse<ProtectionRule>>(`/api/v1/dynamic-protection/rules/${id}`, payload)
    .then((response) => response.data.item)
}

export function deleteDynamicProtectionRule(id: number) {
  return apiClient.delete(`/api/v1/dynamic-protection/rules/${id}`)
}

export function getAttackProtectionGroups() {
  return apiClient
    .get<ListResponse<AttackProtectionGroup>>("/api/v1/attack-protection/groups")
    .then((response) => response.data.items)
}

export function updateAttackProtectionGroup(attackType: string, payload: AttackProtectionGroupInput) {
  return apiClient
    .put<ItemResponse<AttackProtectionGroup>>(
      `/api/v1/attack-protection/groups/${encodeURIComponent(attackType)}`,
      payload
    )
    .then((response) => response.data.item)
}
