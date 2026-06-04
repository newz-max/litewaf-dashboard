<script setup lang="ts">
import { computed, h, reactive, shallowRef } from "vue"
import { NButton, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui"
import {
  applyRulePackageUpdate,
  createRuleCatalog,
  createRuleTrustKey,
  exportRulePackage,
  getRuleCatalogs,
  getRuleCatalogPackages,
  getRulePackages,
  getRules,
  getRuleTrustKeys,
  importRulePackage,
  previewRemoteRulePackage,
  previewRulePackage,
  previewRulePackageExport,
  previewRulePackageUpdate,
  syncRuleCatalog,
  testRule,
  type Rule,
  type RuleCatalogPackage,
  type RuleCatalogSource,
  type RulePackageExportArtifact,
  type RulePackageExportPreview,
  type RulePackageMetadata,
  type RulePackagePreview,
  type RulePackageUpdatePreview,
  type RuleTestResult,
  type RuleTrustKey
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const authStore = useAuthStore()
const packagesResource = useApiResource(getRulePackages)
const rulesResource = useApiResource(getRules)
const catalogsResource = useApiResource(getRuleCatalogs)
const trustKeysResource = useApiResource(getRuleTrustKeys)

const activeCatalogID = shallowRef<number | null>(null)
const catalogPackages = shallowRef<RuleCatalogPackage[]>([])
const catalogLoading = shallowRef(false)
const packageJSON = shallowRef("")
const preview = shallowRef<RulePackagePreview | null>(null)
const remotePreview = shallowRef<RulePackagePreview | null>(null)
const updatePreview = shallowRef<RulePackageUpdatePreview | null>(null)
const exportPreview = shallowRef<RulePackageExportPreview | null>(null)
const exportArtifact = shallowRef<RulePackageExportArtifact | null>(null)
const testResult = shallowRef<RuleTestResult | null>(null)
const busy = shallowRef("")

const catalogForm = reactive({
  name: "",
  source: "",
  enabled: true,
  timeoutSec: 5
})

const trustForm = reactive({
  keyID: "",
  algorithm: "local",
  owner: "",
  publicKey: "",
  enabled: true,
  revoked: false,
  expiresAt: ""
})

const exportForm = reactive({
  packageID: "",
  name: "",
  version: "v1",
  author: "",
  license: "MIT",
  signingKeyID: "",
  ruleIDs: [] as number[]
})

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
const rules = computed<Rule[]>(() =>
  (rulesResource.data.value ?? []).map((rule) => ({
    ...rule,
    export_ineligible_reasons: [...(rule.export_ineligible_reasons ?? [])]
  }))
)
const importedRules = computed<Rule[]>(() => rules.value.filter((rule) => rule.package_id))
const catalogs = computed<RuleCatalogSource[]>(() => [...(catalogsResource.data.value ?? [])])
const trustKeys = computed<RuleTrustKey[]>(() => [...(trustKeysResource.data.value ?? [])])

const canWrite = computed(() => authStore.canWrite)
const exportRuleOptions = computed(() =>
  rules.value.map((rule) => ({
    label: `${rule.name} #${rule.id}`,
    value: rule.id
  }))
)
const testRuleOptions = computed(() =>
  rules.value.map((rule) => ({
    label: `${rule.name} #${rule.id}`,
    value: rule.id
  }))
)
const trustKeyOptions = computed(() =>
  trustKeys.value.map((key) => ({
    label: `${key.key_id} / ${key.algorithm}`,
    value: key.key_id
  }))
)

const packageColumns: DataTableColumns<RulePackageMetadata> = [
  { title: "包 ID", key: "id" },
  { title: "版本", key: "version" },
  { title: "规则数", key: "rule_count" },
  {
    title: "签名",
    key: "signature_status",
    render: (row) => statusTag(row.signature_status || "unsigned")
  },
  { title: "兼容性", key: "compatibility" }
]

const ruleColumns: DataTableColumns<Rule> = [
  { title: "规则", key: "name" },
  { title: "来源包", key: "package_id" },
  { title: "包版本", key: "package_version" },
  { title: "目录", key: "remote_catalog_id", render: (row) => row.remote_catalog_id || "-" },
  { title: "更新", key: "pending_update_state", render: (row) => statusTag(row.pending_update_state || "current") },
  { title: "签名", key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  {
    title: "测试",
    key: "last_test_status",
    render: (row) => statusTag(row.last_test_status || "untested")
  },
  { title: "状态", key: "enabled", render: (row) => (row.enabled ? "启用" : "停用") }
]

const catalogColumns: DataTableColumns<RuleCatalogSource> = [
  { title: "目录", key: "name" },
  { title: "来源", key: "source", ellipsis: { tooltip: true } },
  { title: "状态", key: "status", render: (row) => statusTag(row.status) },
  { title: "包数", key: "package_count" },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(
        NButton,
        {
          size: "small",
          disabled: !canWrite.value,
          loading: busy.value === `sync-${row.id}`,
          onClick: () => runCatalogSync(row)
        },
        { default: () => "同步" }
      )
  }
]

const catalogPackageColumns: DataTableColumns<RuleCatalogPackage> = [
  { title: "包 ID", key: "package_id" },
  { title: "版本", key: "version" },
  { title: "签名", key: "signature_status", render: (row) => statusTag(row.signature_status || "unsigned") },
  { title: "兼容性", key: "compatibility" },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => runRemotePreview(row) },
            { default: () => "预览" }
          ),
          h(
            NButton,
            { size: "small", disabled: !canWrite.value, onClick: () => runUpdatePreview(row) },
            { default: () => "更新预览" }
          ),
          h(
            NButton,
            {
              size: "small",
              type: "primary",
              disabled: !canWrite.value,
              loading: busy.value === `apply-${row.catalog_id}-${row.package_id}`,
              onClick: () => runApplyUpdate(row)
            },
            { default: () => "应用" }
          )
        ]
      })
  }
]

const trustColumns: DataTableColumns<RuleTrustKey> = [
  { title: "Key ID", key: "key_id" },
  { title: "算法", key: "algorithm" },
  { title: "所有者", key: "owner" },
  { title: "启用", key: "enabled", render: (row) => (row.enabled ? "是" : "否") },
  { title: "撤销", key: "revoked", render: (row) => (row.revoked ? "是" : "否") },
  { title: "过期时间", key: "expires_at", render: (row) => row.expires_at || "-" }
]

function statusTag(status: string) {
  const normalized = status || "-"
  const type =
    normalized === "verified" || normalized === "passed" || normalized === "synced" || normalized === "current"
      ? "success"
      : normalized === "invalid" || normalized === "revoked-key" || normalized === "failed"
        ? "error"
        : "warning"
  return h(NTag, { size: "small", type }, { default: () => normalized })
}

function parsePackagePayload() {
  const raw = packageJSON.value.trim()
  return raw ? JSON.parse(raw) : {}
}

async function runPreview() {
  busy.value = "local-preview"
  try {
    preview.value = await previewRulePackage(parsePackagePayload())
    message.success("规则包预览已生成")
  } finally {
    busy.value = ""
  }
}

async function runImport() {
  busy.value = "local-import"
  try {
    await importRulePackage(parsePackagePayload())
    message.success("规则包已导入")
    preview.value = null
    await refreshRuleData()
  } finally {
    busy.value = ""
  }
}

async function createCatalog() {
  busy.value = "create-catalog"
  try {
    const item = await createRuleCatalog({
      name: catalogForm.name,
      source: catalogForm.source,
      enabled: catalogForm.enabled,
      timeout_sec: catalogForm.timeoutSec
    })
    activeCatalogID.value = item.id
    message.success("社区目录已创建")
    await catalogsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runCatalogSync(row: RuleCatalogSource) {
  busy.value = `sync-${row.id}`
  try {
    catalogPackages.value = await syncRuleCatalog(row.id)
    activeCatalogID.value = row.id
    message.success("目录同步完成")
    await catalogsResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function loadCatalogPackages() {
  if (!activeCatalogID.value) {
    catalogPackages.value = []
    return
  }
  catalogLoading.value = true
  try {
    catalogPackages.value = await getRuleCatalogPackages(activeCatalogID.value)
  } finally {
    catalogLoading.value = false
  }
}

async function runRemotePreview(row: RuleCatalogPackage) {
  remotePreview.value = await previewRemoteRulePackage(row.catalog_id, row.package_id)
  message.success("远程包预览完成")
}

async function runUpdatePreview(row: RuleCatalogPackage) {
  updatePreview.value = await previewRulePackageUpdate(row.catalog_id, row.package_id)
  message.success("更新预览完成")
}

async function runApplyUpdate(row: RuleCatalogPackage) {
  busy.value = `apply-${row.catalog_id}-${row.package_id}`
  try {
    await applyRulePackageUpdate(row.catalog_id, row.package_id)
    message.success("规则包更新已应用")
    await refreshRuleData()
  } finally {
    busy.value = ""
  }
}

async function createTrustKey() {
  busy.value = "create-trust"
  try {
    await createRuleTrustKey({
      key_id: trustForm.keyID,
      algorithm: trustForm.algorithm,
      owner: trustForm.owner,
      public_key: trustForm.publicKey,
      enabled: trustForm.enabled,
      revoked: trustForm.revoked,
      expires_at: trustForm.expiresAt || undefined
    })
    message.success("信任密钥已保存")
    await trustKeysResource.refresh()
  } finally {
    busy.value = ""
  }
}

async function runExportPreview() {
  busy.value = "export-preview"
  try {
    exportPreview.value = await previewRulePackageExport(exportPayload())
    exportArtifact.value = null
    message.success("导出预览已生成")
  } finally {
    busy.value = ""
  }
}

async function runExport() {
  busy.value = "export"
  try {
    exportArtifact.value = await exportRulePackage(exportPayload())
    message.success("导出包已生成")
  } finally {
    busy.value = ""
  }
}

async function runRuleTest() {
  if (!testForm.ruleID) {
    message.warning("请选择规则")
    return
  }
  busy.value = "rule-test"
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
    busy.value = ""
  }
}

function exportPayload() {
  return {
    package_id: exportForm.packageID,
    name: exportForm.name,
    version: exportForm.version,
    author: exportForm.author,
    license: exportForm.license,
    rule_ids: exportForm.ruleIDs,
    signing_key_id: exportForm.signingKeyID || undefined
  }
}

async function refreshRuleData() {
  await Promise.all([packagesResource.refresh(), rulesResource.refresh(), catalogsResource.refresh()])
  await loadCatalogPackages()
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
        <p class="page-subtitle">规则包导入、社区目录、信任密钥、更新审核和贡献导出都由控制面完成。</p>
      </div>
    </div>

    <NAlert v-if="!canWrite" type="warning" class="mb">
      当前角色只能查看规则生态，不能同步目录、导入、更新、配置密钥或导出规则包。
    </NAlert>

    <NTabs type="line" animated>
      <NTabPane name="local" tab="本地规则包">
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
                <NButton :loading="busy === 'local-preview'" :disabled="!canWrite" @click="runPreview">预览</NButton>
                <NButton type="primary" :loading="busy === 'local-import'" :disabled="!canWrite" @click="runImport">
                  导入
                </NButton>
              </NSpace>
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
      </NTabPane>

      <NTabPane name="catalogs" tab="社区目录">
        <section class="section section-pad">
          <div class="section-title">目录源</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="catalogForm.name" placeholder="目录名称" /></NGi>
            <NGi :span="2"><NInput v-model:value="catalogForm.source" placeholder="https://... 或本地 catalog.json" /></NGi>
            <NGi><NInputNumber v-model:value="catalogForm.timeoutSec" :min="1" :max="30" /></NGi>
          </NGrid>
          <NSpace class="mb">
            <NSwitch v-model:value="catalogForm.enabled" />
            <NButton type="primary" :loading="busy === 'create-catalog'" :disabled="!canWrite" @click="createCatalog">
              新增目录
            </NButton>
            <NSelect
              v-model:value="activeCatalogID"
              class="catalog-select"
              :options="catalogs.map((item) => ({ label: `${item.name} #${item.id}`, value: item.id }))"
              @update:value="loadCatalogPackages"
            />
          </NSpace>
          <NDataTable :loading="catalogsResource.loading.value" :columns="catalogColumns" :data="catalogs" :bordered="false" />
        </section>

        <section class="section section-pad">
          <div class="section-title">目录包</div>
          <NDataTable :loading="catalogLoading" :columns="catalogPackageColumns" :data="catalogPackages" :bordered="false" />
          <NEmpty v-if="!catalogLoading && catalogPackages.length === 0" description="暂无已同步目录包" />
          <div v-if="remotePreview || updatePreview" class="preview-grid">
            <NStatistic label="远程新增" :value="remotePreview?.added.length ?? updatePreview?.added.length ?? 0" />
            <NStatistic label="远程变更" :value="remotePreview?.changed.length ?? updatePreview?.changed.length ?? 0" />
            <NStatistic label="更新移除" :value="updatePreview?.removed.length ?? 0" />
            <NStatistic label="无效规则" :value="remotePreview?.invalid.length ?? updatePreview?.invalid.length ?? 0" />
          </div>
        </section>
      </NTabPane>

      <NTabPane name="trust" tab="信任密钥">
        <section class="section section-pad">
          <div class="section-title">信任密钥</div>
          <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb">
            <NGi><NInput v-model:value="trustForm.keyID" placeholder="Key ID" /></NGi>
            <NGi><NSelect v-model:value="trustForm.algorithm" :options="['local', 'ed25519', 'rsa', 'ecdsa'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="trustForm.owner" placeholder="所有者" /></NGi>
            <NGi><NInput v-model:value="trustForm.expiresAt" placeholder="过期时间 RFC3339，可空" /></NGi>
            <NGi :span="3"><NInput v-model:value="trustForm.publicKey" type="textarea" placeholder="公钥内容，不会在列表中回显" /></NGi>
            <NGi>
              <NSpace vertical>
                <NCheckbox v-model:checked="trustForm.enabled">启用</NCheckbox>
                <NCheckbox v-model:checked="trustForm.revoked">撤销</NCheckbox>
              </NSpace>
            </NGi>
          </NGrid>
          <NButton type="primary" :loading="busy === 'create-trust'" :disabled="!canWrite" @click="createTrustKey">
            保存密钥
          </NButton>
          <NDataTable class="mt" :loading="trustKeysResource.loading.value" :columns="trustColumns" :data="trustKeys" :bordered="false" />
        </section>
      </NTabPane>

      <NTabPane name="rules" tab="规则与导出">
        <section class="section section-pad">
          <div class="section-title">已导入规则</div>
          <NDataTable :loading="rulesResource.loading.value" :columns="ruleColumns" :data="importedRules" :bordered="false" />
          <NEmpty v-if="!rulesResource.loading.value && importedRules.length === 0" description="暂无导入规则" />
        </section>

        <section class="section section-pad">
          <div class="section-title">贡献导出</div>
          <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
            <NGi><NInput v-model:value="exportForm.packageID" placeholder="包 ID" /></NGi>
            <NGi><NInput v-model:value="exportForm.name" placeholder="包名称" /></NGi>
            <NGi><NInput v-model:value="exportForm.version" placeholder="版本" /></NGi>
            <NGi><NInput v-model:value="exportForm.author" placeholder="作者" /></NGi>
            <NGi><NInput v-model:value="exportForm.license" placeholder="许可证" /></NGi>
            <NGi><NSelect v-model:value="exportForm.signingKeyID" clearable :options="trustKeyOptions" placeholder="签名 Key，可空" /></NGi>
            <NGi :span="3">
              <NSelect v-model:value="exportForm.ruleIDs" multiple filterable :options="exportRuleOptions" placeholder="选择要导出的规则" />
            </NGi>
          </NGrid>
          <NSpace class="actions">
            <NButton :loading="busy === 'export-preview'" :disabled="!canWrite" @click="runExportPreview">导出预览</NButton>
            <NButton type="primary" :loading="busy === 'export'" :disabled="!canWrite" @click="runExport">生成导出包</NButton>
          </NSpace>
          <div v-if="exportPreview" class="preview-grid">
            <NStatistic label="选择规则" :value="exportPreview.selected_rules.length" />
            <NStatistic label="无效规则" :value="exportPreview.invalid.length" />
            <NStatistic label="签名状态" :value="exportPreview.signing_status" />
            <NStatistic label="校验方式" :value="exportPreview.checksum_plan" />
          </div>
          <NInput
            v-if="exportArtifact"
            class="mt"
            type="textarea"
            readonly
            :value="exportArtifact.artifact"
            :autosize="{ minRows: 8, maxRows: 18 }"
          />
        </section>

        <section class="section section-pad">
          <div class="section-title">规则测试</div>
          <NGrid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
            <NGi><NSelect v-model:value="testForm.ruleID" :options="testRuleOptions" filterable placeholder="规则" /></NGi>
            <NGi><NSelect v-model:value="testForm.method" :options="['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ label: value, value }))" /></NGi>
            <NGi><NInput v-model:value="testForm.path" placeholder="路径" /></NGi>
            <NGi><NInput v-model:value="testForm.query" type="textarea" placeholder="q=test" /></NGi>
            <NGi><NInput v-model:value="testForm.headers" type="textarea" placeholder="x-demo=value" /></NGi>
            <NGi><NInput v-model:value="testForm.body" type="textarea" placeholder="请求体" /></NGi>
          </NGrid>
          <NSpace class="actions" align="center">
            <NButton type="primary" :loading="busy === 'rule-test'" :disabled="!canWrite" @click="runRuleTest">运行测试</NButton>
            <NTag v-if="testResult" :type="testResult.matched ? 'success' : 'default'">
              {{ testResult.matched ? "命中" : "未命中" }} / {{ testResult.status }}
            </NTag>
          </NSpace>
        </section>
      </NTabPane>
    </NTabs>
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

.catalog-select {
  min-width: 240px;
}

.mb {
  margin-bottom: 12px;
}

.mt {
  margin-top: 12px;
}
</style>
