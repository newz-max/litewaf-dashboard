import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import { isApiRequestError } from "@/api/errors"
import "./assets/main.css"

const app = createApp(App)

app.config.errorHandler = (error) => {
  if (isApiRequestError(error)) {
    window.dispatchEvent(new CustomEvent("litewaf:api-error", { detail: { error } }))
    return
  }
  console.error(error)
}

app.use(createPinia()).use(router).mount("#app")
