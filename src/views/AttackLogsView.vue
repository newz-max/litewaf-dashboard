<script setup lang="ts">
import { computed } from "vue"
import { getAttackLogs } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const logsResource = useApiResource(getAttackLogs)
const logs = computed(() => [...(logsResource.data.value ?? [])])
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">攻击日志</h1>
        <p class="page-subtitle">检索规则命中、请求来源和处置结果。</p>
      </div>
      <NButton>导出日志</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar">
        <NSpace>
          <NInput placeholder="IP / URI / 规则 ID" clearable />
          <NDatePicker type="datetimerange" clearable />
        </NSpace>
      </div>

      <NDataTable
        style="margin-top: 14px"
        :loading="logsResource.loading.value"
        :columns="[
          { title: '时间', key: 'created_at' },
          { title: '站点', key: 'site_id' },
          { title: '来源 IP', key: 'client_ip' },
          { title: 'URI', key: 'uri' },
          { title: '规则', key: 'rule_id' },
          { title: '处置', key: 'action' }
        ]"
        :data="logs"
        :bordered="false"
      />
      <NAlert v-if="logsResource.error.value" type="error" style="margin-top: 12px">
        {{ logsResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
