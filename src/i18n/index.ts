import { createI18n } from "vue-i18n"
import zhCN from "@/locales/zh-CN"
import enUS from "@/locales/en-US"

export type LocaleCode = "zh-CN" | "en-US"
export type MessageSchema = typeof zhCN

export interface LocaleOption {
  label: string
  shortLabel: string
  value: LocaleCode
}

export const defaultLocale: LocaleCode = "zh-CN"
export const fallbackLocale: LocaleCode = "zh-CN"
export const localeStorageKey = "litewaf.locale.v1"

export const supportedLocales: readonly LocaleOption[] = [
  { label: "简体中文", shortLabel: "中", value: "zh-CN" },
  { label: "English", shortLabel: "EN", value: "en-US" }
]

export const messages: Record<LocaleCode, MessageSchema> = {
  "zh-CN": zhCN,
  "en-US": enUS
}

export function isSupportedLocale(value: unknown): value is LocaleCode {
  return typeof value === "string" && supportedLocales.some((locale) => locale.value === value)
}

export function getStoredLocale(): LocaleCode {
  if (typeof window === "undefined") {
    return defaultLocale
  }
  try {
    const stored = window.localStorage.getItem(localeStorageKey)
    if (isSupportedLocale(stored)) {
      return stored
    }
    window.localStorage.setItem(localeStorageKey, defaultLocale)
  } catch {
    // Keep SSR/privacy-restricted storage paths usable by falling back in memory.
  }
  return defaultLocale
}

export function persistLocale(locale: LocaleCode) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(localeStorageKey, locale)
  }
}

export const i18n = createI18n<[MessageSchema], LocaleCode>({
  legacy: false,
  globalInjection: true,
  locale: getStoredLocale(),
  fallbackLocale,
  messages
})

function readGlobalLocale(): unknown {
  const current = i18n.global.locale as unknown
  if (current && typeof current === "object" && "value" in current) {
    return (current as { value: unknown }).value
  }
  return current
}

function writeGlobalLocale(locale: LocaleCode) {
  const current = i18n.global.locale as unknown
  if (current && typeof current === "object" && "value" in current) {
    ;(current as { value: LocaleCode }).value = locale
    return
  }
  ;(i18n.global as unknown as { locale: LocaleCode }).locale = locale
}

export function setLocale(locale: LocaleCode) {
  if (!isSupportedLocale(locale)) {
    return
  }
  writeGlobalLocale(locale)
  persistLocale(locale)
}

export function getActiveLocale(): LocaleCode {
  const locale = readGlobalLocale()
  return isSupportedLocale(locale) ? locale : defaultLocale
}

export function getLocaleOption(locale: LocaleCode) {
  return supportedLocales.find((option) => option.value === locale) ?? supportedLocales[0]
}
