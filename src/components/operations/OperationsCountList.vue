<script setup lang="ts">
import type { SummaryCount } from "@/api/litewaf"

defineProps<{
  title: string
  items: readonly SummaryCount[]
  emptyDescription: string
  itemPrefix?: string
}>()
</script>

<template>
  <section class="count-list-panel">
    <div class="count-list-title">{{ title }}</div>
    <ul v-if="items.length > 0" class="count-list">
      <li v-for="item in items" :key="item.key" class="count-list-item">
        <span class="count-list-key">{{ itemPrefix }}{{ item.key }}</span>
        <span class="count-list-value">{{ item.count }}</span>
      </li>
    </ul>
    <NEmpty v-else :description="emptyDescription" />
  </section>
</template>

<style scoped>
.count-list-panel {
  min-width: 0;
}

.count-list-title {
  margin-bottom: 10px;
  color: var(--lw-text);
  font-weight: 700;
}

.count-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.count-list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel-muted);
  padding: 8px 10px;
}

.count-list-key {
  overflow: hidden;
  color: var(--lw-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-list-value {
  color: var(--lw-accent);
  font-weight: 800;
}
</style>
