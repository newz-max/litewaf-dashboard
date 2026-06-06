<script setup lang="ts">
defineProps<{
  state: "empty" | "error"
  title?: string
  description: string
  actionLabel?: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <NAlert v-if="state === 'error'" class="module-state-block" type="error">
    <template v-if="title" #header>{{ title }}</template>
    <div class="module-state-block__body">
      <span>{{ description }}</span>
      <NButton v-if="actionLabel" size="small" @click="$emit('retry')">{{ actionLabel }}</NButton>
    </div>
  </NAlert>
  <NEmpty v-else class="module-state-block module-state-block--empty" :description="description">
    <template v-if="actionLabel" #extra>
      <NButton size="small" @click="$emit('retry')">{{ actionLabel }}</NButton>
    </template>
  </NEmpty>
</template>

<style scoped>
.module-state-block {
  margin-top: 12px;
}

.module-state-block__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.module-state-block--empty {
  border: 1px dashed var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel-muted);
  padding: var(--lw-density-y);
}
</style>
