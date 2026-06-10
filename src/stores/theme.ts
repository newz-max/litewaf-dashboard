import { defineStore } from "pinia"
import { computed, reactive, shallowRef, watch } from "vue"
import { darkTheme, type GlobalTheme } from "naive-ui"
import {
  buildCssVars,
  buildThemeOverrides,
  defaultThemeSettings,
  getThemePreset,
  type ResolvedThemeMode,
  type ThemeDensity,
  type ThemeMode,
  type ThemeMotion,
  type ThemePresetId,
  type ThemeSettings
} from "@/theme/presets"
import { i18n } from "@/i18n"

const storageKey = "litewaf.theme.v1"
const legacySafelineAccentColor = "#19d3b5"

function cloneDefaultSettings(): ThemeSettings {
  return {
    ...defaultThemeSettings,
    chartPalette: [...defaultThemeSettings.chartPalette]
  }
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark"
}

function isThemeDensity(value: unknown): value is ThemeDensity {
  return value === "comfortable" || value === "compact"
}

function isThemeMotion(value: unknown): value is ThemeMotion {
  return value === "on" || value === "reduced"
}

function isThemePresetId(value: unknown): value is ThemePresetId {
  return (
    value === "litewaf-default" ||
    value === "safeline-inspired" ||
    value === "high-contrast" ||
    value === "compact-ops"
  )
}

function loadSettings(): ThemeSettings {
  if (typeof window === "undefined") {
    return cloneDefaultSettings()
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return cloneDefaultSettings()
    }

    const parsed = JSON.parse(raw) as Partial<ThemeSettings>
    const fallback = cloneDefaultSettings()
    const presetId = isThemePresetId(parsed.presetId) ? parsed.presetId : fallback.presetId
    const preset = getThemePreset(presetId)
    const shouldUpgradeLegacySafeline =
      presetId === "safeline-inspired" && parsed.accentColor === legacySafelineAccentColor
    const accentColor =
      shouldUpgradeLegacySafeline
        ? preset.accentColor
        : typeof parsed.accentColor === "string" && parsed.accentColor.trim()
          ? parsed.accentColor
          : preset.accentColor
    const radius = typeof parsed.radius === "number" ? Math.min(Math.max(parsed.radius, 4), 12) : preset.radius
    const savedChartPalette = Array.isArray(parsed.chartPalette)
      ? parsed.chartPalette.filter((color): color is string => typeof color === "string" && color.trim().length > 0)
      : []
    const chartPalette = shouldUpgradeLegacySafeline
      ? [...preset.chartPalette]
      : savedChartPalette.length > 0
        ? savedChartPalette
        : [...preset.chartPalette]

    return {
      mode: isThemeMode(parsed.mode) ? parsed.mode : fallback.mode,
      presetId,
      density: isThemeDensity(parsed.density) ? parsed.density : fallback.density,
      accentColor,
      radius,
      motion: isThemeMotion(parsed.motion) ? parsed.motion : fallback.motion,
      chartPalette
    }
  } catch {
    return cloneDefaultSettings()
  }
}

function saveSettings(settings: ThemeSettings) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(settings))
}

function applyCssVars(vars: Record<string, string>) {
  if (typeof document === "undefined") {
    return
  }

  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
}

export const useThemeStore = defineStore("theme", () => {
  const settings = reactive<ThemeSettings>(loadSettings())
  const prefersDark = shallowRef(false)

  if (typeof window !== "undefined") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    prefersDark.value = mediaQuery.matches

    mediaQuery.addEventListener("change", (event) => {
      prefersDark.value = event.matches
    })
  }

  const activeMode = computed<ResolvedThemeMode>(() => {
    if (settings.mode === "system") {
      return prefersDark.value ? "dark" : "light"
    }

    return settings.mode
  })

  const isDark = computed(() => activeMode.value === "dark")
  const activeModeLabel = computed(() => (isDark.value ? i18n.global.t("settings.darkMode") : i18n.global.t("settings.lightMode")))
  const activePreset = computed(() => getThemePreset(settings.presetId))
  const activeTokens = computed(() => (isDark.value ? activePreset.value.dark : activePreset.value.light))
  const activeNaiveTheme = computed<GlobalTheme | null>(() => (isDark.value ? darkTheme : null))
  const themeOverrides = computed(() => buildThemeOverrides(activeTokens.value, settings))
  const cssVars = computed(() => buildCssVars(activeTokens.value, settings))
  const chartPalette = computed(() => settings.chartPalette)
  const chartTextColor = computed(() => cssVars.value["--lw-chart-text"])
  const chartGridColor = computed(() => cssVars.value["--lw-chart-grid"])

  function toggleTheme() {
    settings.mode = isDark.value ? "light" : "dark"
  }

  function toggleDensity() {
    settings.density = settings.density === "compact" ? "comfortable" : "compact"
  }

  function setMode(mode: ThemeMode) {
    settings.mode = mode
  }

  function setPreset(presetId: ThemePresetId) {
    const preset = getThemePreset(presetId)
    settings.presetId = preset.id
    settings.accentColor = preset.accentColor
    settings.radius = preset.radius
    settings.chartPalette = [...preset.chartPalette]
  }

  function setDensity(density: ThemeDensity) {
    settings.density = density
  }

  function setMotion(motion: ThemeMotion) {
    settings.motion = motion
  }

  function setAccentColor(color: string) {
    settings.accentColor = color
  }

  function setRadius(radius: number) {
    settings.radius = Math.min(Math.max(radius, 4), 12)
  }

  function resetTheme() {
    Object.assign(settings, cloneDefaultSettings())
  }

  watch(cssVars, applyCssVars, { immediate: true })
  watch(
    settings,
    (value) => {
      saveSettings(value)

      if (typeof document !== "undefined") {
        document.documentElement.dataset.themeMode = activeMode.value
        document.documentElement.dataset.themePreset = value.presetId
        document.documentElement.dataset.density = value.density
        document.documentElement.dataset.motion = value.motion
      }
    },
    { deep: true, immediate: true }
  )
  watch(
    activeMode,
    (value) => {
      if (typeof document !== "undefined") {
        document.documentElement.dataset.themeMode = value
      }
    },
    { immediate: true }
  )

  return {
    settings,
    activeMode,
    activeModeLabel,
    activePreset,
    activeNaiveTheme,
    themeOverrides,
    cssVars,
    chartPalette,
    chartTextColor,
    chartGridColor,
    isDark,
    toggleTheme,
    toggleDensity,
    setMode,
    setPreset,
    setDensity,
    setMotion,
    setAccentColor,
    setRadius,
    resetTheme
  }
})
