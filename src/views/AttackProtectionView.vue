<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  getAttackProtectionGroups,
  updateAttackProtectionGroup,
  type AttackProtectionGroup,
  type AttackProtectionGroupInput
} from "@/api/litewaf"
import ModulePageHeader from "@/components/operations/ModulePageHeader.vue"
import ModuleRiskGuidance from "@/components/operations/ModuleRiskGuidance.vue"
import ModuleStateBlock from "@/components/operations/ModuleStateBlock.vue"
import ModuleStatusSummary from "@/components/operations/ModuleStatusSummary.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const resource = useApiResource(getAttackProtectionGroups)
const groups = computed(() => [...(resource.data.value ?? [])])
const saving = shallowRef(false)
const editing = shallowRef<AttackProtectionGroup | null>(null)
const drawerVisible = shallowRef(false)
const form = reactive<AttackProtectionGroupInput>({
  action: "block",
  enabled: true,
  priority: 100
})

const actionOptions = [
  { label: "观察", value: "log-only" },
  { label: "阻断", value: "block" }
]

const enabledCount = computed(() => groups.value.filter((group) => group.enabled).length)
const blockingCount = computed(() => groups.value.filter((group) => group.action === "block").length)
const enabledRuleCount = computed(() => groups.value.reduce((total, group) => total + group.enabled_rule_count, 0))
const headerTags = computed(() => [
  { label: "防护组", value: groups.value.length, tone: "info" as const },
  { label: "启用", value: enabledCount.value, tone: "success" as const },
  { label: "阻断", value: blockingCount.value, tone: "warning" as const }
])
const statusItems = computed(() => [
  { label: "防护组", value: groups.value.length, note: "来自攻击防护 API", tone: "info" as const },
  { label: "启用组", value: enabledCount.value, note: "参与托管规则组处置", tone: "success" as const },
  { label: "启用规则", value: enabledRuleCount.value, note: "托管规则组中的启用规则", tone: enabledRuleCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: "阻断组", value: blockingCount.value, note: "动作设置为阻断", tone: blockingCount.value > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => [
  { title: "托管规则组", message: "攻击防护按攻击类型配置托管规则组动作和优先级，不改变具体规则签名内容。", tone: "info" as const },
  { title: "阻断前复核", message: "将防护组切换为阻断会影响该攻击类型下的启用规则，应结合攻击日志确认误报风险。", tone: "warning" as const }
])

const columns: DataTableColumns<AttackProtectionGroup> = [
  {
    title: "防护组",
    key: "name",
    minWidth: 160
  },
  {
    title: "攻击类型",
    key: "attack_type",
    width: 128,
    render(row) {
      return formatAttackType(row.attack_type)
    }
  },
  {
    title: "规则数量",
    key: "rule_count",
    width: 108,
    render(row) {
      return `${row.enabled_rule_count}/${row.rule_count}`
    }
  },
  {
    title: "动作",
    key: "action",
    width: 96,
    render(row) {
      return h(
        NTag,
        { type: row.action === "block" ? "error" : "warning", size: "small" },
        { default: () => formatAction(row.action) }
      )
    }
  },
  {
    title: "启用",
    key: "enabled",
    width: 84,
    render(row) {
      return h(
        NTag,
        { type: row.enabled ? "success" : "default", size: "small" },
        { default: () => (row.enabled ? "启用" : "停用") }
      )
    }
  },
  {
    title: "优先级",
    key: "priority",
    width: 92
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
    width: 96,
    render(row) {
      return h(
        NButton,
        { size: "small", disabled: !authStore.canWrite, onClick: () => openEdit(row) },
        { default: () => "配置" }
      )
    }
  }
]

function openEdit(group: AttackProtectionGroup) {
  editing.value = group
  form.action = group.action || "block"
  form.enabled = group.enabled
  form.priority = group.priority || 100
  drawerVisible.value = true
}

function validateForm() {
  if (!["log-only", "block"].includes(form.action)) {
    return "动作只能是观察或阻断"
  }
  if (form.priority <= 0) {
    return "优先级必须大于 0"
  }
  return ""
}

async function save() {
  if (!editing.value) {
    return
  }
  const error = validateForm()
  if (error) {
    message.error(error)
    return
  }
  saving.value = true
  try {
    await updateAttackProtectionGroup(editing.value.attack_type, form)
    message.success("攻击防护配置已更新")
    drawerVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

function formatAttackType(value: string) {
  const labels: Record<string, string> = {
    sqli: "SQL 注入",
    xss: "XSS",
    rce: "RCE",
    "path-traversal": "路径穿越"
  }
  return labels[value] ?? value
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
    <ModulePageHeader
      title="攻击防护"
      subtitle="按攻击类型管理托管规则组的观察、阻断和启用状态。"
      eyebrow="Protection Module"
      :tags="headerTags"
    >
      <template #actions>
      <NButton :loading="resource.loading.value" @click="resource.refresh">刷新</NButton>
      </template>
    </ModulePageHeader>

    <ModuleStateBlock
      v-if="resource.error.value"
      state="error"
      title="攻击防护加载失败"
      :description="resource.error.value"
      action-label="重试"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance title="运营指引" :items="guidanceAlerts" />
    </section>

    <section class="section section-pad">
      <NDataTable
        :loading="resource.loading.value"
        :columns="columns"
        :data="groups"
        :bordered="false"
        :scroll-x="920"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && groups.length === 0"
        state="empty"
        description="暂无攻击防护规则组"
      />
    </section>

    <NDrawer v-model:show="drawerVisible" :width="460">
      <NDrawerContent :title="editing ? editing.name : '攻击防护配置'" closable>
        <NForm class="group-form" label-placement="top">
          <NFormItem label="攻击类型">
            <NInput :value="editing ? formatAttackType(editing.attack_type) : ''" disabled />
          </NFormItem>
          <NFormItem label="动作">
            <NSelect v-model:value="form.action" :options="actionOptions" :disabled="!authStore.canWrite" />
          </NFormItem>
          <NFormItem label="优先级">
            <NInputNumber v-model:value="form.priority" :min="1" :disabled="!authStore.canWrite" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="form.enabled" :disabled="!authStore.canWrite" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" :disabled="!authStore.canWrite" :loading="saving" @click="save">保存</NButton>
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

.group-form {
  display: grid;
  gap: 4px;
}
</style>
