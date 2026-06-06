<script setup lang="ts">
export interface ModuleHeaderTag {
  label: string
  value: string | number
  tone?: "default" | "success" | "warning" | "error" | "info"
}

defineProps<{
  title: string
  subtitle: string
  eyebrow?: string
  tags?: readonly ModuleHeaderTag[]
}>()
</script>

<template>
  <div class="module-page-header">
    <div class="module-page-header__main">
      <div v-if="eyebrow" class="module-page-header__eyebrow">{{ eyebrow }}</div>
      <h1 class="page-title module-page-header__title">{{ title }}</h1>
      <p class="page-subtitle module-page-header__subtitle">{{ subtitle }}</p>
      <div v-if="tags?.length" class="module-page-header__tags">
        <NTag v-for="tag in tags" :key="`${tag.label}-${tag.value}`" :type="tag.tone ?? 'default'" size="small">
          {{ tag.label }} {{ tag.value }}
        </NTag>
      </div>
    </div>
    <div v-if="$slots.actions" class="module-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.module-page-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  margin-bottom: var(--lw-density-y);
}

.module-page-header__main {
  min-width: 0;
}

.module-page-header__eyebrow {
  margin-bottom: 6px;
  color: var(--lw-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.module-page-header__title,
.module-page-header__subtitle {
  min-width: 0;
}

.module-page-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.module-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

@media (max-width: 720px) {
  .module-page-header {
    grid-template-columns: 1fr;
  }

  .module-page-header__actions {
    justify-content: flex-start;
  }
}
</style>
