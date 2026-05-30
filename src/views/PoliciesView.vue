<script setup lang="ts">
import { computed, h, reactive, ref } from "vue"
import { NButton, NSpace, useMessage } from "naive-ui"
import {
  createPolicy,
  deletePolicy,
  getPolicies,
  getRules,
  getSites,
  updatePolicy,
  type Policy,
  type PolicyInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const message = useMessage()
const policiesResource = useApiResource(getPolicies)
const sitesResource = useApiResource(getSites)
const rulesResource = useApiResource(getRules)
const policies = computed(() => [...(policiesResource.data.value ?? [])])
const showForm = ref(false)
const saving = ref(false)
const editingID = ref<number | null>(null)

const form = reactive<PolicyInput>({
  name: "",
  risk_threshold: 100,
  default_action: "block",
  normalization_enabled: true,
  normalization_decode_passes: 2,
  normalization_max_value_bytes: 4096,
  body_inspection_enabled: false,
  body_inspection_content_types: ["application/json", "application/x-www-form-urlencoded"],
  body_inspection_path_prefixes: ["/"],
  body_inspection_max_bytes: 65536,
  oversized_body_action: "log-only",
  upload_inspection_enabled: false,
  upload_max_bytes: 10485760,
  upload_size_action: "block",
  dynamic_ban_enabled: false,
  dynamic_ban_duration_sec: 300,
  dynamic_ban_score_threshold: 200,
  dynamic_ban_trigger_count: 3,
  dynamic_ban_window_sec: 60,
  enabled: true,
  site_ids: [],
  rule_ids: []
})

const siteOptions = computed(() =>
  (sitesResource.data.value ?? []).map((site) => ({ label: `${site.name} (${site.host})`, value: site.id }))
)
const ruleOptions = computed(() =>
  (rulesResource.data.value ?? []).map((rule) => ({ label: `${rule.name} #${rule.id}`, value: rule.id }))
)
const actionOptions = [
  { label: "阻断", value: "block" },
  { label: "仅记录", value: "log-only" },
  { label: "放行", value: "pass" }
]
const contentTypeOptions = [
  { label: "JSON", value: "application/json" },
  { label: "Form", value: "application/x-www-form-urlencoded" },
  { label: "Multipart", value: "multipart/form-data" },
  { label: "Text", value: "text/plain" }
]
const bodyPathOptions = computed(() =>
  form.body_inspection_path_prefixes.map((value) => ({ label: value, value }))
)

const columns = computed(() => [
  { title: "策略 ID", key: "id" },
  { title: "名称", key: "name" },
  { title: "风险阈值", key: "risk_threshold" },
  { title: "默认动作", key: "default_action" },
  { title: "Body", key: "body_inspection_enabled", render: (row: Policy) => (row.body_inspection_enabled ? "启用" : "停用") },
  { title: "上传", key: "upload_inspection_enabled", render: (row: Policy) => (row.upload_inspection_enabled ? "启用" : "停用") },
  { title: "动态封禁", key: "dynamic_ban_enabled", render: (row: Policy) => (row.dynamic_ban_enabled ? "启用" : "停用") },
  { title: "站点数", key: "site_ids", render: (row: Policy) => row.site_ids.length },
  { title: "规则数", key: "rule_ids", render: (row: Policy) => row.rule_ids.length },
  { title: "状态", key: "enabled", render: (row: Policy) => (row.enabled ? "启用" : "停用") },
  {
    title: "操作",
    key: "actions",
    render: (row: Policy) =>
      h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(NButton, { size: "small", quaternary: true, onClick: () => editPolicy(row) }, { default: () => "编辑" }),
            h(NButton, { size: "small", quaternary: true, onClick: () => removePolicy(row.id) }, { default: () => "删除" })
          ]
        }
      )
  }
])

function resetForm() {
  editingID.value = null
  Object.assign(form, {
    name: "",
    risk_threshold: 100,
    default_action: "block",
    normalization_enabled: true,
    normalization_decode_passes: 2,
    normalization_max_value_bytes: 4096,
    body_inspection_enabled: false,
    body_inspection_content_types: ["application/json", "application/x-www-form-urlencoded"],
    body_inspection_path_prefixes: ["/"],
    body_inspection_max_bytes: 65536,
    oversized_body_action: "log-only",
    upload_inspection_enabled: false,
    upload_max_bytes: 10485760,
    upload_size_action: "block",
    dynamic_ban_enabled: false,
    dynamic_ban_duration_sec: 300,
    dynamic_ban_score_threshold: 200,
    dynamic_ban_trigger_count: 3,
    dynamic_ban_window_sec: 60,
    enabled: true,
    site_ids: [],
    rule_ids: []
  })
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function editPolicy(policy: Policy) {
  editingID.value = policy.id
  Object.assign(form, {
    name: policy.name,
    risk_threshold: policy.risk_threshold,
    default_action: policy.default_action,
    normalization_enabled: policy.normalization_enabled,
    normalization_decode_passes: policy.normalization_decode_passes,
    normalization_max_value_bytes: policy.normalization_max_value_bytes,
    body_inspection_enabled: policy.body_inspection_enabled,
    body_inspection_content_types: [...(policy.body_inspection_content_types ?? [])],
    body_inspection_path_prefixes: [...(policy.body_inspection_path_prefixes ?? [])],
    body_inspection_max_bytes: policy.body_inspection_max_bytes,
    oversized_body_action: policy.oversized_body_action,
    upload_inspection_enabled: policy.upload_inspection_enabled,
    upload_max_bytes: policy.upload_max_bytes,
    upload_size_action: policy.upload_size_action,
    dynamic_ban_enabled: policy.dynamic_ban_enabled,
    dynamic_ban_duration_sec: policy.dynamic_ban_duration_sec,
    dynamic_ban_score_threshold: policy.dynamic_ban_score_threshold,
    dynamic_ban_trigger_count: policy.dynamic_ban_trigger_count,
    dynamic_ban_window_sec: policy.dynamic_ban_window_sec,
    enabled: policy.enabled,
    site_ids: [...policy.site_ids],
    rule_ids: [...policy.rule_ids]
  })
  showForm.value = true
}

async function savePolicy() {
  saving.value = true
  try {
    if (editingID.value) {
      await updatePolicy(editingID.value, form)
    } else {
      await createPolicy(form)
    }
    message.success("策略已保存")
    showForm.value = false
    await policiesResource.refresh()
  } finally {
    saving.value = false
  }
}

async function removePolicy(id: number) {
  await deletePolicy(id)
  message.success("策略已删除")
  await policiesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">防护策略</h1>
        <p class="page-subtitle">按站点绑定规则集、动作和风险阈值。</p>
      </div>
      <NButton type="primary" @click="openCreate">新增策略</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="policiesResource.loading.value"
        :columns="columns"
        :data="policies"
        :bordered="false"
      />
      <NEmpty v-if="!policiesResource.loading.value && policies.length === 0" description="暂无策略" />
      <NAlert v-if="policiesResource.error.value" type="error" style="margin-top: 12px">
        {{ policiesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer v-model:show="showForm" :width="480">
      <NDrawerContent :title="editingID ? '编辑策略' : '新增策略'">
        <NForm label-placement="top">
          <NFormItem label="策略名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="绑定站点">
            <NSelect v-model:value="form.site_ids" multiple :options="siteOptions" />
          </NFormItem>
          <NFormItem label="绑定规则">
            <NSelect v-model:value="form.rule_ids" multiple :options="ruleOptions" />
          </NFormItem>
          <NFormItem label="风险阈值">
            <NInputNumber v-model:value="form.risk_threshold" :min="1" :max="1000" />
          </NFormItem>
          <NFormItem label="默认动作">
            <NSelect v-model:value="form.default_action" :options="actionOptions" />
          </NFormItem>
          <NDivider />
          <NFormItem label="请求归一化">
            <NSwitch v-model:value="form.normalization_enabled" />
          </NFormItem>
          <NFormItem label="解码次数">
            <NInputNumber v-model:value="form.normalization_decode_passes" :min="1" :max="5" />
          </NFormItem>
          <NFormItem label="归一化字节上限">
            <NInputNumber v-model:value="form.normalization_max_value_bytes" :min="128" :max="65536" />
          </NFormItem>
          <NDivider />
          <NFormItem label="请求体检测">
            <NSwitch v-model:value="form.body_inspection_enabled" />
          </NFormItem>
          <NFormItem label="请求体类型">
            <NSelect v-model:value="form.body_inspection_content_types" multiple tag :options="contentTypeOptions" />
          </NFormItem>
          <NFormItem label="路径前缀">
            <NSelect v-model:value="form.body_inspection_path_prefixes" multiple tag :options="bodyPathOptions" />
          </NFormItem>
          <NFormItem label="请求体字节上限">
            <NInputNumber v-model:value="form.body_inspection_max_bytes" :min="1" :max="1048576" />
          </NFormItem>
          <NFormItem label="超限动作">
            <NSelect v-model:value="form.oversized_body_action" :options="actionOptions" />
          </NFormItem>
          <NDivider />
          <NFormItem label="上传检测">
            <NSwitch v-model:value="form.upload_inspection_enabled" />
          </NFormItem>
          <NFormItem label="上传字节上限">
            <NInputNumber v-model:value="form.upload_max_bytes" :min="1" :max="1073741824" />
          </NFormItem>
          <NFormItem label="上传超限动作">
            <NSelect v-model:value="form.upload_size_action" :options="actionOptions" />
          </NFormItem>
          <NDivider />
          <NFormItem label="动态封禁">
            <NSwitch v-model:value="form.dynamic_ban_enabled" />
          </NFormItem>
          <NFormItem label="封禁秒">
            <NInputNumber v-model:value="form.dynamic_ban_duration_sec" :min="1" :max="86400" />
          </NFormItem>
          <NFormItem label="封禁分数阈值">
            <NInputNumber v-model:value="form.dynamic_ban_score_threshold" :min="1" :max="10000" />
          </NFormItem>
          <NFormItem label="触发次数">
            <NInputNumber v-model:value="form.dynamic_ban_trigger_count" :min="1" :max="1000" />
          </NFormItem>
          <NFormItem label="统计窗口秒">
            <NInputNumber v-model:value="form.dynamic_ban_window_sec" :min="1" :max="86400" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="savePolicy">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>
