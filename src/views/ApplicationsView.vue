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

const form = reactive<ApplicationInput>({
  name: "",
  mode: "protect",
  enabled: true,
  description: "",
  hosts: [{ host: "", is_primary: true }],
  listeners: [{ port: 80, protocol: "http", enabled: true }],
  upstreams: [{ name: "primary", url: "", weight: 1, enabled: true }]
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
  { title: t("applications.validUntil"), key: "not_after" },
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
    upstreams: [{ name: "primary", url: "", weight: 1, enabled: true }]
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
    }))
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
    }))
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
      }))
  }
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
