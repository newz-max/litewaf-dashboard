<script setup lang="ts">
import { computed, reactive } from "vue"
import { getAttackLogs } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const filters = reactive({
  site_id: "",
  client_ip: "",
  rule_id: "",
  action: "",
  disposition: "",
  event_type: "",
  advanced_target: "",
  min_score: ""
})

const logsResource = useApiResource(() => getAttackLogs(cleanFilters()))
const logs = computed(() => [...(logsResource.data.value ?? [])])

const columns = [
  { title: "时间", key: "time" },
  { title: "请求 ID", key: "request_id" },
  { title: "站点", key: "site_id" },
  { title: "来源 IP", key: "client_ip" },
  { title: "类型", key: "event_type" },
  { title: "模块", key: "module" },
  { title: "规则", key: "rule_id" },
  { title: "规则名称", key: "rule_name" },
  { title: "计数维度", key: "counter" },
  { title: "阈值", key: "threshold" },
  { title: "窗口", key: "window_sec" },
  { title: "高级目标", key: "advanced_target" },
  { title: "分数", key: "score" },
  { title: "动作", key: "action" },
  { title: "处置", key: "disposition" },
  { title: "URI", key: "uri" },
  { title: "摘要", key: "summary" },
  { title: "Body", key: "body_metadata" },
  { title: "上传", key: "upload_metadata" },
  { title: "封禁", key: "ban_reason" }
]

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== ""))
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">攻击日志</h1>
        <p class="page-subtitle">检索规则、黑白名单和限流命中记录。</p>
      </div>
      <NButton @click="logsResource.refresh">刷新</NButton>
    </div>

    <section class="section section-pad">
      <NSpace class="toolbar">
        <NInput v-model:value="filters.site_id" placeholder="站点 ID" clearable />
        <NInput v-model:value="filters.client_ip" placeholder="来源 IP" clearable />
        <NInput v-model:value="filters.rule_id" placeholder="规则 ID" clearable />
        <NSelect
          v-model:value="filters.event_type"
          clearable
          placeholder="事件类型"
          :options="[
            { label: '规则', value: 'rule' },
            { label: '黑白名单', value: 'access-list' },
            { label: '限流', value: 'rate-limit' },
            { label: '评分阈值', value: 'score-threshold' },
            { label: '请求体检测', value: 'body-inspection' },
            { label: '上传检测', value: 'upload-inspection' },
            { label: '动态封禁', value: 'dynamic-ban' }
          ]"
        />
        <NSelect
          v-model:value="filters.advanced_target"
          clearable
          placeholder="高级目标"
          :options="[
            { label: 'Body', value: 'body' },
            { label: 'JSON Body', value: 'body_json' },
            { label: '上传文件名', value: 'upload_filename' },
            { label: '上传扩展名', value: 'upload_extension' },
            { label: '上传 MIME', value: 'upload_mime' },
            { label: '上传大小', value: 'upload_size' }
          ]"
        />
        <NInput v-model:value="filters.min_score" placeholder="最低分数" clearable />
        <NSelect
          v-model:value="filters.action"
          clearable
          placeholder="动作"
          :options="[
            { label: '阻断', value: 'block' },
            { label: '观察', value: 'log-only' },
            { label: '放行', value: 'allow' }
          ]"
        />
        <NSelect
          v-model:value="filters.disposition"
          clearable
          placeholder="处置"
          :options="[
            { label: '已阻断', value: 'blocked' },
            { label: '已限流', value: 'rate-limited' },
            { label: '已观察', value: 'observed' },
            { label: '已拒绝', value: 'rejected' }
          ]"
        />
        <NButton type="primary" @click="logsResource.refresh">查询</NButton>
      </NSpace>

      <NDataTable
        :loading="logsResource.loading.value"
        :columns="columns"
        :data="logs"
        :bordered="false"
      />
      <NEmpty v-if="!logsResource.loading.value && logs.length === 0" description="暂无攻击日志" />
      <NAlert v-if="logsResource.error.value" type="error" style="margin-top: 12px">
        {{ logsResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>

<style scoped>
.toolbar {
  margin-bottom: 14px;
}
</style>
