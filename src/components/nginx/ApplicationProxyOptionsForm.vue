<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { ApplicationProxyFormInput } from "@/utils/applicationProxyConfig"

const form = defineModel<ApplicationProxyFormInput>({ required: true })
const { t } = useI18n()

const proxySwitchOptions = computed(() => [
  { label: t("nginxProxy.application.proxyDefault"), value: "" },
  { label: "on", value: "on" },
  { label: "off", value: "off" }
])

function addProxyHeader() {
  form.value.headers = [...form.value.headers, { name: "", value: "" }]
}

function removeProxyHeader(index: number) {
  form.value.headers.splice(index, 1)
}
</script>

<template>
  <NForm label-placement="top" class="proxy-form">
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
</template>

<style scoped>
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
