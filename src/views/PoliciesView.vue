<script setup lang="ts">
import { computed } from "vue"
import { getPolicies } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const policiesResource = useApiResource(getPolicies)
const policies = computed(() => [...(policiesResource.data.value ?? [])])
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">防护策略</h1>
        <p class="page-subtitle">按站点绑定规则集、动作和风险阈值。</p>
      </div>
      <NButton type="primary">新增策略</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="policiesResource.loading.value"
        :columns="[
          { title: '策略 ID', key: 'id' },
          { title: '名称', key: 'name' },
          { title: '风险阈值', key: 'risk_threshold' },
          { title: '启用模块', key: 'enabled_modules' },
          { title: '默认动作', key: 'default_action' }
        ]"
        :data="policies"
        :bordered="false"
      />
      <NAlert v-if="policiesResource.error.value" type="error" style="margin-top: 12px">
        {{ policiesResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
