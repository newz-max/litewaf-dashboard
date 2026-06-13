<script setup lang="ts">
import { computed, h, shallowRef } from "vue"
import { NButton, NTag, useMessage } from "naive-ui"
import { useI18n } from "vue-i18n"
import { updateApplication, type Application, type ApplicationInput } from "@/api/litewaf"
import { extractApiErrorMessage } from "@/api/errors"
import ApplicationProxyConfigModal from "@/components/nginx/ApplicationProxyConfigModal.vue"
import {
  applicationToInputWithProxyConfig,
  hasApplicationProxyConfig
} from "@/utils/applicationProxyConfig"

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
const showModal = shallowRef(false)
const saving = shallowRef(false)
const saveError = shallowRef("")
const selectedApplicationId = shallowRef<number | null>(null)

const selectedApplication = computed(() =>
  props.applications.find((application) => application.id === selectedApplicationId.value) ?? null
)

const applicationColumns = computed(() => [
  {
    title: t("nginxProxy.application.columns.application"),
    key: "name",
    minWidth: 180,
    render: (row: Application) => h("div", { class: "application-cell" }, [
      h("span", { class: "application-name" }, row.name),
      h("span", { class: "application-id" }, `#${row.id}`)
    ])
  },
  {
    title: t("applications.domains"),
    key: "hosts",
    minWidth: 220,
    render: (row: Application) => summarizeHosts(row)
  },
  {
    title: t("applications.listener"),
    key: "listeners",
    minWidth: 180,
    render: (row: Application) => summarizeListeners(row)
  },
  {
    title: t("applications.upstream"),
    key: "upstreams",
    minWidth: 240,
    render: (row: Application) => summarizeUpstreams(row)
  },
  {
    title: t("nginxProxy.application.columns.proxyStatus"),
    key: "proxyStatus",
    minWidth: 140,
    render: (row: Application) =>
      h(
        NTag,
        { size: "small", type: hasApplicationProxyConfig(row.proxy_config) ? "success" : "default" },
        {
          default: () =>
            hasApplicationProxyConfig(row.proxy_config)
              ? t("nginxProxy.application.statusConfigured")
              : t("nginxProxy.application.statusDefault")
        }
      )
  },
  {
    title: t("common.actions"),
    key: "actions",
    width: 120,
    render: (row: Application) =>
      h(
        NButton,
        {
          size: "small",
          type: "primary",
          secondary: true,
          onClick: () => openProxyModal(row)
        },
        { default: () => t("nginxProxy.application.configure") }
      )
  }
])

function summarizeHosts(application: Application) {
  return application.hosts.map((host) => host.host).join(", ") || t("common.noData")
}

function summarizeListeners(application: Application) {
  return (
    application.listeners
      .filter((listener) => listener.enabled)
      .map((listener) => `${listener.port}/${listener.protocol}`)
      .join(", ") || t("common.noData")
  )
}

function summarizeUpstreams(application: Application) {
  return (
    application.upstreams
      .filter((upstream) => upstream.enabled)
      .map((upstream) => upstream.url)
      .join(", ") || t("common.noData")
  )
}

function openProxyModal(application: Application) {
  selectedApplicationId.value = application.id
  saveError.value = ""
  showModal.value = true
}

function clearModalState() {
  if (showModal.value) {
    return
  }
  saveError.value = ""
}

async function saveApplicationProxyConfig(proxyConfig: ApplicationInput["proxy_config"] | undefined) {
  const application = selectedApplication.value
  if (!application) {
    return
  }
  saving.value = true
  saveError.value = ""
  try {
    await updateApplication(application.id, applicationToInputWithProxyConfig(application, proxyConfig))
    message.success(t("nginxProxy.application.saved"))
    emit("saved")
    showModal.value = false
  } catch (error) {
    saveError.value = extractApiErrorMessage(error, t("nginxProxy.application.saveFailed"))
    message.error(saveError.value)
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
    </div>

    <LwDataTable
      :scrollbar-props="{ trigger: 'hover' }"
      :loading="loading"
      :columns="applicationColumns"
      :data="applications"
      :bordered="false"
      :scroll-x="900"
    />
    <NEmpty v-if="!loading && applications.length === 0" :description="t('nginxProxy.application.empty')" />
    <NAlert v-if="error" type="error" class="panel-error">
      {{ error }}
    </NAlert>

    <ApplicationProxyConfigModal
      v-model:show="showModal"
      :application="selectedApplication"
      :saving="saving"
      :error="saveError"
      @save="saveApplicationProxyConfig"
      @close="clearModalState"
    />
  </section>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.section-subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.application-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.application-name {
  font-weight: 650;
}

.application-id {
  color: var(--text-tertiary);
  font-size: 12px;
}

.panel-error {
  margin-top: 12px;
}
</style>
