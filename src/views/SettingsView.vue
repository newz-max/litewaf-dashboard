<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue"
import {
  getNginxConfigDraft,
  getVersion,
  saveNginxConfigDraft,
  validateNginxConfigDraft,
  type NginxConfigDraft
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import ThemeSettingsPanel from "@/components/theme/ThemeSettingsPanel.vue"
import UploadLimitsPanel from "@/components/settings/UploadLimitsPanel.vue"
import { useI18n } from "vue-i18n"
import { useMessage } from "naive-ui"

const { t } = useI18n()
const message = useMessage()
const versionResource = useApiResource(getVersion)
const nginxResource = useApiResource(getNginxConfigDraft)
const uploadLimits = computed(() => versionResource.data.value?.upload_limits)
const savingNginx = ref(false)
const validatingNginx = ref(false)
const nginxForm = reactive<NginxConfigDraft>({
  mode: "snippets",
  snippets: [
    { include_point: "http", content: "" },
    { include_point: "server", content: "" },
    { include_point: "location", content: "" }
  ],
  full_config: "",
  validation: { status: "unchecked" }
})
const settings = computed(() => {
  const version = versionResource.data.value

  if (!version) {
    return []
  }

  return [
    { key: t("settings.appName"), value: version.name },
    { key: t("settings.version"), value: version.version },
    { key: t("settings.environment"), value: version.env },
    { key: t("settings.gatewayClientMaxBodySize"), value: version.gateway_client_max_body_size }
  ]
})

const nginxModeOptions = computed(() => [
  { label: t("settings.nginx.snippetMode"), value: "snippets" },
  { label: t("settings.nginx.fullMode"), value: "full" }
])

const nginxSnippetPoints = computed(() => [
  { label: t("settings.nginx.httpPoint"), value: "http" },
  { label: t("settings.nginx.serverPoint"), value: "server" },
  { label: t("settings.nginx.locationPoint"), value: "location" }
])

const nginxValidationType = computed(() => {
  switch (nginxForm.validation?.status) {
    case "passed":
      return "success"
    case "failed":
      return "error"
    case "unavailable":
      return "warning"
    default:
      return "default"
  }
})

watch(
  () => nginxResource.data.value,
  (draft) => {
    if (!draft) {
      return
    }
    Object.assign(nginxForm, {
      mode: draft.mode || "snippets",
      snippets: mergeSnippetDrafts(draft.snippets ?? []),
      full_config: draft.full_config ?? "",
      validation: draft.validation ?? { status: "unchecked" },
      updated_by: draft.updated_by,
      updated_at: draft.updated_at,
      published_at: draft.published_at
    })
  },
  { immediate: true }
)

function mergeSnippetDrafts(snippets: readonly NginxConfigDraft["snippets"][number][]) {
  return nginxSnippetPoints.value.map((point) => ({
    include_point: point.value,
    content: snippets.find((snippet) => snippet.include_point === point.value)?.content ?? ""
  }))
}

function snippetLabel(point: string) {
  return nginxSnippetPoints.value.find((item) => item.value === point)?.label ?? point
}

async function saveNginxDraft() {
  savingNginx.value = true
  try {
    const saved = await saveNginxConfigDraft({
      ...nginxForm,
      snippets: nginxForm.mode === "snippets" ? nginxForm.snippets : [],
      full_config: nginxForm.mode === "full" ? nginxForm.full_config ?? "" : "",
      validation: nginxForm.validation ?? { status: "unchecked" }
    })
    Object.assign(nginxForm, { ...saved, snippets: mergeSnippetDrafts(saved.snippets ?? []) })
    message.success(t("settings.nginx.saved"))
    await nginxResource.refresh()
  } finally {
    savingNginx.value = false
  }
}

async function validateNginxDraft() {
  validatingNginx.value = true
  try {
    await saveNginxDraft()
    const result = await validateNginxConfigDraft()
    Object.assign(nginxForm, { ...result.item, snippets: mergeSnippetDrafts(result.item.snippets ?? []) })
    if (result.review.validation.status === "passed") {
      message.success(t("settings.nginx.validationPassed"))
    } else {
      message.warning(t("settings.nginx.validationNotPassed"))
    }
    await nginxResource.refresh()
  } finally {
    validatingNginx.value = false
  }
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("settings.title") }}</h1>
        <p class="page-subtitle">{{ t("settings.subtitle") }}</p>
      </div>
    </div>

    <ThemeSettingsPanel />

    <section class="section section-pad">
      <div class="section-title">{{ t("settings.runtimeInfo") }}</div>
      <NSpin :show="versionResource.loading.value">
        <NEmpty v-if="settings.length === 0 && !versionResource.loading.value" :description="t('settings.emptyRuntimeInfo')" />
        <NDescriptions v-else bordered :column="1" label-placement="left">
          <NDescriptionsItem
            v-for="item in settings"
            :key="item.key"
            :label="item.key"
          >
            {{ item.value }}
          </NDescriptionsItem>
        </NDescriptions>
      </NSpin>
      <NAlert v-if="versionResource.error.value" type="error" style="margin-top: 12px">
        {{ versionResource.error.value }}
      </NAlert>
    </section>

    <UploadLimitsPanel
      :summary="uploadLimits"
      :loading="versionResource.loading.value"
      :error="versionResource.error.value"
    />

    <section class="section section-pad">
      <div class="section-title">{{ t("settings.nginx.title") }}</div>
      <NAlert type="warning" style="margin-bottom: 12px">
        {{ t("settings.nginx.highRiskWarning") }}
      </NAlert>
      <NSpin :show="nginxResource.loading.value">
        <NEmpty
          v-if="!nginxResource.loading.value && !nginxResource.data.value"
          :description="t('settings.nginx.empty')"
        />
        <NForm v-else label-placement="top">
          <NFormItem :label="t('settings.nginx.mode')">
            <NSelect v-model:value="nginxForm.mode" :options="nginxModeOptions" />
          </NFormItem>
          <template v-if="nginxForm.mode === 'snippets'">
            <NFormItem v-for="snippet in nginxForm.snippets" :key="snippet.include_point" :label="snippetLabel(snippet.include_point)">
              <NInput
                v-model:value="snippet.content"
                type="textarea"
                :autosize="{ minRows: 4 }"
                :placeholder="t('settings.nginx.snippetPlaceholder')"
              />
            </NFormItem>
          </template>
          <NFormItem v-else :label="t('settings.nginx.fullConfig')">
            <NInput
              v-model:value="nginxForm.full_config"
              type="textarea"
              :autosize="{ minRows: 12 }"
              :placeholder="t('settings.nginx.fullPlaceholder')"
            />
          </NFormItem>
          <NAlert :type="nginxValidationType" style="margin-bottom: 12px">
            {{ t("settings.nginx.validationStatus", { status: nginxForm.validation?.status || "unchecked" }) }}
            <div v-if="nginxForm.validation?.message">{{ nginxForm.validation.message }}</div>
            <ul v-if="(nginxForm.validation?.diagnostics ?? []).length > 0" class="diagnostics">
              <li v-for="item in nginxForm.validation?.diagnostics" :key="item">{{ item }}</li>
            </ul>
          </NAlert>
          <NSpace justify="end">
            <NButton :loading="savingNginx" @click="saveNginxDraft">{{ t("common.save") }}</NButton>
            <NButton type="primary" :loading="validatingNginx" @click="validateNginxDraft">
              {{ t("settings.nginx.validate") }}
            </NButton>
          </NSpace>
        </NForm>
      </NSpin>
      <NAlert v-if="nginxResource.error.value" type="error" style="margin-top: 12px">
        {{ nginxResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>

<style scoped>
.section-title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 760;
}

.diagnostics {
  margin: 8px 0 0;
  padding-left: 18px;
}
</style>
