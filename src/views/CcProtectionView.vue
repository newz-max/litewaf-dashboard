<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createCCProtectionRule,
  deleteCCProtectionRule,
  getCCProtectionRules,
  previewCCProtection,
  updateCCProtectionRule,
  type CCProtectionPreviewMatch,
  type ProtectionRule,
  type ProtectionRuleInput
} from "@/api/litewaf"
import ModulePageHeader from "@/components/operations/ModulePageHeader.vue"
import ModuleRiskGuidance from "@/components/operations/ModuleRiskGuidance.vue"
import ModuleStateBlock from "@/components/operations/ModuleStateBlock.vue"
import ModuleStatusSummary from "@/components/operations/ModuleStatusSummary.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"
import { protectionGuides, protectionRiskPrompts, riskPromptText } from "@/utils/protectionGuidance"

const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const resource = useApiResource(getCCProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const previewing = shallowRef(false)
const previewResult = shallowRef<CCProtectionPreviewMatch[] | null>(null)
const guidanceItems = protectionGuides["cc-protection"]
const formRiskPrompts = computed(() => protectionRiskPrompts(form))
const previewForm = reactive({
  application_id: 0,
  path: "/api/v1/login",
  method: "GET",
  client_ip: "198.51.100.10",
  session_id: "",
  device_id: "",
  status: 0,
  attack_matched: false,
  include_disabled: false
})

const templateOptions = [
  { label: "登录接口防爆破", value: "login" },
  { label: "API 调用频率限制", value: "api" },
  { label: "全站基础 CC 防护", value: "site" },
  { label: "404 扫描频率", value: "glob404" },
  { label: "会话级限制", value: "session" }
]

const pathMatchOptions = [
  { label: "精确", value: "exact" },
  { label: "前缀", value: "prefix" },
  { label: "Glob", value: "glob" }
]

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const counterOptions = [
  { label: "客户端 IP", value: "client_ip" },
  { label: "IP + 路径", value: "client_ip_path" },
  { label: "全局", value: "global" },
  { label: "404 频率", value: "not_found_frequency" },
  { label: "攻击命中频率", value: "attack_frequency" },
  { label: "会话", value: "session" },
  { label: "粗粒度设备", value: "device" }
]

const sessionSourceOptions = [
  { label: "Cookie", value: "cookie" },
  { label: "Header", value: "header" }
]

const deviceStrategyOptions = [
  { label: "粗粒度信号", value: "coarse" }
]

const actionOptions = [
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" },
  { label: "限流", value: "rate-limit" },
  { label: "临时封禁", value: "ban" }
]

type CCRiskRule = {
  readonly name: string
  readonly enabled: boolean
  readonly action: { readonly type: string }
  readonly limit: { readonly threshold: number; readonly window_sec: number }
  readonly match: { readonly path?: string; readonly path_match?: string }
}

const columns: DataTableColumns<ProtectionRule> = [
  { title: "名称", key: "name", minWidth: 160 },
  {
    title: "生效应用",
    key: "application_id",
    width: 92,
    render(row) {
      return row.application_id > 0 ? `#${row.application_id}` : "全局"
    }
  },
  {
    title: "路径",
    key: "match.path",
    minWidth: 160,
    render(row) {
      return row.match.path
    }
  },
  {
    title: "匹配方式",
    key: "match.path_match",
    width: 96,
    render(row) {
      return formatPathMatch(row.match.path_match ?? "exact")
    }
  },
  {
    title: "方法",
    key: "match.methods",
    minWidth: 120,
    render(row) {
      return row.match.methods.length > 0 ? row.match.methods.join(", ") : "全部"
    }
  },
  {
    title: "统计对象",
    key: "limit.counter",
    width: 120,
    render(row) {
      return formatCounter(row.limit.counter)
    }
  },
  {
    title: "阈值和窗口",
    key: "limit.threshold",
    minWidth: 120,
    render(row) {
      return `${row.limit.threshold} 次 / ${row.limit.window_sec} 秒`
    }
  },
  {
    title: "动作",
    key: "action.type",
    width: 108,
    render(row) {
      return formatAction(row.action.type)
    }
  },
  {
    title: "启用",
    key: "enabled",
    width: 84,
    render(row) {
      return hStatus(row.enabled)
    }
  },
  {
    title: "来源",
    key: "migration_status",
    width: 104,
    render(row) {
      return hSource(row)
    }
  },
  {
    title: "更新时间",
    key: "updated_at",
    minWidth: 160,
    render(row) {
      return formatTime(row.updated_at)
    }
  },
  {
    title: "操作",
    key: "actions",
    fixed: "right",
    width: 150,
    render(row) {
      return h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(
              NButton,
              { size: "small", disabled: !authStore.canWrite, onClick: () => startEdit(row) },
              { default: () => "编辑" }
            ),
            h(
              NButton,
              {
                size: "small",
                type: "error",
                disabled: !authStore.canWrite,
                onClick: () => remove(row)
              },
              { default: () => "删除" }
            )
          ]
        }
      )
    }
  }
]

const previewColumns: DataTableColumns<CCProtectionPreviewMatch> = [
  { title: "规则", key: "rule_name", minWidth: 160 },
  {
    title: "统计对象",
    key: "counter",
    width: 128,
    render(row) {
      return formatCounter(row.counter)
    }
  },
  {
    title: "阈值窗口",
    key: "threshold",
    width: 120,
    render(row) {
      return `${row.threshold} / ${row.window_sec}s`
    }
  },
  {
    title: "动作",
    key: "action",
    width: 92,
    render(row) {
      return formatAction(row.action)
    }
  },
  {
    title: "预览状态",
    key: "partial",
    width: 108,
    render(row) {
      return h(
        NTag,
        { size: "small", type: row.partial ? "warning" : "success" },
        { default: () => (row.partial ? "部分" : "完整") }
      )
    }
  },
  { title: "计数键", key: "counter_key", minWidth: 220 }
]

const activeRiskWarnings = computed(() => {
  const warnings: string[] = []
  for (const item of items.value) {
    warnings.push(...ruleWarnings(item))
  }
  return warnings
})

const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const blockingCount = computed(() => items.value.filter((item) => ["block", "ban", "rate-limit"].includes(item.action.type)).length)
const headerTags = computed(() => [
  { label: "规则", value: items.value.length, tone: "info" as const },
  { label: "启用", value: enabledCount.value, tone: "success" as const },
  { label: "风险", value: activeRiskWarnings.value.length, tone: activeRiskWarnings.value.length > 0 ? "warning" as const : "default" as const }
])
const statusItems = computed(() => [
  { label: "规则总数", value: items.value.length, note: "来自 CC 防护 API", tone: "info" as const },
  { label: "启用规则", value: enabledCount.value, note: "参与当前发布配置", tone: "success" as const },
  { label: "阻断/限流", value: blockingCount.value, note: "包含阻断、限流和临时封禁", tone: blockingCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: "高风险提示", value: activeRiskWarnings.value.length, note: "由当前规则配置派生", tone: activeRiskWarnings.value.length > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const activeRiskAlerts = computed(() => activeRiskWarnings.value.map((warning) => ({ title: warning, tone: "warning" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk), tone: "warning" as const })))

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "cc-protection",
    category: "rate-limit",
    application_id: 0,
    enabled: true,
    priority: 100,
    match: {
      path: "/",
      path_match: "prefix",
      methods: []
    },
    limit: {
      counter: "client_ip",
      threshold: 300,
      window_sec: 60,
      ban_duration_sec: 300,
      session_source: "",
      session_name: "",
      device_strategy: ""
    },
    action: {
      type: "rate-limit"
    }
  }
}

function assignForm(payload: ProtectionRuleInput) {
  Object.assign(form, {
    ...payload,
    match: { ...payload.match, methods: [...payload.match.methods] },
    limit: { ...payload.limit },
    action: { ...payload.action }
  })
}

function openCreate() {
  editing.value = null
  assignForm(emptyForm())
  formVisible.value = true
}

function startEdit(item: ProtectionRule) {
  editing.value = item
  assignForm({
    name: item.name,
    module: item.module,
    category: item.category,
    application_id: item.application_id,
    enabled: item.enabled,
    priority: item.priority,
    match: item.match,
    limit: item.limit,
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    login: {
      ...emptyForm(),
      name: "登录接口防爆破",
      match: { path: "/api/login", path_match: "exact", methods: ["POST"] },
      limit: { counter: "client_ip", threshold: 10, window_sec: 60, ban_duration_sec: 600 },
      action: { type: "ban" }
    },
    api: {
      ...emptyForm(),
      name: "API 调用频率限制",
      match: { path: "/api/", path_match: "prefix", methods: [] },
      limit: { counter: "client_ip_path", threshold: 120, window_sec: 60, ban_duration_sec: 60 },
      action: { type: "rate-limit" }
    },
    site: {
      ...emptyForm(),
      name: "全站基础 CC 防护",
      match: { path: "/", path_match: "prefix", methods: [] },
      limit: { counter: "client_ip", threshold: 300, window_sec: 60, ban_duration_sec: 300 },
      action: { type: "rate-limit" }
    },
    glob404: {
      ...emptyForm(),
      name: "404 扫描频率限制",
      match: { path: "/api/*", path_match: "glob", methods: [] },
      limit: { counter: "not_found_frequency", threshold: 20, window_sec: 60, ban_duration_sec: 300 },
      action: { type: "rate-limit" }
    },
    session: {
      ...emptyForm(),
      name: "会话级登录频率限制",
      match: { path: "/api/login", path_match: "exact", methods: ["POST"] },
      limit: { counter: "session", session_source: "cookie", session_name: "sid", threshold: 8, window_sec: 60, ban_duration_sec: 300 },
      action: { type: "block" }
    }
  }
  assignForm(templates[value] ?? emptyForm())
}

function validateForm() {
  if (!form.name.trim()) {
    return "规则名称不能为空"
  }
  if (!String(form.match.path || "").startsWith("/")) {
    return "路径必须以 / 开头"
  }
  if (form.match.path_match === "glob" && String(form.match.path || "").includes("**")) {
    return "Glob 路径不支持 **"
  }
  if (form.limit.counter === "session" && !form.limit.session_name?.trim()) {
    return "会话统计需要 Cookie 或 Header 名称"
  }
  if (form.limit.threshold <= 0 || form.limit.window_sec <= 0) {
    return "阈值和窗口必须大于 0"
  }
  if (form.limit.ban_duration_sec < 0) {
    return "封禁时间不能小于 0"
  }
  return ""
}

async function runPreview() {
  if (!previewForm.path.startsWith("/")) {
    message.error("预览路径必须以 / 开头")
    return
  }
  previewing.value = true
  try {
    const result = await previewCCProtection({
      application_id: previewForm.application_id,
      path: previewForm.path,
      method: previewForm.method,
      client_ip: previewForm.client_ip,
      session_id: previewForm.session_id,
      device_id: previewForm.device_id,
      status: previewForm.status || undefined,
      attack_matched: previewForm.attack_matched,
      include_disabled: previewForm.include_disabled
    })
    previewResult.value = result.matches
  } finally {
    previewing.value = false
  }
}

async function save() {
  const error = validateForm()
  if (error) {
    message.error(error)
    return
  }
  if (!(await confirmRiskIfNeeded())) {
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await updateCCProtectionRule(editing.value.id, form)
      message.success("CC 防护规则已更新")
    } else {
      await createCCProtectionRule(form)
      message.success("CC 防护规则已创建")
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

function confirmRiskIfNeeded() {
  const risks = formRiskPrompts.value
  if (risks.length === 0) {
    return Promise.resolve(true)
  }
  return new Promise<boolean>((resolve) => {
    dialog.warning({
      title: "确认高风险 CC 配置",
      content: () => h("div", { class: "risk-confirm" }, risks.map((risk) => h("p", { key: risk.message }, riskPromptText(risk)))),
      positiveText: "确认保存",
      negativeText: "取消",
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false)
    })
  })
}

async function remove(item: ProtectionRule) {
  await deleteCCProtectionRule(item.id)
  message.success("CC 防护规则已删除")
  await resource.refresh()
}

function hStatus(enabled: boolean) {
  return h(
    NTag,
    { type: enabled ? "success" : "default", size: "small" },
    { default: () => (enabled ? "启用" : "停用") }
  )
}

function hSource(row: ProtectionRule) {
  const status = row.migration_status ?? ""
  const label = status === "legacy-only" ? "兼容" : status === "migrated" ? "已迁移" : "原生"
  const type = status === "legacy-only" ? "warning" : status === "migrated" ? "info" : "success"
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function formatPathMatch(value: string) {
  const labels: Record<string, string> = {
    exact: "精确",
    prefix: "前缀",
    glob: "Glob"
  }
  return labels[value] ?? value
}

function formatCounter(value: string) {
  const labels: Record<string, string> = {
    client_ip: "客户端 IP",
    client_ip_path: "IP + 路径",
    global: "全局",
    not_found_frequency: "404 频率",
    attack_frequency: "攻击命中频率",
    session: "会话",
    device: "粗粒度设备"
  }
  return labels[value] ?? value
}

function ruleWarnings(item: CCRiskRule) {
  if (!item.enabled) {
    return []
  }
  const warnings: string[] = []
  const blocking = ["block", "ban", "rate-limit"].includes(item.action.type)
  const lowThreshold = item.limit.threshold > 0 && item.limit.threshold < 60 && item.limit.window_sec <= 60
  if (blocking && lowThreshold && item.match.path === "/" && ["prefix", "glob"].includes(item.match.path_match ?? "exact")) {
    warnings.push(`规则 ${item.name} 对全站路径使用较低阈值`)
  }
  if (blocking && lowThreshold && item.match.path_match === "glob" && String(item.match.path).startsWith("/*")) {
    warnings.push(`规则 ${item.name} 使用较宽泛 Glob 匹配`)
  }
  return warnings
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": "观察",
    block: "阻断",
    "rate-limit": "限流",
    ban: "临时封禁"
  }
  return labels[value] ?? value
}

function formatTime(value?: string) {
  if (!value) {
    return "-"
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <main class="page">
    <ModulePageHeader
      title="CC 防护"
      subtitle="查看 URL 访问频率限制、登录防爆破和 API 调用限流规则。"
      eyebrow="Protection Module"
      :tags="headerTags"
    >
      <template #actions>
      <NSpace>
        <NButton :loading="resource.loading.value" @click="resource.refresh">刷新</NButton>
        <NButton type="primary" :disabled="!authStore.canWrite" @click="openCreate">新增规则</NButton>
      </NSpace>
      </template>
    </ModulePageHeader>

    <ModuleStateBlock
      v-if="resource.error.value"
      state="error"
      title="CC 防护加载失败"
      :description="resource.error.value"
      action-label="重试"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section v-if="activeRiskAlerts.length" class="section section-pad guidance-section">
      <ModuleRiskGuidance title="当前配置风险" :items="activeRiskAlerts" />
    </section>

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance title="运营指引" :items="guidanceAlerts" empty-description="暂无 CC 防护运营指引" />
    </section>

    <section class="section section-pad">
      <NDataTable
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1390"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        description="暂无 CC 防护规则"
      />
    </section>

    <section class="section section-pad preview-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">模拟预览</h2>
        </div>
        <NButton :loading="previewing" @click="runPreview">运行预览</NButton>
      </div>
      <NForm class="preview-form" label-placement="top">
        <NFormItem label="应用 ID">
          <NInputNumber v-model:value="previewForm.application_id" :min="0" />
        </NFormItem>
        <NFormItem label="路径">
          <NInput v-model:value="previewForm.path" />
        </NFormItem>
        <NFormItem label="方法">
          <NSelect v-model:value="previewForm.method" :options="methodOptions" />
        </NFormItem>
        <NFormItem label="客户端 IP">
          <NInput v-model:value="previewForm.client_ip" />
        </NFormItem>
        <NFormItem label="会话样本">
          <NInput v-model:value="previewForm.session_id" />
        </NFormItem>
        <NFormItem label="设备样本">
          <NInput v-model:value="previewForm.device_id" />
        </NFormItem>
        <NFormItem label="响应状态">
          <NInputNumber v-model:value="previewForm.status" :min="0" />
        </NFormItem>
        <NFormItem label="攻击命中">
          <NSwitch v-model:value="previewForm.attack_matched" />
        </NFormItem>
      </NForm>
      <NDataTable
        v-if="previewResult && previewResult.length > 0"
        :columns="previewColumns"
        :data="previewResult"
        :bordered="false"
        :scroll-x="820"
      />
      <NEmpty v-else-if="previewResult" description="没有匹配的 CC 规则" />
      <div v-if="previewResult?.some((item) => item.partial)" class="preview-warnings">
        <NAlert
          v-for="item in previewResult.filter((row) => row.partial)"
          :key="`${item.rule_id}-${item.counter}`"
          type="warning"
        >
          {{ item.rule_name }} 的 {{ formatCounter(item.counter) }} 预览缺少完整样本字段
        </NAlert>
      </div>
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :title="editing ? '编辑 CC 防护规则' : '新增 CC 防护规则'" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem v-if="!editing" label="模板">
            <NSelect :options="templateOptions" placeholder="选择模板快速填充" @update:value="applyTemplate" />
          </NFormItem>
          <NFormItem label="规则名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="应用 ID">
            <NInputNumber v-model:value="form.application_id" :min="0" />
          </NFormItem>
          <NFormItem label="路径">
            <NInput v-model:value="form.match.path" />
          </NFormItem>
          <NFormItem label="匹配方式">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem label="请求方法">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" placeholder="全部方法" />
          </NFormItem>
          <NFormItem label="统计对象">
            <NSelect v-model:value="form.limit.counter" :options="counterOptions" />
          </NFormItem>
          <NFormItem v-if="form.limit.counter === 'session'" label="会话来源">
            <NSelect v-model:value="form.limit.session_source" :options="sessionSourceOptions" />
          </NFormItem>
          <NFormItem v-if="form.limit.counter === 'session'" label="Cookie / Header 名称">
            <NInput v-model:value="form.limit.session_name" />
          </NFormItem>
          <NFormItem v-if="form.limit.counter === 'device'" label="设备策略">
            <NSelect v-model:value="form.limit.device_strategy" :options="deviceStrategyOptions" />
          </NFormItem>
          <NFormItem label="频率阈值">
            <NInputNumber v-model:value="form.limit.threshold" :min="1" />
          </NFormItem>
          <NFormItem label="统计窗口秒">
            <NInputNumber v-model:value="form.limit.window_sec" :min="1" />
          </NFormItem>
          <NFormItem label="动作">
            <NSelect v-model:value="form.action.type" :options="actionOptions" />
          </NFormItem>
          <NFormItem label="封禁/缓解秒">
            <NInputNumber v-model:value="form.limit.ban_duration_sec" :min="0" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
          <ModuleRiskGuidance
            v-if="formRiskAlerts.length > 0"
            class="risk-prompt-list"
            title="保存前风险确认"
            :items="formRiskAlerts"
          />
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="formVisible = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="save">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>

<style scoped>
.view-alert {
  margin-bottom: 16px;
}

.guidance-section {
  margin-bottom: 16px;
}

.guidance-grid,
.risk-prompt-list {
  display: grid;
  gap: 8px;
}

.rule-form {
  display: grid;
  gap: 4px;
}

.preview-section {
  margin-top: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.preview-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px 12px;
  margin-bottom: 12px;
}

.preview-warnings {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
</style>
