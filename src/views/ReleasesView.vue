<script setup lang="ts">
import { computed, ref } from "vue"
import { useMessage } from "naive-ui"
import { getReleases, publishRelease } from "@/api/litewaf"
import { useApiResource } from "@/composables/useApiResource"

const message = useMessage()
const releasesResource = useApiResource(getReleases)
const releases = computed(() => [...(releasesResource.data.value ?? [])])
const publishing = ref(false)

const columns = [
  { title: "版本", key: "version" },
  { title: "操作人", key: "operator" },
  { title: "状态", key: "status" },
  { title: "时间", key: "time" },
  { title: "配置路径", key: "config_path" },
  { title: "说明", key: "note" }
]

async function publishNow() {
  publishing.value = true
  try {
    const record = await publishRelease({ operator: "dashboard", note: "dashboard publish" })
    message.success(`已发布 ${record.version}`)
    await releasesResource.refresh()
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">发布记录</h1>
        <p class="page-subtitle">将当前站点、策略和规则发布为网关可加载配置。</p>
      </div>
      <NButton type="primary" :loading="publishing" @click="publishNow">发布新版本</NButton>
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
