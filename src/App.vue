<script setup lang="ts">
import { computed } from "vue"
import { darkTheme, dateZhCN, zhCN } from "naive-ui"
import { useThemeStore } from "@/stores/theme"

const themeStore = useThemeStore()

const theme = computed(() => (themeStore.isDark ? darkTheme : null))
</script>

<template>
  <NConfigProvider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <RouterView />
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
