<script setup lang="ts">
import { computed } from "vue"
import type { StatisticsReportCards } from "@/api/litewaf"

const props = defineProps<{
  cards?: StatisticsReportCards
}>()

const metrics = computed(() => {
  const cards = props.cards
  return [
    { label: "请求次数", value: cards?.requests ?? 0, accent: "primary" },
    { label: "访问次数 (PV)", value: cards?.pv ?? 0, accent: "info" },
    { label: "独立访客 (UV)", value: cards?.uv ?? 0, accent: "success" },
    { label: "独立 IP", value: cards?.unique_ips ?? 0, accent: "warning" },
    { label: "拦截次数", value: cards?.blocked ?? 0, accent: "danger" },
    { label: "攻击 IP", value: cards?.attack_ips ?? 0, accent: "danger" },
    { label: "4xx 错误数", value: cards?.errors_4xx ?? 0, note: `${formatRate(cards?.error_rate_4xx)} 错误率`, accent: "warning" },
    { label: "4xx 拦截数", value: cards?.blocked_4xx ?? 0, note: `${formatRate(cards?.block_rate_4xx)} 拦截率`, accent: "danger" },
    { label: "5xx 错误数", value: cards?.errors_5xx ?? 0, note: `${formatRate(cards?.error_rate_5xx)} 错误率`, accent: "danger" }
  ]
})

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
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
