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
const staticMatchOptions = computed(() => matchOptions.value.filter((option) => option.value === "prefix"))
const targetTypeOptions = computed<SelectOption[]>(() => [
  { label: t("nginxProxy.routing.targetProxy"), value: "proxy" },
  { label: t("nginxProxy.routing.targetStatic"), value: "static" }
])
const staticModeOptions = computed<SelectOption[]>(() => [
  { label: "alias", value: "alias" },
  { label: "root", value: "root" }
])
const upstreamOptions = computed<SelectOption[]>(() =>
  props.upstreams.map((upstream) => ({
    label: upstream.name ? `${upstream.name} - ${upstream.url}` : upstream.url,
    value: upstream.name,
    disabled: !upstream.enabled || !upstream.name
  }))
)

function handleTargetTypeChange(route: EditableRoute, value: string) {
  route.target_type = value === "static" ? "static" : "proxy"
  if (route.target_type === "static") {
    route.path_match = "prefix"
    route.static_mode = route.static_mode || "alias"
    route.proxy_config = undefined
    route.upstream_name = ""
    return
  }
  route.upstream_name = route.upstream_name || props.upstreams.find((upstream) => upstream.enabled)?.name || props.upstreams[0]?.name || ""
}
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
          <NSelect v-model:value="route.path_match" :options="route.target_type === 'static' ? staticMatchOptions : matchOptions" />
        </NFormItem>
        <NFormItem :label="t('nginxProxy.routing.targetType')">
          <NSelect :value="route.target_type || 'proxy'" :options="targetTypeOptions" @update:value="handleTargetTypeChange(route, String($event))" />
        </NFormItem>
        <NFormItem v-if="(route.target_type || 'proxy') === 'proxy'" :label="t('nginxProxy.routing.upstreamTarget')">
          <NSelect v-model:value="route.upstream_name" :options="upstreamOptions" />
        </NFormItem>
        <NFormItem v-else :label="t('nginxProxy.routing.staticRoot')">
          <NInput v-model:value="route.static_root" placeholder="/www/example/uploads" />
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
      <div v-if="(route.target_type || 'proxy') === 'static'" class="static-row">
        <NFormItem :label="t('nginxProxy.routing.staticMode')">
          <NSelect v-model:value="route.static_mode" :options="staticModeOptions" />
        </NFormItem>
        <NAlert type="info" :bordered="false">
          {{ t("nginxProxy.routing.staticRouteHint") }}
        </NAlert>
      </div>
      <NCollapse>
        <NCollapseItem v-if="(route.target_type || 'proxy') === 'proxy'" :title="t('nginxProxy.routing.routeProxyOptions')" :name="`route-proxy-${index}`">
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
  grid-template-columns: minmax(120px, 1.1fr) minmax(140px, 1fr) minmax(110px, 0.8fr) minmax(130px, 0.9fr) minmax(180px, 1.4fr) minmax(100px, 0.7fr) minmax(80px, 0.5fr) auto;
  gap: 10px;
  align-items: end;
}

.static-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.4fr) minmax(260px, 1fr);
  gap: 10px;
  align-items: center;
  margin-top: 2px;
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

  .static-row {
    grid-template-columns: 1fr;
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
