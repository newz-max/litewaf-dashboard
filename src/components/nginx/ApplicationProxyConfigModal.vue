<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { Application, ApplicationInput } from "@/api/litewaf"
import {
  normalizeApplicationProxyConfigForForm,
  normalizeApplicationProxyConfigInput,
  type ApplicationProxyFormInput
} from "@/utils/applicationProxyConfig"

const props = defineProps<{
  application: Application | null
  error?: string
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: ApplicationInput["proxy_config"] | undefined]
}>()

const show = defineModel<boolean>("show", { default: false })
const { t } = useI18n()
const form = reactive<ApplicationProxyFormInput>(normalizeApplicationProxyConfigForForm(undefined))

const proxySwitchOptions = computed(() => [
  { label: t("nginxProxy.application.proxyDefault"), value: "" },
  { label: "on", value: "on" },
  { label: "off", value: "off" }
])

const hostSummary = computed(() => props.application?.hosts.map((host) => host.host).join(", ") || t("common.noData"))
const listenerSummary = computed(() =>
  props.application?.listeners
    .filter((listener) => listener.enabled)
    .map((listener) => `${listener.port}/${listener.protocol}`)
    .join(", ") || t("common.noData")
)
const upstreamSummary = computed(() =>
  props.application?.upstreams
    .filter((upstream) => upstream.enabled)
    .map((upstream) => upstream.url)
    .join(", ") || t("common.noData")
)

watch(
  () => [props.application?.id, show.value] as const,
  ([, visible]) => {
    if (!visible) {
      return
    }
    Object.assign(form, normalizeApplicationProxyConfigForForm(props.application?.proxy_config))
  },
  { immediate: true }
)

function addProxyHeader() {
  form.headers = [...form.headers, { name: "", value: "" }]
}

function removeProxyHeader(index: number) {
  form.headers.splice(index, 1)
}

function closeModal() {
  show.value = false
  emit("close")
}

function save() {
  emit("save", normalizeApplicationProxyConfigInput(form))
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="application ? t('nginxProxy.application.modalTitle', { name: application.name }) : t('nginxProxy.application.modalTitleEmpty')"
    class="proxy-modal"
    :bordered="false"
    :mask-closable="!saving"
    :closable="!saving"
    @after-leave="emit('close')"
  >
    <NAlert v-if="error" type="error" class="modal-alert">
      {{ error }}
    </NAlert>

    <NDescriptions v-if="application" bordered :column="1" label-placement="left" size="small" class="routing-context">
      <NDescriptionsItem :label="t('applications.domains')">{{ hostSummary }}</NDescriptionsItem>
      <NDescriptionsItem :label="t('applications.listener')">{{ listenerSummary }}</NDescriptionsItem>
      <NDescriptionsItem :label="t('applications.upstream')">{{ upstreamSummary }}</NDescriptionsItem>
    </NDescriptions>

    <NForm v-if="application" label-placement="top" class="proxy-form">
      <div class="proxy-form-grid">
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

      <div class="header-block">
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

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="saving" @click="closeModal">{{ t("common.cancel") }}</NButton>
        <NButton type="primary" :disabled="!application" :loading="saving" @click="save">
          {{ t("common.save") }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.proxy-modal {
  width: min(760px, calc(100vw - 32px));
}

.modal-alert {
  margin-bottom: 12px;
}

.routing-context {
  margin-bottom: 14px;
}

.proxy-form {
  display: grid;
  gap: 14px;
}

.proxy-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.block-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.proxy-header-row {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(220px, 2fr) auto;
  gap: 10px;
  margin-bottom: 10px;
}

@media (max-width: 760px) {
  .header-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .proxy-header-row {
    grid-template-columns: 1fr;
  }
}
</style>
