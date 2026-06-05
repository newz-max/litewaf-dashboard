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

export const protectionGuides: Record<string, ProtectionGuideItem[]> = {
  "cc-protection": [
    { title: "登录防暴力破解", description: "优先使用精确路径、POST 方法和 client_ip 计数，先观察命中再启用封禁。" },
    { title: "API 频率限制", description: "API 前缀规则适合 client_ip_path 计数，阈值应覆盖正常峰值请求。" },
    { title: "高级计数", description: "404、攻击频率、会话和设备计数需要配合模拟预览确认样本字段是否完整。" }
  ],
  "access-control": [
    { title: "路径放行收窄", description: "放行规则应限定 Host、路径或 Header 条件，来源 IP/CIDR 请进入 IP 黑白名单。" },
    { title: "后台路径保护", description: "管理路径建议先用观察或窄范围阻断，确认不会影响健康检查和回调。" },
    { title: "Header / Host 条件", description: "Header 与 Host 规则适合灰度验证，发布前确认匹配值来自可信入口。" }
  ],
  "upload-protection": [
    { title: "危险扩展名", description: "阻断脚本扩展名前先限定上传路径，避免影响非上传接口。" },
    { title: "大小限制", description: "大小限制应基于真实业务文件大小，过小阈值建议先观察。" },
    { title: "方法范围", description: "上传规则优先限定 POST/PUT/PATCH，全部方法阻断需要二次确认。" }
  ],
  "bot-protection": [
    { title: "挑战 rollout", description: "先在登录、后台等高风险路径启用挑战，再逐步扩大范围。" },
    { title: "增强项", description: "captcha、行为评分和设备信号会提升拦截强度，也可能影响兼容性。" },
    { title: "搜索引擎绕过", description: "当前绕过基于 User-Agent，不能替代反向 DNS 或 IP 段验证。" }
  ],
  "dynamic-protection": [
    { title: "动态令牌", description: "阻断前确认页面已能发放令牌，API 和回调路径应保留兼容入口。" },
    { title: "页面动态化", description: "页面注入应限定 HTML 路径和响应大小，避免影响缓存与前端兼容。" },
    { title: "等候室", description: "容量和重试间隔应按真实并发设置，全站低容量规则需要发布前复核。" }
  ]
}

export function protectionRiskPrompts(rule: ProtectionRuleInput): ProtectionRiskPrompt[] {
  if (!rule.enabled) {
    return []
  }
  switch (rule.module) {
    case "cc-protection":
      return ccRiskPrompts(rule)
    case "access-control":
      return accessRiskPrompts(rule)
    case "upload-protection":
      return uploadRiskPrompts(rule)
    case "bot-protection":
      return botRiskPrompts(rule)
    case "dynamic-protection":
      return dynamicRiskPrompts(rule)
    default:
      return []
  }
}

export function riskPromptText(prompt: ProtectionRiskPrompt) {
  return `${prompt.message}。范围：${prompt.scope}；影响：${prompt.impact}；建议：${prompt.recommendation}`
}

function ccRiskPrompts(rule: ProtectionRuleInput): ProtectionRiskPrompt[] {
  const blocking = ["block", "ban", "rate-limit"].includes(rule.action.type)
  const lowThreshold = Number(rule.limit.threshold) > 0 && Number(rule.limit.threshold) < 60 && Number(rule.limit.window_sec) <= 60
  if (!blocking || !lowThreshold || !isBroadPath(rule.match.path, rule.match.path_match)) {
    return []
  }
  return [
    prompt(
      "CC 全站低阈值规则需要二次确认",
      pathScope(rule),
      rule.action.type,
      "可能限制正常用户或业务高峰请求",
      "先使用观察模式或提高阈值，确认峰值后再阻断"
    )
  ]
}

function accessRiskPrompts(rule: ProtectionRuleInput): ProtectionRiskPrompt[] {
  const prompts: ProtectionRiskPrompt[] = []
  if (rule.action.type === "allow" && (isBroadAccessSource(rule) || isBroadPath(rule.match.path, rule.match.path_match))) {
    prompts.push(prompt("宽泛访问放行规则需要二次确认", accessScope(rule), rule.action.type, "可能绕过后续防护模块", "收窄来源、Host 或路径范围"))
  }
  if (rule.action.type === "block" && isBroadAccessScope(rule)) {
    prompts.push(prompt("宽泛访问阻断规则需要二次确认", accessScope(rule), rule.action.type, "可能导致站点或高流量入口不可用", "先使用观察模式验证命中"))
  }
  return prompts
}

function uploadRiskPrompts(rule: ProtectionRuleInput): ProtectionRiskPrompt[] {
  if (rule.action.type !== "block") {
    return []
  }
  const prompts: ProtectionRiskPrompt[] = []
  const maxBytes = Number(rule.upload?.max_bytes ?? 0)
  if (isBroadPath(rule.match.path, rule.match.path_match) || ((rule.upload?.extensions ?? []).length === 0 && maxBytes === 0)) {
    prompts.push(prompt("宽泛上传阻断规则需要二次确认", uploadScope(rule), rule.action.type, "可能影响所有上传入口", "限定路径、方法、扩展名或大小条件"))
  }
  if (maxBytes > 0 && maxBytes < 1024 * 1024 && isBroadPath(rule.match.path, rule.match.path_match)) {
    prompts.push(prompt("严格上传大小限制需要二次确认", uploadScope(rule), rule.action.type, "可能误拦头像、附件或业务文件", "按真实文件大小基线调整阈值"))
  }
  return prompts
}

function botRiskPrompts(rule: ProtectionRuleInput): ProtectionRiskPrompt[] {
  if (rule.challenge?.failure_action !== "block") {
    return []
  }
  const prompts: ProtectionRiskPrompt[] = []
  const broad = isBroadPath(rule.match.path, rule.match.path_match) || rule.match.methods.length === 0
  if (broad) {
    prompts.push(prompt("宽泛 Bot Challenge 阻断需要二次确认", botScope(rule), rule.challenge.failure_action, "可能影响正常用户、爬虫和 API 请求", "先限定高风险路径或使用观察模式"))
  }
  if (broad && (rule.challenge.behavior_enabled || rule.challenge.device_binding || rule.challenge.mode === "captcha")) {
    prompts.push(prompt("严格 Bot 增强配置需要二次确认", botScope(rule), rule.challenge.failure_action, "可能造成兼容性或误拦截问题", "确认增强项对目标客户端兼容"))
  }
  return prompts
}

function dynamicRiskPrompts(rule: ProtectionRuleInput): ProtectionRiskPrompt[] {
  const dynamic = rule.dynamic
  if (!dynamic) {
    return []
  }
  const prompts: ProtectionRiskPrompt[] = []
  const broad = isBroadPath(rule.match.path, rule.match.path_match) || rule.match.methods.length === 0
  if (rule.category === "dynamic-token" && dynamic.failure_action === "block" && broad) {
    prompts.push(prompt("宽泛动态令牌阻断需要二次确认", dynamicScope(rule), dynamic.failure_action, "可能影响未注入令牌的页面、API 或回调", "确认令牌发放路径覆盖目标流量"))
  }
  if (rule.category === "page-mutation" && (isBroadPath(rule.match.path, rule.match.path_match) || Number(dynamic.mutation_max_bytes) > 1024 * 1024)) {
    prompts.push(prompt("宽泛页面动态化规则需要二次确认", dynamicScope(rule), "page-mutation", "可能影响前端兼容或缓存命中", "限定 HTML 路径和响应大小"))
  }
  if (rule.category === "waiting-room" && isBroadPath(rule.match.path, rule.match.path_match) && Number(dynamic.queue_capacity) < 50) {
    prompts.push(prompt("低容量等候室规则需要二次确认", dynamicScope(rule), dynamic.overflow_action, "可能让正常用户排队或收到过载响应", "按真实并发设置容量"))
  }
  if (rule.category === "waiting-room" && dynamic.overflow_action === "block" && broad) {
    prompts.push(prompt("等候室溢出阻断需要二次确认", dynamicScope(rule), dynamic.overflow_action, "流量峰值时可能直接拒绝正常用户", "优先使用 waiting-room 动作并设置合理容量"))
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

function methodScope(methods: string[]) {
  return methods.length > 0 ? methods.join(", ") : "全部方法"
}

function pathScope(rule: ProtectionRuleInput) {
  return `${rule.match.path_match || "prefix"} ${rule.match.path || "/"}，方法 ${methodScope(rule.match.methods)}`
}

function accessScope(rule: ProtectionRuleInput) {
  if (rule.match.target === "host") {
    return `Host ${rule.match.operator || "exact"} ${rule.match.host || rule.match.value || "*"}，方法 ${methodScope(rule.match.methods)}`
  }
  if (rule.match.target === "header") {
    return `Header ${rule.match.header_name || "*"} ${rule.match.operator || "contains"} ${rule.match.value || "*"}，方法 ${methodScope(rule.match.methods)}`
  }
  return pathScope(rule)
}

function uploadScope(rule: ProtectionRuleInput) {
  const extensions = rule.upload?.extensions?.length ? rule.upload.extensions.join(", ") : "全部扩展名"
  const maxBytes = rule.upload?.max_bytes ? `${rule.upload.max_bytes} bytes` : "未限制大小"
  return `${pathScope(rule)}，扩展名 ${extensions}，大小 ${maxBytes}`
}

function botScope(rule: ProtectionRuleInput) {
  return `${pathScope(rule)}，模式 ${rule.challenge?.mode ?? "js-challenge"}，TTL ${rule.challenge?.verify_ttl_sec ?? 0} 秒`
}

function dynamicScope(rule: ProtectionRuleInput) {
  const dynamic = rule.dynamic
  if (!dynamic) {
    return `${pathScope(rule)}，类型 ${rule.category}`
  }
  if (rule.category === "waiting-room") {
    return `${pathScope(rule)}，容量 ${dynamic.queue_capacity}，重试 ${dynamic.retry_interval_sec} 秒`
  }
  if (rule.category === "page-mutation") {
    return `${pathScope(rule)}，插入点 ${dynamic.mutation_marker}，响应上限 ${dynamic.mutation_max_bytes} bytes`
  }
  return `${pathScope(rule)}，令牌位置 ${dynamic.token_placement}，TTL ${dynamic.token_ttl_sec} 秒`
}
