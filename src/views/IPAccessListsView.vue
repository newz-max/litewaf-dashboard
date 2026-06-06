<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useDialog, useMessage, type DataTableColumns } from "naive-ui"
import {
  createIPAccessList,
  deleteIPAccessList,
  getIPAccessLists,
  updateIPAccessList,
  type IPAccessListEntry,
  type IPAccessListInput
} from "@/api/litewaf"
import ModulePageHeader from "@/components/operations/ModulePageHeader.vue"
import ModuleRiskGuidance from "@/components/operations/ModuleRiskGuidance.vue"
import ModuleStateBlock from "@/components/operations/ModuleStateBlock.vue"
import ModuleStatusSummary from "@/components/operations/ModuleStatusSummary.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const resource = useApiResource(getIPAccessLists)

const items = computed(() => [...(resource.data.value ?? [])])
const editing = shallowRef<IPAccessListEntry | null>(null)
const formVisible = shallowRef(false)
const saving = shallowRef(false)
const form = reactive<IPAccessListInput>(emptyForm())
const enabledCount = computed(() => items.value.filter((item) => item.enabled).length)
const allowCount = computed(() => items.value.filter((item) => item.kind === "allow").length)
const blockCount = computed(() => items.value.filter((item) => item.kind === "block").length)
const cidrCount = computed(() => items.value.filter((item) => item.target === "cidr").length)
const headerTags = computed(() => [
  { label: "名单", value: items.value.length, tone: "info" as const },
  { label: "启用", value: enabledCount.value, tone: "success" as const },
  { label: "白名单", value: allowCount.value, tone: allowCount.value > 0 ? "warning" as const : "default" as const }
])
const statusItems = computed(() => [
  { label: "名单总数", value: items.value.length, note: "来自 IP 黑白名单 API", tone: "info" as const },
  { label: "启用名单", value: enabledCount.value, note: "参与独立 IP 模块判断", tone: "success" as const },
  { label: "白名单放行", value: allowCount.value, note: "优先复核宽泛放行", tone: allowCount.value > 0 ? "danger" as const : "neutral" as const },
  { label: "CIDR 网段", value: cidrCount.value, note: "按前缀长度有界匹配", tone: cidrCount.value > 0 ? "warning" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => [
  { title: "独立模块", message: "IP 黑白名单保持与访问控制分离，日志和发布预览按 ip-access-list 模块归因。", tone: "info" as const },
  { title: "宽泛放行复核", message: "白名单和大网段 CIDR 会影响拦截判断，保存前应确认站点作用域和优先级。", tone: "warning" as const }
])

const kindOptions = [
  { label: "白名单放行", value: "allow" },
  { label: "黑名单阻断", value: "block" }
]

const targetOptions = [
  { label: "单个 IP", value: "ip" },
  { label: "CIDR 网段", value: "cidr" }
]

const columns: DataTableColumns<IPAccessListEntry> = [
  { title: "名称", key: "name", minWidth: 160 },
  {
    title: "类型",
    key: "kind",
    width: 110,
    render(row) {
      return h(NTag, { type: row.kind === "allow" ? "success" : "error", size: "small" }, { default: () => formatKind(row.kind) })
    }
  },
  {
    title: "目标",
    key: "target",
    width: 92,
    render(row) {
      return row.target === "cidr" ? "CIDR" : "IP"
    }
  },
  { title: "输入值", key: "value", minWidth: 170 },
  { title: "运行键", key: "normalized_value", minWidth: 190 },
  {
    title: "作用域",
    key: "site_id",
    width: 100,
    render(row) {
      return row.site_id > 0 ? `站点 ${row.site_id}` : "全局"
    }
  },
  { title: "族", key: "ip_family", width: 86 },
  { title: "前缀", key: "prefix_length", width: 76 },
  {
    title: "启用",
    key: "enabled",
    width: 84,
    render(row) {
      return h(NTag, { type: row.enabled ? "success" : "default", size: "small" }, { default: () => (row.enabled ? "启用" : "停用") })
    }
  },
  {
    title: "操作",
    key: "actions",
    fixed: "right",
    width: 210,
    render(row) {
      return h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(NButton, { size: "small", disabled: !authStore.canWrite, onClick: () => startEdit(row) }, { default: () => "编辑" }),
            h(
              NButton,
              { size: "small", disabled: !authStore.canWrite, onClick: () => toggleEnabled(row) },
              { default: () => (row.enabled ? "停用" : "启用") }
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

function emptyForm(): IPAccessListInput {
  return {
    name: "",
    kind: "block",
    target: "ip",
    value: "",
    site_id: 0,
    enabled: true,
    priority: 100,
    description: ""
  }
}

function assignForm(payload: IPAccessListInput) {
  Object.assign(form, payload)
}

function toInput(item: IPAccessListEntry): IPAccessListInput {
  return {
    name: item.name,
    kind: item.kind,
    target: item.target,
    value: item.value,
    site_id: item.site_id,
    enabled: item.enabled,
    priority: item.priority ?? 100,
    description: item.description ?? ""
  }
}

function openCreate() {
  editing.value = null
  assignForm(emptyForm())
  formVisible.value = true
}

function startEdit(item: IPAccessListEntry) {
  editing.value = item
  assignForm(toInput(item))
  formVisible.value = true
}

function validateForm() {
  if (!form.name.trim()) {
    return "名称不能为空"
  }
  if (!form.value.trim()) {
    return "IP 或 CIDR 不能为空"
  }
  if (Number(form.site_id ?? 0) < 0) {
    return "站点 ID 不能小于 0"
  }
  if (Number(form.priority ?? 0) < 0) {
    return "优先级不能小于 0"
  }
  if (form.target === "ip" && !isIP(form.value)) {
    return "请输入有效 IPv4 或 IPv6 地址"
  }
  if (form.target === "cidr" && !isCIDR(form.value)) {
    return "请输入有效 IPv4/IPv6 CIDR"
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
      await updateIPAccessList(editing.value.id, form)
      message.success("IP 黑白名单已更新")
    } else {
      await createIPAccessList(form)
      message.success("IP 黑白名单已创建")
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(item: IPAccessListEntry) {
  await updateIPAccessList(item.id, { ...toInput(item), enabled: !item.enabled })
  message.success(item.enabled ? "已停用" : "已启用")
  await resource.refresh()
}

function remove(item: IPAccessListEntry) {
  dialog.warning({
    title: "删除 IP 黑白名单",
    content: `确认删除 ${item.name}？`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      await deleteIPAccessList(item.id)
      message.success("IP 黑白名单已删除")
      await resource.refresh()
    }
  })
}

function formatKind(value: string) {
  return value === "allow" ? "白名单" : "黑名单"
}

function isIP(value: string) {
  return isIPv4(value) || isIPv6(value)
}

function isCIDR(value: string) {
  const parts = value.split("/")
  if (parts.length !== 2) {
    return false
  }
  const prefix = Number(parts[1])
  if (!Number.isInteger(prefix)) {
    return false
  }
  if (isIPv4(parts[0])) {
    return prefix >= 0 && prefix <= 32
  }
  if (isIPv6(parts[0])) {
    return prefix >= 0 && prefix <= 128
  }
  return false
}

function isIPv4(value: string) {
  const parts = value.split(".")
  return parts.length === 4 && parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
}

function isIPv6(value: string) {
  return value.includes(":") && /^[0-9a-fA-F:]+$/.test(value) && value.split("::").length <= 2
}
</script>

<template>
  <main class="page">
    <ModulePageHeader
      title="IP 黑白名单"
      subtitle="Exact IP 使用预处理哈希索引 O(1) 查询；CIDR 使用按前缀长度分组的有界索引。"
      eyebrow="Protection Module"
      :tags="headerTags"
    >
      <template #actions>
      <NSpace>
        <NButton :loading="resource.loading.value" @click="resource.refresh">刷新</NButton>
        <NButton v-if="authStore.canWrite" type="primary" @click="openCreate">新增名单</NButton>
      </NSpace>
      </template>
    </ModulePageHeader>

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance title="运营指引" :items="guidanceAlerts" />
    </section>

    <section class="section section-pad">
      <ModuleStateBlock
        v-if="resource.error.value"
        state="error"
        title="IP 黑白名单加载失败"
        :description="resource.error.value"
        action-label="重试"
        @retry="resource.refresh"
      />
      <NDataTable
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1280"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        description="暂无 IP 黑白名单"
      />
    </section>

    <NDrawer v-model:show="formVisible" :width="520">
      <NDrawerContent :title="editing ? '编辑 IP 黑白名单' : '新增 IP 黑白名单'" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem label="名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="类型">
            <NSelect v-model:value="form.kind" :options="kindOptions" />
          </NFormItem>
          <NFormItem label="目标">
            <NSelect v-model:value="form.target" :options="targetOptions" />
          </NFormItem>
          <NFormItem :label="form.target === 'cidr' ? 'CIDR' : 'IP 地址'">
            <NInput v-model:value="form.value" />
          </NFormItem>
          <NFormItem label="站点 ID">
            <NInputNumber v-model:value="form.site_id" :min="0" />
          </NFormItem>
          <NFormItem label="优先级">
            <NInputNumber v-model:value="form.priority" :min="0" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
          <NFormItem label="描述">
            <NInput v-model:value="form.description" type="textarea" />
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

.guidance-section {
  margin-bottom: 16px;
}

.rule-form {
  display: grid;
  gap: 4px;
}
</style>
