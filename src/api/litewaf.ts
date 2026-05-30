import { apiClient } from "@/api/client"

export interface ListResponse<T> {
  items: T[]
}

export interface Site {
  id: string
  name: string
  host: string
  upstream: string
  mode: string
  enabled?: boolean
  status?: string
}

export interface Rule {
  id: string
  name: string
  target: string
  action: string
  score: number
  enabled: boolean
  tags?: string[]
}

export interface Policy {
  id: string
  name: string
  risk_threshold?: number
  threshold?: number
  default_action?: string
  action?: string
  enabled_modules?: string[]
  modules?: string
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
  version: string
  operator?: string
  status?: string
  time?: string
  note?: string
}

export interface VersionInfo {
  name: string
  version: string
  env: string
}

export function getVersion() {
  return apiClient.get<VersionInfo>("/api/v1/version").then((response) => response.data)
}

export function getSites() {
  return apiClient.get<ListResponse<Site>>("/api/v1/sites").then((response) => response.data.items)
}

export function getRules() {
  return apiClient.get<ListResponse<Rule>>("/api/v1/rules").then((response) => response.data.items)
}

export function getPolicies() {
  return apiClient.get<ListResponse<Policy>>("/api/v1/policies").then((response) => response.data.items)
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
