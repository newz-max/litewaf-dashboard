<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  createCCProtectionRule,
  deleteCCProtectionRule,
  getCCProtectionRules,
  updateCCProtectionRule,
  type ProtectionRule,
  type ProtectionRuleInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const resource = useApiResource(getCCProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())

const templateOptions = [
  { label: "登录接口防爆破", value: "login" },
  { label: "API 调用频率限制", value: "api" },
  { label: "全站基础 CC 防护", value: "site" }
]

const pathMatchOptions = [
  { label: "精确", value: "exact" },
  { label: "前缀", value: "prefix" }
]

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const counterOptions = [
  { label: "客户端 IP", value: "client_ip" },
  { label: "IP + 路径", value: "client_ip_path" },
  { label: "全局", value: "global" }
]

const actionOptions = [
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" },
  { label: "限流", value: "rate-limit" },
  { label: "临时封禁", value: "ban" }
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

function emptyForm(): ProtectionRuleInput {
  return {
    name: "",
    module: "cc-protection",
    category: "rate-limit",
    site_id: 0,
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
      ban_duration_sec: 300
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
    site_id: item.site_id,
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
  if (form.limit.threshold <= 0 || form.limit.window_sec <= 0) {
    return "阈值和窗口必须大于 0"
  }
  if (form.limit.ban_duration_sec < 0) {
    return "封禁时间不能小于 0"
  }
  return ""
}

async function save() {
  const error = validateForm()
  if (error) {
    message.error(error)
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
    prefix: "前缀"
  }
  return labels[value] ?? value
}

function formatCounter(value: string) {
  const labels: Record<string, string> = {
    client_ip: "客户端 IP",
    client_ip_path: "IP + 路径",
    global: "全局"
  }
  return labels[value] ?? value
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
    <div class="page-header">
      <div>
        <h1 class="page-title">CC 防护</h1>
        <p class="page-subtitle">查看 URL 访问频率限制、登录防爆破和 API 调用限流规则。</p>
      </div>
      <NSpace>
        <NButton :loading="resource.loading.value" @click="resource.refresh">刷新</NButton>
        <NButton type="primary" :disabled="!authStore.canWrite" @click="openCreate">新增规则</NButton>
      </NSpace>
    </div>

    <NAlert v-if="resource.error.value" class="view-alert" type="error">
      {{ resource.error.value }}
    </NAlert>

    <section class="section section-pad">
      <NDataTable
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1390"
      />
      <NEmpty v-if="!resource.loading.value && !resource.error.value && items.length === 0" description="暂无 CC 防护规则" />
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
          <NFormItem label="站点 ID">
            <NInputNumber v-model:value="form.site_id" :min="0" />
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

.rule-form {
  display: grid;
  gap: 4px;
}
</style>
