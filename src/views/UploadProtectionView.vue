<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  createUploadProtectionRule,
  deleteUploadProtectionRule,
  getUploadProtectionRules,
  updateUploadProtectionRule,
  type ProtectionRule,
  type ProtectionRuleInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const resource = useApiResource(getUploadProtectionRules)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<ProtectionRule | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<ProtectionRuleInput>(emptyForm())

const templateOptions = [
  { label: "危险脚本扩展名", value: "script" },
  { label: "头像上传大小限制", value: "avatar" },
  { label: "观察上传行为", value: "observe" }
]

const pathMatchOptions = [
  { label: "精确", value: "exact" },
  { label: "前缀", value: "prefix" }
]

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => ({
  label: method,
  value: method
}))

const actionOptions = [
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
    title: "上传路径",
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
    title: "危险扩展名",
    key: "upload.extensions",
    minWidth: 150,
    render(row) {
      return row.upload?.extensions.length ? row.upload.extensions.map((item) => `.${item}`).join(", ") : "-"
    }
  },
  {
    title: "大小限制",
    key: "upload.max_bytes",
    width: 118,
    render(row) {
      return row.upload?.max_bytes ? formatBytes(row.upload.max_bytes) : "-"
    }
  },
  {
    title: "动作",
    key: "action.type",
    width: 96,
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
    module: "upload-protection",
    category: "upload",
    site_id: 0,
    enabled: true,
    priority: 100,
    match: {
      path: "/upload",
      path_match: "prefix",
      methods: ["POST"]
    },
    limit: {
      counter: "",
      threshold: 0,
      window_sec: 0,
      ban_duration_sec: 0
    },
    upload: {
      extensions: ["php", "jsp", "asp", "aspx"],
      max_bytes: 0
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
    upload: {
      extensions: [...(payload.upload?.extensions ?? [])],
      max_bytes: payload.upload?.max_bytes ?? 0
    },
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
      path: item.match.path || "/upload",
      path_match: item.match.path_match || "prefix",
      methods: [...item.match.methods]
    },
    limit: item.limit,
    upload: {
      extensions: [...(item.upload?.extensions ?? [])],
      max_bytes: item.upload?.max_bytes ?? 0
    },
    action: item.action
  })
  formVisible.value = true
}

function applyTemplate(value: string) {
  const templates: Record<string, ProtectionRuleInput> = {
    script: {
      ...emptyForm(),
      name: "危险脚本扩展名阻断",
      match: { path: "/upload", path_match: "prefix", methods: ["POST"] },
      upload: { extensions: ["php", "jsp", "asp", "aspx", "jspx"], max_bytes: 0 },
      action: { type: "block" }
    },
    avatar: {
      ...emptyForm(),
      name: "头像上传大小限制",
      match: { path: "/upload/avatar", path_match: "prefix", methods: ["POST", "PUT"] },
      upload: { extensions: [], max_bytes: 1048576 },
      action: { type: "block" }
    },
    observe: {
      ...emptyForm(),
      name: "上传行为观察",
      match: { path: "/upload", path_match: "prefix", methods: ["POST", "PUT"] },
      upload: { extensions: ["php", "jsp", "exe"], max_bytes: 10485760 },
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
    return "上传路径必须以 / 开头"
  }
  if (Number(form.priority ?? 0) < 0) {
    return "优先级不能小于 0"
  }
  if (!form.upload?.extensions.length && Number(form.upload?.max_bytes ?? 0) <= 0) {
    return "危险扩展名和大小限制至少填写一项"
  }
  if (Number(form.upload?.max_bytes ?? 0) < 0) {
    return "大小限制不能小于 0"
  }
  if ((form.upload?.extensions ?? []).some((item) => item.includes("/") || item.includes("\\") || item.includes(".."))) {
    return "扩展名不能包含路径字符"
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
      await updateUploadProtectionRule(editing.value.id, form)
      message.success("上传防护规则已更新")
    } else {
      await createUploadProtectionRule(form)
      message.success("上传防护规则已创建")
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function remove(item: ProtectionRule) {
  await deleteUploadProtectionRule(item.id)
  message.success("上传防护规则已删除")
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

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": "观察",
    block: "阻断"
  }
  return labels[value] ?? value
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MiB`
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KiB`
  }
  return `${value} B`
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
        <h1 class="page-title">上传防护</h1>
        <p class="page-subtitle">按上传路径、危险扩展名和大小限制管理上传请求处置。</p>
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
        :scroll-x="1360"
      />
      <NEmpty
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        description="暂无上传防护规则"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :title="editing ? '编辑上传防护规则' : '新增上传防护规则'" closable>
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
          <NFormItem label="上传路径">
            <NInput v-model:value="form.match.path" />
          </NFormItem>
          <NFormItem label="路径匹配">
            <NSelect v-model:value="form.match.path_match" :options="pathMatchOptions" />
          </NFormItem>
          <NFormItem label="请求方法">
            <NSelect v-model:value="form.match.methods" multiple :options="methodOptions" placeholder="全部方法" />
          </NFormItem>
          <NFormItem label="危险扩展名">
            <NDynamicTags v-model:value="form.upload!.extensions" />
          </NFormItem>
          <NFormItem label="大小限制字节">
            <NInputNumber v-model:value="form.upload!.max_bytes" :min="0" :max="1073741824" />
          </NFormItem>
          <NFormItem label="动作">
            <NSelect v-model:value="form.action.type" :options="actionOptions" />
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
