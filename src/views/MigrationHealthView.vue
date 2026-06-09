<script setup lang="ts">
import { computed, h } from "vue"
import { NTag, type DataTableColumns } from "naive-ui"
import {
  getProtectionMigrationHealth,
  type LegacyProtectionStoreState,
  type ProtectionRuleHealthIssue
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

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

const storeColumns: DataTableColumns<LegacyProtectionStoreState> = [
  { title: "旧存储", key: "store" },
  { title: "模块", key: "module" },
  { title: "总数", key: "total" },
  { title: "启用", key: "enabled" },
  { title: "已迁移", key: "migrated" },
  { title: "缺失", key: "missing" },
  { title: "孤儿", key: "orphaned" },
  { title: "重复", key: "duplicates" },
  { title: "冲突", key: "conflicts" }
]

const issueColumns: DataTableColumns<ProtectionRuleHealthIssue> = [
  {
    title: "级别",
    key: "severity",
    render(row) {
      return h(
        NTag,
        { type: row.severity === "error" ? "error" : "warning", size: "small" },
        { default: () => row.severity }
      )
    }
  },
  { title: "类型", key: "type" },
  { title: "旧存储", key: "store" },
  { title: "数量", key: "count" },
  { title: "说明", key: "message" },
  { title: "建议", key: "recommendation" },
  {
    title: "样例",
    key: "samples",
    render(row) {
      return row.samples?.join(", ") || "-"
    }
  }
]

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
        <h1 class="page-title">迁移健康检查</h1>
        <p class="page-subtitle">查看通用 protection_rules 与旧防护存储的迁移、差异和兼容状态。</p>
      </div>
      <NButton :loading="healthResource.loading.value" @click="healthResource.refresh">刷新</NButton>
    </div>

    <NAlert v-if="healthResource.error.value" type="error" class="section-gap">
      {{ healthResource.error.value }}
    </NAlert>

    <NSpin :show="healthResource.loading.value">
      <div class="health-grid section-gap">
        <section class="section section-pad health-panel">
          <div class="panel-title">通用规则</div>
          <div class="stat-grid">
            <NStatistic label="总数" :value="protectionRules?.total ?? 0" />
            <NStatistic label="启用" :value="protectionRules?.enabled ?? 0" />
            <NStatistic label="停用" :value="protectionRules?.disabled ?? 0" />
          </div>
        </section>

        <section class="section section-pad health-panel">
          <div class="panel-title">Backfill</div>
          <NSpace vertical size="small">
            <NTag :type="statusType(health?.backfill.status ?? 'unknown')">
              {{ health?.backfill.status ?? "unknown" }}
            </NTag>
            <div class="muted">{{ health?.backfill.recommendation || "暂无 backfill 状态" }}</div>
            <NCode v-if="health?.backfill.command" :code="health.backfill.command" />
          </NSpace>
        </section>
      </div>

      <NEmpty v-if="hasNoData" description="暂无防护规则或旧存储迁移数据" class="section-gap" />

      <section class="section section-pad section-gap">
        <div class="panel-title">旧存储覆盖</div>
        <NDataTable :scrollbar-props="{ trigger: 'hover' }" :columns="storeColumns" :data="legacyStores" :bordered="false" />
      </section>

      <section class="section section-pad section-gap">
        <div class="panel-title">迁移问题</div>
        <NDataTable :scrollbar-props="{ trigger: 'hover' }" :columns="issueColumns" :data="issues" :bordered="false" />
        <NEmpty v-if="issues.length === 0" description="未发现迁移缺失、孤儿、重复或冲突" />
      </section>

      <div class="health-grid section-gap">
        <section class="section section-pad">
          <div class="panel-title">模块分布</div>
          <NList>
            <NListItem v-for="row in moduleRows" :key="row.key">
              <span>{{ row.key }}</span>
              <template #suffix>{{ row.count }}</template>
            </NListItem>
          </NList>
        </section>

        <section class="section section-pad">
          <div class="panel-title">迁移状态</div>
          <NList>
            <NListItem v-for="row in statusRows" :key="row.key">
              <span>{{ row.key }}</span>
              <template #suffix>{{ row.count }}</template>
            </NListItem>
          </NList>
        </section>

        <section class="section section-pad">
          <div class="panel-title">来源分布</div>
          <NList>
            <NListItem v-for="row in sourceRows" :key="row.key">
              <span>{{ row.key }}</span>
              <template #suffix>{{ row.count }}</template>
            </NListItem>
          </NList>
        </section>
      </div>

      <section v-if="health?.remediation_hints.length" class="section section-pad section-gap">
        <div class="panel-title">处理建议</div>
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
}

.health-panel {
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
}

.muted {
  color: var(--lw-text-muted);
  line-height: 1.6;
}
</style>
