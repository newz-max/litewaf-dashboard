<script setup lang="ts">
import { computed } from "vue"
import type { StatisticsReportCards } from "@/api/litewaf"
import { getActiveLocale } from "@/i18n"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  cards?: StatisticsReportCards
}>()
const { t } = useI18n()

const metrics = computed(() => {
  const cards = props.cards
  return [
    { label: t("statistics.requests"), value: cards?.requests ?? 0, accent: "primary" },
    { label: t("statistics.pv"), value: cards?.pv ?? 0, accent: "info" },
    { label: t("statistics.uv"), value: cards?.uv ?? 0, accent: "success" },
    { label: t("statistics.uniqueIps"), value: cards?.unique_ips ?? 0, accent: "warning" },
    { label: t("statistics.blocked"), value: cards?.blocked ?? 0, accent: "danger" },
    { label: t("statistics.attackIps"), value: cards?.attack_ips ?? 0, accent: "danger" },
    { label: t("statistics.errors4xx"), value: cards?.errors_4xx ?? 0, note: t("statistics.errorRate", { rate: formatRate(cards?.error_rate_4xx) }), accent: "warning" },
    { label: t("statistics.blocked4xx"), value: cards?.blocked_4xx ?? 0, note: t("statistics.blockRate", { rate: formatRate(cards?.block_rate_4xx) }), accent: "danger" },
    { label: t("statistics.errors5xx"), value: cards?.errors_5xx ?? 0, note: t("statistics.errorRate", { rate: formatRate(cards?.error_rate_5xx) }), accent: "danger" }
  ]
})

function formatNumber(value: number) {
  return new Intl.NumberFormat(getActiveLocale(), { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
}

function formatRate(value?: number) {
  return `${(value ?? 0).toFixed(2)}%`
}
</script>

<template>
  <section class="metric-grid">
    <article v-for="metric in metrics" :key="metric.label" class="metric-card" :data-accent="metric.accent">
      <span class="metric-label">{{ metric.label }}</span>
      <strong class="metric-value">{{ formatNumber(metric.value) }}</strong>
      <span v-if="metric.note" class="metric-note">{{ metric.note }}</span>
    </article>
  </section>
</template>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 12px;
}

.metric-card {
  min-height: 86px;
  padding: 14px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
  box-shadow: var(--lw-shadow);
}

.metric-card[data-accent="danger"] {
  border-color: color-mix(in srgb, var(--lw-danger) 34%, var(--lw-border));
}

.metric-card[data-accent="warning"] {
  border-color: color-mix(in srgb, var(--lw-warning) 34%, var(--lw-border));
}

.metric-card[data-accent="success"] {
  border-color: color-mix(in srgb, var(--lw-success) 34%, var(--lw-border));
}

.metric-label,
.metric-note {
  display: block;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.metric-value {
  display: block;
  margin-top: 8px;
  color: var(--lw-text);
  font-size: 22px;
  line-height: 1.2;
}

.metric-note {
  margin-top: 6px;
}

@media (max-width: 1360px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
