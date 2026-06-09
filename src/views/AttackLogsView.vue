<script setup lang="ts">
import { computed, h, reactive } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { NButton, NSpace } from "naive-ui"
import { getAttackLogs, type AttackLog } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const route = useRoute()
const router = useRouter()

const filterKeys = [
  "application_id",
  "client_ip",
  "rule_id",
  "action",
  "disposition",
  "event_type",
  "module",
  "attack_type",
  "advanced_target",
  "challenge_result",
  "bot_result",
  "dynamic_result",
  "min_score"
] as const

type FilterKey = typeof filterKeys[number]

const filters = reactive(Object.fromEntries(filterKeys.map((key) => [key, queryString(key)])) as Record<typeof filterKeys[number], string>)

const logsResource = useApiResource(() => getAttackLogs(cleanFilters()))
const logs = computed(() => [...(logsResource.data.value ?? [])])

const columns = [
  { title: "时间", key: "time" },
  { title: "请求 ID", key: "request_id" },
  { title: "站点", key: "application_id" },
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
  { title: "Bot 结果", key: "bot_result" },
  { title: "Bot 原因", key: "bot_reason" },
  { title: "设备信号", key: "device_signal" },
  { title: "动态结果", key: "advanced_target" },
  { title: "高级目标", key: "advanced_target" },
  { title: "分数", key: "score" },
  { title: "动作", key: "action" },
  { title: "处置", key: "disposition" },
  { title: "URI", key: "uri" },
  { title: "摘要", key: "summary" },
  { title: "Body", key: "body_metadata" },
  { title: "上传", key: "upload_metadata" },
  { title: "封禁", key: "ban_reason" },
  {
    title: "回跳",
    key: "actions",
    render(row: AttackLog) {
      const path = moduleRoute(row.module)
      if (!path) {
        return null
      }
      return h(NSpace, { size: "small" }, {
        default: () => [
          h(
            RouterLink,
            { to: { path, query: row.rule_id > 0 ? { rule_id: row.rule_id } : {} } },
            { default: () => h(NButton, { size: "small", quaternary: true }, { default: () => "查看模块" }) }
          )
        ]
      })
    }
  }
]

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== ""))
}

async function searchLogs() {
  await router.replace({ query: cleanFilters() })
  await logsResource.refresh()
}

function queryString(key: string) {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "")
}

function selectFilterValue(key: FilterKey) {
  return filters[key] || null
}

function updateSelectFilter(key: FilterKey, value: string | number | null) {
  filters[key] = value == null ? "" : String(value)
}

function moduleRoute(module: string) {
  const routes: Record<string, string> = {
    "cc-protection": "/cc-protection",
    "attack-protection": "/attack-protection",
    "ip-access-list": "/ip-access-lists",
    "access-control": "/access-control",
    "upload-protection": "/upload-protection",
    "bot-protection": "/bot-protection",
    "dynamic-protection": "/dynamic-protection"
  }
  return routes[module] ?? ""
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">攻击日志</h1>
        <p class="page-subtitle">按防护模块检索命中记录，单独查看 IP 黑白名单、访问控制和限流事件。</p>
      </div>
      <NButton @click="logsResource.refresh">刷新</NButton>
    </div>

    <section class="section section-pad">
      <div class="toolbar query-toolbar">
        <div class="query-field">
          <span class="query-label">应用 ID</span>
          <NInput v-model:value="filters.application_id" placeholder="输入应用 ID" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">来源 IP</span>
          <NInput v-model:value="filters.client_ip" placeholder="输入来源 IP" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">规则 ID</span>
          <NInput v-model:value="filters.rule_id" placeholder="输入规则 ID" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">事件类型</span>
          <NSelect
            :value="selectFilterValue('event_type')"
            clearable
            placeholder="选择事件类型"
            @update:value="updateSelectFilter('event_type', $event)"
            :options="[
              { label: '规则', value: 'rule' },
              { label: 'IP 黑白名单', value: 'ip-access-list' },
              { label: 'CC 防护兼容事件', value: 'rate-limit' },
              { label: '评分阈值', value: 'score-threshold' },
              { label: '请求体检测', value: 'body-inspection' },
              { label: '上传检测', value: 'upload-inspection' },
              { label: '动态封禁', value: 'dynamic-ban' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">防护模块</span>
          <NSelect
            :value="selectFilterValue('module')"
            clearable
            placeholder="选择防护模块"
            @update:value="updateSelectFilter('module', $event)"
            :options="[
              { label: '攻击防护', value: 'attack-protection' },
              { label: 'IP 黑白名单', value: 'ip-access-list' },
              { label: 'CC 防护', value: 'cc-protection' },
              { label: '访问控制', value: 'access-control' },
              { label: '上传防护', value: 'upload-protection' },
              { label: 'Bot / 人机验证', value: 'bot-protection' },
              { label: '动态防护', value: 'dynamic-protection' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">攻击类型</span>
          <NSelect
            :value="selectFilterValue('attack_type')"
            clearable
            placeholder="选择攻击类型"
            @update:value="updateSelectFilter('attack_type', $event)"
            :options="[
              { label: 'SQL 注入', value: 'sqli' },
              { label: 'XSS', value: 'xss' },
              { label: 'RCE', value: 'rce' },
              { label: '路径穿越', value: 'path-traversal' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">高级检测目标</span>
          <NSelect
            :value="selectFilterValue('advanced_target')"
            clearable
            placeholder="选择高级检测目标"
            @update:value="updateSelectFilter('advanced_target', $event)"
            :options="[
              { label: 'Body', value: 'body' },
              { label: 'JSON Body', value: 'body_json' },
              { label: '上传文件名', value: 'upload_filename' },
              { label: '上传扩展名', value: 'upload_extension' },
              { label: '上传 MIME', value: 'upload_mime' },
              { label: '上传大小', value: 'upload_size' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">挑战结果</span>
          <NSelect
            :value="selectFilterValue('challenge_result')"
            clearable
            placeholder="选择挑战结果"
            @update:value="updateSelectFilter('challenge_result', $event)"
            :options="[
              { label: '已发起', value: 'issued' },
              { label: '已通过', value: 'passed' },
              { label: '失败', value: 'failed' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">Bot 验证结果</span>
          <NSelect
            :value="selectFilterValue('bot_result')"
            clearable
            placeholder="选择 Bot 验证结果"
            @update:value="updateSelectFilter('bot_result', $event)"
            :options="[
              { label: 'Captcha 发放', value: 'captcha-issued' },
              { label: 'Captcha 通过', value: 'captcha-passed' },
              { label: 'Captcha 失败', value: 'captcha-failed' },
              { label: '行为评分通过', value: 'behavior-pass' },
              { label: '搜索引擎绕过', value: 'search-engine-bypass' },
              { label: '设备不匹配', value: 'device-mismatch' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">动态防护结果</span>
          <NSelect
            :value="selectFilterValue('dynamic_result')"
            clearable
            placeholder="选择动态防护结果"
            @update:value="updateSelectFilter('dynamic_result', $event)"
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
        </div>
        <div class="query-field">
          <span class="query-label">最低分数</span>
          <NInput v-model:value="filters.min_score" placeholder="输入最低分数" clearable />
        </div>
        <div class="query-field">
          <span class="query-label">执行动作</span>
          <NSelect
            :value="selectFilterValue('action')"
            clearable
            placeholder="选择执行动作"
            @update:value="updateSelectFilter('action', $event)"
            :options="[
              { label: '阻断', value: 'block' },
              { label: '观察', value: 'log-only' },
              { label: '放行', value: 'allow' }
            ]"
          />
        </div>
        <div class="query-field">
          <span class="query-label">处置结果</span>
          <NSelect
            :value="selectFilterValue('disposition')"
            clearable
            placeholder="选择处置结果"
            @update:value="updateSelectFilter('disposition', $event)"
            :options="[
              { label: '已阻断', value: 'blocked' },
              { label: '已限流', value: 'rate-limited' },
              { label: '已观察', value: 'observed' },
              { label: '已拒绝', value: 'rejected' }
            ]"
          />
        </div>
        <NButton type="primary" @click="searchLogs">查询</NButton>
      </div>

      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
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
