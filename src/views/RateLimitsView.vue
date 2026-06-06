<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue"
import { useMessage } from "naive-ui"
import {
  createRateLimit,
  deleteRateLimit,
  getRateLimits,
  updateRateLimit,
  type RateLimitInput,
  type RateLimitRule
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const resource = useApiResource(getRateLimits)
const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<RateLimitRule | null>(null)
const legacyFormVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<RateLimitInput>(emptyForm())

const columns = [
  { title: "名称", key: "name" },
  { title: "范围", key: "scope" },
  { title: "匹配值", key: "match_value" },
  { title: "阈值", key: "threshold" },
  { title: "窗口(秒)", key: "window_sec" },
  { title: "动作", key: "action" },
  { title: "封禁(秒)", key: "ban_duration_sec" },
  { title: "违规阈值", key: "violation_threshold" },
  { title: "违规窗口", key: "violation_window_sec" },
  { title: "应用 ID", key: "application_id" },
  { title: "启用", key: "enabled" }
]

function emptyForm(): RateLimitInput {
  return {
    name: "",
    scope: "ip",
    match_value: "",
    threshold: 60,
    window_sec: 60,
    action: "block",
    ban_duration_sec: 0,
    violation_threshold: 0,
    violation_window_sec: 0,
    application_id: 0,
    enabled: true
  }
}

function assignForm(payload: RateLimitInput) {
  Object.assign(form, payload)
}

function startEdit(item: RateLimitRule) {
  editing.value = item
  assignForm({ ...item })
  legacyFormVisible.value = true
}

function openLegacyCreate() {
  editing.value = null
  assignForm(emptyForm())
  legacyFormVisible.value = true
}

function resetForm() {
  editing.value = null
  assignForm(emptyForm())
  legacyFormVisible.value = false
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await updateRateLimit(editing.value.id, form)
      message.success("限流规则已更新")
    } else {
      await createRateLimit(form)
      message.success("限流规则已创建")
    }
    resetForm()
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function remove(item: RateLimitRule) {
  await deleteRateLimit(item.id)
  message.success("限流规则已删除")
  await resource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">限流配置（已废弃兼容入口）</h1>
        <p class="page-subtitle">仅保留旧限流 API 和存储兼容；新建 URL 频率限制、登录防爆破和 API 限流请使用 CC 防护。</p>
      </div>
    </div>

    <section class="section section-pad">
      <NAlert class="compat-alert" type="warning">
        <template #header>旧限流入口已废弃，CC 防护是主入口</template>
        这里仍从旧 `/api/v1/rate-limits` 读取兼容规则，便于排障和处理历史数据。常规新增请进入 CC 防护，那里会以 `module=cc-protection`、`category=rate-limit` 管理同类规则；旧 API、发布字段和网关 fallback 仍保留。
        <div class="compat-actions">
          <RouterLink class="compat-link" to="/cc-protection">
            <NButton type="primary" size="small">去 CC 防护新增规则</NButton>
          </RouterLink>
          <NButton v-if="authStore.canWrite" size="small" secondary @click="openLegacyCreate">
            兼容写入旧限流
          </NButton>
        </div>
      </NAlert>

      <NAlert v-if="resource.error.value" class="view-alert" type="error">
        {{ resource.error.value }}
      </NAlert>

      <NAlert v-if="legacyFormVisible" class="compat-alert" type="warning">
        <template #header>{{ editing ? "正在编辑旧限流兼容规则" : "兼容写入旧限流规则" }}</template>
        此表单只用于兼容旧客户端和历史数据，常规新增仍应从 CC 防护完成。
      </NAlert>

      <NForm v-if="authStore.canWrite && legacyFormVisible" class="form-grid" label-placement="top">
        <NFormItem label="名称"><NInput v-model:value="form.name" /></NFormItem>
        <NFormItem label="范围">
          <NSelect v-model:value="form.scope" :options="[{ label: 'IP', value: 'ip' }, { label: 'URI', value: 'uri' }, { label: '站点', value: 'site' }]" />
        </NFormItem>
        <NFormItem label="匹配值"><NInput v-model:value="form.match_value" /></NFormItem>
        <NFormItem label="阈值"><NInputNumber v-model:value="form.threshold" :min="1" /></NFormItem>
        <NFormItem label="窗口秒"><NInputNumber v-model:value="form.window_sec" :min="1" /></NFormItem>
        <NFormItem label="动作">
          <NSelect v-model:value="form.action" :options="[{ label: '阻断', value: 'block' }, { label: '仅记录', value: 'log-only' }]" />
        </NFormItem>
        <NFormItem label="封禁秒"><NInputNumber v-model:value="form.ban_duration_sec" :min="0" /></NFormItem>
        <NFormItem label="违规阈值"><NInputNumber v-model:value="form.violation_threshold" :min="0" /></NFormItem>
        <NFormItem label="违规窗口秒"><NInputNumber v-model:value="form.violation_window_sec" :min="0" /></NFormItem>
        <NFormItem label="应用 ID"><NInputNumber v-model:value="form.application_id" :min="0" /></NFormItem>
        <NFormItem label="启用"><NSwitch v-model:value="form.enabled" /></NFormItem>
        <NFormItem label="操作">
          <NSpace>
            <NButton type="warning" :loading="saving" @click="save">{{ editing ? "保存兼容修改" : "创建兼容规则" }}</NButton>
            <NButton @click="resetForm">收起表单</NButton>
          </NSpace>
        </NFormItem>
      </NForm>

      <NDataTable :loading="resource.loading.value" :columns="columns" :data="items" :bordered="false" />
      <NSpace v-if="authStore.canWrite" class="row-actions">
        <NButton v-for="item in items" :key="`edit-${item.id}`" size="small" @click="startEdit(item)">
          编辑 {{ item.id }}
        </NButton>
        <NButton v-for="item in items" :key="`delete-${item.id}`" size="small" type="error" @click="remove(item)">
          删除 {{ item.id }}
        </NButton>
      </NSpace>
      <NEmpty v-if="!resource.loading.value && !resource.error.value && items.length === 0" description="暂无限流规则" />
    </section>
  </main>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.compat-alert {
  margin-bottom: 16px;
}

.view-alert {
  margin-bottom: 16px;
}

.compat-link {
  text-decoration: none;
}

.compat-actions {
  margin-top: 12px;
}

.row-actions {
  margin-top: 12px;
}
</style>
