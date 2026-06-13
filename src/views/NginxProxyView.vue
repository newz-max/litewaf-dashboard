<script setup lang="ts">
import { computed } from "vue"
import { getApplications, type Application } from "@/api/litewaf"
import AdvancedNginxConfigPanel from "@/components/nginx/AdvancedNginxConfigPanel.vue"
import ApplicationRoutingPanel from "@/components/nginx/ApplicationRoutingPanel.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const applicationsResource = useApiResource(getApplications)
const applications = computed<Application[]>(() =>
  (applicationsResource.data.value ?? []).map((application) => ({
    ...application,
    hosts: application.hosts.map((host) => ({ ...host })),
    listeners: application.listeners.map((listener) => ({ ...listener })),
    upstreams: application.upstreams.map((upstream) => ({ ...upstream })),
    routes: (application.routes ?? []).map((route) => ({
      ...route,
      proxy_config: route.proxy_config
        ? {
            ...route.proxy_config,
            headers: (route.proxy_config.headers ?? []).map((header) => ({ ...header }))
          }
        : undefined
    })),
    proxy_config: application.proxy_config
      ? {
          ...application.proxy_config,
          headers: (application.proxy_config.headers ?? []).map((header) => ({ ...header }))
        }
      : undefined
  }))
)
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("nginxProxy.title") }}</h1>
        <p class="page-subtitle">{{ t("nginxProxy.subtitle") }}</p>
      </div>
    </div>

    <ApplicationRoutingPanel
      :applications="applications"
      :loading="applicationsResource.loading.value"
      :error="applicationsResource.error.value"
      @saved="applicationsResource.refresh"
    />

    <AdvancedNginxConfigPanel />
  </main>
</template>
