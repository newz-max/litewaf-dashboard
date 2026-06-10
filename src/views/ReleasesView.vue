<script setup lang="ts">
import { computed, h, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useDialog, useMessage, NButton, NList, NListItem, NSpace, NTag, type DataTableColumns } from "naive-ui"
import {
  getReleases,
  previewRelease,
  publishRelease,
  rollbackRelease,
  type ProtectionModuleOverview,
  type ProtectionModuleRisk,
  type ReleaseRecord
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"
import { formatDateTime } from "@/utils/dateTime"

const message = useMessage()
const dialog = useDialog()
const { t } = useI18n()
const authStore = useAuthStore()
const releasesResource = useApiResource(getReleases)
const releases = computed(() => [...(releasesResource.data.value ?? [])])
const publishing = ref(false)

const columns = computed<DataTableColumns<ReleaseRecord>>(() => [
  { title: t("releases.columns.version"), key: "version" },
  { title: t("releases.columns.operator"), key: "operator" },
  { title: t("releases.columns.status"), key: "status" },
  { title: t("releases.columns.time"), key: "time", render: (row) => formatDateTime(row.time) },
  { title: t("releases.columns.configPath"), key: "config_path" },
  { title: t("releases.columns.note"), key: "note" },
  {
    title: t("releases.columns.actions"),
    key: "actions",
    render(row: ReleaseRecord) {
      if (!authStore.canWrite || row.status !== "success" || !row.version) {
        return null
      }
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: "small",
              onClick: () => rollback(row.version)
            },
            { default: () => t("releases.rollback") }
          )
        ]
      })
    }
  }
])

async function publishNow() {
  const preview = await previewRelease()
  const moduleSummary = (preview.summary.module_matrix ?? [])
    .filter((item) => item.rules > 0 || item.enabled > 0 || item.warnings.length > 0)
  const moduleText = moduleSummary.length > 0
    ? t("releases.preview.moduleSummary", {
        items: moduleSummary
          .map((item) => t("releases.preview.moduleItem", { label: item.label, enabled: item.enabled, rules: item.rules }))
          .join(t("releases.preview.itemSeparator"))
      })
    : ""
  const ipList = preview.summary.ip_access_list
  const ipListText = ipList
    ? t("releases.preview.ipList", { enabled: ipList.enabled, total: ipList.total, exact: ipList.exact_ip, cidr: ipList.cidr })
    : ""
  const compatibilityText = preview.summary.rate_limits > 0
    ? t("releases.preview.compatibility", { count: preview.summary.rate_limits })
    : ""
  const diagnostics = preview.summary.compatibility_diagnostics
  const diagnosticsText = diagnostics
    ? t("releases.preview.diagnostics", { rules: diagnostics.protection_rules, deduplicated: diagnostics.deduplicated })
    : ""
  const validation = preview.summary.application_validation
  const validationText = validation
    ? t("releases.preview.validation", { errors: validation.errors, warnings: validation.warnings })
    : ""
  const deployment = preview.summary.listener_deployment_mode
  const deploymentText = deployment
    ? t("releases.preview.deployment", {
        mode: deployment.mode,
        range: deployment.bridge_range_config
          ? t("releases.preview.deploymentRange", { range: deployment.raw_port_range || t("releases.portRangeUnset") })
          : ""
      })
    : ""
  dialog.warning({
    title: t("releases.confirmTitle"),
    content: () => renderPublishPreview(
      t("releases.preview.summary", {
        applications: preview.summary.applications,
        listeners: preview.summary.application_listeners,
        certificates: preview.summary.certificates,
        rules: preview.summary.rules,
        policies: preview.summary.policies,
        advanced: preview.summary.advanced_protection ?? 0,
        details: [deploymentText, validationText, moduleText, ipListText, compatibilityText, diagnosticsText].join("")
      }),
      moduleSummary,
      preview.summary.risk_warnings ?? [],
      validation?.issues ?? [],
      deployment?.warnings ?? []
    ),
    positiveText: t("releases.publish"),
    negativeText: t("common.cancel"),
    onPositiveClick: async () => {
      publishing.value = true
      try {
        const record = await publishRelease({ note: t("releases.dashboardPublishNote") })
        message.success(t("releases.published", { version: record.version }))
        await releasesResource.refresh()
      } finally {
        publishing.value = false
      }
    }
  })
}

function renderPublishPreview(
  summary: string,
  modules: ProtectionModuleOverview[],
  risks: ProtectionModuleRisk[],
  applicationIssues: Array<{ severity: string; category: string; message: string }>,
  deploymentWarnings: string[]
) {
  return h("div", { class: "publish-preview" }, [
    h("p", summary),
    applicationIssues.length > 0
      ? h(
          "div",
          { class: "publish-risk-list" },
          applicationIssues.slice(0, 6).map((issue) =>
            h("div", { class: "publish-risk", key: `${issue.category}-${issue.message}` }, [
              h(NTag, { size: "small", type: issue.severity === "error" ? "error" : "warning" }, { default: () => issue.category }),
              h("div", { class: "publish-risk-body" }, [h("strong", issue.message)])
            ])
          )
        )
      : null,
    deploymentWarnings.length > 0
      ? h(
          "div",
          { class: "publish-risk-list" },
          deploymentWarnings.map((warning) =>
            h("div", { class: "publish-risk", key: warning }, [
              h(NTag, { size: "small", type: "warning" }, { default: () => t("releases.deploymentTag") }),
              h("div", { class: "publish-risk-body" }, [h("strong", warning)])
            ])
          )
        )
      : null,
    modules.length > 0
      ? h(
          NList,
          { class: "publish-preview-list" },
          {
            default: () => modules.map((module) =>
              h(
                NListItem,
                { key: module.key },
                {
                  default: () => t("releases.preview.moduleRow", {
                    label: module.label,
                    enabled: module.enabled,
                    rules: module.rules,
                    observe: module.observe,
                    block: module.block
                  }),
                  suffix: () => module.compatibility_source
                    ? h(NTag, { size: "small", type: "info" }, { default: () => t("releases.preview.compatible", { source: module.compatibility_source }) })
                    : null
                }
              )
            )
          }
        )
      : null,
    risks.length > 0
      ? h(
          "div",
          { class: "publish-risk-list" },
          risks.slice(0, 5).map((risk) =>
            h("div", { class: "publish-risk", key: `${risk.module}-${risk.message}` }, [
              h(NTag, { size: "small", type: "warning" }, { default: () => risk.label }),
              h("div", { class: "publish-risk-body" }, [
                h("strong", risk.rule_name ? `${risk.rule_name}: ${risk.message}` : risk.message),
                risk.scope ? h("span", t("releases.preview.scope", { value: risk.scope })) : null,
                risk.action ? h("span", t("releases.preview.action", { value: risk.action })) : null,
                risk.impact ? h("span", t("releases.preview.impact", { value: risk.impact })) : null,
                risk.recommendation ? h("span", t("releases.preview.recommendation", { value: risk.recommendation })) : null
              ])
            ])
          )
        )
      : null
  ])
}

async function rollback(version: string) {
  const record = await rollbackRelease(version)
  message.success(t("releases.rolledBack", { version: record.version }))
  await releasesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("releases.title") }}</h1>
        <p class="page-subtitle">{{ t("releases.subtitle") }}</p>
      </div>
      <NButton v-if="authStore.canWrite" type="primary" :loading="publishing" @click="publishNow">
        {{ t("releases.publishNew") }}
      </NButton>
    </div>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="releasesResource.loading.value"
        :columns="columns"
        :data="releases"
        :bordered="false"
      />
      <NEmpty v-if="!releasesResource.loading.value && releases.length === 0" :description="t('releases.empty')" />
      <NAlert v-if="releasesResource.error.value" type="error" style="margin-top: 12px">
        {{ releasesResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>

<style scoped>
.publish-preview-list {
  margin-top: 8px;
}

.publish-risk-list {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.publish-risk {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.publish-risk-body {
  display: grid;
  gap: 2px;
}
</style>
