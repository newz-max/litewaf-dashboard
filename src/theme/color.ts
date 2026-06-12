export interface ParsedColor {
  red: number
  green: number
  blue: number
  alpha: number
}

export const fallbackAccentColor = "#2f7cff"

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function normalizeChannel(value: number) {
  return Math.round(clampNumber(value, 0, 255))
}

export function normalizeAlpha(value: number) {
  return Number(clampNumber(value, 0, 1).toFixed(3))
}

export function parseColor(color: string): ParsedColor | null {
  const value = color.trim()
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)

  if (hex) {
    const raw = hex[1]
    const normalized = raw.length === 3
      ? raw.split("").map((part) => part + part).join("")
      : raw

    return {
      red: parseInt(normalized.slice(0, 2), 16),
      green: parseInt(normalized.slice(2, 4), 16),
      blue: parseInt(normalized.slice(4, 6), 16),
      alpha: 1
    }
  }

  const rgb = value.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i)

  if (!rgb) {
    return null
  }

  const red = Number(rgb[1])
  const green = Number(rgb[2])
  const blue = Number(rgb[3])
  const alpha = rgb[4] === undefined ? 1 : Number(rgb[4])

  if (
    !Number.isFinite(red) ||
    !Number.isFinite(green) ||
    !Number.isFinite(blue) ||
    !Number.isFinite(alpha) ||
    red < 0 ||
    red > 255 ||
    green < 0 ||
    green > 255 ||
    blue < 0 ||
    blue > 255 ||
    alpha < 0 ||
    alpha > 1
  ) {
    return null
  }

  return {
    red: normalizeChannel(red),
    green: normalizeChannel(green),
    blue: normalizeChannel(blue),
    alpha: normalizeAlpha(alpha)
  }
}

export function isValidNaiveColorToken(color: string) {
  return parseColor(color) !== null
}

export function normalizeAccentColor(color: string, fallback = fallbackAccentColor) {
  const value = color.trim()

  return isValidNaiveColorToken(value) ? value : fallback
}

export function safeColor(color: string, fallback = fallbackAccentColor): ParsedColor {
  return parseColor(color) ?? parseColor(fallback) ?? {
    red: 47,
    green: 124,
    blue: 255,
    alpha: 1
  }
}

export function toNaiveRgba(color: ParsedColor, alpha = color.alpha) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${normalizeAlpha(alpha)})`
}

export function transparentMix(color: string, percent: number) {
  return toNaiveRgba(safeColor(color), percent / 100)
}

export function mixNaiveColor(foreground: string, percent: number, background: string) {
  const foregroundColor = safeColor(foreground)
  const backgroundColor = safeColor(background)
  const ratio = clampNumber(percent / 100, 0, 1)
  const inverseRatio = 1 - ratio

  return toNaiveRgba({
    red: normalizeChannel(foregroundColor.red * ratio + backgroundColor.red * inverseRatio),
    green: normalizeChannel(foregroundColor.green * ratio + backgroundColor.green * inverseRatio),
    blue: normalizeChannel(foregroundColor.blue * ratio + backgroundColor.blue * inverseRatio),
    alpha: normalizeAlpha(foregroundColor.alpha * ratio + backgroundColor.alpha * inverseRatio)
  })
}

export function toCssColorMix(foreground: string, percent: number, background: string) {
  return `color-mix(in srgb, ${foreground} ${percent}%, ${background})`
}
