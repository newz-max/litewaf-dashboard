import { createServer } from "vite"

const browserOnlyExpressions = [
  "color-mix(",
  "linear-gradient("
]

const server = await createServer({
  configFile: false,
  optimizeDeps: {
    noDiscovery: true
  },
  server: {
    middlewareMode: true
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
})

try {
  const builders = await server.ssrLoadModule("/src/theme/builders.ts")
  const presets = await server.ssrLoadModule("/src/theme/presets.ts")
  const modes = ["light", "dark"]

  function buildSettings(overrides = {}) {
    return {
      ...presets.defaultThemeSettings,
      ...overrides,
      chartPalette: [...(overrides.chartPalette ?? presets.defaultThemeSettings.chartPalette)]
    }
  }

  for (const preset of presets.themePresets) {
    for (const mode of modes) {
      const settings = buildSettings({
        presetId: preset.id,
        accentColor: preset.accentColor,
        radius: preset.radius,
        chartPalette: preset.chartPalette
      })
      const tokens = preset[mode]
      const overrides = builders.buildNaiveThemeOverrides(tokens, settings)
      const cssVars = builders.buildBrowserCssVars(tokens, settings)
      const cssVarValues = Object.values(cssVars).join("\n")

      builders.assertNaiveThemeOverridesSafe(overrides)

      if (!browserOnlyExpressions.every((expression) => cssVarValues.includes(expression))) {
        throw new Error(`Browser CSS vars lost expected CSS expressions for ${preset.id}/${mode}`)
      }
    }
  }

  const invalidAccentPreset = presets.themePresets[0]
  const invalidAccentSettings = buildSettings({
    presetId: invalidAccentPreset.id,
    accentColor: "color-mix(in srgb, red 50%, blue)",
    radius: invalidAccentPreset.radius,
    chartPalette: invalidAccentPreset.chartPalette
  })

  builders.assertNaiveThemeOverridesSafe(
    builders.buildNaiveThemeOverrides(invalidAccentPreset.light, invalidAccentSettings)
  )

  console.log(`Theme safety check passed for ${presets.themePresets.length} presets, ${modes.length} modes, and invalid accent fallback.`)
} finally {
  await server.close()
}
