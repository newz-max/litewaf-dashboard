import type { GlobalThemeOverrides } from "naive-ui"

export type ThemeMode = "system" | "light" | "dark"
export type ResolvedThemeMode = "light" | "dark"
export type ThemePresetId = "litewaf-default" | "safeline-inspired" | "high-contrast" | "compact-ops"
export type ThemeDensity = "comfortable" | "compact"
export type ThemeMotion = "on" | "reduced"

export interface ThemeSettings {
  mode: ThemeMode
  presetId: ThemePresetId
  density: ThemeDensity
  accentColor: string
  radius: number
  motion: ThemeMotion
  chartPalette: string[]
}

export interface ThemeSurfaceTokens {
  bg: string
  bgElevated: string
  panel: string
  panelMuted: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  textSubtle: string
  header: string
  sider: string
  shadow: string
  accentStrong: string
  success: string
  warning: string
  danger: string
  info: string
}

export interface ThemePreset {
  id: ThemePresetId
  label: string
  description: string
  accentColor: string
  radius: number
  chartPalette: string[]
  light: ThemeSurfaceTokens
  dark: ThemeSurfaceTokens
}

export const themePresets: ThemePreset[] = [
  {
    id: "litewaf-default",
    label: "LiteWaf 清爽",
    description: "接近当前产品色，适合日常配置和文档截图。",
    accentColor: "#0f766e",
    radius: 8,
    chartPalette: ["#0f766e", "#2563eb", "#b7791f", "#b42318", "#6d5dfc", "#0891b2"],
    light: {
      bg: "#eef2f3",
      bgElevated: "#f8fbfb",
      panel: "#ffffff",
      panelMuted: "#f6f8f8",
      border: "#d9e1df",
      borderStrong: "#aec0bc",
      text: "#10201d",
      textMuted: "#63736f",
      textSubtle: "#879591",
      header: "rgba(255, 255, 255, 0.86)",
      sider: "#ffffff",
      shadow: "0 18px 42px rgba(15, 35, 31, 0.08)",
      accentStrong: "#0b4f4a",
      success: "#16a34a",
      warning: "#b7791f",
      danger: "#b42318",
      info: "#2563eb"
    },
    dark: {
      bg: "#08110f",
      bgElevated: "#0d1917",
      panel: "#101d1a",
      panelMuted: "#132521",
      border: "#24413b",
      borderStrong: "#3a5d55",
      text: "#e7f5f1",
      textMuted: "#9cb8b2",
      textSubtle: "#6f8c86",
      header: "rgba(12, 25, 22, 0.86)",
      sider: "#0b1714",
      shadow: "0 22px 58px rgba(0, 0, 0, 0.32)",
      accentStrong: "#2dd4bf",
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#f97373",
      info: "#60a5fa"
    }
  },
  {
    id: "safeline-inspired",
    label: "安全运营深色",
    description: "面向态势大屏和规则运营，参考雷池的深色安全产品气质。",
    accentColor: "#19d3b5",
    radius: 8,
    chartPalette: ["#19d3b5", "#4f8cff", "#f6c85f", "#ff6b6b", "#64d2ff", "#7dd87d"],
    light: {
      bg: "#edf5f4",
      bgElevated: "#f6fbfa",
      panel: "#ffffff",
      panelMuted: "#f1f7f6",
      border: "#cfe0dd",
      borderStrong: "#9fb9b4",
      text: "#11231f",
      textMuted: "#5d736f",
      textSubtle: "#839690",
      header: "rgba(248, 253, 252, 0.9)",
      sider: "#f8fdfc",
      shadow: "0 18px 44px rgba(12, 47, 41, 0.1)",
      accentStrong: "#0f8d7c",
      success: "#12a150",
      warning: "#b98214",
      danger: "#cf3d3d",
      info: "#2563eb"
    },
    dark: {
      bg: "#060d10",
      bgElevated: "#09171b",
      panel: "#0d1f24",
      panelMuted: "#102a30",
      border: "#1e454d",
      borderStrong: "#326470",
      text: "#e8fbff",
      textMuted: "#9dc4c9",
      textSubtle: "#6f969d",
      header: "rgba(8, 21, 25, 0.88)",
      sider: "#071216",
      shadow: "0 24px 64px rgba(0, 0, 0, 0.42)",
      accentStrong: "#5eead4",
      success: "#34d399",
      warning: "#fbbf24",
      danger: "#fb7185",
      info: "#60a5fa"
    }
  },
  {
    id: "high-contrast",
    label: "高对比",
    description: "强化边框和文字对比，适合长时间日志排查。",
    accentColor: "#2563eb",
    radius: 6,
    chartPalette: ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"],
    light: {
      bg: "#f4f6f8",
      bgElevated: "#ffffff",
      panel: "#ffffff",
      panelMuted: "#eef2f7",
      border: "#c4ccd8",
      borderStrong: "#7a8798",
      text: "#0b1220",
      textMuted: "#475569",
      textSubtle: "#64748b",
      header: "rgba(255, 255, 255, 0.94)",
      sider: "#f8fafc",
      shadow: "0 16px 36px rgba(15, 23, 42, 0.1)",
      accentStrong: "#1d4ed8",
      success: "#15803d",
      warning: "#a16207",
      danger: "#b91c1c",
      info: "#2563eb"
    },
    dark: {
      bg: "#05070b",
      bgElevated: "#0a0f18",
      panel: "#101826",
      panelMuted: "#162235",
      border: "#334155",
      borderStrong: "#64748b",
      text: "#f8fafc",
      textMuted: "#cbd5e1",
      textSubtle: "#94a3b8",
      header: "rgba(10, 15, 24, 0.92)",
      sider: "#070b12",
      shadow: "0 22px 60px rgba(0, 0, 0, 0.46)",
      accentStrong: "#93c5fd",
      success: "#4ade80",
      warning: "#facc15",
      danger: "#f87171",
      info: "#93c5fd"
    }
  },
  {
    id: "compact-ops",
    label: "紧凑运营",
    description: "减少留白，提高规则、日志和表单页面的信息密度。",
    accentColor: "#0ea5e9",
    radius: 6,
    chartPalette: ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#8b5cf6"],
    light: {
      bg: "#edf2f7",
      bgElevated: "#f8fafc",
      panel: "#ffffff",
      panelMuted: "#f1f5f9",
      border: "#d4dde8",
      borderStrong: "#a8b6c8",
      text: "#111827",
      textMuted: "#536171",
      textSubtle: "#778493",
      header: "rgba(248, 250, 252, 0.9)",
      sider: "#f8fafc",
      shadow: "0 14px 34px rgba(17, 24, 39, 0.08)",
      accentStrong: "#0369a1",
      success: "#059669",
      warning: "#d97706",
      danger: "#dc2626",
      info: "#0284c7"
    },
    dark: {
      bg: "#071018",
      bgElevated: "#0b1721",
      panel: "#111f2c",
      panelMuted: "#142637",
      border: "#274157",
      borderStrong: "#3c6380",
      text: "#eef6fb",
      textMuted: "#a8becd",
      textSubtle: "#7d94a4",
      header: "rgba(10, 23, 33, 0.9)",
      sider: "#09131c",
      shadow: "0 22px 58px rgba(0, 0, 0, 0.36)",
      accentStrong: "#7dd3fc",
      success: "#34d399",
      warning: "#fbbf24",
      danger: "#f87171",
      info: "#7dd3fc"
    }
  }
]

export const defaultThemeSettings: ThemeSettings = {
  mode: "system",
  presetId: "safeline-inspired",
  density: "comfortable",
  accentColor: "#19d3b5",
  radius: 8,
  motion: "on",
  chartPalette: ["#19d3b5", "#4f8cff", "#f6c85f", "#ff6b6b", "#64d2ff", "#7dd87d"]
}

export function getThemePreset(id: ThemePresetId) {
  return themePresets.find((preset) => preset.id === id) ?? themePresets[0]
}

export function buildThemeOverrides(
  tokens: ThemeSurfaceTokens,
  settings: ThemeSettings
): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: settings.accentColor,
      primaryColorHover: tokens.accentStrong,
      primaryColorPressed: tokens.accentStrong,
      primaryColorSuppl: settings.accentColor,
      infoColor: tokens.info,
      successColor: tokens.success,
      warningColor: tokens.warning,
      errorColor: tokens.danger,
      bodyColor: tokens.bg,
      cardColor: tokens.panel,
      modalColor: tokens.panel,
      popoverColor: tokens.panel,
      tableColor: tokens.panel,
      borderColor: tokens.border,
      dividerColor: tokens.border,
      textColorBase: tokens.text,
      borderRadius: `${settings.radius}px`
    },
    Button: {
      borderRadiusMedium: `${settings.radius}px`,
      borderRadiusLarge: `${settings.radius}px`
    },
    Card: {
      borderRadius: `${settings.radius}px`
    },
    DataTable: {
      borderRadius: `${settings.radius}px`,
      thColor: tokens.panelMuted,
      tdColor: tokens.panel,
      borderColor: tokens.border
    },
    Select: {
      peers: {
        InternalSelection: {
          textColor: tokens.text,
          placeholderColor: tokens.textSubtle,
          color: tokens.panel,
          colorActive: tokens.panel,
          border: `1px solid ${tokens.border}`,
          borderHover: `1px solid ${tokens.borderStrong}`,
          borderActive: `1px solid ${settings.accentColor}`,
          borderFocus: `1px solid ${settings.accentColor}`,
          arrowColor: tokens.textMuted
        },
        InternalSelectMenu: {
          color: tokens.panel,
          optionTextColor: tokens.text,
          optionTextColorPressed: tokens.accentStrong,
          optionTextColorActive: settings.accentColor,
          optionTextColorDisabled: tokens.textSubtle,
          optionColorPending: `color-mix(in srgb, ${settings.accentColor} 10%, transparent)`,
          optionColorActive: `color-mix(in srgb, ${settings.accentColor} 14%, transparent)`,
          optionColorActivePending: `color-mix(in srgb, ${settings.accentColor} 18%, transparent)`,
          groupHeaderTextColor: tokens.textMuted,
          actionTextColor: tokens.text
        }
      }
    },
    Menu: {
      itemBorderRadius: `${settings.radius}px`
    }
  }
}

export function buildCssVars(tokens: ThemeSurfaceTokens, settings: ThemeSettings) {
  const densityY = settings.density === "compact" ? "10px" : "16px"
  const contentPadding = settings.density === "compact" ? "14px" : "20px"
  const chartVars = settings.chartPalette.reduce<Record<string, string>>((vars, color, index) => {
    vars[`--lw-chart-${index + 1}`] = color
    return vars
  }, {})

  return {
    "--lw-bg": tokens.bg,
    "--lw-bg-elevated": tokens.bgElevated,
    "--lw-panel": tokens.panel,
    "--lw-panel-muted": tokens.panelMuted,
    "--lw-border": tokens.border,
    "--lw-border-strong": tokens.borderStrong,
    "--lw-text": tokens.text,
    "--lw-text-muted": tokens.textMuted,
    "--lw-text-subtle": tokens.textSubtle,
    "--lw-accent": settings.accentColor,
    "--lw-accent-strong": tokens.accentStrong,
    "--lw-success": tokens.success,
    "--lw-danger": tokens.danger,
    "--lw-warning": tokens.warning,
    "--lw-info": tokens.info,
    "--lw-header": tokens.header,
    "--lw-sider": tokens.sider,
    "--lw-radius": `${settings.radius}px`,
    "--lw-shadow": tokens.shadow,
    "--lw-density-y": densityY,
    "--lw-content-padding": contentPadding,
    "--lw-chart-text": tokens.text,
    "--lw-chart-grid": tokens.border,
    ...chartVars
  }
}
