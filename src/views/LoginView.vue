<script setup lang="ts">
import { reactive, shallowRef } from "vue"
import { useMessage } from "naive-ui"
import { useRoute, useRouter } from "vue-router"
import { FlashOutline, PulseOutline, ShieldCheckmarkOutline } from "@vicons/ionicons5"
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
        <div class="brand-mark">
          <NIcon size="24">
            <FlashOutline />
          </NIcon>
        </div>
        <div>
          <span class="login-kicker">OpenResty WAF 控制面</span>
          <h1>LiteWaf</h1>
          <p>管理控制台</p>
        </div>
      </div>

      <div class="login-status-grid" aria-hidden="true">
        <span>
          <NIcon>
            <ShieldCheckmarkOutline />
          </NIcon>
          安全运营
        </span>
        <span>
          <NIcon>
            <PulseOutline />
          </NIcon>
          Debian 12
        </span>
      </div>

      <NForm class="login-form" @submit.prevent="submit">
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
    radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--lw-accent) 12%, transparent), transparent 30%),
    linear-gradient(135deg, color-mix(in srgb, var(--lw-accent) 18%, transparent), transparent 36%),
    var(--lw-bg);
}

.login-panel {
  width: min(420px, 100%);
  padding: 30px;
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
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--lw-accent) 52%, var(--lw-border));
  border-radius: var(--lw-radius);
  background: color-mix(in srgb, var(--lw-accent) 18%, var(--lw-panel));
  color: var(--lw-accent-strong);
  font-weight: 800;
  box-shadow: 0 12px 30px color-mix(in srgb, var(--lw-accent) 18%, transparent);
}

.login-kicker {
  color: var(--lw-accent);
  font-size: 12px;
  font-weight: 700;
}

.login-brand h1 {
  margin: 0;
  font-size: 22px;
}

.login-brand p {
  margin: 2px 0 0;
  color: var(--lw-text-muted);
}

.login-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 22px;
}

.login-status-grid span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel-muted);
  color: var(--lw-text-muted);
  font-size: 12px;
}

.login-form {
  margin-top: 2px;
}

@media (max-width: 420px) {
  .login-page {
    padding: 16px;
  }

  .login-panel {
    padding: 22px;
  }
}
</style>
