<script setup lang="ts">
import { computed, h, reactive, ref } from "vue"
import { NButton, NSpace, useMessage } from "naive-ui"
import {
  createRule,
  deleteRule,
  getRules,
  updateRule,
  type Rule,
  type RuleInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const message = useMessage()
const rulesResource = useApiResource(getRules)
const rules = computed(() => [...(rulesResource.data.value ?? [])])
const showForm = ref(false)
const saving = ref(false)
const editingID = ref<number | null>(null)

const form = reactive<RuleInput>({
  name: "",
  type: "custom",
  target: "args",
  action: "block",
  expression: "",
  score: 80,
  enabled: true
})

const typeOptions = [
  { label: "SQLi", value: "sqli" },
  { label: "XSS", value: "xss" },
  { label: "RCE", value: "rce" },
  { label: "CC", value: "cc" },
  { label: "Bot", value: "bot" },
  { label: "自定义", value: "custom" }
]
const targetOptions = [
  { label: "查询参数", value: "args" },
  { label: "URI", value: "uri" },
  { label: "请求头", value: "headers" },
  { label: "归一化 URI", value: "normalized_uri" },
  { label: "归一化路径", value: "normalized_path" },
  { label: "归一化参数", value: "normalized_args" },
  { label: "归一化请求头", value: "normalized_headers" },
  { label: "请求体", value: "body" },
  { label: "JSON Body", value: "body_json" },
  { label: "Form Body", value: "body_form" },
  { label: "上传文件名", value: "upload_filename" },
  { label: "上传扩展名", value: "upload_extension" },
  { label: "上传 MIME", value: "upload_mime" },
  { label: "上传大小", value: "upload_size" }
]
const actionOptions = [
  { label: "阻断", value: "block" },
  { label: "仅记录", value: "log-only" },
  { label: "放行", value: "pass" }
]

const columns = computed(() => [
  { title: "规则 ID", key: "id" },
  { title: "名称", key: "name" },
  { title: "类型", key: "type" },
  { title: "检测目标", key: "target" },
  { title: "动作", key: "action" },
  { title: "分数", key: "score" },
  { title: "状态", key: "enabled", render: (row: Rule) => (row.enabled ? "启用" : "停用") },
  {
    title: "操作",
    key: "actions",
    render: (row: Rule) =>
      h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(NButton, { size: "small", quaternary: true, onClick: () => editRule(row) }, { default: () => "编辑" }),
            h(NButton, { size: "small", quaternary: true, onClick: () => removeRule(row.id) }, { default: () => "删除" })
          ]
        }
      )
  }
])

function resetForm() {
  editingID.value = null
  Object.assign(form, {
    name: "",
    type: "custom",
    target: "args",
    action: "block",
    expression: "",
    score: 80,
    enabled: true
  })
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function editRule(rule: Rule) {
  editingID.value = rule.id
  Object.assign(form, {
    name: rule.name,
    type: rule.type,
    target: rule.target,
    action: rule.action,
    expression: rule.expression,
    score: rule.score,
    enabled: rule.enabled
  })
  showForm.value = true
}

async function saveRule() {
  saving.value = true
  try {
    if (editingID.value) {
      await updateRule(editingID.value, form)
    } else {
      await createRule(form)
    }
    message.success("规则已保存")
    showForm.value = false
    await rulesResource.refresh()
  } finally {
    saving.value = false
  }
}

async function removeRule(id: number) {
  await deleteRule(id)
  message.success("规则已删除")
  await rulesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">规则管理</h1>
        <p class="page-subtitle">维护 SQLi、XSS、RCE、CC 和 Bot 检测规则。</p>
      </div>
      <NButton type="primary" @click="openCreate">新增规则</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :scrollbar-props="{ trigger: 'hover' }"
        :loading="rulesResource.loading.value"
        :columns="columns"
        :data="rules"
        :bordered="false"
      />
      <NEmpty v-if="!rulesResource.loading.value && rules.length === 0" description="暂无规则" />
      <NAlert v-if="rulesResource.error.value" type="error" style="margin-top: 12px">
        {{ rulesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" v-model:show="showForm" :width="480">
      <NDrawerContent :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }" :title="editingID ? '编辑规则' : '新增规则'">
        <NForm label-placement="top">
          <NFormItem label="规则名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="规则类型">
            <NSelect v-model:value="form.type" :options="typeOptions" />
          </NFormItem>
          <NFormItem label="检测目标">
            <NSelect v-model:value="form.target" :options="targetOptions" />
          </NFormItem>
          <NFormItem label="动作">
            <NSelect v-model:value="form.action" :options="actionOptions" />
          </NFormItem>
          <NFormItem label="表达式">
            <NInput v-model:value="form.expression" type="textarea" />
          </NFormItem>
          <NFormItem label="分数">
            <NInputNumber v-model:value="form.score" :min="0" :max="1000" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="saveRule">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>
