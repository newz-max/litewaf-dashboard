import { createRouter, createWebHistory } from "vue-router"
import MainLayout from "@/layouts/MainLayout.vue"
import DashboardView from "@/views/DashboardView.vue"
import SitesView from "@/views/SitesView.vue"
import RulesView from "@/views/RulesView.vue"
import PoliciesView from "@/views/PoliciesView.vue"
import AttackLogsView from "@/views/AttackLogsView.vue"
import AccessLogsView from "@/views/AccessLogsView.vue"
import ReleasesView from "@/views/ReleasesView.vue"
import SettingsView from "@/views/SettingsView.vue"
import LoginView from "@/views/LoginView.vue"
import AuditLogsView from "@/views/AuditLogsView.vue"
import AccessListsView from "@/views/AccessListsView.vue"
import RateLimitsView from "@/views/RateLimitsView.vue"
import CcProtectionView from "@/views/CcProtectionView.vue"
import AttackProtectionView from "@/views/AttackProtectionView.vue"
import AccessControlView from "@/views/AccessControlView.vue"
import UploadProtectionView from "@/views/UploadProtectionView.vue"
import BotProtectionView from "@/views/BotProtectionView.vue"
import DynamicProtectionView from "@/views/DynamicProtectionView.vue"
import { useAuthStore } from "@/stores/auth"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { title: "登录" }
    },
    {
      path: "/",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: DashboardView,
          meta: { title: "仪表盘" }
        },
        {
          path: "sites",
          name: "sites",
          component: SitesView,
          meta: { title: "站点管理" }
        },
        {
          path: "rules",
          name: "rules",
          component: RulesView,
          meta: { title: "规则管理" }
        },
        {
          path: "policies",
          name: "policies",
          component: PoliciesView,
          meta: { title: "防护策略" }
        },
        {
          path: "attack-logs",
          name: "attackLogs",
          component: AttackLogsView,
          meta: { title: "攻击日志" }
        },
        {
          path: "access-logs",
          name: "accessLogs",
          component: AccessLogsView,
          meta: { title: "访问日志" }
        },
        {
          path: "releases",
          name: "releases",
          component: ReleasesView,
          meta: { title: "发布记录" }
        },
        {
          path: "audit-logs",
          name: "auditLogs",
          component: AuditLogsView,
          meta: { title: "审计日志" }
        },
        {
          path: "access-lists",
          name: "accessLists",
          component: AccessListsView,
          meta: { title: "黑白名单" }
        },
        {
          path: "cc-protection",
          name: "ccProtection",
          component: CcProtectionView,
          meta: { title: "CC 防护" }
        },
        {
          path: "attack-protection",
          name: "attackProtection",
          component: AttackProtectionView,
          meta: { title: "攻击防护" }
        },
        {
          path: "access-control",
          name: "accessControl",
          component: AccessControlView,
          meta: { title: "访问控制" }
        },
        {
          path: "upload-protection",
          name: "uploadProtection",
          component: UploadProtectionView,
          meta: { title: "上传防护" }
        },
        {
          path: "bot-protection",
          name: "botProtection",
          component: BotProtectionView,
          meta: { title: "Bot / 人机验证" }
        },
        {
          path: "dynamic-protection",
          name: "dynamicProtection",
          component: DynamicProtectionView,
          meta: { title: "动态防护 / 等候室" }
        },
        {
          path: "rate-limits",
          name: "rateLimits",
          component: RateLimitsView,
          meta: { title: "限流配置" }
        },
        {
          path: "settings",
          name: "settings",
          component: SettingsView,
          meta: { title: "系统设置" }
        }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } }
  }
  if (to.name === "login" && authStore.isAuthenticated) {
    return { name: "dashboard" }
  }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title || "控制台")} - LiteWaf`
})

export default router
