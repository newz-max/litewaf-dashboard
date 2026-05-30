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

const columns = computed(() => [
  { title: "策略 ID", key: "id" },
  { title: "名称", key: "name" },
  { title: "风险阈值", key: "risk_threshold" },
  { title: "默认动作", key: "default_action" },
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
