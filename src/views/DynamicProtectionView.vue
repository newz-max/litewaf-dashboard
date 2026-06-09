<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createDynamicProtectionRule,
  deleteDynamicProtectionRule,
  getDynamicProtectionRules,
  updateDynamicProtectionRule,
  type ProtectionRule,
  type ProtectionRuleDynamic,
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
const resource = useApiResource(getDynamicProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const guidanceItems = protectionGuides["dynamic-protection"]
const formRiskPrompts = computed(() => protectionRiskPrompts(form))
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const tokenCount = computed(() => items.value.filter((item) => item.category === "dynamic-token").length)
const waitingRoomCount = computed(() => items.value.filter((item) => item.category === "waiting-room").length)
const headerTags = computed(() => [
  { label: "规则", value: items.value.length, tone: "info" as const },
  { label: "启用", value: enabledCount.value, tone: "success" as const },
  { label: "等候室", value: waitingRoomCount.value, tone: "warning" as const }
])
const statusItems = computed(() => [
  { label: "规则总数", value: items.value.length, note: "来自动态防护 API", tone: "info" as const },
  { label: "启用规则", value: enabledCount.value, note: "参与动态令牌或等候室策略", tone: "success" as const },
  { label: "动态令牌", value: tokenCount.value, note: "验证浏览器请求有效性", tone: tokenCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: "等候室", value: waitingRoomCount.value, note: "容量和准入节流", tone: waitingRoomCount.value > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk), tone: "warning" as const })))

const templateOptions = [
  { label: "后台动态令牌", value: "admin-token" },
  { label: "HTML Token 注入", value: "html-mutation" },
  { label: "全站等候室", value: "waiting-room" },
  { label: "观察动态防护", value: "observe" }
]

const categoryOptions = [
  { label: "动态令牌", value: "dynamic-token" },
  { label: "页面动态化", value: "page-mutation" },
  { label: "等候室", value: "waiting-room" }
]

const pathMatchOptions = [
  { label: "精确", value: "exact" },
  { label: "前缀", value: "prefix" }
]

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const tokenPlacementOptions = [
  { label: "Cookie", value: "cookie" },
  { label: "Header", value: "header" },
  { label: "Query", value: "query" }
]

const failureActionOptions = [
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" }
]

const mutationMarkerOptions = [
  { label: "Head 末尾", value: "head-end" },
  { label: "Body 末尾", value: "body-end" }
]

const overflowActionOptions = [
  { label: "进入等候室", value: "waiting-room" },
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" }
]

function defaultDynamic(): ProtectionRuleDynamic {
  return {
    mode: "dynamic-token",
    token_ttl_sec: 300,
    token_placement: "cookie",
    failure_action: "block",
    mutation_marker: "body-end",
    mutation_max_bytes: 262144,
    queue_capacity: 100,
    admission_ttl_sec: 300,
    retry_interval_sec: 5,
    overflow_action: "waiting-room"
  }
}

const columns: DataTableColumns<ProtectionRule> = [
  { title: "名称", key: "name", minWidth: 170 },
  {
    title: "类型",
    key: "category",
    width: 112,
    render(row) {
      return formatCategory(row.category)
    }
  },
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
    minWidth: 150,
    render(row) {
      return row.match.path
    }
  },
  {
    title: "方法",
    key: "match.methods",
    minWidth: 118,
    render(row) {
      return row.match.methods.length > 0 ? row.match.methods.join(", ") : "全部"
    }
  },
  {
    title: "关键配置",
    key: "dynamic",
    minWidth: 210,
    render(row) {
      return formatDynamic(row)
    }
  },
  {
    title: "动作",
    key: "action.type",
    width: 100,
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
              { size: "small", type: "error", disabled: !authStore.canWrite, onClick: () => remove(row) },
              { default: () => "删除" }
            )
          ]
        }
      )
    }
  }
]

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "dynamic-protection",
    category: "dynamic-token",
    application_id: 0,
    enabled: true,
    priority: 100,
    match: {
      path: "/admin",
      path_match: "prefix",
      methods: []
    },
    limit: {
      counter: "",
      threshold: 0,
      window_sec: 0,
      ban_duration_sec: 0
    },
    dynamic: defaultDynamic(),
    action: {
      type: "block"
    }
  }
}

function assignForm(payload: ProtectionRuleInput) {
  Object.assign(form, {
    ...payload,
    match: { ...payload.match, methods: [...payload.match.methods] },
    limit: { ...payload.limit },
    dynamic: { ...defaultDynamic(), ...(payload.dynamic ?? {}) },
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
    match: {
      path: item.match.path || "/",
      path_match: item.match.path_match || "prefix",
      methods: [...item.match.methods]
    },
    limit: item.limit,
    dynamic: { ...defaultDynamic(), ...(item.dynamic ?? {}), mode: item.category },
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const base = emptyForm()
  const templates: Record<string, ProtectionRuleInput> = {
    "admin-token": {
      ...base,
      name: "后台动态令牌",
      category: "dynamic-token",
      match: { path: "/admin", path_match: "prefix", methods: [] },
      dynamic: { ...base.dynamic!, mode: "dynamic-token", token_ttl_sec: 600, token_placement: "cookie", failure_action: "block" },
      action: { type: "block" }
    },
    "html-mutation": {
      ...base,
      name: "HTML Token 注入",
      category: "page-mutation",
      match: { path: "/", path_match: "prefix", methods: ["GET"] },
      dynamic: { ...base.dynamic!, mode: "page-mutation", mutation_marker: "body-end", mutation_max_bytes: 262144 },
      action: { type: "log-only" }
    },
    "waiting-room": {
      ...base,
      name: "全站等候室",
      category: "waiting-room",
      match: { path: "/", path_match: "prefix", methods: [] },
      dynamic: { ...base.dynamic!, mode: "waiting-room", queue_capacity: 100, admission_ttl_sec: 300, retry_interval_sec: 5, overflow_action: "waiting-room" },
      action: { type: "waiting-room" }
    },
    observe: {
      ...base,
      name: "动态防护观察",
      category: "dynamic-token",
      match: { path: "/", path_match: "prefix", methods: [] },
      dynamic: { ...base.dynamic!, mode: "dynamic-token", token_ttl_sec: 300, token_placement: "cookie", failure_action: "log-only" },
      action: { type: "log-only" }
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
  if (Number(form.priority ?? 0) < 0) {
    return "优先级不能小于 0"
  }
  const dynamic = form.dynamic
  if (!dynamic) {
    return "动态防护配置不能为空"
  }
  if (form.category === "dynamic-token" && (Number(dynamic.token_ttl_sec) <= 0 || Number(dynamic.token_ttl_sec) > 86400)) {
    return "令牌有效期必须在 1 到 86400 秒之间"
  }
  if (form.category === "page-mutation" && (Number(dynamic.mutation_max_bytes) <= 0 || Number(dynamic.mutation_max_bytes) > 1048576)) {
    return "页面动态化大小上限必须在 1 到 1048576 字节之间"
  }
  if (form.category === "waiting-room" && (Number(dynamic.queue_capacity) <= 0 || Number(dynamic.admission_ttl_sec) <= 0 || Number(dynamic.retry_interval_sec) <= 0)) {
    return "等候室容量、准入有效期和重试间隔必须为正数"
  }
  return ""
}

function syncCategoryAction() {
  if (!form.dynamic) {
    return
  }
  form.dynamic.mode = form.category || "dynamic-token"
  if (form.category === "waiting-room") {
    form.action.type = form.dynamic.overflow_action || "waiting-room"
  } else if (form.category === "page-mutation") {
    form.action.type = "log-only"
  } else {
    form.action.type = form.dynamic.failure_action || "block"
  }
}

async function save() {
  syncCategoryAction()
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
      await updateDynamicProtectionRule(editing.value.id, form)
      message.success("动态防护规则已更新")
    } else {
      await createDynamicProtectionRule(form)
      message.success("动态防护规则已创建")
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
      title: "确认高风险动态防护配置",
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
  await deleteDynamicProtectionRule(item.id)
  message.success("动态防护规则已删除")
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

function formatCategory(value: string) {
  const labels: Record<string, string> = {
    "dynamic-token": "动态令牌",
    "page-mutation": "页面动态化",
    "waiting-room": "等候室"
  }
  return labels[value] ?? value
}

function formatDynamic(row: ProtectionRule) {
  const dynamic = row.dynamic
  if (!dynamic) {
    return "-"
  }
  if (row.category === "page-mutation") {
    return `${formatMarker(dynamic.mutation_marker)} / ${dynamic.mutation_max_bytes}B`
  }
  if (row.category === "waiting-room") {
    return `容量 ${dynamic.queue_capacity} / TTL ${dynamic.admission_ttl_sec}s / 重试 ${dynamic.retry_interval_sec}s`
  }
  return `${formatPlacement(dynamic.token_placement)} / TTL ${dynamic.token_ttl_sec}s`
}

function formatPlacement(value: string) {
  const labels: Record<string, string> = {
    cookie: "Cookie",
    header: "Header",
    query: "Query"
  }
  return labels[value] ?? value
}

function formatMarker(value: string) {
  return value === "head-end" ? "Head 末尾" : "Body 末尾"
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": "观察",
    block: "阻断",
    allow: "放行",
    "waiting-room": "等候室"
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
      title="动态防护 / 等候室"
      subtitle="为浏览器路径启用动态令牌、页面动态化和轻量等候室。"
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
      title="动态防护加载失败"
      :description="resource.error.value"
      action-label="重试"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance title="运营指引" :items="guidanceAlerts" empty-description="暂无动态防护运营指引" />
    </section>

    <section class="section section-pad">
      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1440"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        description="暂无动态防护规则"
      />
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="formVisible" :width="560">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? '编辑动态防护规则' : '新增动态防护规则'" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem v-if="!editing" label="模板">
            <NSelect :options="templateOptions" placeholder="选择模板快速填充" @update:value="applyTemplate" />
          </NFormItem>
          <NFormItem label="规则名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="类型">
            <NSelect v-model:value="form.category" :options="categoryOptions" @update:value="syncCategoryAction" />
          </NFormItem>
          <NFormItem label="应用 ID">
            <NInputNumber v-model:value="form.application_id" :min="0" />
          </NFormItem>
          <NFormItem label="路径">
            <NInput v-model:value="form.match.path" />
          </NFormItem>
          <NFormItem label="路径匹配">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem label="请求方法">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" placeholder="全部方法" />
          </NFormItem>

          <template v-if="form.category === 'dynamic-token'">
            <NFormItem label="令牌位置">
              <NSelect v-model:value="form.dynamic!.token_placement" :options="tokenPlacementOptions" />
            </NFormItem>
            <NFormItem label="令牌有效期秒">
              <NInputNumber v-model:value="form.dynamic!.token_ttl_sec" :min="1" :max="86400" />
            </NFormItem>
            <NFormItem label="失败动作">
              <NSelect
                v-model:value="form.dynamic!.failure_action"
                :options="failureActionOptions"
                @update:value="syncCategoryAction"
              />
            </NFormItem>
          </template>

          <template v-if="form.category === 'page-mutation'">
            <NFormItem label="注入位置">
              <NSelect v-model:value="form.dynamic!.mutation_marker" :options="mutationMarkerOptions" />
            </NFormItem>
            <NFormItem label="响应大小上限字节">
              <NInputNumber v-model:value="form.dynamic!.mutation_max_bytes" :min="1" :max="1048576" />
            </NFormItem>
          </template>

          <template v-if="form.category === 'waiting-room'">
            <NFormItem label="队列容量">
              <NInputNumber v-model:value="form.dynamic!.queue_capacity" :min="1" :max="100000" />
            </NFormItem>
            <NFormItem label="准入有效期秒">
              <NInputNumber v-model:value="form.dynamic!.admission_ttl_sec" :min="1" :max="86400" />
            </NFormItem>
            <NFormItem label="重试间隔秒">
              <NInputNumber v-model:value="form.dynamic!.retry_interval_sec" :min="1" :max="86400" />
            </NFormItem>
            <NFormItem label="溢出动作">
              <NSelect
                v-model:value="form.dynamic!.overflow_action"
                :options="overflowActionOptions"
                @update:value="syncCategoryAction"
              />
            </NFormItem>
          </template>

          <NFormItem label="优先级">
            <NInputNumber v-model:value="form.priority" :min="0" />
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
</style>
