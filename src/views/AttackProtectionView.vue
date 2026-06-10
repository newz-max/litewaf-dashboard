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
import { useI18n } from "vue-i18n"

const { t } = useI18n()
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

const actionOptions = computed(() => [
  { label: t("common.observation"), value: "log-only" },
  { label: t("common.block"), value: "block" }
])

const enabledCount = computed(() => groups.value.filter((group) => group.enabled).length)
const blockingCount = computed(() => groups.value.filter((group) => group.action === "block").length)
const enabledRuleCount = computed(() => groups.value.reduce((total, group) => total + group.enabled_rule_count, 0))
const headerTags = computed(() => [
  { label: t("modules.attack.group"), value: groups.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: t("common.block"), value: blockingCount.value, tone: "warning" as const }
])
const statusItems = computed(() => [
  { label: t("modules.attack.group"), value: groups.value.length, note: t("modules.attack.apiSource"), tone: "info" as const },
  { label: t("modules.attack.enabledGroups"), value: enabledCount.value, note: t("modules.attack.enabledGroupsNote"), tone: "success" as const },
  { label: t("common.enabledRules"), value: enabledRuleCount.value, note: t("modules.attack.enabledRulesNote"), tone: enabledRuleCount.value > 0 ? "warning" as const : "neutral" as const },
  { label: t("modules.attack.blockingGroups"), value: blockingCount.value, note: t("modules.attack.blockingGroupsNote"), tone: blockingCount.value > 0 ? "danger" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => [
  { title: t("modules.attack.managedGroupsTitle"), message: t("modules.attack.managedGroupsMessage"), tone: "info" as const },
  { title: t("modules.attack.reviewBeforeBlockTitle"), message: t("modules.attack.reviewBeforeBlockMessage"), tone: "warning" as const }
])

const columns = computed<DataTableColumns<AttackProtectionGroup>>(() => [
  {
    title: t("table.group"),
    key: "name",
    minWidth: 160
  },
  {
    title: t("table.attackType"),
    key: "attack_type",
    width: 128,
    render(row) {
      return formatAttackType(row.attack_type)
    }
  },
  {
    title: t("table.ruleCount"),
    key: "rule_count",
    width: 108,
    render(row) {
      return `${row.enabled_rule_count}/${row.rule_count}`
    }
  },
  {
    title: t("common.action"),
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
    title: t("common.enabled"),
    key: "enabled",
    width: 84,
    render(row) {
      return h(
        NTag,
        { type: row.enabled ? "success" : "default", size: "small" },
        { default: () => (row.enabled ? t("common.enabled") : t("common.disabled")) }
      )
    }
  },
  {
    title: t("common.priority"),
    key: "priority",
    width: 92
  },
  {
    title: t("common.updatedAt"),
    key: "updated_at",
    minWidth: 160,
    render(row) {
      return formatTime(row.updated_at)
    }
  },
  {
    title: t("common.actions"),
    key: "actions",
    fixed: "right",
    width: 96,
    render(row) {
      return h(
        NButton,
        { size: "small", disabled: !authStore.canWrite, onClick: () => openEdit(row) },
        { default: () => t("common.configure") }
      )
    }
  }
])

function openEdit(group: AttackProtectionGroup) {
  editing.value = group
  form.action = group.action || "block"
  form.enabled = group.enabled
  form.priority = group.priority || 100
  drawerVisible.value = true
}

function validateForm() {
  if (!["log-only", "block"].includes(form.action)) {
    return t("common.action")
  }
  if (form.priority <= 0) {
    return t("common.invalidPriorityPositive")
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
    message.success(t("common.updated", { name: t("modules.attack.title") }))
    drawerVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

function formatAttackType(value: string) {
  const labels: Record<string, string> = {
    sqli: t("modules.attack.sqli"),
    xss: "XSS",
    rce: "RCE",
    "path-traversal": t("modules.attack.pathTraversal")
  }
  return labels[value] ?? value
}

function formatAction(value: string) {
  const labels: Record<string, string> = {
    "log-only": t("common.observation"),
    block: t("common.block")
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
      :title="t('modules.attack.title')"
      :subtitle="t('modules.attack.subtitle')"
      :eyebrow="t('moduleCommon.protectionModule')"
      :tags="headerTags"
    >
      <template #actions>
      <NButton :loading="resource.loading.value" @click="resource.refresh">{{ t("common.refresh") }}</NButton>
      </template>
    </ModulePageHeader>

    <ModuleStateBlock
      v-if="resource.error.value"
      state="error"
      :title="t('modules.attack.loadingFailed')"
      :description="resource.error.value"
      :action-label="t('common.retry')"
      @retry="resource.refresh"
    />

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" />
    </section>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="groups"
        :bordered="false"
        :scroll-x="920"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && groups.length === 0"
        state="empty"
        :description="t('modules.attack.emptyRules')"
      />
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="drawerVisible" :width="460">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? editing.name : t('moduleCommon.configTitle', { name: t('modules.attack.title') })" closable>
        <NForm class="group-form" label-placement="top">
          <NFormItem :label="t('table.attackType')">
            <NInput :value="editing ? formatAttackType(editing.attack_type) : ''" disabled />
          </NFormItem>
          <NFormItem :label="t('common.action')">
            <NSelect v-model:value="form.action" :options="actionOptions" :disabled="!authStore.canWrite" />
          </NFormItem>
          <NFormItem :label="t('common.priority')">
            <NInputNumber v-model:value="form.priority" :min="1" :disabled="!authStore.canWrite" />
          </NFormItem>
          <NFormItem :label="t('common.enabled')">
            <NSwitch v-model:value="form.enabled" :disabled="!authStore.canWrite" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="drawerVisible = false">{{ t("common.cancel") }}</NButton>
            <NButton type="primary" :disabled="!authStore.canWrite" :loading="saving" @click="save">{{ t("common.save") }}</NButton>
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
