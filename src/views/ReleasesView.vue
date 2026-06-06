<script setup lang="ts">
import { computed, h, ref } from "vue"
import { useDialog, useMessage, NButton, NList, NListItem, NSpace, NTag } from "naive-ui"
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

const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const releasesResource = useApiResource(getReleases)
const releases = computed(() => [...(releasesResource.data.value ?? [])])
const publishing = ref(false)

const columns = [
  { title: "版本", key: "version" },
  { title: "操作人", key: "operator" },
  { title: "状态", key: "status" },
  { title: "时间", key: "time" },
  { title: "配置路径", key: "config_path" },
  { title: "说明", key: "note" },
  {
    title: "操作",
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
            { default: () => "回滚" }
          )
        ]
      })
    }
  }
]

async function publishNow() {
  const preview = await previewRelease()
  const moduleSummary = (preview.summary.module_matrix ?? [])
    .filter((item) => item.rules > 0 || item.enabled > 0 || item.warnings.length > 0)
  const moduleText = moduleSummary.length > 0
    ? `模块化防护包含 ${moduleSummary.map((item) => `${item.label} ${item.enabled}/${item.rules}`).join("、")}。`
    : ""
  const ipList = preview.summary.ip_access_list
  const ipListText = ipList
    ? `IP 黑白名单启用 ${ipList.enabled}/${ipList.total}，Exact ${ipList.exact_ip} 条、CIDR ${ipList.cidr} 条。`
    : ""
  const compatibilityText = preview.summary.rate_limits > 0
    ? `兼容字段保留 ${preview.summary.rate_limits} 条旧限流配置。`
    : ""
  const diagnostics = preview.summary.compatibility_diagnostics
  const diagnosticsText = diagnostics
    ? `兼容诊断：protection_rules ${diagnostics.protection_rules} 条，legacy_ref 去重 ${diagnostics.deduplicated} 条。`
    : ""
  const validation = preview.summary.application_validation
  const validationText = validation
    ? `应用校验 ${validation.errors} 个错误、${validation.warnings} 个警告。`
    : ""
  const deployment = preview.summary.listener_deployment_mode
  const deploymentText = deployment
    ? `监听模式 ${deployment.mode}${deployment.bridge_range_config ? `，端口范围 ${deployment.raw_port_range || "未配置"}` : ""}。`
    : ""
  dialog.warning({
    title: "确认发布",
    content: () => renderPublishPreview(
      `将发布 ${preview.summary.applications} 个防护应用、${preview.summary.application_listeners} 个监听、${preview.summary.certificates} 个证书、${preview.summary.rules} 条规则、${preview.summary.policies} 个策略、${preview.summary.advanced_protection ?? 0} 项高级防护配置。${deploymentText}${validationText}${moduleText}${ipListText}${compatibilityText}${diagnosticsText}`,
      moduleSummary,
      preview.summary.risk_warnings ?? [],
      validation?.issues ?? [],
      deployment?.warnings ?? []
    ),
    positiveText: "发布",
    negativeText: "取消",
    onPositiveClick: async () => {
      publishing.value = true
      try {
        const record = await publishRelease({ note: "dashboard publish" })
        message.success(`已发布 ${record.version}`)
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
              h(NTag, { size: "small", type: "warning" }, { default: () => "部署" }),
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
                  default: () => `${module.label}：启用 ${module.enabled} / 总数 ${module.rules}，观察 ${module.observe}，阻断 ${module.block}`,
                  suffix: () => module.compatibility_source
                    ? h(NTag, { size: "small", type: "info" }, { default: () => `兼容 ${module.compatibility_source}` })
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
                h("strong", risk.rule_name ? `${risk.rule_name}：${risk.message}` : risk.message),
                risk.scope ? h("span", `范围：${risk.scope}`) : null,
                risk.action ? h("span", `动作：${risk.action}`) : null,
                risk.impact ? h("span", `影响：${risk.impact}`) : null,
                risk.recommendation ? h("span", `建议：${risk.recommendation}`) : null
              ])
            ])
          )
        )
      : null
  ])
}

async function rollback(version: string) {
  const record = await rollbackRelease(version)
  message.success(`已回滚 ${record.version}`)
  await releasesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">发布记录</h1>
        <p class="page-subtitle">将当前防护应用、监听、证书、策略和规则发布为网关可加载配置。</p>
      </div>
      <NButton v-if="authStore.canWrite" type="primary" :loading="publishing" @click="publishNow">
        发布新版本
      </NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="releasesResource.loading.value"
        :columns="columns"
        :data="releases"
        :bordered="false"
      />
      <NEmpty v-if="!releasesResource.loading.value && releases.length === 0" description="暂无发布记录" />
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
