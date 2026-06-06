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

const modeOptions = [
  { label: "防护", value: "protect" },
  { label: "观察", value: "monitor" },
  { label: "关闭", value: "off" }
]

const protocolOptions = [
  { label: "HTTP", value: "http" },
  { label: "HTTPS", value: "https" }
]

const applicationColumns = computed(() => [
  { title: "应用", key: "name" },
  {
    title: "域名",
    key: "hosts",
    render: (row: Application) => row.hosts.map((host) => host.host).join(", ")
  },
  {
    title: "监听",
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
    title: "上游",
    key: "upstreams",
    render: (row: Application) => row.upstreams.filter((item) => item.enabled).map((item) => item.url).join(", ")
  },
  { title: "模式", key: "mode" },
  {
    title: "状态",
    key: "enabled",
    render: (row: Application) => (row.enabled ? "启用" : "停用")
  },
  {
    title: "操作",
    key: "actions",
    render: (row: Application) =>
      hActions([
        { label: "编辑", onClick: () => editApplication(row) },
        { label: row.enabled ? "停用" : "启用", onClick: () => toggleApplication(row) },
        { label: "删除", onClick: () => removeApplication(row.id) }
      ])
  }
])

const certificateColumns = computed(() => [
  { title: "证书", key: "name" },
  {
    title: "域名",
    key: "domains",
    render: (row: Certificate) => row.domains.join(", ")
  },
  { title: "有效期至", key: "not_after" },
  { title: "指纹", key: "fingerprint" },
  {
    title: "操作",
    key: "actions",
    render: (row: Certificate) => hActions([{ label: "删除", onClick: () => removeCertificate(row.id) }])
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
    message.success("防护应用已保存")
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
  message.success(application.enabled ? "防护应用已停用" : "防护应用已启用")
  await applicationsResource.refresh()
}

async function removeApplication(id: number) {
  await deleteApplication(id)
  message.success("防护应用已删除")
  await applicationsResource.refresh()
}

function normalizedApplicationInput(): ApplicationInput {
  return {
    name: form.name.trim(),
    mode: form.mode,
    enabled: form.enabled,
    description: form.description?.trim(),
    hosts: form.hosts
      .filter((host) => host.host.trim())
      .map((host, index) => ({ host: host.host.trim(), is_primary: index === 0 || host.is_primary })),
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

function removeHost(index: number) {
  form.hosts.splice(index, 1)
  if (form.hosts.length === 0) {
    addHost()
  }
  form.hosts[0].is_primary = true
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
    message.success(`证书校验通过：${result.domains.join(", ") || result.name}`)
  } finally {
    validatingCertificate.value = false
  }
}

async function saveCertificate() {
  savingCertificate.value = true
  try {
    await createCertificate(certificateForm)
    message.success("证书已上传")
    showCertificateForm.value = false
    await certificatesResource.refresh()
  } finally {
    savingCertificate.value = false
  }
}

async function removeCertificate(id: number) {
  await deleteCertificate(id)
  message.success("证书已删除")
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
        <h1 class="page-title">防护应用</h1>
        <p class="page-subtitle">维护域名、入口监听、HTTPS 证书、上游和防护模式。</p>
      </div>
      <NSpace>
        <NButton @click="openCertificateForm">上传证书</NButton>
        <NButton type="primary" @click="openCreate">新增应用</NButton>
      </NSpace>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="applicationsResource.loading.value"
        :columns="applicationColumns"
        :data="applications"
        :bordered="false"
      />
      <NEmpty
        v-if="!applicationsResource.loading.value && applications.length === 0"
        description="暂无防护应用"
      />
      <NAlert v-if="applicationsResource.error.value" type="error" style="margin-top: 12px">
        {{ applicationsResource.error.value }}
      </NAlert>
    </section>

    <section class="section section-pad">
      <div class="section-header">
        <h2 class="section-title">证书</h2>
      </div>
      <NDataTable
        :loading="certificatesResource.loading.value"
        :columns="certificateColumns"
        :data="certificates"
        :bordered="false"
      />
      <NEmpty
        v-if="!certificatesResource.loading.value && certificates.length === 0"
        description="暂无证书"
      />
      <NAlert v-if="certificatesResource.error.value" type="error" style="margin-top: 12px">
        {{ certificatesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer v-model:show="showForm" :width="720">
      <NDrawerContent :title="editingID ? '编辑防护应用' : '新增防护应用'">
        <NForm label-placement="top">
          <NFormItem label="应用名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="备注">
            <NInput v-model:value="form.description" type="textarea" />
          </NFormItem>
          <NSpace :wrap="false" align="center">
            <NFormItem label="防护模式">
              <NSelect v-model:value="form.mode" :options="modeOptions" />
            </NFormItem>
            <NFormItem label="启用">
              <NSwitch v-model:value="form.enabled" />
            </NFormItem>
          </NSpace>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">域名</h3>
              <NButton size="small" @click="addHost">添加域名</NButton>
            </div>
            <NSpace v-for="(host, index) in form.hosts" :key="index" align="center" class="row-line">
              <NInput v-model:value="host.host" placeholder="example.local" />
              <NSwitch v-model:value="host.is_primary" :disabled="index === 0" />
              <NButton size="small" quaternary @click="removeHost(index)">删除</NButton>
            </NSpace>
          </div>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">入口监听</h3>
              <NButton size="small" @click="addListener">添加监听</NButton>
            </div>
            <NSpace v-for="(listener, index) in form.listeners" :key="index" align="center" class="row-line">
              <NInputNumber v-model:value="listener.port" :min="1" :max="65535" />
              <NSelect v-model:value="listener.protocol" :options="protocolOptions" />
              <NSelect
                v-if="listener.protocol === 'https'"
                v-model:value="listener.certificate_id"
                :options="certificateOptions"
                placeholder="选择证书"
              />
              <NSwitch v-model:value="listener.enabled" />
              <NButton size="small" quaternary @click="removeListener(index)">删除</NButton>
            </NSpace>
          </div>

          <div class="form-block">
            <div class="block-header">
              <h3 class="block-title">上游</h3>
              <NButton size="small" @click="addUpstream">添加上游</NButton>
            </div>
            <NSpace v-for="(upstream, index) in form.upstreams" :key="index" align="center" class="row-line">
              <NInput v-model:value="upstream.name" placeholder="primary" />
              <NInput v-model:value="upstream.url" placeholder="http://upstream:8080" />
              <NInputNumber v-model:value="upstream.weight" :min="1" />
              <NSwitch v-model:value="upstream.enabled" />
              <NButton size="small" quaternary @click="removeUpstream(index)">删除</NButton>
            </NSpace>
          </div>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="saveApplication">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NDrawer v-model:show="showCertificateForm" :width="640">
      <NDrawerContent title="上传证书">
        <NForm label-placement="top">
          <NFormItem label="证书名称">
            <NInput v-model:value="certificateForm.name" />
          </NFormItem>
          <NFormItem label="证书 PEM">
            <NInput v-model:value="certificateForm.cert_pem" type="textarea" :autosize="{ minRows: 6 }" />
          </NFormItem>
          <NFormItem label="私钥 PEM">
            <NInput v-model:value="certificateForm.key_pem" type="textarea" :autosize="{ minRows: 6 }" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showCertificateForm = false">取消</NButton>
            <NButton :loading="validatingCertificate" @click="validateCertificateInput">校验证书</NButton>
            <NButton type="primary" :loading="savingCertificate" @click="saveCertificate">上传</NButton>
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
