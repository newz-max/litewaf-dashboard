type Translate = (key: string, values?: Record<string, unknown>) => string

export type PathMatchMode = "exact" | "prefix" | "glob"

export function pathMatchOptions(t: Translate) {
  return [
    { label: t("common.exact"), value: "exact" },
    { label: t("common.prefix"), value: "prefix" },
    { label: "Glob", value: "glob" }
  ] satisfies Array<{ label: string; value: PathMatchMode }>
}

export function formatPathMatch(value: string | undefined, t: Translate) {
  const labels: Record<string, string> = {
    exact: t("common.exact"),
    prefix: t("common.prefix"),
    glob: "Glob"
  }
  return labels[value || ""] ?? value ?? ""
}

export function validateGlobPath(path: string, pathMatch: string | undefined, t: Translate) {
  if (pathMatch !== "glob") {
    return ""
  }
  if (path.includes("**") || path.includes("\\") || /[\[\]{}]/.test(path)) {
    return t("modules.cc.globPathInvalid")
  }
  return ""
}
