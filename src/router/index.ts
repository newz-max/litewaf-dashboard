import { createRouter, createWebHistory } from "vue-router"
import MainLayout from "@/layouts/MainLayout.vue"
import DashboardView from "@/views/DashboardView.vue"
import SitesView from "@/views/SitesView.vue"
import RulesView from "@/views/RulesView.vue"
import PoliciesView from "@/views/PoliciesView.vue"
import AttackLogsView from "@/views/AttackLogsView.vue"
import ReleasesView from "@/views/ReleasesView.vue"
import SettingsView from "@/views/SettingsView.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: MainLayout,
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
          path: "releases",
          name: "releases",
          component: ReleasesView,
          meta: { title: "发布记录" }
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

router.afterEach((to) => {
  document.title = `${String(to.meta.title || "控制台")} - LiteWaf`
})

export default router
