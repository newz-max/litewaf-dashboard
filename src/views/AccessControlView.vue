<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createAccessControlRule,
  deleteAccessControlRule,
  getAccessControlRules,
  updateAccessControlRule,
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
const resource = useApiResource(getAccessControlRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())
const guidanceItems = protectionGuides["access-control"]
const formRiskPrompts = computed(() => protectionRiskPrompts(form))
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const blockCount = computed(() => items.value.filter((item) => item.action.type === "block").length)
const allowCount = computed(() => items.value.filter((item) => item.action.type === "allow").length)
const headerTags = computed(() => [
  { label: "规则", value: items.value.length, tone: "info" as const },
  { label: "启用", value: enabledCount.value, tone: "success" as const },
  { label: "放行", value: allowCount.value, tone: allowCount.value > 0 ? "warning" as const : "default" as const }
])
const statusItems = computed(() => [
  { label: "规则总数", value: items.value.length, note: "来自访问控制 API", tone: "info" as const },
  { label: "启用规则", value: enabledCount.value, note: "参与当前访问控制策略", tone: "success" as const },
  { label: "阻断规则", value: blockCount.value, note: "阻断路径、Header 或 Host", tone: blockCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: "放行规则", value: allowCount.value, note: "高优先级放行需复核", tone: allowCount.value > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => guidanceItems.map((item) => ({ title: item.title, message: item.description, tone: "info" as const })))
const formRiskAlerts = computed(() => formRiskPrompts.value.map((risk) => ({ title: risk.message, message: riskPromptText(risk), tone: "warning" as const })))

const templateOptions = [
  { label: "管理后台路径阻断", value: "admin" },
  { label: "Host 限制", value: "host" }
]

const targetOptions = [
  { label: "路径", value: "path" },
  { label: "Header", value: "header" },
  { label: "Host", value: "host" }
]

const pathMatchOptions = [
  { label: "精确", value: "exact" },
  { label: "前缀", value: "prefix" }
]

const operatorOptions = computed(() => {
  switch (form.match.target) {
    case "header":
      return [
        { label: "精确", value: "exact" },
        { label: "包含", value: "contains" }
      ]
    case "host":
      return [
        { label: "精确", value: "exact" },
        { label: "后缀", value: "suffix" }
      ]
    default:
      return []
  }
})

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const actionOptions = [
  { label: "放行", value: "allow" },
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" }
]

const columns: DataTableColumns<ProtectionRule> = [
  { title: "名称", key: "name", minWidth: 160 },
  {
    title: "生效站点",
    key: "site_id",
    width: 92,
    render(row) {
      return row.site_id > 0 ? `#${row.site_id}` : "全局"
    }
  },
  {
    title: "匹配对象",
    key: "match.target",
    minWidth: 180,
    render(row) {
      return formatMatch(row)
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
    title: "动作",
    key: "action.type",
    width: 100,
    render(row) {
      return formatAction(row.action.type)
    }
  },
  {
    title: "优先级",
    key: "priority",
    width: 88
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

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "access-control",
    category: "access-control",
    site_id: 0,
    enabled: true,
    priority: 100,
    match: {
      target: "path",
      path: "/admin",
      path_match: "prefix",
      methods: [],
      value: "",
      operator: "prefix",
      header_name: "",
      host: ""
    },
    limit: {
      counter: "",
      threshold: 0,
      window_sec: 0,
      ban_duration_sec: 0
    },
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
    site_id: item.site_id,
    enabled: item.enabled,
    priority: item.priority,
    match: {
      target: item.match.target || "path",
      path: item.match.path || "",
      path_match: item.match.path_match || item.match.operator || "exact",
      methods: [...item.match.methods],
      value: item.match.value || "",
      operator: item.match.operator || item.match.path_match || "exact",
      header_name: item.match.header_name || "",
      host: item.match.host || ""
    },
    limit: item.limit,
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    admin: {
      ...emptyForm(),
      name: "管理后台路径阻断",
      match: { target: "path", path: "/admin", path_match: "prefix", operator: "prefix", methods: [] },
      action: { type: "block" }
    },
    host: {
      ...emptyForm(),
      name: "Host 限制",
      match: { target: "host", host: "example.com", value: "example.com", operator: "exact", methods: [] },
      action: { type: "block" }
    }
  }
  assignForm(templates[value] ?? emptyForm())
}

function handleTargetChange(value: string) {
  form.match.target = value
  form.match.methods = []
  if (value === "path") {
    form.match.path = form.match.path || "/admin"
    form.match.path_match = "prefix"
    form.match.operator = "prefix"
    return
  }
  if (value === "header") {
    form.match.operator = "contains"
    return
  }
  if (value === "host") {
    form.match.operator = "exact"
    return
  }
  form.match.operator = ""
}

function validateForm() {
  const target = form.match.target
  if (!form.name.trim()) {
    return "规则名称不能为空"
  }
  if (Number(form.priority ?? 0) < 0) {
    return "优先级不能小于 0"
  }
  if (target === "path" && !String(form.match.path || "").startsWith("/")) {
    return "路径必须以 / 开头"
  }
  if (target === "ip" || target === "cidr") {
    return "IP/CIDR 黑白名单请使用独立 IP 黑白名单模块"
  }
  if (target === "header" && (!form.match.header_name?.trim() || !form.match.value?.trim())) {
    return "Header 名称和值不能为空"
  }
  if (target === "host" && !form.match.host?.trim()) {
    return "Host 不能为空"
  }
  return ""
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
      await updateAccessControlRule(editing.value.id, form)
      message.success("访问控制规则已更新")
    } else {
      await createAccessControlRule(form)
      message.success("访问控制规则已创建")
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
      title: "确认高风险访问控制配置",
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
  await deleteAccessControlRule(item.id)
  message.success("访问控制规则已删除")
  await resource.refresh()
}

function hStatus(enabled: boolean) {
  return h(
    NTag,
    { type: enabled ? "success" : "default", size: "small" },
    { default: () => (enabled ? "启用" : "停用") }
  )
}

function formatMatch(row: ProtectionRule) {
  const target = row.match.target
  if (target === "path") {
    return `路径 ${row.match.path_match === "prefix" ? "前缀" : "精确"} ${row.match.path}`
  }
  if (target === "header") {
    return `Header ${row.match.header_name} ${row.match.operator === "contains" ? "包含" : "等于"} ${row.match.value}`
  }
  if (target === "host") {
    return `Host ${row.match.operator === "suffix" ? "后缀" : "等于"} ${row.match.host || row.match.value}`
  }
  return "不支持的访问控制对象"
}

function hSource(row: ProtectionRule) {
  const status = row.migration_status ?? ""
  const label = status === "legacy-only" ? "兼容" : status === "migrated" ? "已迁移" : "原生"
  const type = status === "legacy-only" ? "warning" : status === "migrated" ? "info" : "success"
  return h(NTag, { type, size: "small" }, { default: () => label })
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    allow: "放行",
    "log-only": "观察",
    block: "阻断"
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
      title="访问控制"
      subtitle="按路径、Header 和 Host 管理放行、观察与阻断规则；来源 IP/CIDR 使用独立 IP 黑白名单。"
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
      title="访问控制加载失败"
      :description="resource.error.value"
      action-label="重试"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance title="运营指引" :items="guidanceAlerts" empty-description="暂无访问控制运营指引" />
    </section>

    <section class="section section-pad">
      <NDataTable
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1140"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        description="暂无访问控制规则"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :title="editing ? '编辑访问控制规则' : '新增访问控制规则'" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem v-if="!editing" label="模板">
            <NSelect :options="templateOptions" placeholder="选择模板快速填充" @update:value="applyTemplate" />
          </NFormItem>
          <NFormItem label="规则名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="站点 ID">
            <NInputNumber v-model:value="form.site_id" :min="0" />
          </NFormItem>
          <NFormItem label="匹配对象">
            <NSelect :value="form.match.target" :options="targetOptions" @update:value="handleTargetChange" />
          </NFormItem>
          <template v-if="form.match.target === 'path'">
            <NFormItem label="路径">
              <NInput v-model:value="form.match.path" />
            </NFormItem>
            <NFormItem label="路径匹配">
              <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
            </NFormItem>
            <NFormItem label="请求方法">
              <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" placeholder="全部方法" />
            </NFormItem>
          </template>
          <template v-else-if="form.match.target === 'header'">
            <NFormItem label="Header 名称">
              <NInput v-model:value="form.match.header_name" />
            </NFormItem>
            <NFormItem label="匹配方式">
              <NSelect v-model:value="form.match.operator" :options="operatorOptions" />
            </NFormItem>
            <NFormItem label="Header 值">
              <NInput v-model:value="form.match.value" />
            </NFormItem>
          </template>
          <template v-else-if="form.match.target === 'host'">
            <NFormItem label="匹配方式">
              <NSelect v-model:value="form.match.operator" :options="operatorOptions" />
            </NFormItem>
            <NFormItem label="Host">
              <NInput v-model:value="form.match.host" />
            </NFormItem>
          </template>
          <NFormItem label="动作">
            <NSelect v-model:value="form.action.type" :options="actionOptions" />
          </NFormItem>
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
