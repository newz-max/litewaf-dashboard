<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { getProtectionOverview } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const overviewResource = useApiResource(getProtectionOverview)
const overview = computed(() => overviewResource.data.value)
const modules = computed(() => overview.value?.modules ?? [])
const risks = computed(() => overview.value?.risks ?? [])

function evidenceTotal(moduleKey: string) {
  const module = modules.value.find((item) => item.key === moduleKey)
  return (module?.evidence ?? []).reduce((total, item) => total + item.count, 0)
}

function moduleLogQuery(moduleKey: string) {
  const module = modules.value.find((item) => item.key === moduleKey)
  return module?.log_module ? { module: module.log_module } : {}
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">防护概览</h1>
        <p class="page-subtitle">按模块查看规则启用、处置姿态、风险提示和最近命中证据。</p>
      </div>
      <NButton type="primary" @click="overviewResource.refresh">刷新概览</NButton>
    </div>

    <NAlert v-if="overviewResource.error.value" type="error">
      {{ overviewResource.error.value }}
    </NAlert>

    <section class="module-grid">
      <article v-for="module in modules" :key="module.key" class="module-card">
        <div class="module-head">
          <div>
            <div class="module-title">{{ module.label }}</div>
            <div class="module-meta">
              {{ module.category }}
              <template v-if="module.compatibility_source"> · 兼容 {{ module.compatibility_source }}</template>
            </div>
          </div>
          <NTag :type="module.enabled > 0 ? 'success' : 'default'" size="small">
            {{ module.enabled > 0 ? "已启用" : "空状态" }}
          </NTag>
        </div>

        <div class="module-stats">
          <NStatistic label="规则" :value="module.rules" />
          <NStatistic label="启用" :value="module.enabled" />
          <NStatistic label="观察" :value="module.observe" />
          <NStatistic label="阻断" :value="module.block" />
        </div>

        <NAlert v-if="module.warnings.length > 0" type="warning" class="module-warning">
          {{ module.warnings[0] }}
        </NAlert>
        <NEmpty v-else-if="module.rules === 0 && evidenceTotal(module.key) === 0" description="暂无规则和命中" />

        <div class="module-actions">
          <RouterLink :to="module.route">查看规则</RouterLink>
          <RouterLink :to="{ path: '/attack-logs', query: moduleLogQuery(module.key) }">查看日志</RouterLink>
        </div>
      </article>
    </section>

    <section class="section section-pad">
      <div class="panel-title">跨模块风险</div>
      <NList v-if="risks.length > 0">
        <NListItem v-for="risk in risks" :key="`${risk.module}-${risk.message}`">
          <NTag type="warning" size="small">{{ risk.label }}</NTag>
          <span class="risk-text">{{ risk.message }}</span>
          <template #suffix>
            <RouterLink :to="{ path: '/attack-logs', query: moduleLogQuery(risk.module) }">日志筛选</RouterLink>
          </template>
        </NListItem>
      </NList>
      <NEmpty v-else description="暂无高风险配置提示" />
    </section>
  </main>
</template>

<style scoped>
.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.module-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 220px;
  padding: 16px;
  border: 1px solid var(--lw-border);
  border-radius: 8px;
  background: var(--lw-panel);
}

.module-head,
.module-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.module-title {
  font-size: 16px;
  font-weight: 700;
}

.module-meta {
  margin-top: 3px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.module-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.module-warning {
  flex: 1;
}

.risk-text {
  margin-left: 10px;
}

.panel-title {
  margin-bottom: 12px;
  font-weight: 700;
}
</style>
