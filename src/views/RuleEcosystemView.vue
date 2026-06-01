<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  getRules,
  getRulePackages,
  importRulePackage,
  previewRulePackage,
  testRule,
  type Rule,
  type RulePackageMetadata,
  type RulePackagePreview,
  type RuleTestResult
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const packagesResource = useApiResource(getRulePackages)
const rulesResource = useApiResource(getRules)

const packageJSON = shallowRef("")
const preview = shallowRef<RulePackagePreview | null>(null)
const previewing = shallowRef(false)
const importing = shallowRef(false)
const testing = shallowRef(false)
const testResult = shallowRef<RuleTestResult | null>(null)

const testForm = reactive({
  ruleID: null as number | null,
  method: "GET",
  path: "/search",
  query: "q=" + "<scr" + "ipt>alert(1)</scr" + "ipt>",
  headers: "",
  body: "",
  uploadFilename: "",
  uploadMime: "",
  uploadSize: 0
})

const packages = computed<RulePackageMetadata[]>(() =>
  (packagesResource.data.value ?? []).map((item) => ({ ...item, warnings: [...(item.warnings ?? [])] }))
)
const importedRules = computed<Rule[]>(() => [...(rulesResource.data.value ?? [])].filter((rule) => rule.package_id))
const testRuleOptions = computed(() =>
  (rulesResource.data.value ?? []).map((rule) => ({
    label: `${rule.name} #${rule.id}`,
    value: rule.id
  }))
)

const packageColumns: DataTableColumns<RulePackageMetadata> = [
  { title: "包 ID", key: "id" },
  { title: "版本", key: "version" },
  { title: "规则数", key: "rule_count" },
  {
    title: "签名",
    key: "signature_status",
    render: (row) =>
      h(NTag, { size: "small", type: row.signature_status === "verified" ? "success" : "warning" }, {
        default: () => row.signature_status || "unsigned"
      })
  },
  { title: "兼容性", key: "compatibility" }
]

const ruleColumns: DataTableColumns<Rule> = [
  { title: "规则", key: "name" },
  { title: "来源包", key: "package_id" },
  { title: "包版本", key: "package_version" },
  { title: "包内 ID", key: "package_rule_id" },
  {
    title: "签名",
    key: "signature_status",
    render: (row) => h(NTag, { size: "small" }, { default: () => row.signature_status || "-" })
  },
  {
    title: "测试",
    key: "last_test_status",
    render: (row) =>
      h(NTag, { size: "small", type: row.last_test_status === "passed" ? "success" : "default" }, {
        default: () => row.last_test_status || "未测试"
      })
  },
  { title: "状态", key: "enabled", render: (row) => (row.enabled ? "启用" : "停用") }
]

function defaultPackagePayload() {
  return {}
}

function parsePackagePayload() {
  const raw = packageJSON.value.trim()
  if (!raw) {
    return defaultPackagePayload()
  }
  return JSON.parse(raw)
}

async function runPreview() {
  previewing.value = true
  try {
    preview.value = await previewRulePackage(parsePackagePayload())
    message.success("规则包预览已生成")
  } finally {
    previewing.value = false
  }
}

async function runImport() {
  importing.value = true
  try {
    await importRulePackage(parsePackagePayload())
    message.success("规则包已导入")
    preview.value = null
    await Promise.all([packagesResource.refresh(), rulesResource.refresh()])
  } finally {
    importing.value = false
  }
}

async function runRuleTest() {
  if (!testForm.ruleID) {
    message.warning("请选择规则")
    return
  }
  testing.value = true
  try {
    testResult.value = await testRule({
      rule_id: testForm.ruleID,
      sample: {
        method: testForm.method,
        path: testForm.path,
        query: parseKeyValues(testForm.query),
        headers: parseKeyValues(testForm.headers),
        body: testForm.body,
        upload_filename: testForm.uploadFilename,
        upload_mime: testForm.uploadMime,
        upload_size: testForm.uploadSize
      }
    })
    message.success("规则测试完成")
    await rulesResource.refresh()
  } finally {
    testing.value = false
  }
}

function parseKeyValues(value: string) {
  const out: Record<string, string> = {}
  for (const line of value.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }
    const index = trimmed.indexOf("=")
    if (index <= 0) {
      continue
    }
    out[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return out
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">高级规则生态</h1>
        <p class="page-subtitle">导入、审查和测试本地规则包，发布时仍走现有网关规则模型。</p>
      </div>
    </div>

    <NGrid :cols="2" :x-gap="16" :y-gap="16" responsive="screen">
      <NGi>
        <section class="section section-pad">
          <div class="section-title">规则包</div>
          <NDataTable
            :loading="packagesResource.loading.value"
            :columns="packageColumns"
            :data="packages"
            :bordered="false"
          />
          <NEmpty v-if="!packagesResource.loading.value && packages.length === 0" description="暂无规则包" />
        </section>
      </NGi>

      <NGi>
        <section class="section section-pad">
          <div class="section-title">导入预览</div>
          <NInput
            v-model:value="packageJSON"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 14 }"
            placeholder="粘贴规则包 JSON；留空使用内置默认规则包"
          />
          <NSpace class="actions">
            <NButton :loading="previewing" :disabled="!authStore.canWrite" @click="runPreview">预览</NButton>
            <NButton type="primary" :loading="importing" :disabled="!authStore.canWrite" @click="runImport">
              导入
            </NButton>
          </NSpace>
          <NAlert v-if="!authStore.canWrite" type="warning" class="mt">
            当前角色只能查看规则生态，不能导入或测试规则。
          </NAlert>
          <div v-if="preview" class="preview-grid">
            <NStatistic label="新增" :value="preview.added.length" />
            <NStatistic label="变更" :value="preview.changed.length" />
            <NStatistic label="跳过" :value="preview.skipped.length" />
            <NStatistic label="无效" :value="preview.invalid.length" />
          </div>
          <NAlert v-for="warning in preview?.warnings ?? []" :key="warning" type="warning" class="mt">
            {{ warning }}
          </NAlert>
        </section>
      </NGi>
    </NGrid>

    <section class="section section-pad">
      <div class="section-title">已导入规则</div>
      <NDataTable
        :loading="rulesResource.loading.value"
        :columns="ruleColumns"
        :data="importedRules"
        :bordered="false"
      />
      <NEmpty v-if="!rulesResource.loading.value && importedRules.length === 0" description="暂无导入规则" />
    </section>

    <section class="section section-pad">
      <div class="section-title">规则测试</div>
      <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
        <NGi>
          <NFormItem label="规则">
            <NSelect v-model:value="testForm.ruleID" :options="testRuleOptions" filterable />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="方法">
            <NSelect
              v-model:value="testForm.method"
              :options="['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ label: value, value }))"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="路径">
            <NInput v-model:value="testForm.path" />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="查询参数">
            <NInput v-model:value="testForm.query" type="textarea" placeholder="q=test" />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="请求头">
            <NInput v-model:value="testForm.headers" type="textarea" placeholder="x-demo=value" />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="请求体">
            <NInput v-model:value="testForm.body" type="textarea" />
          </NFormItem>
        </NGi>
      </NGrid>
      <NSpace align="center">
        <NButton type="primary" :loading="testing" :disabled="!authStore.canWrite" @click="runRuleTest">
          运行测试
        </NButton>
        <NTag v-if="testResult" :type="testResult.matched ? 'success' : 'default'">
          {{ testResult.matched ? "命中" : "未命中" }} / {{ testResult.status }}
        </NTag>
      </NSpace>
      <NDescriptions v-if="testResult" class="mt" bordered :column="3">
        <NDescriptionsItem label="动作">{{ testResult.action }}</NDescriptionsItem>
        <NDescriptionsItem label="分数">{{ testResult.score }}</NDescriptionsItem>
        <NDescriptionsItem label="目标">{{ testResult.target }}</NDescriptionsItem>
      </NDescriptions>
    </section>
  </main>
</template>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-weight: 700;
}

.actions {
  margin-top: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.mt {
  margin-top: 12px;
}
</style>
