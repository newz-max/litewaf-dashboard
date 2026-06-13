import type { Application, ApplicationInput, ApplicationProxyConfig } from "@/api/litewaf"

export type ApplicationProxyFormInput = Required<ApplicationProxyConfig>

export function defaultApplicationProxyForm(): ApplicationProxyFormInput {
  return {
    headers: [],
    connect_timeout: "",
    read_timeout: "",
    send_timeout: "",
    websocket_enabled: false,
    preserve_host: true,
    proxy_buffering: "",
    request_buffering: ""
  }
}

export function normalizeApplicationProxyConfigForForm(config: Application["proxy_config"]): ApplicationProxyFormInput {
  return {
    headers: (config?.headers ?? []).map((header) => ({ name: header.name, value: header.value })),
    connect_timeout: config?.connect_timeout ?? "",
    read_timeout: config?.read_timeout ?? "",
    send_timeout: config?.send_timeout ?? "",
    websocket_enabled: Boolean(config?.websocket_enabled),
    preserve_host: config?.preserve_host ?? true,
    proxy_buffering: config?.proxy_buffering ?? "",
    request_buffering: config?.request_buffering ?? ""
  }
}

export function normalizeApplicationProxyConfigInput(
  config: ApplicationProxyConfig | undefined
): ApplicationInput["proxy_config"] | undefined {
  const form = config ?? defaultApplicationProxyForm()
  const headers = (form.headers ?? [])
    .filter((header) => header.name.trim() || header.value.trim())
    .map((header) => ({ name: header.name.trim(), value: header.value.trim() }))
  const payload = {
    headers,
    connect_timeout: form.connect_timeout?.trim() ?? "",
    read_timeout: form.read_timeout?.trim() ?? "",
    send_timeout: form.send_timeout?.trim() ?? "",
    websocket_enabled: Boolean(form.websocket_enabled),
    preserve_host: form.preserve_host ?? true,
    proxy_buffering: form.proxy_buffering ?? "",
    request_buffering: form.request_buffering ?? ""
  }
  const empty =
    headers.length === 0 &&
    !payload.connect_timeout &&
    !payload.read_timeout &&
    !payload.send_timeout &&
    !payload.websocket_enabled &&
    payload.preserve_host === true &&
    !payload.proxy_buffering &&
    !payload.request_buffering

  return empty ? undefined : payload
}

export function applicationToInputWithProxyConfig(
  application: Application,
  proxyConfig: ApplicationInput["proxy_config"] | undefined
): ApplicationInput {
  return {
    name: application.name,
    mode: application.mode,
    enabled: application.enabled,
    description: application.description ?? "",
    hosts: application.hosts.map((host) => ({
      host: host.host,
      is_primary: host.is_primary
    })),
    listeners: application.listeners.map((listener) => ({
      port: listener.port,
      protocol: listener.protocol,
      certificate_id: listener.certificate_id || undefined,
      enabled: listener.enabled
    })),
    upstreams: application.upstreams.map((upstream) => ({
      name: upstream.name,
      url: upstream.url,
      weight: upstream.weight,
      enabled: upstream.enabled
    })),
    proxy_config: proxyConfig
  }
}

export function hasApplicationProxyConfig(config: Application["proxy_config"]) {
  return Boolean(normalizeApplicationProxyConfigInput(config))
}
