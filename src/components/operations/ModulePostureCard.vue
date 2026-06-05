<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import type { ProtectionModuleOverview } from "@/api/litewaf"

const props = defineProps<{
  module: ProtectionModuleOverview
  evidenceTotal: number
  isEmpty: boolean
  logQuery: Record<string, string>
}>()

const statusType = computed(() => (props.module.enabled > 0 ? "success" : "default"))
const statusLabel = computed(() => (props.module.enabled > 0 ? "已启用" : "空状态"))
const primaryWarning = computed(() => props.module.warnings[0] ?? "")
const hasRiskDetails = computed(() => (props.module.risk_details ?? []).length > 0)
const hasEvidence = computed(() => props.module.evidence.length > 0)
const showAllow = computed(() => typeof props.module.allow === "number")
</script>

<template>
  <article class="module-posture-card">
    <div class="module-head">
      <div class="module-title-group">
        <div class="module-title">{{ module.label }}</div>
        <div class="module-meta">
          {{ module.category }}
          <template v-if="module.compatibility_source"> · 兼容 {{ module.compatibility_source }}</template>
        </div>
      </div>
      <NTag :type="statusType" size="small">{{ statusLabel }}</NTag>
    </div>

    <div class="module-stats">
      <div class="module-stat">
        <span>规则</span>
        <strong>{{ module.rules }}</strong>
      </div>
      <div class="module-stat">
        <span>启用</span>
        <strong>{{ module.enabled }}</strong>
      </div>
      <div class="module-stat">
        <span>观察</span>
        <strong>{{ module.observe }}</strong>
      </div>
      <div class="module-stat">
        <span>阻断</span>
        <strong>{{ module.block }}</strong>
      </div>
      <div v-if="showAllow" class="module-stat">
        <span>放行</span>
        <strong>{{ module.allow }}</strong>
      </div>
    </div>

    <NAlert v-if="primaryWarning" type="warning" class="module-warning">
      {{ primaryWarning }}
    </NAlert>

    <div v-if="hasRiskDetails" class="module-risk-list">
      <div v-for="risk in module.risk_details" :key="`${risk.module}-${risk.message}`" class="module-risk-row">
        <NTag type="warning" size="small">{{ risk.label }}</NTag>
        <span>{{ risk.message }}</span>
      </div>
    </div>

    <div v-if="hasEvidence" class="module-evidence">
      <div class="module-section-title">最近命中证据</div>
      <div v-for="item in module.evidence" :key="item.key" class="module-evidence-row">
        <span>{{ item.key }}</span>
        <strong>{{ item.count }}</strong>
      </div>
    </div>

    <NEmpty v-else-if="isEmpty" description="暂无规则和命中" />

    <div class="module-actions">
      <RouterLink :to="module.route">查看规则</RouterLink>
      <RouterLink :to="{ path: '/attack-logs', query: logQuery }">查看日志</RouterLink>
    </div>
  </article>
</template>

<style scoped>
.module-posture-card {
  display: flex;
  min-width: 0;
  min-height: 280px;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--lw-accent) 10%, transparent), transparent 46%),
    var(--lw-panel);
  box-shadow: var(--lw-shadow);
  padding: var(--lw-density-y);
}

.module-head,
.module-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.module-title-group {
  min-width: 0;
}

.module-title {
  color: var(--lw-text);
  font-size: 16px;
  font-weight: 800;
}

.module-meta {
  margin-top: 4px;
  color: var(--lw-text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.module-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 8px;
}

.module-stat {
  min-width: 0;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel-muted);
  padding: 8px;
}

.module-stat span {
  display: block;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.module-stat strong {
  display: block;
  margin-top: 4px;
  color: var(--lw-text);
  font-size: 20px;
}

.module-warning {
  flex: 0 0 auto;
}

.module-risk-list,
.module-evidence {
  display: grid;
  gap: 8px;
}

.module-section-title {
  color: var(--lw-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.module-risk-row,
.module-evidence-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel-muted);
  padding: 8px 10px;
  color: var(--lw-text);
}

.module-risk-row {
  grid-template-columns: auto minmax(0, 1fr);
}

.module-evidence-row span,
.module-risk-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-evidence-row strong {
  color: var(--lw-accent);
}

.module-actions {
  flex-wrap: wrap;
  margin-top: auto;
  border-top: 1px solid var(--lw-border);
  padding-top: 10px;
}
</style>
