import type { ProtectionRuleInput } from "@/api/litewaf"

export interface ProtectionGuideItem {
  title: string
  description: string
}

export interface ProtectionRiskPrompt {
  message: string
  scope: string
  action: string
  impact: string
  recommendation: string
}

type Translate = (key: string, values?: Record<string, unknown>) => string

const guideKeys: Record<string, readonly string[]> = {
  "cc-protection": ["cc.loginBruteforce", "cc.apiRateLimit", "cc.advancedCounters"],
  "access-control": ["access.narrowAllow", "access.adminPath", "access.headerHost"],
  "upload-protection": ["upload.dangerousExtensions", "upload.sizeLimit", "upload.methodScope"],
  "bot-protection": ["bot.challengeRollout", "bot.enhancements", "bot.searchEngineBypass"],
  "dynamic-protection": ["dynamic.dynamicToken", "dynamic.pageMutation", "dynamic.waitingRoom"]
}

export function protectionGuides(t: Translate, module: string): ProtectionGuideItem[] {
  return (guideKeys[module] ?? []).map((key) => ({
    title: t(`protectionGuidance.guides.${key}.title`),
    description: t(`protectionGuidance.guides.${key}.description`)
  }))
}

export function protectionRiskPrompts(rule: ProtectionRuleInput, t: Translate): ProtectionRiskPrompt[] {
  if (!rule.enabled) {
    return []
  }
  switch (rule.module) {
    case "cc-protection":
      return ccRiskPrompts(rule, t)
    case "access-control":
      return accessRiskPrompts(rule, t)
    case "upload-protection":
      return uploadRiskPrompts(rule, t)
    case "bot-protection":
      return botRiskPrompts(rule, t)
    case "dynamic-protection":
      return dynamicRiskPrompts(rule, t)
    default:
      return []
  }
}

export function riskPromptText(prompt: ProtectionRiskPrompt, t: Translate) {
  return t("protectionGuidance.riskText", {
    message: prompt.message,
    scope: prompt.scope,
    impact: prompt.impact,
    recommendation: prompt.recommendation
  })
}

function ccRiskPrompts(rule: ProtectionRuleInput, t: Translate): ProtectionRiskPrompt[] {
  const blocking = ["block", "ban", "rate-limit"].includes(rule.action.type)
  const lowThreshold = Number(rule.limit.threshold) > 0 && Number(rule.limit.threshold) < 60 && Number(rule.limit.window_sec) <= 60
  if (!blocking || !lowThreshold || !isBroadPath(rule.match.path, rule.match.path_match)) {
    return []
  }
  return [
    prompt(
      t("protectionGuidance.risks.ccLowThreshold.message"),
      pathScope(rule, t),
      rule.action.type,
      t("protectionGuidance.risks.ccLowThreshold.impact"),
      t("protectionGuidance.risks.ccLowThreshold.recommendation")
    )
  ]
}

function accessRiskPrompts(rule: ProtectionRuleInput, t: Translate): ProtectionRiskPrompt[] {
  const prompts: ProtectionRiskPrompt[] = []
  if (rule.action.type === "allow" && (isBroadAccessSource(rule) || isBroadPath(rule.match.path, rule.match.path_match))) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.broadAccessAllow.message"),
        accessScope(rule, t),
        rule.action.type,
        t("protectionGuidance.risks.broadAccessAllow.impact"),
        t("protectionGuidance.risks.broadAccessAllow.recommendation")
      )
    )
  }
  if (rule.action.type === "block" && isBroadAccessScope(rule)) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.broadAccessBlock.message"),
        accessScope(rule, t),
        rule.action.type,
        t("protectionGuidance.risks.broadAccessBlock.impact"),
        t("protectionGuidance.risks.broadAccessBlock.recommendation")
      )
    )
  }
  return prompts
}

function uploadRiskPrompts(rule: ProtectionRuleInput, t: Translate): ProtectionRiskPrompt[] {
  if (rule.action.type !== "block") {
    return []
  }
  const prompts: ProtectionRiskPrompt[] = []
  const maxBytes = Number(rule.upload?.max_bytes ?? 0)
  if (isBroadPath(rule.match.path, rule.match.path_match) || ((rule.upload?.extensions ?? []).length === 0 && maxBytes === 0)) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.broadUploadBlock.message"),
        uploadScope(rule, t),
        rule.action.type,
        t("protectionGuidance.risks.broadUploadBlock.impact"),
        t("protectionGuidance.risks.broadUploadBlock.recommendation")
      )
    )
  }
  if (maxBytes > 0 && maxBytes < 1024 * 1024 && isBroadPath(rule.match.path, rule.match.path_match)) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.strictUploadSize.message"),
        uploadScope(rule, t),
        rule.action.type,
        t("protectionGuidance.risks.strictUploadSize.impact"),
        t("protectionGuidance.risks.strictUploadSize.recommendation")
      )
    )
  }
  return prompts
}

function botRiskPrompts(rule: ProtectionRuleInput, t: Translate): ProtectionRiskPrompt[] {
  if (rule.challenge?.failure_action !== "block") {
    return []
  }
  const prompts: ProtectionRiskPrompt[] = []
  const broad = isBroadPath(rule.match.path, rule.match.path_match) || rule.match.methods.length === 0
  if (broad) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.broadBotBlock.message"),
        botScope(rule, t),
        rule.challenge.failure_action,
        t("protectionGuidance.risks.broadBotBlock.impact"),
        t("protectionGuidance.risks.broadBotBlock.recommendation")
      )
    )
  }
  if (broad && (rule.challenge.behavior_enabled || rule.challenge.device_binding || rule.challenge.mode === "captcha")) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.strictBotEnhancement.message"),
        botScope(rule, t),
        rule.challenge.failure_action,
        t("protectionGuidance.risks.strictBotEnhancement.impact"),
        t("protectionGuidance.risks.strictBotEnhancement.recommendation")
      )
    )
  }
  return prompts
}

function dynamicRiskPrompts(rule: ProtectionRuleInput, t: Translate): ProtectionRiskPrompt[] {
  const dynamic = rule.dynamic
  if (!dynamic) {
    return []
  }
  const prompts: ProtectionRiskPrompt[] = []
  const broad = isBroadPath(rule.match.path, rule.match.path_match) || rule.match.methods.length === 0
  if (rule.category === "dynamic-token" && dynamic.failure_action === "block" && broad) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.broadDynamicToken.message"),
        dynamicScope(rule, t),
        dynamic.failure_action,
        t("protectionGuidance.risks.broadDynamicToken.impact"),
        t("protectionGuidance.risks.broadDynamicToken.recommendation")
      )
    )
  }
  if (rule.category === "page-mutation" && (isBroadPath(rule.match.path, rule.match.path_match) || Number(dynamic.mutation_max_bytes) > 1024 * 1024)) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.broadPageMutation.message"),
        dynamicScope(rule, t),
        "page-mutation",
        t("protectionGuidance.risks.broadPageMutation.impact"),
        t("protectionGuidance.risks.broadPageMutation.recommendation")
      )
    )
  }
  if (rule.category === "waiting-room" && isBroadPath(rule.match.path, rule.match.path_match) && Number(dynamic.queue_capacity) < 50) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.lowCapacityWaitingRoom.message"),
        dynamicScope(rule, t),
        dynamic.overflow_action,
        t("protectionGuidance.risks.lowCapacityWaitingRoom.impact"),
        t("protectionGuidance.risks.lowCapacityWaitingRoom.recommendation")
      )
    )
  }
  if (rule.category === "waiting-room" && dynamic.overflow_action === "block" && broad) {
    prompts.push(
      prompt(
        t("protectionGuidance.risks.waitingRoomOverflowBlock.message"),
        dynamicScope(rule, t),
        dynamic.overflow_action,
        t("protectionGuidance.risks.waitingRoomOverflowBlock.impact"),
        t("protectionGuidance.risks.waitingRoomOverflowBlock.recommendation")
      )
    )
  }
  return prompts
}

function prompt(message: string, scope: string, action: string, impact: string, recommendation: string): ProtectionRiskPrompt {
  return { message, scope, action, impact, recommendation }
}

function isBroadPath(path = "", pathMatch = "") {
  return path === "/" && (pathMatch === "" || pathMatch === "prefix" || pathMatch === "glob")
}

function isBroadAccessSource(rule: ProtectionRuleInput) {
  const value = rule.match.value || rule.match.host || ""
  return value === "*" || value === ""
}

function isBroadAccessScope(rule: ProtectionRuleInput) {
  return isBroadPath(rule.match.path, rule.match.path_match) || isBroadAccessSource(rule)
}

function methodScope(methods: string[], t: Translate) {
  return methods.length > 0 ? methods.join(", ") : t("common.allMethods")
}

function pathScope(rule: ProtectionRuleInput, t: Translate) {
  return t("protectionGuidance.scopes.path", {
    pathMatch: rule.match.path_match || "prefix",
    path: rule.match.path || "/",
    methods: methodScope(rule.match.methods, t)
  })
}

function accessScope(rule: ProtectionRuleInput, t: Translate) {
  if (rule.match.target === "host") {
    return t("protectionGuidance.scopes.host", {
      operator: rule.match.operator || "exact",
      host: rule.match.host || rule.match.value || "*",
      methods: methodScope(rule.match.methods, t)
    })
  }
  if (rule.match.target === "header") {
    return t("protectionGuidance.scopes.header", {
      header: rule.match.header_name || "*",
      operator: rule.match.operator || "contains",
      value: rule.match.value || "*",
      methods: methodScope(rule.match.methods, t)
    })
  }
  return pathScope(rule, t)
}

function uploadScope(rule: ProtectionRuleInput, t: Translate) {
  const extensions = rule.upload?.extensions?.length ? rule.upload.extensions.join(", ") : t("protectionGuidance.scopes.allExtensions")
  const maxBytes = rule.upload?.max_bytes ? `${rule.upload.max_bytes} bytes` : t("protectionGuidance.scopes.noSizeLimit")
  return t("protectionGuidance.scopes.upload", {
    scope: pathScope(rule, t),
    extensions,
    maxBytes
  })
}

function botScope(rule: ProtectionRuleInput, t: Translate) {
  return t("protectionGuidance.scopes.bot", {
    scope: pathScope(rule, t),
    mode: rule.challenge?.mode ?? "js-challenge",
    ttl: rule.challenge?.verify_ttl_sec ?? 0
  })
}

function dynamicScope(rule: ProtectionRuleInput, t: Translate) {
  const dynamic = rule.dynamic
  if (!dynamic) {
    return t("protectionGuidance.scopes.dynamicFallback", {
      scope: pathScope(rule, t),
      category: rule.category
    })
  }
  if (rule.category === "waiting-room") {
    return t("protectionGuidance.scopes.waitingRoom", {
      scope: pathScope(rule, t),
      capacity: dynamic.queue_capacity,
      retry: dynamic.retry_interval_sec
    })
  }
  if (rule.category === "page-mutation") {
    return t("protectionGuidance.scopes.pageMutation", {
      scope: pathScope(rule, t),
      marker: dynamic.mutation_marker,
      maxBytes: dynamic.mutation_max_bytes
    })
  }
  return t("protectionGuidance.scopes.dynamicToken", {
    scope: pathScope(rule, t),
    placement: dynamic.token_placement,
    ttl: dynamic.token_ttl_sec
  })
}
