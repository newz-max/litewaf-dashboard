<script setup lang="ts">
import { computed } from "vue"
import { getProtectionOverview, type ProtectionModuleOverview, type SummaryCount } from "@/api/litewaf"
import ModulePostureCard from "@/components/operations/ModulePostureCard.vue"
import PostureMetricCard, { type PostureMetric } from "@/components/operations/PostureMetricCard.vue"
import RiskSummaryList from "@/components/operations/RiskSummaryList.vue"
import { useApiResource } from "@/composables/useApiResource"
import { useThemeStore } from "@/stores/theme"

interface ModuleCardModel {
  module: ProtectionModuleOverview
  evidenceTotal: number
  isEmpty: boolean
  logQuery: Record<string, string>
}

const themeStore = useThemeStore()
const overviewResource = useApiResource(getProtectionOverview)
const overview = computed(() => overviewResource.data.value)
const modules = computed(() => overview.value?.modules ?? [])
const risks = computed(() => overview.value?.risks ?? [])
const hasModules = computed(() => modules.value.length > 0)
const isEmptyOverview = computed(
  () => !overviewResource.loading.value && !overviewResource.error.value && !hasModules.value
)

function totalOf(key: keyof Pick<ProtectionModuleOverview, "rules" | "enabled" | "observe" | "block" | "allow">) {
  return modules.value.reduce((total, module) => total + (module[key] ?? 0), 0)
}

function evidenceTotal(module: { evidence: readonly SummaryCount[] }) {
  return module.evidence.reduce((total, item) => total + item.count, 0)
}

function moduleLogQuery(moduleKey: string): Record<string, string> {
  const module = modules.value.find((item) => item.key === moduleKey)

  if (module?.log_module) {
    return { module: module.log_module }
  }

  return moduleKey ? { module: moduleKey } : {}
}

const postureMetrics = computed<PostureMetric[]>(() => [
  {
    label: "防护模块",
    value: modules.value.length,
    note: "已接入概览的模块数量",
    tone: hasModules.value ? "info" : "neutral",
    featured: true
  },
  {
    label: "启用规则",
    value: totalOf("enabled"),
    note: "所有模块已启用规则",
    tone: totalOf("enabled") > 0 ? "success" : "neutral",
    featured: true
  },
  {
    label: "阻断姿态",
    value: totalOf("block"),
    note: "阻断类处置配置数量",
    tone: totalOf("block") > 0 ? "danger" : "neutral",
    featured: true
  },
  {
    label: "风险提示",
    value: risks.value.length,
    note: "跨模块高风险配置提示",
    tone: risks.value.length > 0 ? "warning" : "success",
    featured: true
  },
  {
    label: "观察策略",
    value: totalOf("observe"),
    note: "观察/记录类处置配置",
    tone: "info"
  },
  {
    label: "放行规则",
    value: totalOf("allow"),
    note: "显式放行配置",
    tone: "success"
  },
  {
    label: "命中证据",
    value: modules.value.reduce((total, module) => total + evidenceTotal(module), 0),
    note: "模块概览返回的最近命中",
    tone: "warning"
  }
])

const moduleCards = computed<ModuleCardModel[]>(() =>
  modules.value.map((module) => {
    const totalEvidence = evidenceTotal(module)

    return {
      module: {
        ...module,
        warnings: [...module.warnings],
        risk_details: [...(module.risk_details ?? [])],
        evidence: [...module.evidence]
      },
      evidenceTotal: totalEvidence,
      isEmpty: module.rules === 0 && module.warnings.length === 0 && totalEvidence === 0,
      logQuery: moduleLogQuery(module.key)
    }
  })
)
</script>

<template>
  <main class="page protection-overview">
    <div class="page-header overview-header">
      <div>
        <h1 class="page-title">防护概览</h1>
        <p class="page-subtitle">按模块查看规则启用、处置姿态、风险提示和最近命中证据。</p>
      </div>
      <NButton type="primary" :loading="overviewResource.loading.value" @click="overviewResource.refresh">
        刷新概览
      </NButton>
    </div>

    <section class="overview-hero">
      <div class="overview-hero-copy">
        <div class="hero-kicker">Module-first Posture</div>
        <h2>按防护模块组织运营状态和风险证据</h2>
        <p>模块卡片只展示 API 返回的规则、处置、风险和命中证据；缺少规则身份时只保留模块级日志筛选。</p>
      </div>
      <div class="hero-status">
        <NTag :type="overviewResource.error.value ? 'error' : hasModules ? 'success' : 'default'" size="small">
          {{ overviewResource.error.value ? "接口异常" : hasModules ? "模块态势已加载" : "暂无模块数据" }}
        </NTag>
        <span>{{ themeStore.activePreset.label }} · {{ themeStore.activeModeLabel }}</span>
      </div>
    </section>

    <NAlert v-if="overviewResource.error.value" type="error">
      {{ overviewResource.error.value }}
    </NAlert>

    <NAlert v-if="isEmptyOverview" type="info">
      防护概览接口当前没有返回模块数据。页面保持空态展示，不生成演示模块或风险记录。
    </NAlert>

    <section class="overview-metric-grid">
      <PostureMetricCard v-for="metric in postureMetrics" :key="metric.label" :metric="metric" />
    </section>

    <section class="module-grid">
      <ModulePostureCard
        v-for="card in moduleCards"
        :key="card.module.key"
        :module="card.module"
        :evidence-total="card.evidenceTotal"
        :is-empty="card.isEmpty"
        :log-query="card.logQuery"
      />
    </section>

    <section class="section section-pad risk-section">
      <div class="panel-heading">
        <div>
          <div class="panel-title">跨模块风险</div>
          <div class="panel-subtitle">高风险规则、过宽范围和需要复核的处置姿态</div>
        </div>
        <NTag size="small" type="warning">{{ risks.length }} 条</NTag>
      </div>
      <RiskSummaryList :risks="risks" :log-query-by-module="moduleLogQuery" />
    </section>
  </main>
</template>

<style scoped>
.protection-overview {
  min-width: 0;
}

.overview-header {
  align-items: flex-start;
}

.overview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--lw-accent) 12%, transparent), transparent 44%),
    var(--lw-panel);
  box-shadow: var(--lw-shadow);
  padding: calc(var(--lw-density-y) + 4px);
}

.overview-hero-copy {
  min-width: 0;
}

.hero-kicker {
  color: var(--lw-accent);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.overview-hero h2 {
  margin: 8px 0;
  color: var(--lw-text);
  font-size: 22px;
  line-height: 1.3;
}

.overview-hero p {
  max-width: 780px;
  margin: 0;
  color: var(--lw-text-muted);
  line-height: 1.7;
}

.hero-status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.overview-metric-grid,
.module-grid {
  display: grid;
  gap: 14px;
}

.overview-metric-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.module-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.risk-section {
  min-width: 0;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-title {
  color: var(--lw-text);
  font-weight: 800;
}

.panel-subtitle {
  margin-top: 3px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

@media (max-width: 760px) {
  .overview-hero {
    grid-template-columns: 1fr;
  }

  .hero-status {
    justify-content: flex-start;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
