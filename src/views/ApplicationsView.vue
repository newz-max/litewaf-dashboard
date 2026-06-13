<script setup lang="ts">
import { computed, h, reactive, ref } from "vue"
import { NButton, NSpace, NTag, useMessage } from "naive-ui"
import {
  createApplication,
  createCertificate,
  deleteApplication,
  deleteCertificate,
  getApplications,
  getCertificates,
  updateApplication,
  validateCertificate,
  type Application,
  type ApplicationInput,
  type Certificate
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { formatDateTime } from "@/utils/dateTime"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const message = useMessage()
const applicationsResource = useApiResource(getApplications)
const certificatesResource = useApiResource(getCertificates)
const applications = computed(() => [...(applicationsResource.data.value ?? [])])
const certificates = computed(() => [...(certificatesResource.data.value ?? [])])
const certificateOptions = computed(() =>
  certificates.value.map((certificate) => ({
    label: `${certificate.name} (#${certificate.id})`,
    value: certificate.id
  }))
)

const showForm = ref(false)
const showCertificateForm = ref(false)
const saving = ref(false)
const savingCertificate = ref(false)
const validatingCertificate = ref(false)
const editingID = ref<number | null>(null)

type ApplicationFormInput = ApplicationInput & {
  proxy_config: NonNullable<ApplicationInput["proxy_config"]>
}

const form = reactive<ApplicationFormInput>({
  name: "",
  mode: "protect",
  enabled: true,
  description: "",
  hosts: [{ host: "", is_primary: true }],
  listeners: [{ port: 80, protocol: "http", enabled: true }],
  upstreams: [{ name: "primary", url: "", weight: 1, enabled: true }],
  proxy_config: {
    headers: [],
    connect_timeout: "",
    read_timeout: "",
    send_timeout: "",
    websocket_enabled: false,
    preserve_host: true,
    proxy_buffering: "",
    request_buffering: ""
  }
})

const certificateForm = reactive({
  name: "",
  cert_pem: "",
  key_pem: ""
})

const modeOptions = computed(() => [
  { label: t("applications.modeProtect"), value: "protect" },
  { label: t("applications.modeMonitor"), value: "monitor" },
  { label: t("applications.modeOff"), value: "off" }
])

const protocolOptions = [
  { label: "HTTP", value: "http" },
  { label: "HTTPS", value: "https" }
]

const proxySwitchOptions = computed(() => [
  { label: t("applications.proxyDefault"), value: "" },
  { label: "on", value: "on" },
  { label: "off", value: "off" }
])

const applicationColumns = computed(() => [
  { title: t("applications.application"), key: "name" },
  {
    title: t("applications.domains"),
    key: "hosts",
    render: (row: Application) => row.hosts.map((host) => host.host).join(", ")
  },
  {
    title: t("applications.listener"),
    key: "listeners",
    render: (row: Application) =>
      h(
        NSpace,
        { size: "small" },
        {
          default: () =>
            row.listeners
              .filter((listener) => listener.enabled)
              .map((listener) =>
                h(
                  NTag,
                  { size: "small", type: listener.protocol === "https" ? "success" : "default" },
                  { default: () => `${listener.port}/${listener.protocol}` }
                )
              )
        }
      )
  },
  {
    title: t("applications.upstream"),
    key: "upstreams",
    render: (row: Application) => row.upstreams.filter((item) => item.enabled).map((item) => item.url).join(", ")
  },
  { title: t("applications.mode"), key: "mode" },
  {
    title: t("common.status"),
    key: "enabled",
    render: (row: Application) => (row.enabled ? t("common.enabled") : t("common.disabled"))
  },
  {
    title: t("common.actions"),
    key: "actions",
    render: (row: Application) =>
      hActions([
        { label: t("common.edit"), onClick: () => editApplication(row) },
        { label: row.enabled ? t("common.disabled") : t("common.enabled"), onClick: () => toggleApplication(row) },
        { label: t("common.delete"), onClick: () => removeApplication(row.id) }
      ])
  }
])

const certificateColumns = computed(() => [
  { title: t("applications.certificates"), key: "name" },
  {
    title: t("applications.domains"),
    key: "domains",
    render: (row: Certificate) => row.domains.join(", ")
  },
  { title: t("applications.validUntil"), key: "not_after", render: (row: Certificate) => formatDateTime(row.not_after) },
  { title: t("applications.fingerprint"), key: "fingerprint" },
  {
    title: t("common.actions"),
    key: "actions",
    render: (row: Certificate) => hActions([{ label: t("common.delete"), onClick: () => removeCertificate(row.id) }])
  }
])

function resetApplicationForm() {
  editingID.value = null
  Object.assign(form, {
    name: "",
    mode: "protect",
    enabled: true,
    description: "",
    hosts: [{ host: "", is_primary: true }],
    listeners: [{ port: 80, protocol: "http", enabled: true }],
    upstreams: [{ name: "primary", url: "", weight: 1, enabled: true }],
    proxy_config: {
      headers: [],
      connect_timeout: "",
      read_timeout: "",
      send_timeout: "",
      websocket_enabled: false,
      preserve_host: true,
      proxy_buffering: "",
      request_buffering: ""
    }
  })
}

function openCreate() {
  resetApplicationForm()
  showForm.value = true
}

function editApplication(application: Application) {
  editingID.value = application.id
  Object.assign(form, {
    name: application.name,
    mode: application.mode,
    enabled: application.enabled,
    description: application.description ?? "",
    hosts: application.hosts.map((host) => ({ host: host.host, is_primary: host.is_primary })),
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
    proxy_config: normalizeProxyConfigForForm(application.proxy_config)
  })
  showForm.value = true
}

async function saveApplication() {
  saving.value = true
  try {
    const payload = normalizedApplicationInput()
    if (editingID.value) {
      await updateApplication(editingID.value, payload)
    } else {
      await createApplication(payload)
    }
    message.success(t("applications.applicationSaved"))
    showForm.value = false
    await applicationsResource.refresh()
  } finally {
    saving.value = false
  }
}

async function toggleApplication(application: Application) {
  await updateApplication(application.id, {
    name: application.name,
    mode: application.mode,
    enabled: !application.enabled,
    description: application.description ?? "",
    hosts: application.hosts.map((host) => ({ host: host.host, is_primary: host.is_primary })),
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
    proxy_config: application.proxy_config
  })
  message.success(application.enabled ? t("applications.applicationDisabled") : t("applications.applicationEnabled"))
  await applicationsResource.refresh()
}

async function removeApplication(id: number) {
  await deleteApplication(id)
  message.success(t("applications.applicationDeleted"))
  await applicationsResource.refresh()
}

function normalizedApplicationInput(): ApplicationInput {
  const hosts = form.hosts.filter((host) => host.host.trim())
  const primaryHostIndex = Math.max(
    0,
    hosts.findIndex((host) => host.is_primary)
  )

  return {
    name: form.name.trim(),
    mode: form.mode,
    enabled: form.enabled,
    description: form.description?.trim(),
    hosts: hosts.map((host, index) => ({ host: host.host.trim(), is_primary: index === primaryHostIndex })),
    listeners: form.listeners.map((listener) => ({
      port: Number(listener.port),
      protocol: listener.protocol,
      certificate_id: listener.protocol === "https" ? Number(listener.certificate_id || 0) : undefined,
      enabled: listener.enabled
    })),
    upstreams: form.upstreams
      .filter((upstream) => upstream.url.trim())
      .map((upstream) => ({
        name: upstream.name.trim() || "primary",
        url: upstream.url.trim(),
        weight: Number(upstream.weight || 1),
        enabled: upstream.enabled
      })),
    proxy_config: normalizedProxyConfigInput()
  }
}

function normalizeProxyConfigForForm(config: Application["proxy_config"]): ApplicationFormInput["proxy_config"] {
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
  const config = form.proxy_config ?? normalizeProxyConfigForForm(undefined)
  const headers = (config.headers ?? [])
    .filter((header) => header.name.trim() || header.value.trim())
    .map((header) => ({ name: header.name.trim(), value: header.value.trim() }))
  const payload = {
    headers,
    connect_timeout: config.connect_timeout?.trim() ?? "",
    read_timeout: config.read_timeout?.trim() ?? "",
    send_timeout: config.send_timeout?.trim() ?? "",
    websocket_enabled: Boolean(config.websocket_enabled),
    preserve_host: config.preserve_host,
    proxy_buffering: config.proxy_buffering ?? "",
    request_buffering: config.request_buffering ?? ""
  }
  const empty = headers.length === 0 &&
    !payload.connect_timeout &&
    !payload.read_timeout &&
    !payload.send_timeout &&
    !payload.websocket_enabled &&
    payload.preserve_host === true &&
    !payload.proxy_buffering &&
    !payload.request_buffering
  return empty ? undefined : payload
}

function addHost() {
  form.hosts.push({ host: "", is_primary: false })
}

function updateHostPrimary(index: number, value: boolean) {
  if (value) {
    form.hosts.forEach((host, hostIndex) => {
      host.is_primary = hostIndex === index
    })
    return
  }
  form.hosts[index].is_primary = false
  if (!form.hosts.some((host) => host.is_primary)) {
    form.hosts[0].is_primary = true
  }
}

function removeHost(index: number) {
  form.hosts.splice(index, 1)
  if (form.hosts.length === 0) {
    addHost()
  }
  if (!form.hosts.some((host) => host.is_primary)) {
    form.hosts[0].is_primary = true
  }
}

function addListener() {
  form.listeners.push({ port: 80, protocol: "http", enabled: true })
}

function removeListener(index: number) {
  form.listeners.splice(index, 1)
  if (form.listeners.length === 0) {
    addListener()
  }
}

function addUpstream() {
  form.upstreams.push({ name: "primary", url: "", weight: 1, enabled: true })
}

function removeUpstream(index: number) {
  form.upstreams.splice(index, 1)
  if (form.upstreams.length === 0) {
    addUpstream()
  }
}

function addProxyHeader() {
  form.proxy_config.headers = [...(form.proxy_config.headers ?? []), { name: "", value: "" }]
}

function removeProxyHeader(index: number) {
  if (!form.proxy_config.headers) {
    return
  }
  form.proxy_config.headers.splice(index, 1)
}

function openCertificateForm() {
  Object.assign(certificateForm, { name: "", cert_pem: "", key_pem: "" })
  showCertificateForm.value = true
}

async function validateCertificateInput() {
  validatingCertificate.value = true
  try {
    const result = await validateCertificate({
      cert_pem: certificateForm.cert_pem,
      key_pem: certificateForm.key_pem
    })
    message.success(t("applications.certificateValidated", { name: result.domains.join(", ") || result.name }))
  } finally {
    validatingCertificate.value = false
  }
}

async function saveCertificate() {
  savingCertificate.value = true
  try {
    await createCertificate(certificateForm)
    message.success(t("applications.certificateUploaded"))
    showCertificateForm.value = false
    await certificatesResource.refresh()
  } finally {
    savingCertificate.value = false
  }
}

async function removeCertificate(id: number) {
  await deleteCertificate(id)
  message.success(t("applications.certificateDeleted"))
  await certificatesResource.refresh()
}

function hActions(actions: Array<{ label: string; onClick: () => void }>) {
  return h(
    NSpace,
    { size: "small" },
    {
      default: () =>
        actions.map((action) =>
          h(
            NButton,
            { size: "small", quaternary: true, onClick: action.onClick },
            { default: () => action.label }
          )
        )
    }
  )
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("applications.title") }}</h1>
        <p class="page-subtitle">{{ t("applications.subtitle") }}</p>
      </div>
      <NSpace>
        <NButton @click="openCertificateForm">{{ t("applications.uploadCertificate") }}</NButton>
        <NButton type="primary" @click="openCreate">{{ t("applications.createApplication") }}</NButton>
      </NSpace>
    </div>

    <section class="section section-pad">
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="applicationsResource.loading.value"
        :columns="applicationColumns"
        :data="applications"
        :bordered="false"
      />
      <NEmpty
        v-if="!applicationsResource.loading.value && applications.length === 0"
        :description="t('applications.noApplications')"
      />
      <NAlert v-if="applicationsResource.error.value" type="error" style="margin-top: 12px">
        {{ applicationsResource.error.value }}
      </NAlert>
    </section>

    <section class="section section-pad">
      <div class="section-header">
        <h2 class="section-title">{{ t("applications.certificates") }}</h2>
      </div>
      <LwDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="certificatesResource.loading.value"
        :columns="certificateColumns"
        :data="certificates"
        :bordered="false"
      />
      <NEmpty
        v-if="!certificatesResource.loading.value && certificates.length === 0"
        :description="t('applications.noCertificates')"
      />
      <NAlert v-if="certificatesResource.error.value" type="error" style="margin-top: 12px">
        {{ certificatesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer v-model:show="showForm" :width="720">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editingID ? t('applications.editApplication') : t('applications.newApplication')">
        <NForm label-placement="top">
          <NFormItem :label="t('applications.applicationName')">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem :label="t('applications.remark')">
            <NInput v-model:value="form.description" type="textarea" />
          </NFormItem>
          <NSpace :wrap="false" align="center">
            <NFormItem :label="t('applications.protectionMode')">
              <NSelect v-model:value="form.mode" :options="modeOptions" />
            </NFormItem>
            <NFormItem :label="t('common.enabled')">
              <NSwitch v-model:value="form.enabled" />
            </NFormItem>
          </NSpace>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">{{ t("applications.domains") }}</h3>
              <NButton size="small" @click="addHost">{{ t("applications.addDomain") }}</NButton>
            </div>
            <NSpace v-for="(host, index) in form.hosts" :key="index" align="center" class="row-line">
              <NInput v-model:value="host.host" placeholder="example.local" />
              <NSwitch v-model:value="host.is_primary" @update:value="updateHostPrimary(index, $event)" />
              <NButton size="small" quaternary @click="removeHost(index)">{{ t("common.delete") }}</NButton>
            </NSpace>
          </div>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">{{ t("applications.entryListeners") }}</h3>
              <NButton size="small" @click="addListener">{{ t("applications.addListener") }}</NButton>
            </div>
            <NSpace v-for="(listener, index) in form.listeners" :key="index" align="center" class="row-line">
              <NInputNumber v-model:value="listener.port" :min="1" :max="65535" />
              <NSelect v-model:value="listener.protocol" :options="protocolOptions" />
              <NSelect
                v-if="listener.protocol === 'https'"
                v-model:value="listener.certificate_id"
                :options="certificateOptions"
                :placeholder="t('applications.selectCertificate')"
              />
              <NSwitch v-model:value="listener.enabled" />
              <NButton size="small" quaternary @click="removeListener(index)">{{ t("common.delete") }}</NButton>
            </NSpace>
          </div>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">{{ t("applications.upstream") }}</h3>
              <NButton size="small" @click="addUpstream">{{ t("applications.addUpstream") }}</NButton>
            </div>
            <NSpace v-for="(upstream, index) in form.upstreams" :key="index" align="center" class="row-line">
              <NInput v-model:value="upstream.name" placeholder="primary" />
              <NInput v-model:value="upstream.url" placeholder="http://upstream:8080" />
              <NInputNumber v-model:value="upstream.weight" :min="1" />
              <NSwitch v-model:value="upstream.enabled" />
              <NButton size="small" quaternary @click="removeUpstream(index)">{{ t("common.delete") }}</NButton>
            </NSpace>
          </div>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">{{ t("applications.proxySettings") }}</h3>
              <NButton size="small" @click="addProxyHeader">{{ t("applications.addProxyHeader") }}</NButton>
            </div>
            <NSpace :wrap="false" align="center" class="row-line">
              <NFormItem :label="t('applications.connectTimeout')">
                <NInput v-model:value="form.proxy_config.connect_timeout" placeholder="30s" />
              </NFormItem>
              <NFormItem :label="t('applications.readTimeout')">
                <NInput v-model:value="form.proxy_config.read_timeout" placeholder="60s" />
              </NFormItem>
              <NFormItem :label="t('applications.sendTimeout')">
                <NInput v-model:value="form.proxy_config.send_timeout" placeholder="60s" />
              </NFormItem>
            </NSpace>
            <NSpace :wrap="false" align="center" class="row-line">
              <NFormItem :label="t('applications.websocket')">
                <NSwitch v-model:value="form.proxy_config.websocket_enabled" />
              </NFormItem>
              <NFormItem :label="t('applications.preserveHost')">
                <NSwitch v-model:value="form.proxy_config.preserve_host" />
              </NFormItem>
              <NFormItem :label="t('applications.proxyBuffering')">
                <NSelect v-model:value="form.proxy_config.proxy_buffering" :options="proxySwitchOptions" />
              </NFormItem>
              <NFormItem :label="t('applications.requestBuffering')">
                <NSelect v-model:value="form.proxy_config.request_buffering" :options="proxySwitchOptions" />
              </NFormItem>
            </NSpace>
            <NSpace
              v-for="(header, index) in form.proxy_config.headers"
              :key="index"
              align="center"
              class="row-line"
            >
              <NInput v-model:value="header.name" :placeholder="t('applications.proxyHeaderName')" />
              <NInput v-model:value="header.value" :placeholder="t('applications.proxyHeaderValue')" />
              <NButton size="small" quaternary @click="removeProxyHeader(index)">{{ t("common.delete") }}</NButton>
            </NSpace>
            <NEmpty
              v-if="(form.proxy_config?.headers ?? []).length === 0"
              :description="t('applications.noProxyHeaders')"
            />
          </div>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">{{ t("common.cancel") }}</NButton>
            <NButton type="primary" :loading="saving" @click="saveApplication">{{ t("common.save") }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NDrawer v-model:show="showCertificateForm" :width="640">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="t('applications.uploadCertificate')">
        <NForm label-placement="top">
          <NFormItem :label="t('applications.certificateName')">
            <NInput v-model:value="certificateForm.name" />
          </NFormItem>
          <NFormItem :label="t('applications.certPem')">
            <NInput v-model:value="certificateForm.cert_pem" type="textarea" :autosize="{ minRows: 6 }" />
          </NFormItem>
          <NFormItem :label="t('applications.keyPem')">
            <NInput v-model:value="certificateForm.key_pem" type="textarea" :autosize="{ minRows: 6 }" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showCertificateForm = false">{{ t("common.cancel") }}</NButton>
            <NButton :loading="validatingCertificate" @click="validateCertificateInput">{{ t("applications.validateCertificate") }}</NButton>
            <NButton type="primary" :loading="savingCertificate" @click="saveCertificate">{{ t("applications.upload") }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>

<style scoped>
.section-header,
.block-header {
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

.form-block {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.row-line {
  width: 100%;
  margin-bottom: 10px;
}

.row-line :deep(.n-input),
.row-line :deep(.n-select) {
  min-width: 150px;
}
</style>
