<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  createBotProtectionRule,
  deleteBotProtectionRule,
  getBotProtectionRules,
  updateBotProtectionRule,
  type ProtectionRule,
  type ProtectionRuleInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const resource = useApiResource(getBotProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())

const templateOptions = [
  { label: "后台路径挑战", value: "admin" },
  { label: "登录路径挑战", value: "login" },
  { label: "观察 Bot 行为", value: "observe" }
]

const pathMatchOptions = [
  { label: "精确", value: "exact" },
  { label: "前缀", value: "prefix" }
]

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const failureActionOptions = [
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" }
]

const columns: DataTableColumns<ProtectionRule> = [
  { title: "名称", key: "name", minWidth: 170 },
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
      return row.match.path_match === "exact" ? "精确" : "前缀"
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
    title: "挑战方式",
    key: "challenge.mode",
    width: 126,
    render(row) {
      return formatChallengeMode(row.challenge?.mode)
    }
  },
  {
    title: "有效期",
    key: "challenge.verify_ttl_sec",
    width: 104,
    render(row) {
      return `${row.challenge?.verify_ttl_sec ?? 0}s`
    }
  },
  {
    title: "失败动作",
    key: "challenge.failure_action",
    width: 96,
    render(row) {
      return formatAction(row.challenge?.failure_action ?? row.action.type)
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
    module: "bot-protection",
    category: "challenge",
    site_id: 0,
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
    challenge: {
      mode: "js-challenge",
      verify_ttl_sec: 300,
      failure_action: "block"
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
    challenge: { ...(payload.challenge ?? emptyForm().challenge) },
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
      path: item.match.path || "/admin",
      path_match: item.match.path_match || "prefix",
      methods: [...item.match.methods]
    },
    limit: item.limit,
    challenge: {
      mode: item.challenge?.mode ?? "js-challenge",
      verify_ttl_sec: item.challenge?.verify_ttl_sec ?? 300,
      failure_action: item.challenge?.failure_action ?? item.action.type
    },
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    admin: {
      ...emptyForm(),
      name: "后台路径 JS Challenge",
      match: { path: "/admin", path_match: "prefix", methods: [] },
      challenge: { mode: "js-challenge", verify_ttl_sec: 600, failure_action: "block" },
      action: { type: "block" }
    },
    login: {
      ...emptyForm(),
      name: "登录路径 JS Challenge",
      match: { path: "/login", path_match: "exact", methods: ["GET", "POST"] },
      challenge: { mode: "js-challenge", verify_ttl_sec: 300, failure_action: "block" },
      action: { type: "block" }
    },
    observe: {
      ...emptyForm(),
      name: "Bot 行为观察",
      match: { path: "/", path_match: "prefix", methods: [] },
      challenge: { mode: "js-challenge", verify_ttl_sec: 300, failure_action: "log-only" },
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
  if ((form.challenge?.mode ?? "") !== "js-challenge") {
    return "第一版仅支持 JS Challenge"
  }
  if (Number(form.challenge?.verify_ttl_sec ?? 0) <= 0 || Number(form.challenge?.verify_ttl_sec ?? 0) > 86400) {
    return "验证有效期必须在 1 到 86400 秒之间"
  }
  return ""
}

async function save() {
  const error = validateForm()
  if (error) {
    message.error(error)
    return
  }
  const failureAction = form.challenge?.failure_action ?? "block"
  form.action.type = failureAction
  saving.value = true
  try {
    if (editing.value) {
      await updateBotProtectionRule(editing.value.id, form)
      message.success("Bot 防护规则已更新")
    } else {
      await createBotProtectionRule(form)
      message.success("Bot 防护规则已创建")
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function remove(item: ProtectionRule) {
  await deleteBotProtectionRule(item.id)
  message.success("Bot 防护规则已删除")
  await resource.refresh()
}

function hStatus(enabled: boolean) {
  return h(
    NTag,
    { type: enabled ? "success" : "default", size: "small" },
    { default: () => (enabled ? "启用" : "停用") }
  )
}

function formatChallengeMode(value?: string) {
  if (value === "js-challenge") {
    return "JS Challenge"
  }
  return value || "-"
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
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
    <div class="page-header">
      <div>
        <h1 class="page-title">Bot / 人机验证</h1>
        <p class="page-subtitle">按路径启用轻量 JS Challenge，拦截或观察未通过验证的自动化访问。</p>
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
        :scroll-x="1320"
      />
      <NEmpty
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        description="暂无 Bot 防护规则"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :title="editing ? '编辑 Bot 防护规则' : '新增 Bot 防护规则'" closable>
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
          <NFormItem label="路径匹配">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem label="请求方法">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" placeholder="全部方法" />
          </NFormItem>
          <NFormItem label="挑战方式">
            <NSelect
              v-model:value="form.challenge!.mode"
              :options="[{ label: 'JS Challenge', value: 'js-challenge' }]"
            />
          </NFormItem>
          <NFormItem label="验证有效期秒">
            <NInputNumber v-model:value="form.challenge!.verify_ttl_sec" :min="1" :max="86400" />
          </NFormItem>
          <NFormItem label="失败动作">
            <NSelect v-model:value="form.challenge!.failure_action" :options="failureActionOptions" />
          </NFormItem>
          <NFormItem label="优先级">
            <NInputNumber v-model:value="form.priority" :min="0" />
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
