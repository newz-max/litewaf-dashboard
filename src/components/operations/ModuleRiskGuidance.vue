<script setup lang="ts">
export interface ModuleRiskGuidanceItem {
  title: string
  message?: string
  tone?: "warning" | "error" | "info" | "success"
}

defineProps<{
  title?: string
  items: readonly ModuleRiskGuidanceItem[]
  emptyDescription?: string
}>()
</script>

<template>
  <section class="module-risk-guidance">
    <div v-if="title" class="module-risk-guidance__title">{{ title }}</div>
    <div v-if="items.length" class="module-risk-guidance__list">
      <NAlert v-for="item in items" :key="`${item.title}-${item.message ?? ''}`" :type="item.tone ?? 'warning'">
        <template #header>{{ item.title }}</template>
        <span v-if="item.message">{{ item.message }}</span>
      </NAlert>
    </div>
    <NEmpty v-else :description="emptyDescription ?? '暂无高风险提示'" />
  </section>
</template>

<style scoped>
.module-risk-guidance {
  min-width: 0;
}

.module-risk-guidance__title {
  margin-bottom: 10px;
  color: var(--lw-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.module-risk-guidance__list {
  display: grid;
  gap: 10px;
}
</style>
