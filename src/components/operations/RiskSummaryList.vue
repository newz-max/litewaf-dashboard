<script setup lang="ts">
import { RouterLink } from "vue-router"
import type { ProtectionModuleRisk } from "@/api/litewaf"
import { useI18n } from "vue-i18n"

defineProps<{
  risks: readonly ProtectionModuleRisk[]
  logQueryByModule: (moduleKey: string) => Record<string, string>
}>()

const { t } = useI18n()
</script>

<template>
  <div class="risk-summary-list">
    <div v-if="risks.length > 0" class="risk-list">
      <div v-for="risk in risks" :key="`${risk.module}-${risk.message}`" class="risk-row">
        <div class="risk-main">
          <NTag type="warning" size="small">{{ risk.label }}</NTag>
          <span class="risk-message">{{ risk.message }}</span>
        </div>
        <div class="risk-meta">
          <span v-if="risk.rule_name">{{ t("risk.rulePrefix", { name: risk.rule_name }) }}</span>
          <span v-if="risk.scope">{{ risk.scope }}</span>
          <span v-if="risk.action">{{ risk.action }}</span>
        </div>
        <RouterLink :to="{ path: '/attack-logs', query: logQueryByModule(risk.module) }">{{ t("risk.logFilter") }}</RouterLink>
      </div>
    </div>
    <NEmpty v-else :description="t('risk.empty')" />
  </div>
</template>

<style scoped>
.risk-summary-list {
  min-width: 0;
}

.risk-list {
  display: grid;
  gap: 10px;
}

.risk-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, auto) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel-muted);
  padding: 10px 12px;
}

.risk-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.risk-message {
  min-width: 0;
  overflow: hidden;
  color: var(--lw-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  color: var(--lw-text-muted);
  font-size: 12px;
}

@media (max-width: 860px) {
  .risk-row {
    grid-template-columns: 1fr;
  }

  .risk-meta {
    justify-content: flex-start;
  }
}
</style>
