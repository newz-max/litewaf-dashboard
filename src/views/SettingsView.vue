<script setup lang="ts">
import { computed } from "vue"
import { getVersion } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import ThemeSettingsPanel from "@/components/theme/ThemeSettingsPanel.vue"

const versionResource = useApiResource(getVersion)
const settings = computed(() => {
  const version = versionResource.data.value

  if (!version) {
    return []
  }

  return [
    { key: "应用名称", value: version.name },
    { key: "版本", value: version.version },
    { key: "环境", value: version.env }
  ]
})
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统设置</h1>
        <p class="page-subtitle">维护运行参数、用户权限、系统集成和本地外观偏好。</p>
      </div>
    </div>

    <ThemeSettingsPanel />

    <section class="section section-pad">
      <div class="section-title">运行信息</div>
      <NSpin :show="versionResource.loading.value">
        <NEmpty v-if="settings.length === 0 && !versionResource.loading.value" description="暂无系统配置数据" />
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
