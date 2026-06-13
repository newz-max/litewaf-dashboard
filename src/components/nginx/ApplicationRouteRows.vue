<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SelectOption } from "naive-ui"
import type { ApplicationRoute, ApplicationUpstream } from "@/api/litewaf"
import ApplicationProxyOptionsForm from "@/components/nginx/ApplicationProxyOptionsForm.vue"
import { pathMatchOptions } from "@/utils/pathMatch"
import type { ApplicationProxyFormInput } from "@/utils/applicationProxyConfig"

type EditableRoute = Omit<ApplicationRoute, "proxy_config"> & { proxy_config?: ApplicationProxyFormInput }

const props = defineProps<{
  routes: EditableRoute[]
  upstreams: ApplicationUpstream[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const { t } = useI18n()
const matchOptions = computed(() => pathMatchOptions(t))
const upstreamOptions = computed<SelectOption[]>(() =>
  props.upstreams.map((upstream) => ({
    label: upstream.name ? `${upstream.name} - ${upstream.url}` : upstream.url,
    value: upstream.name,
    disabled: !upstream.enabled || !upstream.name
  }))
)
</script>

<template>
  <div class="route-section">
    <div class="route-header">
      <h3 class="block-title">{{ t("nginxProxy.routing.routes") }}</h3>
      <NButton size="small" @click="emit('add')">{{ t("nginxProxy.routing.addRoute") }}</NButton>
    </div>

    <div v-for="(route, index) in routes" :key="route.id || index" class="route-card">
      <div class="route-row">
        <NFormItem :label="t('nginxProxy.routing.routeName')">
          <NInput v-model:value="route.name" />
        </NFormItem>
        <NFormItem :label="t('nginxProxy.routing.path')">
          <NInput v-model:value="route.path" placeholder="/api" />
        </NFormItem>
        <NFormItem :label="t('nginxProxy.routing.pathMatch')">
          <NSelect v-model:value="route.path_match" :options="matchOptions" />
        </NFormItem>
        <NFormItem :label="t('nginxProxy.routing.upstreamTarget')">
          <NSelect v-model:value="route.upstream_name" :options="upstreamOptions" />
        </NFormItem>
        <NFormItem :label="t('nginxProxy.routing.priority')">
          <NInputNumber v-model:value="route.priority" :min="1" />
        </NFormItem>
        <NFormItem :label="t('common.status')">
          <NSwitch v-model:value="route.enabled" />
        </NFormItem>
        <div class="route-actions">
          <NButton size="small" quaternary @click="emit('remove', index)">{{ t("common.delete") }}</NButton>
        </div>
      </div>
      <NCollapse>
        <NCollapseItem :title="t('nginxProxy.routing.routeProxyOptions')" :name="`route-proxy-${index}`">
          <ApplicationProxyOptionsForm v-if="route.proxy_config" v-model="route.proxy_config" />
        </NCollapseItem>
      </NCollapse>
    </div>

    <NEmpty v-if="routes.length === 0" :description="t('nginxProxy.routing.noRoutes')" />
  </div>
</template>

<style scoped>
.route-section {
  display: grid;
  gap: 12px;
}

.route-header {
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

.route-card {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.route-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.1fr) minmax(140px, 1fr) minmax(120px, 0.8fr) minmax(180px, 1.4fr) minmax(100px, 0.7fr) minmax(80px, 0.5fr) auto;
  gap: 10px;
  align-items: end;
}

.route-actions {
  display: flex;
  align-items: center;
  min-height: 34px;
}

@media (max-width: 1100px) {
  .route-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .route-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .route-row {
    grid-template-columns: 1fr;
  }
}
</style>
