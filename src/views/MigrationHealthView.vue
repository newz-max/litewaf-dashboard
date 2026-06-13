<script setup lang="ts">
import { computed, h } from "vue"
import { useI18n } from "vue-i18n"
import { NTag, type DataTableColumns } from "naive-ui"
import {
  getProtectionMigrationHealth,
  type LegacyProtectionStoreState,
  type ProtectionRuleHealthIssue
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const { t } = useI18n()
const healthResource = useApiResource(getProtectionMigrationHealth)
const health = computed(() => healthResource.data.value)
const protectionRules = computed(() => health.value?.protection_rules)
const legacyStores = computed<LegacyProtectionStoreState[]>(() =>
  (health.value?.legacy_stores ?? []).map((item) => ({
    ...item,
    missing_samples: [...item.missing_samples],
    orphan_samples: [...item.orphan_samples]
  }))
)
const issues = computed<ProtectionRuleHealthIssue[]>(() =>
  (health.value?.issues ?? []).map((item) => ({
    ...item,
    samples: [...item.samples]
  }))
)
const moduleRows = computed(() => entries(protectionRules.value?.by_module))
const statusRows = computed(() => entries(protectionRules.value?.by_migration_status))
const sourceRows = computed(() => entries(protectionRules.value?.by_source))
const hasNoData = computed(() =>
  !healthResource.loading.value &&
  !healthResource.error.value &&
  (protectionRules.value?.total ?? 0) === 0 &&
  legacyStores.value.every((item) => item.total === 0) &&
  issues.value.length === 0
)

const storeColumns = computed<DataTableColumns<LegacyProtectionStoreState>>(() => [
  { title: t("migrationHealth.columns.legacyStore"), key: "store", width: 180, ellipsis: { tooltip: true } },
  { title: t("migrationHealth.columns.module"), key: "module", width: 140, ellipsis: { tooltip: true } },
  { title: t("migrationHealth.columns.total"), key: "total", width: 96 },
  { title: t("migrationHealth.columns.enabled"), key: "enabled", width: 96 },
  { title: t("migrationHealth.columns.migrated"), key: "migrated", width: 96 },
  { title: t("migrationHealth.columns.missing"), key: "missing", width: 96 },
  { title: t("migrationHealth.columns.orphaned"), key: "orphaned", width: 96 },
  { title: t("migrationHealth.columns.duplicates"), key: "duplicates", width: 104 },
  { title: t("migrationHealth.columns.conflicts"), key: "conflicts", width: 104 }
])

const issueColumns = computed<DataTableColumns<ProtectionRuleHealthIssue>>(() => [
  {
    title: t("migrationHealth.columns.severity"),
    key: "severity",
    width: 110,
    render(row) {
      return h(
        NTag,
        { type: row.severity === "error" ? "error" : "warning", size: "small" },
        { default: () => row.severity }
      )
    }
  },
  { title: t("migrationHealth.columns.type"), key: "type", width: 170, ellipsis: { tooltip: true } },
  { title: t("migrationHealth.columns.legacyStore"), key: "store", width: 180, ellipsis: { tooltip: true } },
  { title: t("migrationHealth.columns.count"), key: "count", width: 90 },
  { title: t("migrationHealth.columns.message"), key: "message", width: 260, ellipsis: { tooltip: true } },
  { title: t("migrationHealth.columns.recommendation"), key: "recommendation", width: 320, ellipsis: { tooltip: true } },
  {
    title: t("migrationHealth.columns.samples"),
    key: "samples",
    width: 320,
    ellipsis: { tooltip: true },
    render(row) {
      return row.samples?.join(", ") || "-"
    }
  }
])

function entries(source: Record<string, number> | undefined) {
  return Object.entries(source ?? {})
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
}

function statusType(status: string) {
  if (status === "healthy") {
    return "success"
  }
  if (status === "attention_required") {
    return "warning"
  }
  return "default"
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("migrationHealth.title") }}</h1>
        <p class="page-subtitle">{{ t("migrationHealth.subtitle") }}</p>
      </div>
      <NButton :loading="healthResource.loading.value" @click="healthResource.refresh">{{ t("common.refresh") }}</NButton>
    </div>

    <NAlert v-if="healthResource.error.value" type="error" class="section-gap">
      {{ healthResource.error.value }}
    </NAlert>

    <NSpin :show="healthResource.loading.value">
      <div class="health-grid section-gap">
        <section class="section section-pad health-panel">
          <div class="panel-title">{{ t("migrationHealth.generalRules") }}</div>
          <div class="stat-grid">
            <NStatistic :label="t('migrationHealth.total')" :value="protectionRules?.total ?? 0" />
            <NStatistic :label="t('common.enabled')" :value="protectionRules?.enabled ?? 0" />
            <NStatistic :label="t('migrationHealth.disabled')" :value="protectionRules?.disabled ?? 0" />
          </div>
        </section>

        <section class="section section-pad health-panel">
          <div class="panel-title">Backfill</div>
          <NSpace vertical size="small">
            <NTag :type="statusType(health?.backfill.status ?? 'unknown')">
              {{ health?.backfill.status ?? "unknown" }}
            </NTag>
            <div class="muted">{{ health?.backfill.recommendation || t("migrationHealth.noBackfillStatus") }}</div>
            <div v-if="health?.backfill.command" class="command-scroll">
              <NCode :code="health.backfill.command" />
            </div>
          </NSpace>
        </section>
      </div>

      <NEmpty v-if="hasNoData" :description="t('migrationHealth.noMigrationData')" class="section-gap" />

      <section class="section section-pad section-gap">
        <div class="panel-title">{{ t("migrationHealth.legacyStoreCoverage") }}</div>
        <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :columns="storeColumns" :data="legacyStores" :bordered="false" :scroll-x="1008" />
      </section>

      <section class="section section-pad section-gap">
        <div class="panel-title">{{ t("migrationHealth.migrationIssues") }}</div>
        <LwDataTable :scrollbar-props="{ trigger: 'hover' }" :columns="issueColumns" :data="issues" :bordered="false" :scroll-x="1450" />
        <NEmpty v-if="issues.length === 0" :description="t('migrationHealth.noIssues')" />
      </section>

      <div class="health-grid section-gap">
        <section class="section section-pad">
          <div class="panel-title">{{ t("migrationHealth.moduleDistribution") }}</div>
          <NList>
            <NListItem v-for="row in moduleRows" :key="row.key">
              <span>{{ row.key }}</span>
              <template #suffix>{{ row.count }}</template>
            </NListItem>
          </NList>
        </section>

        <section class="section section-pad">
          <div class="panel-title">{{ t("migrationHealth.migrationStatus") }}</div>
          <NList>
            <NListItem v-for="row in statusRows" :key="row.key">
              <span>{{ row.key }}</span>
              <template #suffix>{{ row.count }}</template>
            </NListItem>
          </NList>
        </section>

        <section class="section section-pad">
          <div class="panel-title">{{ t("migrationHealth.sourceDistribution") }}</div>
          <NList>
            <NListItem v-for="row in sourceRows" :key="row.key">
              <span>{{ row.key }}</span>
              <template #suffix>{{ row.count }}</template>
            </NListItem>
          </NList>
        </section>
      </div>

      <section v-if="health?.remediation_hints.length" class="section section-pad section-gap">
        <div class="panel-title">{{ t("migrationHealth.remediationHints") }}</div>
        <NList>
          <NListItem v-for="hint in health.remediation_hints" :key="hint">
            {{ hint }}
          </NListItem>
        </NList>
      </section>
    </NSpin>
  </main>
</template>

<style scoped>
.section-gap {
  margin-top: 16px;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  min-width: 0;
}

.health-panel {
  min-width: 0;
  min-height: 150px;
}

.panel-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 700;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.muted {
  color: var(--lw-text-muted);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.command-scroll {
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.command-scroll :deep(.n-code) {
  width: max-content;
  min-width: 100%;
}
</style>
