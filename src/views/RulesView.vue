<script setup lang="ts">
import { computed, h, reactive, ref } from "vue"
import { NButton, NSpace, useMessage } from "naive-ui"
import {
  createRule,
  deleteRule,
  getRules,
  updateRule,
  type Rule,
  type RuleInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const message = useMessage()
const rulesResource = useApiResource(getRules)
const rules = computed(() => [...(rulesResource.data.value ?? [])])
const showForm = ref(false)
const saving = ref(false)
const editingID = ref<number | null>(null)

const form = reactive<RuleInput>({
  name: "",
  type: "custom",
  target: "args",
  action: "block",
  expression: "",
  score: 80,
  enabled: true
})

const typeOptions = computed(() => [
  { label: "SQLi", value: "sqli" },
  { label: "XSS", value: "xss" },
  { label: "RCE", value: "rce" },
  { label: "CC", value: "cc" },
  { label: "Bot", value: "bot" },
  { label: t("rulesPage.custom"), value: "custom" }
])
const targetOptions = computed(() => [
  { label: t("rulesPage.queryArgs"), value: "args" },
  { label: "URI", value: "uri" },
  { label: t("rulesPage.headers"), value: "headers" },
  { label: t("rulesPage.normalizedUri"), value: "normalized_uri" },
  { label: t("rulesPage.normalizedPath"), value: "normalized_path" },
  { label: t("rulesPage.normalizedArgs"), value: "normalized_args" },
  { label: t("rulesPage.normalizedHeaders"), value: "normalized_headers" },
  { label: t("rulesPage.body"), value: "body" },
  { label: "JSON Body", value: "body_json" },
  { label: "Form Body", value: "body_form" },
  { label: t("rulesPage.uploadFilename"), value: "upload_filename" },
  { label: t("rulesPage.uploadExtension"), value: "upload_extension" },
  { label: t("rulesPage.uploadMime"), value: "upload_mime" },
  { label: t("rulesPage.uploadSize"), value: "upload_size" }
])
const actionOptions = computed(() => [
  { label: t("common.block"), value: "block" },
  { label: t("rulesPage.logOnly"), value: "log-only" },
  { label: t("common.allow"), value: "pass" }
])

const columns = computed(() => [
  { title: t("rulesPage.ruleId"), key: "id" },
  { title: t("common.name"), key: "name" },
  { title: t("rulesPage.type"), key: "type" },
  { title: t("rulesPage.target"), key: "target" },
  { title: t("common.action"), key: "action" },
  { title: t("rulesPage.score"), key: "score" },
  { title: t("common.status"), key: "enabled", render: (row: Rule) => (row.enabled ? t("common.enabled") : t("common.disabled")) },
  {
    title: t("common.actions"),
    key: "actions",
    render: (row: Rule) =>
      h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(NButton, { size: "small", quaternary: true, onClick: () => editRule(row) }, { default: () => t("common.edit") }),
            h(NButton, { size: "small", quaternary: true, onClick: () => removeRule(row.id) }, { default: () => t("common.delete") })
          ]
        }
      )
  }
])

function resetForm() {
  editingID.value = null
  Object.assign(form, {
    name: "",
    type: "custom",
    target: "args",
    action: "block",
    expression: "",
    score: 80,
    enabled: true
  })
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function editRule(rule: Rule) {
  editingID.value = rule.id
  Object.assign(form, {
    name: rule.name,
    type: rule.type,
    target: rule.target,
    action: rule.action,
    expression: rule.expression,
    score: rule.score,
    enabled: rule.enabled
  })
  showForm.value = true
}

async function saveRule() {
  saving.value = true
  try {
    if (editingID.value) {
      await updateRule(editingID.value, form)
    } else {
      await createRule(form)
    }
    message.success(t("rulesPage.saved"))
    showForm.value = false
    await rulesResource.refresh()
  } finally {
    saving.value = false
  }
}

async function removeRule(id: number) {
  await deleteRule(id)
  message.success(t("rulesPage.deleted"))
  await rulesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("rulesPage.title") }}</h1>
        <p class="page-subtitle">{{ t("rulesPage.subtitle") }}</p>
      </div>
      <NButton type="primary" @click="openCreate">{{ t("common.createRule") }}</NButton>
    </div>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="rulesResource.loading.value"
        :columns="columns"
        :data="rules"
        :bordered="false"
      />
      <NEmpty v-if="!rulesResource.loading.value && rules.length === 0" :description="t('common.noRules')" />
      <NAlert v-if="rulesResource.error.value" type="error" style="margin-top: 12px">
        {{ rulesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer v-model:show="showForm" :width="480">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editingID ? t('rulesPage.editRule') : t('rulesPage.newRule')">
        <NForm label-placement="top">
          <NFormItem :label="t('common.ruleName')">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem :label="t('rulesPage.ruleType')">
            <NSelect v-model:value="form.type" :options="typeOptions" />
          </NFormItem>
          <NFormItem :label="t('rulesPage.target')">
            <NSelect v-model:value="form.target" :options="targetOptions" />
          </NFormItem>
          <NFormItem :label="t('common.action')">
            <NSelect v-model:value="form.action" :options="actionOptions" />
          </NFormItem>
          <NFormItem :label="t('rulesPage.expression')">
            <NInput v-model:value="form.expression" type="textarea" />
          </NFormItem>
          <NFormItem :label="t('rulesPage.score')">
            <NInputNumber v-model:value="form.score" :min="0" :max="1000" />
          </NFormItem>
          <NFormItem :label="t('common.enabled')">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">{{ t("common.cancel") }}</NButton>
            <NButton type="primary" :loading="saving" @click="saveRule">{{ t("common.save") }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>
