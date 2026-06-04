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
  module: "",
  attack_type: "",
  advanced_target: "",
  challenge_result: "",
  dynamic_result: "",
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
  { title: "攻击类型", key: "attack_type" },
  { title: "防护组", key: "group_name" },
  { title: "规则", key: "rule_id" },
  { title: "规则名称", key: "rule_name" },
  { title: "计数维度", key: "counter" },
  { title: "阈值", key: "threshold" },
  { title: "窗口", key: "window_sec" },
  { title: "挑战方式", key: "challenge_mode" },
  { title: "挑战结果", key: "challenge_result" },
  { title: "动态结果", key: "advanced_target" },
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
        <p class="page-subtitle">按防护模块检索命中记录，兼容查看旧黑白名单和限流事件类型。</p>
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
            { label: '访问控制兼容事件', value: 'access-list' },
            { label: 'CC 防护兼容事件', value: 'rate-limit' },
            { label: '评分阈值', value: 'score-threshold' },
            { label: '请求体检测', value: 'body-inspection' },
            { label: '上传检测', value: 'upload-inspection' },
            { label: '动态封禁', value: 'dynamic-ban' }
          ]"
        />
        <NSelect
          v-model:value="filters.module"
          clearable
          placeholder="模块"
          :options="[
            { label: '攻击防护', value: 'attack-protection' },
            { label: 'CC 防护', value: 'cc-protection' },
            { label: '访问控制', value: 'access-control' },
            { label: '上传防护', value: 'upload-protection' },
            { label: 'Bot / 人机验证', value: 'bot-protection' },
            { label: '动态防护', value: 'dynamic-protection' }
          ]"
        />
        <NSelect
          v-model:value="filters.attack_type"
          clearable
          placeholder="攻击类型"
          :options="[
            { label: 'SQL 注入', value: 'sqli' },
            { label: 'XSS', value: 'xss' },
            { label: 'RCE', value: 'rce' },
            { label: '路径穿越', value: 'path-traversal' }
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
        <NSelect
          v-model:value="filters.challenge_result"
          clearable
          placeholder="挑战结果"
          :options="[
            { label: '已发起', value: 'issued' },
            { label: '已通过', value: 'passed' },
            { label: '失败', value: 'failed' }
          ]"
        />
        <NSelect
          v-model:value="filters.dynamic_result"
          clearable
          placeholder="动态结果"
          :options="[
            { label: '令牌发放', value: 'token-issued' },
            { label: '令牌通过', value: 'token-passed' },
            { label: '令牌失败', value: 'token-failed' },
            { label: '页面已注入', value: 'mutation-applied' },
            { label: '页面跳过', value: 'mutation-skipped' },
            { label: '已准入', value: 'queue-admitted' },
            { label: '已排队', value: 'queue-rejected' }
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
