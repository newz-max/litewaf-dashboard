import { createRouter, createWebHistory } from "vue-router"
import MainLayout from "@/layouts/MainLayout.vue"
import DashboardView from "@/views/DashboardView.vue"
import ApplicationsView from "@/views/ApplicationsView.vue"
import RulesView from "@/views/RulesView.vue"
import RuleEcosystemView from "@/views/RuleEcosystemView.vue"
import PoliciesView from "@/views/PoliciesView.vue"
import AttackLogsView from "@/views/AttackLogsView.vue"
import BlockedRejectedRecordsView from "@/views/BlockedRejectedRecordsView.vue"
import AccessLogsView from "@/views/AccessLogsView.vue"
import ReleasesView from "@/views/ReleasesView.vue"
import MigrationHealthView from "@/views/MigrationHealthView.vue"
import NginxProxyView from "@/views/NginxProxyView.vue"
import SettingsView from "@/views/SettingsView.vue"
import LoginView from "@/views/LoginView.vue"
import AuditLogsView from "@/views/AuditLogsView.vue"
import ActiveDynamicBansView from "@/views/ActiveDynamicBansView.vue"
import IPAccessListsView from "@/views/IPAccessListsView.vue"
import RateLimitsView from "@/views/RateLimitsView.vue"
import ProtectionOverviewView from "@/views/ProtectionOverviewView.vue"
import CcProtectionView from "@/views/CcProtectionView.vue"
import AttackProtectionView from "@/views/AttackProtectionView.vue"
import AccessControlView from "@/views/AccessControlView.vue"
import UploadProtectionView from "@/views/UploadProtectionView.vue"
import BotProtectionView from "@/views/BotProtectionView.vue"
import DynamicProtectionView from "@/views/DynamicProtectionView.vue"
import { i18n } from "@/i18n"
import { useAuthStore } from "@/stores/auth"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { titleKey: "shell.nav.login" }
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
          meta: { titleKey: "shell.nav.dashboard" }
        },
        {
          path: "statistics-report",
          name: "statisticsReport",
          component: () => import("@/views/StatisticsReportView.vue"),
          meta: { titleKey: "shell.nav.statisticsReport" }
        },
        {
          path: "applications",
          name: "applications",
          component: ApplicationsView,
          meta: { titleKey: "shell.nav.applications" }
        },
        {
          path: "sites",
          redirect: "/applications"
        },
        {
          path: "protection-overview",
          name: "protectionOverview",
          component: ProtectionOverviewView,
          meta: { titleKey: "shell.nav.protectionOverview" }
        },
        {
          path: "rules",
          name: "rules",
          component: RulesView,
          meta: { titleKey: "shell.nav.rules" }
        },
        {
          path: "rule-ecosystem",
          name: "ruleEcosystem",
          component: RuleEcosystemView,
          meta: { titleKey: "shell.nav.ruleEcosystem" }
        },
        {
          path: "policies",
          name: "policies",
          component: PoliciesView,
          meta: { titleKey: "shell.nav.policies" }
        },
        {
          path: "attack-logs",
          name: "attackLogs",
          component: AttackLogsView,
          meta: { titleKey: "shell.nav.attackLogs" }
        },
        {
          path: "blocked-rejected-records",
          name: "blockedRejectedRecords",
          component: BlockedRejectedRecordsView,
          meta: { titleKey: "shell.nav.blockedRejectedRecords" }
        },
        {
          path: "dynamic-bans",
          name: "dynamicBans",
          component: ActiveDynamicBansView,
          meta: { titleKey: "shell.nav.dynamicBans" }
        },
        {
          path: "access-logs",
          name: "accessLogs",
          component: AccessLogsView,
          meta: { titleKey: "shell.nav.accessLogs" }
        },
        {
          path: "releases",
          name: "releases",
          component: ReleasesView,
          meta: { titleKey: "shell.nav.releases" }
        },
        {
          path: "protection-migration-health",
          name: "protectionMigrationHealth",
          component: MigrationHealthView,
          meta: { titleKey: "shell.nav.protectionMigrationHealth" }
        },
        {
          path: "audit-logs",
          name: "auditLogs",
          component: AuditLogsView,
          meta: { titleKey: "shell.nav.auditLogs" }
        },
        {
          path: "ip-access-lists",
          name: "ipAccessLists",
          component: IPAccessListsView,
          meta: { titleKey: "shell.nav.ipAccessLists" }
        },
        {
          path: "cc-protection",
          name: "ccProtection",
          component: CcProtectionView,
          meta: { titleKey: "shell.nav.ccProtection" }
        },
        {
          path: "attack-protection",
          name: "attackProtection",
          component: AttackProtectionView,
          meta: { titleKey: "shell.nav.attackProtection" }
        },
        {
          path: "access-control",
          name: "accessControl",
          component: AccessControlView,
          meta: { titleKey: "shell.nav.accessControl" }
        },
        {
          path: "upload-protection",
          name: "uploadProtection",
          component: UploadProtectionView,
          meta: { titleKey: "shell.nav.uploadProtection" }
        },
        {
          path: "bot-protection",
          name: "botProtection",
          component: BotProtectionView,
          meta: { titleKey: "shell.nav.botProtection" }
        },
        {
          path: "dynamic-protection",
          name: "dynamicProtection",
          component: DynamicProtectionView,
          meta: { titleKey: "shell.nav.dynamicProtection" }
        },
        {
          path: "rate-limits",
          name: "rateLimits",
          component: RateLimitsView,
          meta: { titleKey: "shell.nav.rateLimits" }
        },
        {
          path: "nginx-proxy",
          name: "nginxProxy",
          component: NginxProxyView,
          meta: { titleKey: "shell.nav.nginxProxy" }
        },
        {
          path: "settings",
          name: "settings",
          component: SettingsView,
          meta: { titleKey: "shell.nav.settings" }
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
  const titleKey = typeof to.meta.titleKey === "string" ? to.meta.titleKey : "common.console"
  document.title = `${i18n.global.t(titleKey)} - LiteWaf`
})

export default router
