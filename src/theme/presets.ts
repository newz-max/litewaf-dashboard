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
      panel: "#f7fbfa",
      panelMuted: "#edf4f2",
      border: "#d9e1df",
      borderStrong: "#aec0bc",
      text: "#10201d",
      textMuted: "#4f625e",
      textSubtle: "#687a76",
      header: "rgba(247, 251, 250, 0.9)",
      sider: "#f7fbfa",
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
    label: "蓝盾态势",
    description: "面向安全态势和规则运营的深蓝科技风格。",
    accentColor: "#2f7cff",
    radius: 8,
    chartPalette: ["#2f7cff", "#16d6c4", "#ff8a3d", "#ff4f92", "#7c5cff", "#5bc0ff"],
    light: {
      bg: "#eaf2f8",
      bgElevated: "#f3f8fb",
      panel: "#f5faff",
      panelMuted: "#e8f1fb",
      border: "#c5d8ea",
      borderStrong: "#7da7d5",
      text: "#0b1f35",
      textMuted: "#425a72",
      textSubtle: "#5f7892",
      header: "rgba(245, 250, 255, 0.92)",
      sider: "#edf5fc",
      shadow: "0 18px 44px rgba(17, 58, 104, 0.12)",
      accentStrong: "#1b5fc4",
      success: "#12a150",
      warning: "#b98214",
      danger: "#cf3d3d",
      info: "#2563eb"
    },
    dark: {
      bg: "#010613",
      bgElevated: "#020b1f",
      panel: "#051738",
      panelMuted: "#071f49",
      border: "#1b56b8",
      borderStrong: "#2c7dff",
      text: "#f3f8ff",
      textMuted: "#a9bade",
      textSubtle: "#7186b3",
      header: "rgba(2, 8, 22, 0.9)",
      sider: "#01081a",
      shadow: "0 18px 42px rgba(0, 48, 132, 0.16)",
      accentStrong: "#70b4ff",
      success: "#16d6c4",
      warning: "#ffcf57",
      danger: "#ff4f92",
      info: "#2f7cff"
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
      bgElevated: "#f8fafc",
      panel: "#f8fafc",
      panelMuted: "#eef2f7",
      border: "#c4ccd8",
      borderStrong: "#7a8798",
      text: "#0b1220",
      textMuted: "#475569",
      textSubtle: "#64748b",
      header: "rgba(248, 250, 252, 0.94)",
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
      panel: "#f8fafc",
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
  mode: "dark",
  presetId: "safeline-inspired",
  density: "comfortable",
  accentColor: "#2f7cff",
  radius: 8,
  motion: "on",
  chartPalette: ["#2f7cff", "#16d6c4", "#ff8a3d", "#ff4f92", "#7c5cff", "#5bc0ff"]
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
      hoverColor: `color-mix(in srgb, ${settings.accentColor} 12%, transparent)`,
      pressedColor: `color-mix(in srgb, ${settings.accentColor} 16%, transparent)`,
      infoColor: tokens.info,
      successColor: tokens.success,
      warningColor: tokens.warning,
      errorColor: tokens.danger,
      bodyColor: tokens.bg,
      cardColor: tokens.panel,
      modalColor: tokens.panel,
      popoverColor: tokens.panel,
      tableColor: tokens.panel,
      tableHeaderColor: tokens.panelMuted,
      borderColor: tokens.border,
      dividerColor: tokens.border,
      textColorBase: tokens.text,
      textColor1: tokens.text,
      textColor2: tokens.textMuted,
      textColor3: tokens.textSubtle,
      placeholderColor: tokens.textSubtle,
      iconColor: tokens.textMuted,
      borderRadius: `${settings.radius}px`
    },
    Layout: {
      color: tokens.bg,
      colorEmbedded: tokens.bgElevated,
      headerColor: tokens.header,
      siderColor: tokens.sider,
      textColor: tokens.text,
      headerBorderColor: tokens.border,
      siderBorderColor: tokens.border,
      siderToggleButtonColor: tokens.panelMuted,
      siderToggleButtonIconColor: tokens.text,
      siderToggleButtonBorder: `1px solid ${tokens.borderStrong}`,
      siderToggleBarColor: tokens.textMuted,
      siderToggleBarColorHover: tokens.text
    },
    Button: {
      color: `color-mix(in srgb, ${tokens.panelMuted} 86%, transparent)`,
      colorHover: `color-mix(in srgb, ${settings.accentColor} 16%, ${tokens.panelMuted})`,
      colorPressed: `color-mix(in srgb, ${settings.accentColor} 22%, ${tokens.panelMuted})`,
      colorFocus: `color-mix(in srgb, ${settings.accentColor} 16%, ${tokens.panelMuted})`,
      textColor: tokens.text,
      textColorHover: tokens.text,
      textColorPressed: tokens.text,
      textColorFocus: tokens.text,
      border: `1px solid ${tokens.border}`,
      borderHover: `1px solid ${tokens.borderStrong}`,
      borderPressed: `1px solid ${tokens.borderStrong}`,
      borderFocus: `1px solid ${tokens.borderStrong}`,
      borderRadiusMedium: "6px",
      borderRadiusLarge: "6px"
    },
    Card: {
      color: tokens.panel,
      colorEmbedded: tokens.panelMuted,
      borderColor: tokens.border,
      borderRadius: "6px",
      titleTextColor: tokens.text,
      textColor: tokens.textMuted
    },
    Modal: {
      color: tokens.panel,
      textColor: tokens.text,
      boxShadow: tokens.shadow
    },
    Drawer: {
      color: tokens.panel,
      bodyColor: tokens.panel,
      textColor: tokens.text,
      titleTextColor: tokens.text,
      headerBorderBottom: `1px solid ${tokens.border}`,
      footerBorderTop: `1px solid ${tokens.border}`
    },
    Dialog: {
      color: tokens.panel,
      border: `1px solid ${tokens.border}`,
      titleTextColor: tokens.text,
      textColor: tokens.textMuted,
      closeIconColor: tokens.textMuted,
      closeIconColorHover: tokens.text,
      closeIconColorPressed: tokens.text,
      closeColorHover: `color-mix(in srgb, ${settings.accentColor} 12%, transparent)`,
      closeColorPressed: `color-mix(in srgb, ${settings.accentColor} 18%, transparent)`
    },
    DataTable: {
      borderRadius: "6px",
      thColor: tokens.panelMuted,
      tdColor: tokens.panel,
      tdColorHover: `color-mix(in srgb, ${settings.accentColor} 8%, ${tokens.panel})`,
      borderColor: tokens.border,
      thTextColor: tokens.textMuted,
      tdTextColor: tokens.text
    },
    Scrollbar: {
      width: "8px",
      height: "8px",
      borderRadius: "999px",
      color: `color-mix(in srgb, ${settings.accentColor} 38%, transparent)`,
      colorHover: `color-mix(in srgb, ${settings.accentColor} 62%, transparent)`,
      railColor: `color-mix(in srgb, ${tokens.panelMuted} 42%, transparent)`,
      railInsetHorizontalBottom: "2px 4px",
      railInsetHorizontalTop: "2px 4px",
      railInsetVerticalRight: "4px 2px",
      railInsetVerticalLeft: "4px 2px"
    },
    Alert: {
      borderRadius: "6px",
      color: `color-mix(in srgb, ${tokens.panelMuted} 94%, ${tokens.panel})`,
      colorInfo: `color-mix(in srgb, ${tokens.info} 10%, ${tokens.panel})`,
      colorSuccess: `color-mix(in srgb, ${tokens.success} 10%, ${tokens.panel})`,
      colorWarning: `color-mix(in srgb, ${tokens.warning} 12%, ${tokens.panel})`,
      colorError: `color-mix(in srgb, ${tokens.danger} 12%, ${tokens.panel})`,
      borderColor: tokens.border,
      borderInfo: `1px solid color-mix(in srgb, ${tokens.info} 42%, ${tokens.border})`,
      borderSuccess: `1px solid color-mix(in srgb, ${tokens.success} 42%, ${tokens.border})`,
      borderWarning: `1px solid color-mix(in srgb, ${tokens.warning} 42%, ${tokens.border})`,
      borderError: `1px solid color-mix(in srgb, ${tokens.danger} 42%, ${tokens.border})`,
      titleTextColor: tokens.text,
      contentTextColor: tokens.textMuted
    },
    Empty: {
      textColor: tokens.textMuted,
      iconColor: tokens.textSubtle,
      extraTextColor: tokens.textMuted
    },
    Input: {
      color: tokens.panel,
      colorFocus: tokens.panel,
      colorDisabled: tokens.panelMuted,
      textColor: tokens.text,
      textColorDisabled: tokens.textSubtle,
      placeholderColor: tokens.textSubtle,
      placeholderColorDisabled: tokens.textSubtle,
      border: `1px solid ${tokens.border}`,
      borderHover: `1px solid ${tokens.borderStrong}`,
      borderFocus: `1px solid ${settings.accentColor}`
    },
    InputNumber: {
      peers: {
        Input: {
          color: tokens.panel,
          colorFocus: tokens.panel,
          colorDisabled: tokens.panelMuted,
          textColor: tokens.text,
          textColorDisabled: tokens.textSubtle,
          placeholderColor: tokens.textSubtle,
          placeholderColorDisabled: tokens.textSubtle,
          border: `1px solid ${tokens.border}`,
          borderHover: `1px solid ${tokens.borderStrong}`,
          borderFocus: `1px solid ${settings.accentColor}`
        }
      }
    },
    DatePicker: {
      peers: {
        Input: {
          color: tokens.panel,
          colorFocus: tokens.panel,
          colorDisabled: tokens.panelMuted,
          textColor: tokens.text,
          textColorDisabled: tokens.textSubtle,
          placeholderColor: tokens.textSubtle,
          placeholderColorDisabled: tokens.textSubtle,
          border: `1px solid ${tokens.border}`,
          borderHover: `1px solid ${tokens.borderStrong}`,
          borderFocus: `1px solid ${settings.accentColor}`
        }
      }
    },
    Form: {
      labelTextColor: tokens.text,
      feedbackTextColor: tokens.textMuted,
      feedbackTextColorWarning: tokens.warning,
      feedbackTextColorError: tokens.danger
    },
    Radio: {
      textColor: tokens.text,
      textColorDisabled: tokens.textSubtle,
      buttonTextColor: tokens.text,
      buttonTextColorHover: tokens.text,
      buttonTextColorActive: tokens.text,
      buttonTextColorDisabled: tokens.textSubtle,
      buttonColor: tokens.panel,
      buttonColorActive: `color-mix(in srgb, ${settings.accentColor} 20%, ${tokens.panel})`,
      buttonBorderColor: tokens.border,
      buttonBorderColorActive: settings.accentColor
    },
    Switch: {
      textColor: tokens.text,
      railColor: tokens.panelMuted,
      railColorActive: settings.accentColor,
      buttonColor: tokens.text
    },
    Select: {
      peers: {
        InternalSelection: {
          textColor: tokens.text,
          textColorDisabled: tokens.textSubtle,
          placeholderColor: tokens.textSubtle,
          placeholderColorDisabled: tokens.textSubtle,
          color: tokens.panel,
          colorActive: tokens.panel,
          colorDisabled: tokens.panelMuted,
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
    ColorPicker: {
      textColor: tokens.text,
      panelColor: tokens.panel,
      peers: {
        Input: {
          color: tokens.panel,
          colorFocus: tokens.panel,
          textColor: tokens.text,
          placeholderColor: tokens.textSubtle,
          border: `1px solid ${tokens.border}`,
          borderHover: `1px solid ${tokens.borderStrong}`,
          borderFocus: `1px solid ${settings.accentColor}`
        },
        Button: {
          textColor: tokens.text,
          textColorHover: tokens.text,
          textColorPressed: tokens.text
        }
      }
    },
    Menu: {
      color: "transparent",
      groupTextColor: tokens.textSubtle,
      itemTextColor: tokens.textMuted,
      itemTextColorHover: tokens.text,
      itemTextColorActive: tokens.text,
      itemTextColorActiveHover: tokens.text,
      itemIconColor: tokens.textMuted,
      itemIconColorHover: tokens.text,
      itemIconColorActive: settings.accentColor,
      itemColorHover: `color-mix(in srgb, ${settings.accentColor} 11%, transparent)`,
      itemColorActive: `color-mix(in srgb, ${settings.accentColor} 18%, transparent)`,
      itemColorActiveHover: `color-mix(in srgb, ${settings.accentColor} 22%, transparent)`,
      itemBorderRadius: "6px"
    },
    Tabs: {
      colorSegment: tokens.panelMuted,
      tabColor: tokens.panel,
      tabColorSegment: `color-mix(in srgb, ${settings.accentColor} 16%, ${tokens.panel})`,
      tabBorderColor: tokens.border,
      tabTextColorLine: tokens.textMuted,
      tabTextColorActiveLine: tokens.text,
      tabTextColorHoverLine: tokens.text,
      tabTextColorBar: tokens.textMuted,
      tabTextColorActiveBar: tokens.text,
      tabTextColorHoverBar: tokens.text,
      tabTextColorCard: tokens.textMuted,
      tabTextColorActiveCard: tokens.text,
      tabTextColorHoverCard: tokens.text,
      tabTextColorSegment: tokens.textMuted,
      tabTextColorActiveSegment: tokens.text,
      tabTextColorHoverSegment: tokens.text,
      paneTextColor: tokens.text,
      barColor: settings.accentColor,
      closeIconColor: tokens.textMuted,
      closeIconColorHover: tokens.text
    },
    Descriptions: {
      titleTextColor: tokens.text,
      thColor: tokens.panelMuted,
      thColorModal: tokens.panelMuted,
      thColorPopover: tokens.panelMuted,
      thTextColor: tokens.text,
      tdColor: tokens.panel,
      tdColorModal: tokens.panel,
      tdColorPopover: tokens.panel,
      tdTextColor: tokens.textMuted,
      borderColor: tokens.border,
      borderColorModal: tokens.border,
      borderColorPopover: tokens.border
    },
    List: {
      color: "transparent",
      textColor: tokens.text,
      borderColor: tokens.border
    },
    Statistic: {
      labelTextColor: tokens.textMuted,
      valueTextColor: tokens.text,
      valuePrefixTextColor: tokens.text,
      valueSuffixTextColor: tokens.textMuted
    },
    Tag: {
      borderRadius: "5px",
      color: `color-mix(in srgb, ${tokens.panelMuted} 88%, transparent)`,
      textColor: tokens.text,
      border: `1px solid ${tokens.border}`,
      colorCheckable: "transparent",
      colorChecked: `color-mix(in srgb, ${settings.accentColor} 18%, transparent)`,
      textColorCheckable: tokens.textMuted,
      textColorHoverCheckable: tokens.text,
      textColorPressedCheckable: tokens.text,
      textColorChecked: tokens.text
    },
    Tooltip: {
      color: tokens.panelMuted,
      textColor: tokens.text,
      boxShadow: tokens.shadow
    },
    Code: {
      textColor: tokens.text,
      lineNumberTextColor: tokens.textSubtle
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
