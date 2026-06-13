<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useMessage } from "naive-ui"
import {
  getNginxConfigDraft,
  getNginxEffectiveConfig,
  saveNginxConfigDraft,
  validateNginxConfigDraft,
  type NginxConfigDraft
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const { t } = useI18n()
const message = useMessage()
const nginxResource = useApiResource(getNginxConfigDraft)
const nginxEffectiveResource = useApiResource(getNginxEffectiveConfig)
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

const nginxModeOptions = computed(() => [
  { label: t("nginxProxy.advanced.snippetMode"), value: "snippets" },
  { label: t("nginxProxy.advanced.fullMode"), value: "full" }
])

const nginxSnippetPoints = computed(() => [
  { label: t("nginxProxy.advanced.httpPoint"), value: "http" },
  { label: t("nginxProxy.advanced.serverPoint"), value: "server" },
  { label: t("nginxProxy.advanced.locationPoint"), value: "location" }
])

const effectiveSnippetRows = computed(() => mergeSnippetDrafts(nginxEffectiveResource.data.value?.snippets ?? []))

const effectiveSourceLabel = computed(() => {
  const source = nginxEffectiveResource.data.value?.source ?? "missing"
  switch (source) {
    case "runtime_full":
      return t("nginxProxy.advanced.effectiveSources.runtimeFull")
    case "runtime_snippets":
      return t("nginxProxy.advanced.effectiveSources.runtimeSnippets")
    case "generated_default":
      return t("nginxProxy.advanced.effectiveSources.generatedDefault")
    case "missing":
      return t("nginxProxy.advanced.effectiveSources.missing")
    default:
      return source
  }
})

const hasEffectiveConfig = computed(() => {
  const effective = nginxEffectiveResource.data.value
  if (!effective || effective.source === "missing") {
    return false
  }
  if (effective.mode === "full") {
    return Boolean(effective.full_config?.trim())
  }
  return effectiveSnippetRows.value.some((snippet) => snippet.content.trim() !== "")
})

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

function copyEffectiveToDraft() {
  const effective = nginxEffectiveResource.data.value
  if (!effective || !hasEffectiveConfig.value) {
    return
  }
  Object.assign(nginxForm, {
    mode: effective.mode || "snippets",
    snippets: effective.mode === "snippets" ? mergeSnippetDrafts(effective.snippets ?? []) : mergeSnippetDrafts([]),
    full_config: effective.mode === "full" ? effective.full_config ?? "" : "",
    validation: { status: "unchecked" }
  })
  message.success(t("nginxProxy.advanced.copiedToDraft"))
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
    message.success(t("nginxProxy.advanced.saved"))
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
      message.success(t("nginxProxy.advanced.validationPassed"))
    } else {
      message.warning(t("nginxProxy.advanced.validationNotPassed"))
    }
    await nginxResource.refresh()
  } finally {
    validatingNginx.value = false
  }
}
</script>

<template>
  <section class="section section-pad">
    <div class="section-title">{{ t("nginxProxy.advanced.title") }}</div>
    <NAlert type="warning" class="panel-alert">
      {{ t("nginxProxy.advanced.highRiskWarning") }}
    </NAlert>

    <div class="nginx-panel-title">{{ t("nginxProxy.advanced.effectiveTitle") }}</div>
    <NSpin :show="nginxEffectiveResource.loading.value">
      <NEmpty
        v-if="!nginxEffectiveResource.loading.value && !hasEffectiveConfig"
        :description="t('nginxProxy.advanced.effectiveEmpty')"
      />
      <div v-else class="nginx-effective">
        <NDescriptions bordered :column="1" label-placement="left" size="small">
          <NDescriptionsItem :label="t('nginxProxy.advanced.effectiveSource')">
            {{ effectiveSourceLabel }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="nginxEffectiveResource.data.value?.config_path" :label="t('nginxProxy.advanced.configPath')">
            {{ nginxEffectiveResource.data.value?.config_path }}
          </NDescriptionsItem>
        </NDescriptions>
        <template v-if="nginxEffectiveResource.data.value?.mode === 'snippets'">
          <div v-for="snippet in effectiveSnippetRows" :key="snippet.include_point" class="nginx-readonly-block">
            <div class="nginx-readonly-label">{{ snippetLabel(snippet.include_point) }}</div>
            <NInput
              :value="snippet.content"
              type="textarea"
              readonly
              :autosize="{ minRows: 3 }"
              :placeholder="t('nginxProxy.advanced.emptySnippet')"
            />
          </div>
        </template>
        <div v-else class="nginx-readonly-block">
          <div class="nginx-readonly-label">{{ t("nginxProxy.advanced.fullConfig") }}</div>
          <NInput
            :value="nginxEffectiveResource.data.value?.full_config ?? ''"
            type="textarea"
            readonly
            :autosize="{ minRows: 8 }"
          />
        </div>
        <NSpace justify="end">
          <NButton :disabled="!hasEffectiveConfig" @click="copyEffectiveToDraft">
            {{ t("nginxProxy.advanced.copyEffectiveToDraft") }}
          </NButton>
        </NSpace>
      </div>
    </NSpin>
    <NAlert v-if="nginxEffectiveResource.error.value" type="error" class="panel-error">
      {{ nginxEffectiveResource.error.value }}
    </NAlert>

    <div class="nginx-panel-title">{{ t("nginxProxy.advanced.draftTitle") }}</div>
    <NSpin :show="nginxResource.loading.value">
      <NEmpty
        v-if="!nginxResource.loading.value && !nginxResource.data.value"
        :description="t('nginxProxy.advanced.empty')"
      />
      <NForm v-else label-placement="top">
        <NFormItem :label="t('nginxProxy.advanced.mode')">
          <NSelect v-model:value="nginxForm.mode" :options="nginxModeOptions" />
        </NFormItem>
        <template v-if="nginxForm.mode === 'snippets'">
          <NFormItem v-for="snippet in nginxForm.snippets" :key="snippet.include_point" :label="snippetLabel(snippet.include_point)">
            <NInput
              v-model:value="snippet.content"
              type="textarea"
              :autosize="{ minRows: 4 }"
              :placeholder="t('nginxProxy.advanced.snippetPlaceholder')"
            />
          </NFormItem>
        </template>
        <NFormItem v-else :label="t('nginxProxy.advanced.fullConfig')">
          <NInput
            v-model:value="nginxForm.full_config"
            type="textarea"
            :autosize="{ minRows: 12 }"
            :placeholder="t('nginxProxy.advanced.fullPlaceholder')"
          />
        </NFormItem>
        <NAlert :type="nginxValidationType" class="panel-alert">
          {{ t("nginxProxy.advanced.validationStatus", { status: nginxForm.validation?.status || "unchecked" }) }}
          <div v-if="nginxForm.validation?.message">{{ nginxForm.validation.message }}</div>
          <ul v-if="(nginxForm.validation?.diagnostics ?? []).length > 0" class="diagnostics">
            <li v-for="item in nginxForm.validation?.diagnostics" :key="item">{{ item }}</li>
          </ul>
        </NAlert>
        <NSpace justify="end">
          <NButton :loading="savingNginx" @click="saveNginxDraft">{{ t("common.save") }}</NButton>
          <NButton type="primary" :loading="validatingNginx" @click="validateNginxDraft">
            {{ t("nginxProxy.advanced.validate") }}
          </NButton>
        </NSpace>
      </NForm>
    </NSpin>
    <NAlert v-if="nginxResource.error.value" type="error" class="panel-error">
      {{ nginxResource.error.value }}
    </NAlert>
  </section>
</template>

<style scoped>
.section-title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 760;
}

.panel-alert {
  margin-bottom: 12px;
}

.panel-error {
  margin-top: 12px;
}

.diagnostics {
  margin: 8px 0 0;
  padding-left: 18px;
}

.nginx-panel-title {
  margin: 18px 0 12px;
  font-size: 15px;
  font-weight: 700;
}

.nginx-effective {
  display: grid;
  gap: 12px;
}

.nginx-readonly-block {
  display: grid;
  gap: 8px;
}

.nginx-readonly-label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
}
</style>
