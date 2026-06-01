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
}

export interface SummaryCount {
  key: string
  count: number
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
    warnings: string[]
    gateway_hot_path: string
    remote_sync_enabled: boolean
  }
    rate_limits: number
    advanced_protection?: number
  }
}

export interface RulePackageSignature {
  key_id?: string
  checksum?: string
  signature?: string
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
}

export interface RulePackageImportResult {
  package: RulePackageMetadata
  imported: Rule[]
  changed: Rule[]
  skipped: Rule[]
  invalid: Array<{ rule_id: string; message: string }>
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
