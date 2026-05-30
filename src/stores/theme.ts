import { defineStore } from "pinia"
import { shallowRef } from "vue"

export const useThemeStore = defineStore("theme", () => {
  const isDark = shallowRef(false)

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    toggleTheme
  }
})
