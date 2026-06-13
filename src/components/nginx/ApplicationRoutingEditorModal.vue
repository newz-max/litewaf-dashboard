<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { Application, ApplicationHost, ApplicationInput, ApplicationListener, ApplicationRoute, ApplicationUpstream } from "@/api/litewaf"
import ApplicationProxyOptionsForm from "@/components/nginx/ApplicationProxyOptionsForm.vue"
import ApplicationRouteRows from "@/components/nginx/ApplicationRouteRows.vue"
import {
  defaultApplicationProxyForm,
  normalizeApplicationProxyConfigForForm,
  normalizeApplicationProxyConfigInput,
  normalizeApplicationRoutesInput,
  type ApplicationProxyFormInput
} from "@/utils/applicationProxyConfig"

type EditableHost = Omit<ApplicationHost, "id" | "application_id">
type EditableListener = Omit<ApplicationListener, "id" | "application_id">
type EditableUpstream = Omit<ApplicationUpstream, "id" | "application_id">
type EditableRoute = Omit<ApplicationRoute, "proxy_config"> & { proxy_config: ApplicationProxyFormInput }

const props = defineProps<{
  application: Application | null
  error?: string
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: ApplicationInput]
}>()

const show = defineModel<boolean>("show", { default: false })
const { t } = useI18n()

const form = reactive({
  hosts: [] as EditableHost[],
  listeners: [] as EditableListener[],
  upstreams: [] as EditableUpstream[],
  routes: [] as EditableRoute[],
  proxy_config: defaultApplicationProxyForm()
})

const protocolOptions = [
  { label: "HTTP", value: "http" },
  { label: "HTTPS", value: "https" }
]

watch(
  () => [props.application?.id, show.value] as const,
  ([, visible]) => {
    if (!visible || !props.application) {
      return
    }
    form.hosts = props.application.hosts.map((host) => ({ host: host.host, is_primary: host.is_primary }))
    form.listeners = props.application.listeners.map((listener) => ({
      port: listener.port,
      protocol: listener.protocol,
      certificate_id: listener.certificate_id,
      enabled: listener.enabled
    }))
    form.upstreams = props.application.upstreams.map((upstream) => ({
      name: upstream.name,
      url: upstream.url,
      weight: upstream.weight,
      enabled: upstream.enabled
    }))
    form.routes = (props.application.routes ?? []).map((route) => ({
      ...route,
      proxy_config: normalizeApplicationProxyConfigForForm(route.proxy_config)
    }))
    form.proxy_config = normalizeApplicationProxyConfigForForm(props.application.proxy_config)
  },
  { immediate: true }
)

const orderedRoutes = computed(() => [...form.routes].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)))
const editableUpstreams = computed<ApplicationUpstream[]>(() =>
  form.upstreams.map((upstream, index) => ({
    id: index + 1,
    name: upstream.name,
    url: upstream.url,
    weight: upstream.weight,
    enabled: upstream.enabled
  }))
)

function addHost() {
  form.hosts.push({ host: "", is_primary: form.hosts.length === 0 })
}

function removeHost(index: number) {
  form.hosts.splice(index, 1)
}

function addListener() {
  form.listeners.push({ port: 80, protocol: "http", enabled: true })
}

function removeListener(index: number) {
  form.listeners.splice(index, 1)
}

function addUpstream() {
  form.upstreams.push({ name: nextUpstreamName(), url: "", weight: 1, enabled: true })
}

function removeUpstream(index: number) {
  form.upstreams.splice(index, 1)
}

function addRoute() {
  form.routes.push({
    id: 0,
    name: t("nginxProxy.routing.newRoute"),
    path: "/",
    path_match: "prefix",
    upstream_name: form.upstreams.find((upstream) => upstream.enabled)?.name ?? form.upstreams[0]?.name ?? "",
    priority: nextRoutePriority(),
    enabled: true,
    proxy_config: defaultApplicationProxyForm()
  })
}

function removeRoute(index: number) {
  form.routes.splice(index, 1)
}

function nextUpstreamName() {
  const existing = new Set(form.upstreams.map((upstream) => upstream.name))
  let index = form.upstreams.length + 1
  while (existing.has(`upstream-${index}`)) {
    index += 1
  }
  return `upstream-${index}`
}

function nextRoutePriority() {
  return form.routes.reduce((max, route) => Math.max(max, route.priority || 0), 0) + 10
}

function save() {
  const application = props.application
  if (!application) {
    return
  }
  emit("save", {
    name: application.name,
    mode: application.mode,
    enabled: application.enabled,
    description: application.description ?? "",
    hosts: form.hosts.map((host) => ({ host: host.host.trim(), is_primary: host.is_primary })),
    listeners: form.listeners.map((listener) => ({
      port: listener.port,
      protocol: listener.protocol,
      certificate_id: listener.certificate_id || undefined,
      enabled: listener.enabled
    })),
    upstreams: form.upstreams.map((upstream) => ({
      name: upstream.name.trim(),
      url: upstream.url.trim(),
      weight: upstream.weight || 1,
      enabled: upstream.enabled
    })),
    routes: normalizeApplicationRoutesInput(form.routes),
    proxy_config: normalizeApplicationProxyConfigInput(form.proxy_config as ApplicationProxyFormInput)
  })
}

function closeModal() {
  show.value = false
  emit("close")
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="application ? t('nginxProxy.routing.modalTitle', { name: application.name }) : t('nginxProxy.application.modalTitleEmpty')"
    class="routing-modal"
    :bordered="false"
    :mask-closable="!saving"
    :closable="!saving"
    @after-leave="emit('close')"
  >
    <NAlert v-if="error" type="error" class="modal-alert">
      {{ error }}
    </NAlert>

    <NTabs v-if="application" type="line" animated>
      <NTabPane name="routing" :tab="t('nginxProxy.routing.routingTab')">
        <div class="editor-section">
          <div class="section-title-row">
            <h3 class="block-title">{{ t("applications.domains") }}</h3>
            <NButton size="small" @click="addHost">{{ t("nginxProxy.routing.addDomain") }}</NButton>
          </div>
          <div v-for="(host, index) in form.hosts" :key="index" class="domain-row">
            <NInput v-model:value="host.host" placeholder="example.com" />
            <NCheckbox v-model:checked="host.is_primary">{{ t("nginxProxy.routing.primaryDomain") }}</NCheckbox>
            <NButton size="small" quaternary @click="removeHost(index)">{{ t("common.delete") }}</NButton>
          </div>

          <div class="section-title-row">
            <h3 class="block-title">{{ t("applications.listener") }}</h3>
            <NButton size="small" @click="addListener">{{ t("nginxProxy.routing.addListener") }}</NButton>
          </div>
          <div v-for="(listener, index) in form.listeners" :key="index" class="listener-row">
            <NInputNumber v-model:value="listener.port" :min="1" :max="65535" />
            <NSelect v-model:value="listener.protocol" :options="protocolOptions" />
            <NInputNumber v-model:value="listener.certificate_id" :min="0" :placeholder="t('nginxProxy.routing.certificateId')" />
            <NSwitch v-model:value="listener.enabled" />
            <NButton size="small" quaternary @click="removeListener(index)">{{ t("common.delete") }}</NButton>
          </div>

          <div class="section-title-row">
            <h3 class="block-title">{{ t("applications.upstream") }}</h3>
            <NButton size="small" @click="addUpstream">{{ t("nginxProxy.routing.addUpstream") }}</NButton>
          </div>
          <div v-for="(upstream, index) in form.upstreams" :key="index" class="upstream-row">
            <NInput v-model:value="upstream.name" :placeholder="t('nginxProxy.routing.upstreamName')" />
            <NInput v-model:value="upstream.url" placeholder="http://127.0.0.1:8080" />
            <NInputNumber v-model:value="upstream.weight" :min="1" />
            <NSwitch v-model:value="upstream.enabled" />
            <NButton size="small" quaternary @click="removeUpstream(index)">{{ t("common.delete") }}</NButton>
          </div>

          <ApplicationRouteRows :routes="form.routes" :upstreams="editableUpstreams" @add="addRoute" @remove="removeRoute" />
        </div>
      </NTabPane>

      <NTabPane name="proxy" :tab="t('nginxProxy.routing.proxyTab')">
        <ApplicationProxyOptionsForm v-model="form.proxy_config" />
      </NTabPane>

      <NTabPane name="summary" :tab="t('nginxProxy.routing.summaryTab')">
        <NDescriptions bordered :column="1" size="small">
          <NDescriptionsItem :label="t('applications.domains')">
            {{ form.hosts.map((host) => host.host).filter(Boolean).join(", ") || t("common.noData") }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('applications.listener')">
            {{ form.listeners.filter((listener) => listener.enabled).map((listener) => `${listener.port}/${listener.protocol}`).join(", ") || t("common.noData") }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('nginxProxy.routing.routeOrder')">
            {{ orderedRoutes.map((route) => `${route.priority}:${route.path} -> ${route.upstream_name}`).join(" | ") || t("common.noData") }}
          </NDescriptionsItem>
        </NDescriptions>
      </NTabPane>
    </NTabs>

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
.routing-modal {
  width: min(1080px, calc(100vw - 32px));
}

.modal-alert {
  margin-bottom: 12px;
}

.editor-section {
  display: grid;
  gap: 14px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.block-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.domain-row,
.listener-row,
.upstream-row {
  display: grid;
  gap: 10px;
  align-items: center;
}

.domain-row {
  grid-template-columns: minmax(220px, 1fr) auto auto;
}

.listener-row {
  grid-template-columns: minmax(100px, 0.8fr) minmax(120px, 0.8fr) minmax(140px, 1fr) auto auto;
}

.upstream-row {
  grid-template-columns: minmax(120px, 0.8fr) minmax(240px, 1.6fr) minmax(90px, 0.5fr) auto auto;
}

@media (max-width: 820px) {
  .domain-row,
  .listener-row,
  .upstream-row {
    grid-template-columns: 1fr;
  }

  .section-title-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
