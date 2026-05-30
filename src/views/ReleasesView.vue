<script setup lang="ts">
import { computed, h, ref } from "vue"
import { useDialog, useMessage, NButton, NSpace } from "naive-ui"
import { getReleases, previewRelease, publishRelease, rollbackRelease, type ReleaseRecord } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"
import { useAuthStore } from "@/stores/auth"

const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const releasesResource = useApiResource(getReleases)
const releases = computed(() => [...(releasesResource.data.value ?? [])])
const publishing = ref(false)

const columns = [
  { title: "版本", key: "version" },
  { title: "操作人", key: "operator" },
  { title: "状态", key: "status" },
  { title: "时间", key: "time" },
  { title: "配置路径", key: "config_path" },
  { title: "说明", key: "note" },
  {
    title: "操作",
    key: "actions",
    render(row: ReleaseRecord) {
      if (!authStore.canWrite || row.status !== "success" || !row.version) {
        return null
      }
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: "small",
              onClick: () => rollback(row.version)
            },
            { default: () => "回滚" }
          )
        ]
      })
    }
  }
]

async function publishNow() {
  const preview = await previewRelease()
  dialog.warning({
    title: "确认发布",
    content: `将发布 ${preview.summary.sites} 个站点、${preview.summary.rules} 条规则、${preview.summary.policies} 个策略、${preview.summary.access_lists} 条名单、${preview.summary.rate_limits} 条限流配置。`,
    positiveText: "发布",
    negativeText: "取消",
    onPositiveClick: async () => {
      publishing.value = true
      try {
        const record = await publishRelease({ note: "dashboard publish" })
        message.success(`已发布 ${record.version}`)
        await releasesResource.refresh()
      } finally {
        publishing.value = false
      }
    }
  })
}

async function rollback(version: string) {
  const record = await rollbackRelease(version)
  message.success(`已回滚 ${record.version}`)
  await releasesResource.refresh()
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">发布记录</h1>
        <p class="page-subtitle">将当前站点、策略和规则发布为网关可加载配置。</p>
      </div>
      <NButton v-if="authStore.canWrite" type="primary" :loading="publishing" @click="publishNow">
        发布新版本
      </NButton>
    </div>

    <section class="section section-pad">
      <NDataTable
        :loading="releasesResource.loading.value"
        :columns="columns"
        :data="releases"
        :bordered="false"
      />
      <NEmpty v-if="!releasesResource.loading.value && releases.length === 0" description="暂无发布记录" />
      <NAlert v-if="releasesResource.error.value" type="error" style="margin-top: 12px">
        {{ releasesResource.error.value }}
      </NAlert>
    </section>
  </main>
</template>
