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
import { useI18n } from "vue-i18n"

const { t } = useI18n()
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
  { label: t("moduleCommon.list"), value: items.value.length, tone: "info" as const },
  { label: t("common.enabled"), value: enabledCount.value, tone: "success" as const },
  { label: t("moduleCommon.whitelist"), value: allowCount.value, tone: allowCount.value > 0 ? "warning" as const : "default" as const }
])
const statusItems = computed(() => [
  { label: t("moduleCommon.totalList"), value: items.value.length, note: "IP access list API", tone: "info" as const },
  { label: t("moduleCommon.enabledList"), value: enabledCount.value, note: t("moduleCommon.independentModule"), tone: "success" as const },
  { label: t("moduleCommon.allowList"), value: allowCount.value, note: t("moduleCommon.broadAllowReview"), tone: allowCount.value > 0 ? "danger" as const : "neutral" as const },
  { label: t("moduleCommon.cidrRange"), value: cidrCount.value, note: t("moduleCommon.ipAccessListSubtitle"), tone: cidrCount.value > 0 ? "warning" as const : "neutral" as const }
])
const guidanceAlerts = computed(() => [
  { title: t("moduleCommon.independentModule"), message: t("moduleCommon.independentModuleMessage"), tone: "info" as const },
  { title: t("moduleCommon.broadAllowReview"), message: t("moduleCommon.broadAllowReviewMessage"), tone: "warning" as const }
])

const kindOptions = computed(() => [
  { label: t("moduleCommon.allowList"), value: "allow" },
  { label: t("moduleCommon.blacklist"), value: "block" }
])

const targetOptions = computed(() => [
  { label: t("moduleCommon.singleIp"), value: "ip" },
  { label: t("moduleCommon.cidrRange"), value: "cidr" }
])

const columns = computed<DataTableColumns<IPAccessListEntry>>(() => [
  { title: t("common.name"), key: "name", minWidth: 160 },
  {
    title: t("table.type"),
    key: "kind",
    width: 110,
    render(row) {
      return h(NTag, { type: row.kind === "allow" ? "success" : "error", size: "small" }, { default: () => formatKind(row.kind) })
    }
  },
  {
    title: t("table.target"),
    key: "target",
    width: 92,
    render(row) {
      return row.target === "cidr" ? "CIDR" : "IP"
    }
  },
  { title: t("table.inputValue"), key: "value", minWidth: 170 },
  { title: t("table.runtimeKey"), key: "normalized_value", minWidth: 190 },
  {
    title: t("table.scope"),
    key: "application_id",
    width: 100,
    render(row) {
      return row.application_id > 0 ? t("common.siteScoped", { id: row.application_id }) : t("common.global")
    }
  },
  { title: t("table.family"), key: "ip_family", width: 86 },
  { title: t("table.prefixLength"), key: "prefix_length", width: 76 },
  {
    title: t("common.enabled"),
    key: "enabled",
    width: 84,
    render(row) {
      return h(NTag, { type: row.enabled ? "success" : "default", size: "small" }, { default: () => (row.enabled ? t("common.enabled") : t("common.disabled")) })
    }
  },
  {
    title: t("common.actions"),
    key: "actions",
    fixed: "right",
    width: 210,
    render(row) {
      return h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(NButton, { size: "small", disabled: !authStore.canWrite, onClick: () => startEdit(row) }, { default: () => t("common.edit") }),
            h(
              NButton,
              { size: "small", disabled: !authStore.canWrite, onClick: () => toggleEnabled(row) },
              { default: () => (row.enabled ? t("common.disabled") : t("common.enabled")) }
            ),
            h(
              NButton,
              { size: "small", type: "error", disabled: !authStore.canWrite, onClick: () => remove(row) },
              { default: () => t("common.delete") }
            )
          ]
        }
      )
    }
  }
])

function emptyForm(): IPAccessListInput {
  return {
    name: "",
    kind: "block",
    target: "ip",
    value: "",
    application_id: 0,
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
    application_id: item.application_id,
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
    return t("moduleCommon.nameRequired")
  }
  if (!form.value.trim()) {
    return t("moduleCommon.valueRequired", { name: form.target === "cidr" ? "CIDR" : t("moduleCommon.ipAddress") })
  }
  if (Number(form.application_id ?? 0) < 0) {
    return t("moduleCommon.applicationIdInvalid")
  }
  if (Number(form.priority ?? 0) < 0) {
    return t("common.invalidPriorityZero")
  }
  if (form.target === "ip" && !isIP(form.value)) {
    return t("moduleCommon.invalidIpv4OrIpv6")
  }
  if (form.target === "cidr" && !isCIDR(form.value)) {
    return t("moduleCommon.invalidCidr")
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
      message.success(t("common.updated", { name: t("shell.nav.ipAccessLists") }))
    } else {
      await createIPAccessList(form)
      message.success(t("common.created", { name: t("shell.nav.ipAccessLists") }))
    }
    formVisible.value = false
    await resource.refresh()
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(item: IPAccessListEntry) {
  await updateIPAccessList(item.id, { ...toInput(item), enabled: !item.enabled })
  message.success(item.enabled ? t("moduleCommon.disabledMessage") : t("moduleCommon.enabledMessage"))
  await resource.refresh()
}

function remove(item: IPAccessListEntry) {
  dialog.warning({
    title: t("moduleCommon.deleteTitle", { name: t("shell.nav.ipAccessLists") }),
    content: t("moduleCommon.deleteContent", { name: item.name }),
    positiveText: t("common.delete"),
    negativeText: t("common.cancel"),
    onPositiveClick: async () => {
      await deleteIPAccessList(item.id)
      message.success(t("common.deleted", { name: t("shell.nav.ipAccessLists") }))
      await resource.refresh()
    }
  })
}

function formatKind(value: string) {
  return value === "allow" ? t("moduleCommon.whitelist") : t("moduleCommon.blacklist")
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
      :title="t('shell.nav.ipAccessLists')"
      :subtitle="t('moduleCommon.ipAccessListSubtitle')"
      :eyebrow="t('moduleCommon.protectionModule')"
      :tags="headerTags"
    >
      <template #actions>
      <NSpace>
        <NButton :loading="resource.loading.value" @click="resource.refresh">{{ t("common.refresh") }}</NButton>
        <NButton v-if="authStore.canWrite" type="primary" @click="openCreate">{{ t("moduleCommon.createList") }}</NButton>
      </NSpace>
      </template>
    </ModulePageHeader>

    <ModuleStatusSummary :items="statusItems" />

    <section class="section section-pad guidance-section">
      <ModuleRiskGuidance :title="t('common.operationGuidance')" :items="guidanceAlerts" />
    </section>

    <section class="section section-pad">
      <ModuleStateBlock
        v-if="resource.error.value"
        state="error"
        :title="t('moduleCommon.ipAccessListLoadFailed')"
        :description="resource.error.value"
        :action-label="t('common.retry')"
        @retry="resource.refresh"
      />
      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="resource.loading.value"
        :columns="columns"
        :data="items"
        :bordered="false"
        :scroll-x="1280"
      />
      <ModuleStateBlock
        v-if="!resource.loading.value && !resource.error.value && items.length === 0"
        state="empty"
        :description="t('moduleCommon.noIpAccessLists')"
      />
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="formVisible" :width="520">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editing ? t('moduleCommon.editIpAccessList') : t('moduleCommon.createIpAccessList')" closable>
        <NForm class="rule-form" label-placement="top">
          <NFormItem :label="t('common.name')">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem :label="t('table.type')">
            <NSelect v-model:value="form.kind" :options="kindOptions" />
          </NFormItem>
          <NFormItem :label="t('table.target')">
            <NSelect v-model:value="form.target" :options="targetOptions" />
          </NFormItem>
          <NFormItem :label="form.target === 'cidr' ? 'CIDR' : t('moduleCommon.ipAddress')">
            <NInput v-model:value="form.value" />
          </NFormItem>
          <NFormItem :label="t('common.applicationId')">
            <NInputNumber v-model:value="form.application_id" :min="0" />
          </NFormItem>
          <NFormItem :label="t('common.priority')">
            <NInputNumber v-model:value="form.priority" :min="0" />
          </NFormItem>
          <NFormItem :label="t('common.enabled')">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
          <NFormItem :label="t('moduleCommon.description')">
            <NInput v-model:value="form.description" type="textarea" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="formVisible = false">{{ t("common.cancel") }}</NButton>
            <NButton type="primary" :loading="saving" @click="save">{{ t("common.save") }}</NButton>
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
