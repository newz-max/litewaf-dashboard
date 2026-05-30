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
}

function resetForm() {
  editing.value = null
  assignForm(emptyForm())
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
        <h1 class="page-title">黑白名单</h1>
        <p class="page-subtitle">维护 IP、CIDR、URI 和 UA 访问控制。</p>
      </div>
    </div>

    <section class="section section-pad">
      <NForm v-if="authStore.canWrite" class="form-grid" label-placement="top">
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
            <NButton type="primary" :loading="saving" @click="save">{{ editing ? "保存" : "创建" }}</NButton>
            <NButton @click="resetForm">重置</NButton>
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
      <NEmpty v-if="!resource.loading.value && items.length === 0" description="暂无名单" />
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

.row-actions {
  margin-top: 12px;
}
</style>
