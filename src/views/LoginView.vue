<script setup lang="ts">
import { reactive, shallowRef } from "vue"
import { useMessage } from "naive-ui"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = shallowRef(false)
const form = reactive({
  username: "",
  password: ""
})

async function submit() {
  loading.value = true
  try {
    await authStore.signIn(form.username, form.password)
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/"
    await router.push(redirect)
  } catch {
    message.error("登录失败")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-brand">
        <div class="brand-mark">LW</div>
        <div>
          <h1>LiteWaf</h1>
          <p>管理控制台</p>
        </div>
      </div>

      <NForm @submit.prevent="submit">
        <NFormItem label="账号">
          <NInput v-model:value="form.username" placeholder="请输入账号" />
        </NFormItem>
        <NFormItem label="密码">
          <NInput
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="请输入密码"
          />
        </NFormItem>
        <NButton type="primary" block attr-type="submit" :loading="loading">登录</NButton>
      </NForm>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--lw-accent) 18%, transparent), transparent 36%),
    var(--lw-bg);
}

.login-panel {
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
  box-shadow: var(--lw-shadow);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: var(--lw-radius);
  background: color-mix(in srgb, var(--lw-accent) 18%, var(--lw-panel));
  color: var(--lw-accent-strong);
  font-weight: 800;
}

.login-brand h1 {
  margin: 0;
  font-size: 22px;
}

.login-brand p {
  margin: 2px 0 0;
  color: var(--lw-text-muted);
}
</style>
