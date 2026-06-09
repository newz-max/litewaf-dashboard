<script setup lang="ts">
import { computed } from "vue"
import { GlobeOutline } from "@vicons/ionicons5"
import { setLocale, supportedLocales, type LocaleCode } from "@/i18n"
import { useI18n } from "vue-i18n"

const { locale } = useI18n()

const localeOptions = computed(() =>
  supportedLocales.map((locale) => ({
    label: locale.label,
    value: locale.value
  }))
)

function updateLocale(value: string | number) {
  setLocale(value as LocaleCode)
}
</script>

<template>
  <NSelect
    class="language-switcher"
    size="small"
    :value="locale"
    :options="localeOptions"
    :consistent-menu-width="false"
    @update:value="updateLocale"
  >
    <template #arrow>
      <NIcon>
        <GlobeOutline />
      </NIcon>
    </template>
  </NSelect>
</template>

<style scoped>
.language-switcher {
  width: 116px;
}

@media (max-width: 520px) {
  .language-switcher {
    width: 104px;
  }
}
</style>
