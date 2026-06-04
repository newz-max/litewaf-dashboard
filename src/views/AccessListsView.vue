<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue"
import { useMessage } from "naive-ui"
import {
  createAccessList,
  deleteAccessList,
  getAccessLists,
  updateAccessList,
  type AccessListEntry,
  type AccessListInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const resource = useApiResource(getAccessLists)
const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<AccessListEntry | null>(null)
const legacyFormVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<AccessListInput>(emptyForm())

const columns = [
  { title: "名称", key: "name" },
  { title: "类型", key: "kind" },
  { title: "目标", key: "target" },
  { title: "值", key: "value" },
  { title: "动作", key: "action" },
  { title: "站点 ID", key: "site_id" },
  { title: "启用", key: "enabled" }
]

function emptyForm(): AccessListInput {
  return {
    name: "",
    kind: "blacklist",
    target: "ip",
    value: "",
    action: "block",
    site_id: 0,
    enabled: true
  }
}

function assignForm(payload: AccessListInput) {
  Object.assign(form, payload)
}

function startEdit(item: AccessListEntry) {
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
      await updateAccessList(editing.value.id, form)
      message.success("名单已更新")
    } else {
      await createAccessList(form)
      message.success("名单已创建")
    }
    resetForm()
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function remove(item: AccessListEntry) {
  await deleteAccessList(item.id)
  message.success("名单已删除")
  await resource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">黑白名单（已废弃兼容入口）</h1>
        <p class="page-subtitle">仅保留旧黑白名单 API 和存储兼容；新建 IP/CIDR、路径、Header 和 Host 访问规则请使用访问控制。</p>
      </div>
    </div>

    <section class="section section-pad">
      <NAlert class="compat-alert" type="warning">
        <template #header>旧黑白名单入口已废弃，访问控制是主入口</template>
        这里仍从旧 `/api/v1/access-lists` 读取兼容名单，便于排障和处理历史数据。常规新增请进入访问控制，那里会以 `module=access-control`、`category=access-control` 管理同类规则；旧 API、发布字段和网关 fallback 仍保留。
        <div class="compat-actions">
          <RouterLink class="compat-link" to="/access-control">
            <NButton type="primary" size="small">去访问控制新增规则</NButton>
          </RouterLink>
          <NButton v-if="authStore.canWrite" size="small" secondary @click="openLegacyCreate">
            兼容写入旧名单
          </NButton>
        </div>
      </NAlert>

      <NAlert v-if="resource.error.value" class="view-alert" type="error">
        {{ resource.error.value }}
      </NAlert>

      <NAlert v-if="legacyFormVisible" class="compat-alert" type="warning">
        <template #header>{{ editing ? "正在编辑旧名单兼容规则" : "兼容写入旧名单规则" }}</template>
        此表单只用于兼容旧客户端和历史数据，常规新增仍应从访问控制完成。
      </NAlert>

      <NForm v-if="authStore.canWrite && legacyFormVisible" class="form-grid" label-placement="top">
        <NFormItem label="名称"><NInput v-model:value="form.name" /></NFormItem>
        <NFormItem label="类型">
          <NSelect v-model:value="form.kind" :options="[{ label: '黑名单', value: 'blacklist' }, { label: '白名单', value: 'whitelist' }]" />
        </NFormItem>
        <NFormItem label="目标">
          <NSelect v-model:value="form.target" :options="[{ label: 'IP', value: 'ip' }, { label: 'CIDR', value: 'cidr' }, { label: 'URI', value: 'uri' }, { label: 'UA', value: 'ua' }]" />
        </NFormItem>
        <NFormItem label="值"><NInput v-model:value="form.value" /></NFormItem>
        <NFormItem label="动作">
          <NSelect v-model:value="form.action" :options="[{ label: '允许', value: 'allow' }, { label: '阻断', value: 'block' }]" />
        </NFormItem>
        <NFormItem label="站点 ID"><NInputNumber v-model:value="form.site_id" :min="0" /></NFormItem>
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
      <NEmpty v-if="!resource.loading.value && !resource.error.value && items.length === 0" description="暂无名单" />
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
