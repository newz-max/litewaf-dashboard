<script setup lang="ts">
import { dateZhCN, zhCN } from "naive-ui"
import { useThemeStore } from "@/stores/theme"

const themeStore = useThemeStore()
</script>

<template>
  <NConfigProvider
    :theme="themeStore.activeNaiveTheme"
    :theme-overrides="themeStore.themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NGlobalStyle />
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
