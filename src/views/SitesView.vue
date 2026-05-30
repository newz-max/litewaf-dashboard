<script setup lang="ts">
import { computed } from "vue"
import { getSites } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const sitesResource = useApiResource(getSites)
const sites = computed(() => [...(sitesResource.data.value ?? [])])
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">站点管理</h1>
        <p class="page-subtitle">配置域名、上游服务和防护模式。</p>
      </div>
      <NButton type="primary">新增站点</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="sitesResource.loading.value"
        :columns="[
          { title: '站点名称', key: 'name' },
          { title: '域名', key: 'host' },
          { title: '上游地址', key: 'upstream' },
          { title: '防护模式', key: 'mode' },
          { title: '状态', key: 'status' }
        ]"
        :data="sites"
        :bordered="false"
      />
      <NAlert v-if="sitesResource.error.value" type="error" style="margin-top: 12px">
        {{ sitesResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
