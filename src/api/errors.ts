import axios from "axios"
import { i18n } from "@/i18n"

interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
  }
  message?: string
}

export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = "ApiRequestError"
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

function defaultRequestFailedMessage() {
  return i18n.global.t("common.requestFailed")
}

export function extractApiErrorMessage(error: unknown, fallback = defaultRequestFailedMessage()) {
  if (isApiRequestError(error)) {
    return error.message || fallback
  }
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message || fallback : fallback
  }

  const payload = error.response?.data as ApiErrorPayload | undefined
  const message = payload?.error?.message || payload?.message
  if (message) {
    return message
  }
  if (error.response?.statusText) {
    return error.response.statusText
  }
  return error.message || fallback
}

export function toApiRequestError(error: unknown, fallback = defaultRequestFailedMessage()) {
  if (isApiRequestError(error)) {
    return error
  }
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  return new ApiRequestError(extractApiErrorMessage(error, fallback), status)
}
