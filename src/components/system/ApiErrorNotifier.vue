<script setup lang="ts">
import { onMounted, onUnmounted } from "vue"
import { useMessage } from "naive-ui"
import { extractApiErrorMessage, isApiRequestError } from "@/api/errors"

const message = useMessage()

function notify(error: unknown) {
  if (isApiRequestError(error)) {
    message.error(extractApiErrorMessage(error))
  }
}

function handleUnhandledRejection(event: PromiseRejectionEvent) {
  notify(event.reason)
}

function handleApiError(event: Event) {
  notify((event as CustomEvent<{ error?: unknown }>).detail?.error)
}

onMounted(() => {
  window.addEventListener("unhandledrejection", handleUnhandledRejection)
  window.addEventListener("litewaf:api-error", handleApiError)
})

onUnmounted(() => {
  window.removeEventListener("unhandledrejection", handleUnhandledRejection)
  window.removeEventListener("litewaf:api-error", handleApiError)
})
</script>

<template>
  <span hidden />
</template>
