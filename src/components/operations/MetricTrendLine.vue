<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  points: readonly number[]
}>()

const viewBoxWidth = 120
const viewBoxHeight = 46
const paddingX = 4
const paddingY = 6

const normalizedPoints = computed(() => {
  const source = props.points.length > 1 ? props.points : [0, props.points[0] ?? 0]
  const max = Math.max(...source, 1)
  const min = Math.min(...source, 0)
  const span = Math.max(max - min, 1)
  const stepX = (viewBoxWidth - paddingX * 2) / Math.max(source.length - 1, 1)

  return source.map((value, index) => {
    const x = paddingX + index * stepX
    const y = viewBoxHeight - paddingY - ((value - min) / span) * (viewBoxHeight - paddingY * 2)
    return { x, y }
  })
})

const linePoints = computed(() => normalizedPoints.value.map((point) => `${point.x},${point.y}`).join(" "))
const areaPoints = computed(() => {
  const points = normalizedPoints.value
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) {
    return ""
  }

  return `${first.x},${viewBoxHeight - paddingY} ${linePoints.value} ${last.x},${viewBoxHeight - paddingY}`
})
</script>

<template>
  <svg class="metric-trend-line" viewBox="0 0 120 46" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="metric-trend-stroke" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.2" />
        <stop offset="58%" stop-color="currentColor" stop-opacity="0.72" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="metric-trend-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.22" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <line class="metric-trend-baseline" x1="4" x2="116" y1="38" y2="38" />
    <polygon class="metric-trend-area" :points="areaPoints" />
    <polyline class="metric-trend-stroke" :points="linePoints" />
    <circle
      v-for="point in normalizedPoints.slice(-3)"
      :key="`${point.x}-${point.y}`"
      class="metric-trend-dot"
      :cx="point.x"
      :cy="point.y"
      r="2.4"
    />
  </svg>
</template>

<style scoped>
.metric-trend-line {
  display: block;
  width: 100%;
  height: 46px;
  color: var(--metric-tone);
  overflow: visible;
}

.metric-trend-baseline {
  stroke: currentColor;
  stroke-opacity: 0.22;
  stroke-width: 1;
}

.metric-trend-area {
  fill: url("#metric-trend-fill");
}

.metric-trend-stroke {
  fill: none;
  stroke: url("#metric-trend-stroke");
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
  filter: drop-shadow(0 0 5px currentColor);
}

.metric-trend-dot {
  fill: currentColor;
  filter: drop-shadow(0 0 5px currentColor);
}
</style>
