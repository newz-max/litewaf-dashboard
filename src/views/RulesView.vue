<script setup lang="ts">
import { computed } from "vue"
import { getRules } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const rulesResource = useApiResource(getRules)
const rules = computed(() => [...(rulesResource.data.value ?? [])])
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">规则管理</h1>
        <p class="page-subtitle">维护 SQLi、XSS、RCE、CC 和 Bot 检测规则。</p>
      </div>
      <NButton type="primary">新增规则</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar">
        <NSpace>
          <NInput placeholder="搜索规则 ID / 名称" clearable />
          <NSelect
            placeholder="规则类型"
            clearable
            style="width: 160px"
            :options="[
              { label: 'SQLi', value: 'sqli' },
              { label: 'XSS', value: 'xss' },
              { label: 'RCE', value: 'rce' },
              { label: 'CC', value: 'cc' }
            ]"
          />
        </NSpace>
      </div>

      <NDataTable
        style="margin-top: 14px"
        :loading="rulesResource.loading.value"
        :columns="[
          { title: '规则 ID', key: 'id' },
          { title: '名称', key: 'name' },
          { title: '检测目标', key: 'target' },
          { title: '动作', key: 'action' },
          { title: '分数', key: 'score' },
          { title: '状态', key: 'enabled' }
        ]"
        :data="rules"
        :bordered="false"
      />
      <NAlert v-if="rulesResource.error.value" type="error" style="margin-top: 12px">
        {{ rulesResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
