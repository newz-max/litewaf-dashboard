<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, shallowRef, type Component } from "vue"
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router"
import { NIcon, type MenuOption } from "naive-ui"
import {
  AnalyticsOutline,
  CloudUploadOutline,
  DocumentTextOutline,
  FlashOutline,
  GlobeOutline,
  LayersOutline,
  ListOutline,
  MoonOutline,
  OptionsOutline,
  PersonCircleOutline,
  PulseOutline,
  ReaderOutline,
  RepeatOutline,
  RocketOutline,
  SkullOutline,
  LockClosedOutline,
  MedkitOutline,
  PricetagsOutline,
  ShieldOutline,
  ShieldCheckmarkOutline,
  SunnyOutline,
  WarningOutline
} from "@vicons/ionicons5"
import { useThemeStore } from "@/stores/theme"
import { useAuthStore } from "@/stores/auth"

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const siderCollapsed = shallowRef(false)
let removeViewportListener: (() => void) | undefined

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function renderLabel(label: string, to: string) {
  return () => h(RouterLink, { to }, { default: () => label })
}

const menuOptions = computed<MenuOption[]>(() => [
  {
    type: "group",
    key: "nav-overview",
    label: "态势",
    children: [
      {
        key: "dashboard",
        label: renderLabel("安全态势", "/"),
        icon: renderIcon(AnalyticsOutline)
      },
      {
        key: "statisticsReport",
        label: renderLabel("统计报表", "/statistics-report"),
        icon: renderIcon(DocumentTextOutline)
      },
      {
        key: "protectionOverview",
        label: renderLabel("防护概览", "/protection-overview"),
        icon: renderIcon(ShieldOutline)
      },
      {
        key: "applications",
        label: renderLabel("防护应用", "/applications"),
        icon: renderIcon(GlobeOutline)
      }
    ]
  },
  {
    type: "group",
    key: "nav-protection",
    label: "防护模块",
    children: [
      {
        key: "ccProtection",
        label: renderLabel("CC 防护", "/cc-protection"),
        icon: renderIcon(RocketOutline)
      },
      {
        key: "attackProtection",
        label: renderLabel("攻击防护", "/attack-protection"),
        icon: renderIcon(SkullOutline)
      },
      {
        key: "ipAccessLists",
        label: renderLabel("IP 黑白名单", "/ip-access-lists"),
        icon: renderIcon(ShieldCheckmarkOutline)
      },
      {
        key: "accessControl",
        label: renderLabel("访问控制", "/access-control"),
        icon: renderIcon(LockClosedOutline)
      },
      {
        key: "uploadProtection",
        label: renderLabel("上传防护", "/upload-protection"),
        icon: renderIcon(CloudUploadOutline)
      },
      {
        key: "botProtection",
        label: renderLabel("Bot / 人机验证", "/bot-protection"),
        icon: renderIcon(PersonCircleOutline)
      },
      {
        key: "dynamicProtection",
        label: renderLabel("动态防护 / 等候室", "/dynamic-protection"),
        icon: renderIcon(RepeatOutline)
      }
    ]
  },
  {
    type: "group",
    key: "nav-rule-ops",
    label: "规则与发布",
    children: [
      {
        key: "rules",
        label: renderLabel("规则管理", "/rules"),
        icon: renderIcon(ShieldCheckmarkOutline)
      },
      {
        key: "ruleEcosystem",
        label: renderLabel("高级规则生态", "/rule-ecosystem"),
        icon: renderIcon(PricetagsOutline)
      },
      {
        key: "policies",
        label: renderLabel("防护策略", "/policies"),
        icon: renderIcon(LayersOutline)
      },
      {
        key: "releases",
        label: renderLabel("发布记录", "/releases"),
        icon: renderIcon(CloudUploadOutline)
      }
    ]
  },
  {
    type: "group",
    key: "nav-logs",
    label: "日志审计",
    children: [
      {
        key: "attackLogs",
        label: renderLabel("攻击日志", "/attack-logs"),
        icon: renderIcon(WarningOutline)
      },
      {
        key: "blockedRejectedRecords",
        label: renderLabel("拦截 / 拒绝记录", "/blocked-rejected-records"),
        icon: renderIcon(FlashOutline)
      },
      {
        key: "dynamicBans",
        label: renderLabel("动态封禁", "/dynamic-bans"),
        icon: renderIcon(WarningOutline)
      },
      {
        key: "accessLogs",
        label: renderLabel("访问日志", "/access-logs"),
        icon: renderIcon(PulseOutline)
      },
      ...(authStore.canAudit
        ? [
            {
              key: "auditLogs",
              label: renderLabel("审计日志", "/audit-logs"),
              icon: renderIcon(ReaderOutline)
            }
          ]
        : [])
    ]
  },
  {
    type: "group",
    key: "nav-system",
    label: "系统",
    children: [
      {
        key: "protectionMigrationHealth",
        label: renderLabel("迁移健康检查", "/protection-migration-health"),
        icon: renderIcon(MedkitOutline)
      },
      {
        key: "legacyCompatibility",
        label: "兼容入口",
        icon: renderIcon(ListOutline),
        children: [
          {
            key: "rateLimits",
            label: renderLabel("限流配置（已废弃）", "/rate-limits")
          }
        ]
      },
      {
        key: "settings",
        label: renderLabel("系统设置", "/settings"),
        icon: renderIcon(OptionsOutline)
      }
    ]
  }
])

const activeKey = computed(() => String(route.name || "dashboard"))
const themeIcon = computed(() => (themeStore.isDark ? SunnyOutline : MoonOutline))
const densityLabel = computed(() => (themeStore.settings.density === "compact" ? "紧凑" : "舒适"))

function updateSiderCollapsed(value: boolean) {
  siderCollapsed.value = value
}

function openAppearanceSettings() {
  router.push("/settings")
}

function signOut() {
  authStore.signOut()
  router.replace({ name: "login" })
}

onMounted(() => {
  const mediaQuery = window.matchMedia("(max-width: 860px)")
  const updateFromViewport = (event: MediaQueryList | MediaQueryListEvent) => {
    siderCollapsed.value = event.matches
  }

  updateFromViewport(mediaQuery)
  mediaQuery.addEventListener("change", updateFromViewport)
  removeViewportListener = () => {
    mediaQuery.removeEventListener("change", updateFromViewport)
  }
})

onBeforeUnmount(() => {
  removeViewportListener?.()
})
</script>

<template>
  <NLayout class="app-shell" has-sider>
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed="siderCollapsed"
      :collapsed-width="72"
      :width="256"
      :native-scrollbar="false"
      :scrollbar-props="{ trigger: 'hover', style: {} }"
      show-trigger
      class="app-sider"
      :class="{ 'app-sider--collapsed': siderCollapsed }"
      @update:collapsed="updateSiderCollapsed"
    >
      <div class="brand">
        <div class="brand-mark">
          <NIcon size="24">
            <FlashOutline />
          </NIcon>
        </div>
        <div class="brand-text">
          <strong>LiteWaf</strong>
          <span>OpenResty WAF</span>
        </div>
      </div>

      <div class="sider-status">
        <span class="status-dot" />
        <span>控制面在线</span>
      </div>

      <NMenu class="litewaf-menu" :value="activeKey" :options="menuOptions" :indent="18" />
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader bordered class="app-header">
        <div class="header-title">
          <NIcon size="22">
            <DocumentTextOutline />
          </NIcon>
          <div>
            <span>{{ route.meta.title || "控制台" }}</span>
            <small>{{ themeStore.activePreset.label }} · {{ densityLabel }}</small>
          </div>
        </div>

        <div class="header-actions">
          <NTag type="success" size="small" round>Debian 12</NTag>
          <NTag type="info" size="small" round>{{ authStore.user?.role || "未登录" }}</NTag>
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton circle quaternary @click="themeStore.toggleDensity">
                <template #icon>
                  <NIcon>
                    <LayersOutline />
                  </NIcon>
                </template>
              </NButton>
            </template>
            切换操作密度
          </NTooltip>
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton circle quaternary @click="themeStore.toggleTheme">
                <template #icon>
                  <NIcon>
                    <component :is="themeIcon" />
                  </NIcon>
                </template>
              </NButton>
            </template>
            切换深浅色
          </NTooltip>
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton circle quaternary @click="openAppearanceSettings">
                <template #icon>
                  <NIcon>
                    <OptionsOutline />
                  </NIcon>
                </template>
              </NButton>
            </template>
            外观设置
          </NTooltip>
          <NButton quaternary @click="signOut">退出</NButton>
        </div>
      </NLayoutHeader>

      <NLayoutContent class="app-content" :native-scrollbar="false" :scrollbar-props="{ trigger: 'hover' }">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  background:
    radial-gradient(circle at 54% -18%, color-mix(in srgb, var(--lw-accent) 18%, transparent), transparent 26%),
    var(--lw-shell-bg),
    var(--lw-bg);
  color: var(--lw-text);
}

.app-sider {
  border-right: 1px solid var(--lw-shell-border);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--lw-accent) 22%, transparent), transparent 4px),
    radial-gradient(circle at 26% 0, color-mix(in srgb, var(--lw-accent) 12%, transparent), transparent 160px),
    var(--lw-shell-sider),
    var(--lw-sider);
  color: var(--lw-text);
  box-shadow:
    inset -1px 0 0 color-mix(in srgb, var(--lw-border-strong) 18%, transparent),
    var(--lw-shadow);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 66px;
  padding: 0 16px;
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--lw-accent) 62%, var(--lw-border));
  border-radius: 9px;
  background:
    radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--lw-success) 24%, transparent), transparent 58%),
    color-mix(in srgb, var(--lw-accent) 16%, var(--lw-panel));
  color: var(--lw-accent-strong);
  box-shadow: 0 0 24px color-mix(in srgb, var(--lw-accent) 24%, transparent);
}

.brand-text {
  display: grid;
  line-height: 1.2;
}

.brand-text strong {
  color: var(--lw-text);
  font-size: 16px;
}

.brand-text span {
  color: var(--lw-text-muted);
  font-size: 12px;
}

.sider-status {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  margin: 0 12px 10px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--lw-accent) 34%, var(--lw-border));
  border-radius: var(--lw-radius);
  background: var(--lw-shell-surface);
  color: var(--lw-text-muted);
  font-size: 12px;
}

.litewaf-menu {
  --n-group-text-color: var(--lw-text-subtle);
  --n-item-text-color: var(--lw-text-muted);
  --n-item-text-color-hover: var(--lw-text);
  --n-item-text-color-active: var(--lw-text);
  --n-item-text-color-active-hover: var(--lw-text);
  --n-item-icon-color: var(--lw-text-muted);
  --n-item-icon-color-hover: var(--lw-text);
  --n-item-icon-color-active: var(--lw-accent);
  --n-item-color-hover: color-mix(in srgb, var(--lw-accent) 11%, transparent);
  --n-item-color-active: color-mix(in srgb, var(--lw-accent) 18%, transparent);
  --n-item-color-active-hover: color-mix(in srgb, var(--lw-accent) 22%, transparent);
  color: var(--lw-text);
}

.litewaf-menu :deep(.n-menu-item-content),
.litewaf-menu :deep(.n-menu-item-content-header),
.litewaf-menu :deep(.n-menu-item-content-header a),
.litewaf-menu :deep(.n-menu-item-content__icon),
.litewaf-menu :deep(.n-menu-item-group-title) {
  color: inherit;
}

.app-sider--collapsed .brand {
  justify-content: center;
  padding: 0;
}

.app-sider--collapsed .brand-text,
.app-sider--collapsed .sider-status {
  display: none;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--lw-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--lw-success) 18%, transparent);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 0 20px;
  border-bottom: 1px solid var(--lw-shell-border);
  background:
    var(--lw-shell-header),
    var(--lw-header);
  color: var(--lw-text);
  backdrop-filter: blur(16px);
}

.header-title,
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  min-width: 0;
  color: var(--lw-text);
  font-size: 16px;
  font-weight: 740;
}

.header-title div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.header-title span,
.header-title small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-title small {
  color: var(--lw-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.header-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.app-content {
  height: calc(100vh - 66px);
  background:
    radial-gradient(circle at 56% -8%, color-mix(in srgb, var(--lw-accent) 10%, transparent), transparent 24%),
    var(--lw-shell-content),
    var(--lw-bg);
  color: var(--lw-text);
}

.app-content :deep(.n-scrollbar-content) {
  min-height: 100%;
  padding: var(--lw-content-padding);
}

@media (max-width: 860px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    height: auto;
    padding: 12px 14px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .app-content {
    height: calc(100vh - 112px);
  }
}
</style>
