<script setup lang="ts">
import { computed } from "vue"
import type { TimeSeriesPoint } from "@/api/litewaf"
import MetricTrendChart from "@/components/operations/MetricTrendChart.vue"

export interface PostureMetric {
  label: string
  value: string | number
  note: string
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
  featured?: boolean
  featuredSize?: "normal" | "large"
  trend?: readonly (number | TimeSeriesPoint)[]
}

const props = defineProps<{
  metric: PostureMetric
}>()

const cardClass = computed(() => [
  "posture-metric-card",
  `posture-metric-card--${props.metric.tone ?? "neutral"}`,
  {
    "posture-metric-card--featured": props.metric.featured && props.metric.trend && props.metric.trend.length > 0
  }
])
const hasTrend = computed(() => Boolean(props.metric.featured && props.metric.trend && props.metric.trend.length > 0))
</script>

<template>
  <article :class="cardClass">
    <div class="metric-head">
      <div class="metric-label">{{ metric.label }}</div>
      <MetricTrendChart
        v-if="hasTrend"
        class="metric-sparkline"
        :points="metric.trend ?? []"
        :tone="metric.tone ?? 'neutral'"
        :size="metric.featuredSize ?? 'normal'"
      />
    </div>
    <div class="metric-value">{{ metric.value }}</div>
    <div class="metric-note">{{ metric.note }}</div>
  </article>
</template>

<style scoped>
.posture-metric-card {
  display: flex;
  min-height: 132px;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--lw-border);
  border-radius: 6px;
  background:
    radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--metric-tone) 22%, transparent), transparent 42%),
    linear-gradient(135deg, color-mix(in srgb, var(--metric-tone) 12%, transparent), var(--lw-panel-muted) 150%),
    var(--lw-panel);
  box-shadow:
    inset 0 0 28px rgba(47, 124, 255, 0.08),
    var(--lw-shadow);
  padding: var(--lw-density-y);
}

.posture-metric-card--featured {
  min-height: 178px;
  border-color: color-mix(in srgb, var(--metric-tone) 52%, var(--lw-border));
}

.posture-metric-card--neutral {
  --metric-tone: var(--lw-accent);
}

.posture-metric-card--success {
  --metric-tone: var(--lw-success);
}

.posture-metric-card--warning {
  --metric-tone: var(--lw-warning);
}

.posture-metric-card--danger {
  --metric-tone: var(--lw-danger);
}

.posture-metric-card--info {
  --metric-tone: var(--lw-info);
}

.metric-head {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  align-items: center;
  gap: 12px;
}

.metric-label {
  color: color-mix(in srgb, var(--metric-tone) 74%, var(--lw-text));
  font-size: 13px;
  font-weight: 700;
}

.metric-value {
  color: var(--lw-text);
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  word-break: break-word;
}

.metric-note {
  color: var(--lw-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.metric-sparkline {
  width: 100%;
  height: 84px;
  margin-left: auto;
}

@media (max-width: 760px) {
  .metric-head {
    grid-template-columns: 1fr;
  }

  .metric-sparkline {
    height: 76px;
  }
}
</style>
