<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useMessage } from "naive-ui"
import type { Application, ApplicationInput, ApplicationProxyConfig } from "@/api/litewaf"
import { updateApplication } from "@/api/litewaf"

const props = defineProps<{
  applications: Application[]
  loading: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const { t } = useI18n()
const message = useMessage()
const selectedApplicationId = defineModel<number | null>("selectedApplicationId", { default: null })
const form = reactive<Required<ApplicationProxyConfig>>({
  headers: [],
  connect_timeout: "",
  read_timeout: "",
  send_timeout: "",
  websocket_enabled: false,
  preserve_host: true,
  proxy_buffering: "",
  request_buffering: ""
})
const saving = defineModel<boolean>("saving", { default: false })

const applicationOptions = computed(() =>
  props.applications.map((application) => ({
    label: `${application.name} (#${application.id})`,
    value: application.id
  }))
)

const selectedApplication = computed(() =>
  props.applications.find((application) => application.id === selectedApplicationId.value) ?? null
)

const proxySwitchOptions = computed(() => [
  { label: t("nginxProxy.application.proxyDefault"), value: "" },
  { label: "on", value: "on" },
  { label: "off", value: "off" }
])

const hostSummary = computed(() => selectedApplication.value?.hosts.map((host) => host.host).join(", ") || t("common.noData"))
const listenerSummary = computed(() =>
  selectedApplication.value?.listeners
    .filter((listener) => listener.enabled)
    .map((listener) => `${listener.port}/${listener.protocol}`)
    .join(", ") || t("common.noData")
)
const upstreamSummary = computed(() =>
  selectedApplication.value?.upstreams
    .filter((upstream) => upstream.enabled)
    .map((upstream) => upstream.url)
    .join(", ") || t("common.noData")
)

watch(
  () => props.applications,
  (applications) => {
    if (selectedApplicationId.value && applications.some((application) => application.id === selectedApplicationId.value)) {
      return
    }
    selectedApplicationId.value = applications[0]?.id ?? null
  },
  { immediate: true }
)

watch(
  selectedApplication,
  (application) => {
    Object.assign(form, normalizeProxyConfigForForm(application?.proxy_config))
  },
  { immediate: true }
)

function normalizeProxyConfigForForm(config: Application["proxy_config"]): Required<ApplicationProxyConfig> {
  return {
    headers: (config?.headers ?? []).map((header) => ({ name: header.name, value: header.value })),
    connect_timeout: config?.connect_timeout ?? "",
    read_timeout: config?.read_timeout ?? "",
    send_timeout: config?.send_timeout ?? "",
    websocket_enabled: Boolean(config?.websocket_enabled),
    preserve_host: config?.preserve_host ?? true,
    proxy_buffering: config?.proxy_buffering ?? "",
    request_buffering: config?.request_buffering ?? ""
  }
}

function normalizedProxyConfigInput(): ApplicationInput["proxy_config"] | undefined {
  const headers = form.headers
    .filter((header) => header.name.trim() || header.value.trim())
    .map((header) => ({ name: header.name.trim(), value: header.value.trim() }))
  const payload = {
    headers,
    connect_timeout: form.connect_timeout.trim(),
    read_timeout: form.read_timeout.trim(),
    send_timeout: form.send_timeout.trim(),
    websocket_enabled: Boolean(form.websocket_enabled),
    preserve_host: form.preserve_host,
    proxy_buffering: form.proxy_buffering,
    request_buffering: form.request_buffering
  }
  const empty =
    headers.length === 0 &&
    !payload.connect_timeout &&
    !payload.read_timeout &&
    !payload.send_timeout &&
    !payload.websocket_enabled &&
    payload.preserve_host === true &&
    !payload.proxy_buffering &&
    !payload.request_buffering
  return empty ? undefined : payload
}

function applicationToInput(application: Application): ApplicationInput {
  return {
    name: application.name,
    mode: application.mode,
    enabled: application.enabled,
    description: application.description ?? "",
    hosts: application.hosts.map((host) => ({
      host: host.host,
      is_primary: host.is_primary
    })),
    listeners: application.listeners.map((listener) => ({
      port: listener.port,
      protocol: listener.protocol,
      certificate_id: listener.certificate_id || undefined,
      enabled: listener.enabled
    })),
    upstreams: application.upstreams.map((upstream) => ({
      name: upstream.name,
      url: upstream.url,
      weight: upstream.weight,
      enabled: upstream.enabled
    })),
    proxy_config: normalizedProxyConfigInput()
  }
}

function addProxyHeader() {
  form.headers = [...form.headers, { name: "", value: "" }]
}

function removeProxyHeader(index: number) {
  form.headers.splice(index, 1)
}

async function saveApplicationProxyConfig() {
  const application = selectedApplication.value
  if (!application) {
    return
  }
  saving.value = true
  try {
    await updateApplication(application.id, applicationToInput(application))
    message.success(t("nginxProxy.application.saved"))
    emit("saved")
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="section section-pad">
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t("nginxProxy.application.title") }}</h2>
        <p class="section-subtitle">{{ t("nginxProxy.application.subtitle") }}</p>
      </div>
      <NButton :disabled="!selectedApplication" :loading="saving" type="primary" @click="saveApplicationProxyConfig">
        {{ t("common.save") }}
      </NButton>
    </div>

    <NSpin :show="loading">
      <NEmpty v-if="!loading && applications.length === 0" :description="t('nginxProxy.application.empty')" />
      <div v-else class="proxy-editor">
        <NForm label-placement="top">
          <NFormItem :label="t('nginxProxy.application.selectApplication')">
            <NSelect
              v-model:value="selectedApplicationId"
              :options="applicationOptions"
              :placeholder="t('nginxProxy.application.selectApplication')"
            />
          </NFormItem>

          <NDescriptions v-if="selectedApplication" bordered :column="1" label-placement="left" size="small">
            <NDescriptionsItem :label="t('applications.domains')">{{ hostSummary }}</NDescriptionsItem>
            <NDescriptionsItem :label="t('applications.listener')">{{ listenerSummary }}</NDescriptionsItem>
            <NDescriptionsItem :label="t('applications.upstream')">{{ upstreamSummary }}</NDescriptionsItem>
          </NDescriptions>

          <div v-if="selectedApplication" class="proxy-form-grid">
            <NFormItem :label="t('nginxProxy.application.connectTimeout')">
              <NInput v-model:value="form.connect_timeout" placeholder="30s" />
            </NFormItem>
            <NFormItem :label="t('nginxProxy.application.readTimeout')">
              <NInput v-model:value="form.read_timeout" placeholder="60s" />
            </NFormItem>
            <NFormItem :label="t('nginxProxy.application.sendTimeout')">
              <NInput v-model:value="form.send_timeout" placeholder="60s" />
            </NFormItem>
            <NFormItem :label="t('nginxProxy.application.proxyBuffering')">
              <NSelect v-model:value="form.proxy_buffering" :options="proxySwitchOptions" />
            </NFormItem>
            <NFormItem :label="t('nginxProxy.application.requestBuffering')">
              <NSelect v-model:value="form.request_buffering" :options="proxySwitchOptions" />
            </NFormItem>
            <NFormItem :label="t('nginxProxy.application.websocket')">
              <NSwitch v-model:value="form.websocket_enabled" />
            </NFormItem>
            <NFormItem :label="t('nginxProxy.application.preserveHost')">
              <NSwitch v-model:value="form.preserve_host" />
            </NFormItem>
          </div>

          <div v-if="selectedApplication" class="header-block">
            <div class="header-row">
              <h3 class="block-title">{{ t("nginxProxy.application.proxyHeaders") }}</h3>
              <NButton size="small" @click="addProxyHeader">{{ t("nginxProxy.application.addProxyHeader") }}</NButton>
            </div>
            <div v-for="(header, index) in form.headers" :key="index" class="proxy-header-row">
              <NInput v-model:value="header.name" :placeholder="t('nginxProxy.application.proxyHeaderName')" />
              <NInput v-model:value="header.value" :placeholder="t('nginxProxy.application.proxyHeaderValue')" />
              <NButton size="small" quaternary @click="removeProxyHeader(index)">{{ t("common.delete") }}</NButton>
            </div>
            <NEmpty v-if="form.headers.length === 0" :description="t('nginxProxy.application.noProxyHeaders')" />
          </div>
        </NForm>
      </div>
    </NSpin>
    <NAlert v-if="error" type="error" class="panel-error">
      {{ error }}
    </NAlert>
  </section>
</template>

<style scoped>
.section-header,
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title,
.block-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.section-subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.proxy-editor {
  display: grid;
  gap: 14px;
}

.proxy-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.header-block {
  margin-top: 6px;
}

.proxy-header-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(220px, 2fr) auto;
  gap: 10px;
  margin-bottom: 10px;
}

.panel-error {
  margin-top: 12px;
}

@media (max-width: 760px) {
  .section-header,
  .header-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .proxy-header-row {
    grid-template-columns: 1fr;
  }
}
</style>
