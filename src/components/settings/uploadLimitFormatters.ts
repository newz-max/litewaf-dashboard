import type { ComposerTranslation } from "vue-i18n"
import type { UploadLimitSummary } from "@/api/litewaf"

export interface UploadLimitRow {
  key: string
  layer: string
  name: string
  value: string
  source: string
  stage: string
  eventVisible: string
  policyDetails: boolean
}

export function formatBytes(value?: number) {
  if (!value || value <= 0) {
    return "-"
  }
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MiB`
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KiB`
  }
  return `${value} B`
}

export function formatEventVisible(t: ComposerTranslation, value: boolean) {
  return value ? t("settings.uploadLimits.eventVisibleYes") : t("settings.uploadLimits.eventVisibleNo")
}

export function formatStage(t: ComposerTranslation, value: string) {
  return t(`settings.uploadLimits.stages.${value}`)
}

export function formatSource(t: ComposerTranslation, value: string) {
  return t(`settings.uploadLimits.sources.${value}`)
}

export function uploadLimitRows(t: ComposerTranslation, summary?: UploadLimitSummary): UploadLimitRow[] {
  if (!summary) {
    return []
  }

  return [
    {
      key: "gateway_client_max_body_size",
      layer: summary.gateway_client_max_body_size.layer,
      name: t("settings.uploadLimits.gateway"),
      value: summary.gateway_client_max_body_size.value,
      source: formatSource(t, summary.gateway_client_max_body_size.source),
      stage: formatStage(t, summary.gateway_client_max_body_size.stage),
      eventVisible: formatEventVisible(t, summary.gateway_client_max_body_size.event_visible),
      policyDetails: false
    },
    {
      key: "body_inspection_limit",
      layer: summary.body_inspection_limit.layer,
      name: t("settings.uploadLimits.bodyInspection"),
      value: t("settings.uploadLimits.policyDerived", {
        enabled: summary.body_inspection_limit.enabled_policies ?? 0,
        min: formatBytes(summary.body_inspection_limit.min_bytes),
        max: formatBytes(summary.body_inspection_limit.max_bytes)
      }),
      source: formatSource(t, summary.body_inspection_limit.source),
      stage: formatStage(t, summary.body_inspection_limit.stage),
      eventVisible: formatEventVisible(t, summary.body_inspection_limit.event_visible),
      policyDetails: true
    },
    {
      key: "upload_protection",
      layer: summary.upload_protection.layer,
      name: t("settings.uploadLimits.uploadProtection"),
      value: t("settings.uploadLimits.ruleSummary", {
        enabled: summary.upload_protection.enabled_rules,
        size: summary.upload_protection.size_rules,
        max: formatBytes(summary.upload_protection.max_bytes)
      }),
      source: formatSource(t, summary.upload_protection.source),
      stage: formatStage(t, summary.upload_protection.stage),
      eventVisible: formatEventVisible(t, summary.upload_protection.event_visible),
      policyDetails: false
    }
  ]
}
