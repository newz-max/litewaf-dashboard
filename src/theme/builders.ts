import type { GlobalThemeOverrides } from "naive-ui"
import type { ThemeSettings, ThemeSurfaceTokens } from "./presets"
import {
  fallbackAccentColor,
  mixNaiveColor,
  normalizeAccentColor,
  toCssColorMix,
  transparentMix
} from "./color"

const unsafeNaiveTokenExpressions = [
  "color-mix(",
  "linear-gradient(",
  "radial-gradient(",
  "var("
]

export function assertNaiveThemeOverridesSafe(overrides: GlobalThemeOverrides) {
  const visit = (value: unknown, path: string): void => {
    if (typeof value === "string") {
      const matched = unsafeNaiveTokenExpressions.find((expression) => value.includes(expression))

      if (matched) {
        throw new Error(`Unsafe Naive UI theme token at ${path}: contains ${matched}`)
      }

      return
    }

    if (!value || typeof value !== "object") {
      return
    }

    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      visit(nestedValue, path ? `${path}.${key}` : key)
    })
  }

  visit(overrides, "")
}

export function buildNaiveThemeOverrides(
  tokens: ThemeSurfaceTokens,
  settings: ThemeSettings
): GlobalThemeOverrides {
  const accentColor = normalizeAccentColor(settings.accentColor, fallbackAccentColor)

  return {
    common: {
      primaryColor: accentColor,
      primaryColorHover: tokens.accentStrong,
      primaryColorPressed: tokens.accentStrong,
      primaryColorSuppl: accentColor,
      hoverColor: transparentMix(accentColor, 12),
      pressedColor: transparentMix(accentColor, 16),
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
      color: transparentMix(tokens.panelMuted, 86),
      colorHover: mixNaiveColor(accentColor, 16, tokens.panelMuted),
      colorPressed: mixNaiveColor(accentColor, 22, tokens.panelMuted),
      colorFocus: mixNaiveColor(accentColor, 16, tokens.panelMuted),
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
      closeColorHover: transparentMix(accentColor, 12),
      closeColorPressed: transparentMix(accentColor, 18)
    },
    DataTable: {
      borderRadius: "6px",
      thColor: tokens.panelMuted,
      tdColor: tokens.panel,
      tdColorHover: mixNaiveColor(accentColor, 8, tokens.panel),
      borderColor: tokens.border,
      thTextColor: tokens.textMuted,
      tdTextColor: tokens.text
    },
    Scrollbar: {
      width: "8px",
      height: "8px",
      borderRadius: "999px",
      color: transparentMix(accentColor, 38),
      colorHover: transparentMix(accentColor, 62),
      railColor: transparentMix(tokens.panelMuted, 42),
      railInsetHorizontalBottom: "2px 4px",
      railInsetHorizontalTop: "2px 4px",
      railInsetVerticalRight: "4px 2px",
      railInsetVerticalLeft: "4px 2px"
    },
    Alert: {
      borderRadius: "6px",
      color: mixNaiveColor(tokens.panelMuted, 94, tokens.panel),
      colorInfo: mixNaiveColor(tokens.info, 10, tokens.panel),
      colorSuccess: mixNaiveColor(tokens.success, 10, tokens.panel),
      colorWarning: mixNaiveColor(tokens.warning, 12, tokens.panel),
      colorError: mixNaiveColor(tokens.danger, 12, tokens.panel),
      borderColor: tokens.border,
      borderInfo: `1px solid ${mixNaiveColor(tokens.info, 42, tokens.border)}`,
      borderSuccess: `1px solid ${mixNaiveColor(tokens.success, 42, tokens.border)}`,
      borderWarning: `1px solid ${mixNaiveColor(tokens.warning, 42, tokens.border)}`,
      borderError: `1px solid ${mixNaiveColor(tokens.danger, 42, tokens.border)}`,
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
      borderFocus: `1px solid ${accentColor}`
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
          borderFocus: `1px solid ${accentColor}`
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
          borderFocus: `1px solid ${accentColor}`
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
      buttonColorActive: mixNaiveColor(accentColor, 20, tokens.panel),
      buttonBorderColor: tokens.border,
      buttonBorderColorActive: accentColor
    },
    Switch: {
      textColor: tokens.text,
      railColor: tokens.panelMuted,
      railColorActive: accentColor,
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
          borderActive: `1px solid ${accentColor}`,
          borderFocus: `1px solid ${accentColor}`,
          arrowColor: tokens.textMuted
        },
        InternalSelectMenu: {
          color: tokens.panel,
          optionTextColor: tokens.text,
          optionTextColorPressed: tokens.accentStrong,
          optionTextColorActive: accentColor,
          optionTextColorDisabled: tokens.textSubtle,
          optionColorPending: transparentMix(accentColor, 10),
          optionColorActive: transparentMix(accentColor, 14),
          optionColorActivePending: transparentMix(accentColor, 18),
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
          borderFocus: `1px solid ${accentColor}`
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
      itemIconColorActive: accentColor,
      itemColorHover: transparentMix(accentColor, 11),
      itemColorActive: transparentMix(accentColor, 18),
      itemColorActiveHover: transparentMix(accentColor, 22),
      itemBorderRadius: "6px"
    },
    Tabs: {
      colorSegment: tokens.panelMuted,
      tabColor: tokens.panel,
      tabColorSegment: mixNaiveColor(accentColor, 16, tokens.panel),
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
      barColor: accentColor,
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
      color: transparentMix(tokens.panelMuted, 88),
      textColor: tokens.text,
      border: `1px solid ${tokens.border}`,
      colorCheckable: "transparent",
      colorChecked: transparentMix(accentColor, 18),
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

export function buildBrowserCssVars(tokens: ThemeSurfaceTokens, settings: ThemeSettings) {
  const densityY = settings.density === "compact" ? "10px" : "16px"
  const contentPadding = settings.density === "compact" ? "14px" : "20px"
  const accentColor = normalizeAccentColor(settings.accentColor, fallbackAccentColor)
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
    "--lw-accent": accentColor,
    "--lw-accent-strong": tokens.accentStrong,
    "--lw-success": tokens.success,
    "--lw-danger": tokens.danger,
    "--lw-warning": tokens.warning,
    "--lw-info": tokens.info,
    "--lw-header": tokens.header,
    "--lw-sider": tokens.sider,
    "--lw-shell-bg": `linear-gradient(180deg, ${tokens.bgElevated} 0%, ${tokens.bg} 52%, ${toCssColorMix(tokens.bg, 88, tokens.sider)} 100%)`,
    "--lw-shell-sider": `linear-gradient(180deg, ${toCssColorMix(tokens.sider, 90, tokens.panelMuted)} 0%, ${tokens.sider} 62%, ${toCssColorMix(tokens.sider, 86, tokens.bg)} 100%)`,
    "--lw-shell-header": `linear-gradient(180deg, ${toCssColorMix(tokens.header, 94, tokens.panel)}, ${toCssColorMix(tokens.header, 88, tokens.bg)})`,
    "--lw-shell-content": `linear-gradient(180deg, ${tokens.bgElevated} 0%, ${tokens.bg} 48%, ${toCssColorMix(tokens.bg, 92, tokens.panelMuted)} 100%)`,
    "--lw-shell-border": toCssColorMix(tokens.border, 74, "transparent"),
    "--lw-shell-surface": toCssColorMix(tokens.panelMuted, 82, "transparent"),
    "--lw-radius": `${settings.radius}px`,
    "--lw-shadow": tokens.shadow,
    "--lw-density-y": densityY,
    "--lw-content-padding": contentPadding,
    "--lw-chart-text": tokens.text,
    "--lw-chart-grid": tokens.border,
    ...chartVars
  }
}

export const buildThemeOverrides = buildNaiveThemeOverrides
export const buildCssVars = buildBrowserCssVars
