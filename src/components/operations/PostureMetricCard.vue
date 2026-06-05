<script setup lang="ts">
import { computed } from "vue"

export interface PostureMetric {
  label: string
  value: string | number
  note: string
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
  featured?: boolean
}

const props = defineProps<{
  metric: PostureMetric
}>()

const cardClass = computed(() => [
  "posture-metric-card",
  `posture-metric-card--${props.metric.tone ?? "neutral"}`,
  { "posture-metric-card--featured": props.metric.featured }
])
</script>

<template>
  <article :class="cardClass">
    <div class="metric-label">{{ metric.label }}</div>
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
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--metric-tone) 10%, transparent), transparent 52%),
    var(--lw-panel);
  box-shadow: var(--lw-shadow);
  padding: var(--lw-density-y);
}

.posture-metric-card--featured {
  min-height: 154px;
  border-color: color-mix(in srgb, var(--metric-tone) 38%, var(--lw-border));
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

.metric-label {
  color: var(--lw-text-muted);
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
  color: var(--lw-text-subtle);
  font-size: 12px;
  line-height: 1.5;
}
</style>
