<script setup lang="ts">
import { computed, h, reactive, ref } from "vue"
import { NButton, NSpace, useMessage } from "naive-ui"
import {
  createSite,
  deleteSite,
  getSites,
  updateSite,
  type Site,
  type SiteInput
} from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const message = useMessage()
const sitesResource = useApiResource(getSites)
const sites = computed(() => [...(sitesResource.data.value ?? [])])
const showForm = ref(false)
const saving = ref(false)
const editingID = ref<number | null>(null)

const form = reactive<SiteInput>({
  name: "",
  host: "",
  upstream: "",
  mode: "protect",
  enabled: true
})

const modeOptions = [
  { label: "防护", value: "protect" },
  { label: "观察", value: "monitor" },
  { label: "关闭", value: "off" }
]

const columns = computed(() => [
  { title: "站点名称", key: "name" },
  { title: "域名", key: "host" },
  { title: "上游地址", key: "upstream" },
  { title: "防护模式", key: "mode" },
  {
    title: "状态",
    key: "enabled",
    render: (row: Site) => (row.enabled ? "启用" : "停用")
  },
  {
    title: "操作",
    key: "actions",
    render: (row: Site) =>
      hActions([
        { label: "编辑", onClick: () => editSite(row) },
        { label: "删除", onClick: () => removeSite(row.id) }
      ])
  }
])

function resetForm() {
  editingID.value = null
  Object.assign(form, {
    name: "",
    host: "",
    upstream: "",
    mode: "protect",
    enabled: true
  })
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function editSite(site: Site) {
  editingID.value = site.id
  Object.assign(form, {
    name: site.name,
    host: site.host,
    upstream: site.upstream,
    mode: site.mode,
    enabled: site.enabled
  })
  showForm.value = true
}

async function saveSite() {
  saving.value = true
  try {
    if (editingID.value) {
      await updateSite(editingID.value, form)
    } else {
      await createSite(form)
    }
    message.success("站点已保存")
    showForm.value = false
    await sitesResource.refresh()
  } finally {
    saving.value = false
  }
}

async function removeSite(id: number) {
  await deleteSite(id)
  message.success("站点已删除")
  await sitesResource.refresh()
}

function hActions(actions: Array<{ label: string; onClick: () => void }>) {
  return h(
    NSpace,
    { size: "small" },
    {
      default: () =>
        actions.map((action) =>
          h(
            NButton,
            { size: "small", quaternary: true, onClick: action.onClick },
            { default: () => action.label }
          )
        )
    }
  )
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">站点管理</h1>
        <p class="page-subtitle">配置域名、上游服务和防护模式。</p>
      </div>
      <NButton type="primary" @click="openCreate">新增站点</NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="sitesResource.loading.value"
        :columns="columns"
        :data="sites"
        :bordered="false"
      />
      <NEmpty v-if="!sitesResource.loading.value && sites.length === 0" description="暂无站点" />
      <NAlert v-if="sitesResource.error.value" type="error" style="margin-top: 12px">
        {{ sitesResource.error.value }}
      </NAlert>
    </section>

    <NDrawer v-model:show="showForm" :width="420">
      <NDrawerContent :title="editingID ? '编辑站点' : '新增站点'">
        <NForm label-placement="top">
          <NFormItem label="站点名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="域名">
            <NInput v-model:value="form.host" placeholder="example.local" />
          </NFormItem>
          <NFormItem label="上游地址">
            <NInput v-model:value="form.upstream" placeholder="http://upstream:8080" />
          </NFormItem>
          <NFormItem label="防护模式">
            <NSelect v-model:value="form.mode" :options="modeOptions" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="form.enabled" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showForm = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="saveSite">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </main>
</template>
