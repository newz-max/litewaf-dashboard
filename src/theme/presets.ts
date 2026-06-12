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
    label: "LiteWaf Fresh",
    description: "Close to the current product colors, suitable for daily configuration and documentation screenshots.",
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
    label: "Blue Shield Posture",
    description: "A deep-blue technical style for security posture and rule operations.",
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
    label: "High Contrast",
    description: "Strengthens borders and text contrast for long log-investigation sessions.",
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
    label: "Compact Operations",
    description: "Reduces whitespace and increases information density on rules, logs, and form pages.",
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
