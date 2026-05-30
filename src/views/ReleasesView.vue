<script setup lang="ts">
import { computed } from "vue"
import { getReleases } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const releasesResource = useApiResource(getReleases)
const releases = computed(() => [...(releasesResource.data.value ?? [])])
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">发布记录</h1>
        <p class="page-subtitle">规则集发布、审计和回滚入口。</p>
      </div>
      <NButton type="primary">发布新版本</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="releasesResource.loading.value"
        :columns="[
          { title: '版本', key: 'version' },
          { title: '操作人', key: 'operator' },
          { title: '状态', key: 'status' },
          { title: '时间', key: 'time' },
          { title: '说明', key: 'note' }
        ]"
        :data="releases"
        :bordered="false"
      />
      <NAlert v-if="releasesResource.error.value" type="error" style="margin-top: 12px">
        {{ releasesResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
