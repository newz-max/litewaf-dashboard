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
}

export interface Policy {
  id: number
  name: string
  risk_threshold: number
  default_action: string
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
  enabled: boolean
  site_ids: number[]
  rule_ids: number[]
}

export interface AttackLog {
  id: string
  created_at?: string
  time?: string
  site_id?: string
  site?: string
  client_ip?: string
  ip?: string
  uri: string
  rule_id?: string
  rule?: string
  action: string
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
    rate_limits: number
  }
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
  action: string
  site_id: number
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface AccessListInput {
  name: string
  kind: string
  target: string
  value: string
  action: string
  site_id: number
  enabled: boolean
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
  site_id: number
  enabled: boolean
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

export function getAttackLogs() {
  return apiClient
    .get<ListResponse<AttackLog>>("/api/v1/attack-logs")
    .then((response) => response.data.items)
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
