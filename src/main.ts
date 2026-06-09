import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import { isApiRequestError } from "@/api/errors"
import { i18n } from "@/i18n"
import "./assets/main.css"

const app = createApp(App)

app.config.errorHandler = (error) => {
  if (isApiRequestError(error)) {
    window.dispatchEvent(new CustomEvent("litewaf:api-error", { detail: { error } }))
    return
  }
  console.error(error)
}

app.use(createPinia()).use(i18n).use(router).mount("#app")
