<script setup lang="ts">
import { computed } from "vue"
import { dateEnUS, dateZhCN, enUS, zhCN } from "naive-ui"
import ApiErrorNotifier from "@/components/system/ApiErrorNotifier.vue"
import { getActiveLocale } from "@/i18n"
import { useThemeStore } from "@/stores/theme"
import { useI18n } from "vue-i18n"

const themeStore = useThemeStore()
const { locale } = useI18n()
const naiveLocale = computed(() => (locale.value === "en-US" || getActiveLocale() === "en-US" ? enUS : zhCN))
const naiveDateLocale = computed(() => (locale.value === "en-US" || getActiveLocale() === "en-US" ? dateEnUS : dateZhCN))
</script>

<template>
  <NConfigProvider
    :theme="themeStore.activeNaiveTheme"
    :theme-overrides="themeStore.themeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <NGlobalStyle />
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <ApiErrorNotifier />
            <RouterView />
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
