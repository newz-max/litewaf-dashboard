<script setup lang="ts">
import { computed } from "vue"
import { getVersion } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import ThemeSettingsPanel from "@/components/theme/ThemeSettingsPanel.vue"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const versionResource = useApiResource(getVersion)
const settings = computed(() => {
  const version = versionResource.data.value

  if (!version) {
    return []
  }

  return [
    { key: t("settings.appName"), value: version.name },
    { key: t("settings.version"), value: version.version },
    { key: t("settings.environment"), value: version.env }
  ]
})
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("settings.title") }}</h1>
        <p class="page-subtitle">{{ t("settings.subtitle") }}</p>
      </div>
    </div>

    <ThemeSettingsPanel />

    <section class="section section-pad">
      <div class="section-title">{{ t("settings.runtimeInfo") }}</div>
      <NSpin :show="versionResource.loading.value">
        <NEmpty v-if="settings.length === 0 && !versionResource.loading.value" :description="t('settings.emptyRuntimeInfo')" />
        <NDescriptions v-else bordered :column="1" label-placement="left">
          <NDescriptionsItem
            v-for="item in settings"
            :key="item.key"
            :label="item.key"
          >
            {{ item.value }}
          </NDescriptionsItem>
        </NDescriptions>
      </NSpin>
      <NAlert v-if="versionResource.error.value" type="error" style="margin-top: 12px">
        {{ versionResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>

<style scoped>
.section-title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 760;
}
</style>
