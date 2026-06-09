<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"

export interface ModuleStatusItem {
  label: string
  value: string | number
  note?: string
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
}

const props = defineProps<{
  items: readonly ModuleStatusItem[]
}>()

const { t } = useI18n()
const visibleItems = computed(() => props.items.filter((item) => item.value !== "" && item.value !== null && item.value !== undefined))
</script>

<template>
  <section v-if="visibleItems.length" class="module-status-summary" :aria-label="t('aria.moduleStatusSummary')">
    <article v-for="item in visibleItems" :key="item.label" :class="['module-status-summary__item', `module-status-summary__item--${item.tone ?? 'neutral'}`]">
      <span class="module-status-summary__label">{{ item.label }}</span>
      <strong class="module-status-summary__value">{{ item.value }}</strong>
      <span v-if="item.note" class="module-status-summary__note">{{ item.note }}</span>
    </article>
  </section>
</template>

<style scoped>
.module-status-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: var(--lw-density-y);
}

.module-status-summary__item {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--module-summary-tone) 10%, transparent), transparent 58%),
    var(--lw-panel);
  box-shadow: var(--lw-shadow);
  padding: 12px;
}

.module-status-summary__item--neutral {
  --module-summary-tone: var(--lw-accent);
}

.module-status-summary__item--success {
  --module-summary-tone: var(--lw-success);
}

.module-status-summary__item--warning {
  --module-summary-tone: var(--lw-warning);
}

.module-status-summary__item--danger {
  --module-summary-tone: var(--lw-danger);
}

.module-status-summary__item--info {
  --module-summary-tone: var(--lw-info);
}

.module-status-summary__label,
.module-status-summary__note {
  display: block;
  color: var(--lw-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.module-status-summary__value {
  display: block;
  margin-top: 6px;
  color: var(--lw-text);
  font-size: 24px;
  line-height: 1.1;
  word-break: break-word;
}

.module-status-summary__note {
  margin-top: 6px;
  color: var(--lw-text-subtle);
}
</style>
