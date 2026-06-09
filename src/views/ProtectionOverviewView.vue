<script setup lang="ts">
import { computed } from "vue"
import { getProtectionOverview, type ProtectionModuleOverview, type SummaryCount } from "@/api/litewaf"
import ModulePostureCard from "@/components/operations/ModulePostureCard.vue"
import PostureMetricCard, { type PostureMetric } from "@/components/operations/PostureMetricCard.vue"
import RiskSummaryList from "@/components/operations/RiskSummaryList.vue"
import { useApiResource } from "@/composables/useApiResource"
import { getActiveLocale } from "@/i18n"
import { useThemeStore } from "@/stores/theme"
import { useI18n } from "vue-i18n"

interface ModuleCardModel {
  module: ProtectionModuleOverview
  evidenceTotal: number
  isEmpty: boolean
  logQuery: Record<string, string>
}

const themeStore = useThemeStore()
const { t } = useI18n()
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
    label: t("protectionOverview.modules"),
    value: modules.value.length,
    note: t("protectionOverview.modulesNote"),
    tone: hasModules.value ? "info" : "neutral",
    featured: true
  },
  {
    label: t("common.enabledRules"),
    value: totalOf("enabled"),
    note: t("protectionOverview.enabledRulesNote"),
    tone: totalOf("enabled") > 0 ? "success" : "neutral",
    featured: true
  },
  {
    label: t("protectionOverview.blockPosture"),
    value: totalOf("block"),
    note: t("protectionOverview.blockPostureNote"),
    tone: totalOf("block") > 0 ? "danger" : "neutral",
    featured: true
  },
  {
    label: t("protectionOverview.riskHints"),
    value: risks.value.length,
    note: t("protectionOverview.riskHintsNote"),
    tone: risks.value.length > 0 ? "warning" : "success",
    featured: true
  },
  {
    label: t("protectionOverview.observePolicies"),
    value: totalOf("observe"),
    note: t("protectionOverview.observePoliciesNote"),
    tone: "info"
  },
  {
    label: t("protectionOverview.allowRules"),
    value: totalOf("allow"),
    note: t("protectionOverview.allowRulesNote"),
    tone: "success"
  },
  {
    label: t("protectionOverview.evidence"),
    value: modules.value.reduce((total, module) => total + evidenceTotal(module), 0),
    note: t("protectionOverview.evidenceNote"),
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

function formatCount(value: number) {
  return new Intl.NumberFormat(getActiveLocale()).format(value)
}
</script>

<template>
  <main class="page protection-overview">
    <div class="page-header overview-header">
      <div>
        <h1 class="page-title">{{ t("protectionOverview.title") }}</h1>
        <p class="page-subtitle">{{ t("protectionOverview.subtitle") }}</p>
      </div>
      <NButton type="primary" :loading="overviewResource.loading.value" @click="overviewResource.refresh">
        {{ t("common.refreshOverview") }}
      </NButton>
    </div>

    <section class="overview-hero">
      <div class="overview-hero-copy">
        <div class="hero-kicker">{{ t("protectionOverview.heroKicker") }}</div>
        <h2>{{ t("protectionOverview.heroTitle") }}</h2>
        <p>{{ t("protectionOverview.heroText") }}</p>
      </div>
      <div class="hero-status">
        <NTag :type="overviewResource.error.value ? 'error' : hasModules ? 'success' : 'default'" size="small">
          {{ overviewResource.error.value ? t("common.apiError") : hasModules ? t("protectionOverview.loaded") : t("protectionOverview.emptyStatus") }}
        </NTag>
        <span>{{ themeStore.activePreset.label }} · {{ themeStore.activeModeLabel }}</span>
      </div>
    </section>

    <NAlert v-if="overviewResource.error.value" type="error">
      {{ overviewResource.error.value }}
    </NAlert>

    <NAlert v-if="isEmptyOverview" type="info">
      {{ t("protectionOverview.empty") }}
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
          <div class="panel-title">{{ t("protectionOverview.crossModuleRisk") }}</div>
          <div class="panel-subtitle">{{ t("protectionOverview.crossModuleRiskSubtitle") }}</div>
        </div>
        <NTag size="small" type="warning">{{ t("protectionOverview.riskCount", { count: formatCount(risks.length) }) }}</NTag>
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
