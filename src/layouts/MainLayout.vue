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
import LanguageSwitcher from "@/components/system/LanguageSwitcher.vue"
import { useThemeStore } from "@/stores/theme"
import { useAuthStore } from "@/stores/auth"
import { useI18n } from "vue-i18n"

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const { t } = useI18n()

const siderCollapsed = shallowRef(false)
let removeViewportListener: (() => void) | undefined

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function renderLabel(labelKey: string, to: string) {
  return () => h(RouterLink, { to }, { default: () => t(labelKey) })
}

const menuOptions = computed<MenuOption[]>(() => [
  {
    type: "group",
    key: "nav-overview",
    label: t("shell.nav.overview"),
    children: [
      {
        key: "dashboard",
        label: renderLabel("shell.nav.dashboard", "/"),
        icon: renderIcon(AnalyticsOutline)
      },
      {
        key: "statisticsReport",
        label: renderLabel("shell.nav.statisticsReport", "/statistics-report"),
        icon: renderIcon(DocumentTextOutline)
      },
      {
        key: "protectionOverview",
        label: renderLabel("shell.nav.protectionOverview", "/protection-overview"),
        icon: renderIcon(ShieldOutline)
      },
      {
        key: "applications",
        label: renderLabel("shell.nav.applications", "/applications"),
        icon: renderIcon(GlobeOutline)
      }
    ]
  },
  {
    type: "group",
    key: "nav-protection",
    label: t("shell.nav.protection"),
    children: [
      {
        key: "ccProtection",
        label: renderLabel("shell.nav.ccProtection", "/cc-protection"),
        icon: renderIcon(RocketOutline)
      },
      {
        key: "attackProtection",
        label: renderLabel("shell.nav.attackProtection", "/attack-protection"),
        icon: renderIcon(SkullOutline)
      },
      {
        key: "ipAccessLists",
        label: renderLabel("shell.nav.ipAccessLists", "/ip-access-lists"),
        icon: renderIcon(ShieldCheckmarkOutline)
      },
      {
        key: "accessControl",
        label: renderLabel("shell.nav.accessControl", "/access-control"),
        icon: renderIcon(LockClosedOutline)
      },
      {
        key: "uploadProtection",
        label: renderLabel("shell.nav.uploadProtection", "/upload-protection"),
        icon: renderIcon(CloudUploadOutline)
      },
      {
        key: "botProtection",
        label: renderLabel("shell.nav.botProtection", "/bot-protection"),
        icon: renderIcon(PersonCircleOutline)
      },
      {
        key: "dynamicProtection",
        label: renderLabel("shell.nav.dynamicProtection", "/dynamic-protection"),
        icon: renderIcon(RepeatOutline)
      }
    ]
  },
  {
    type: "group",
    key: "nav-rule-ops",
    label: t("shell.nav.ruleOps"),
    children: [
      {
        key: "rules",
        label: renderLabel("shell.nav.rules", "/rules"),
        icon: renderIcon(ShieldCheckmarkOutline)
      },
      {
        key: "ruleEcosystem",
        label: renderLabel("shell.nav.ruleEcosystem", "/rule-ecosystem"),
        icon: renderIcon(PricetagsOutline)
      },
      {
        key: "policies",
        label: renderLabel("shell.nav.policies", "/policies"),
        icon: renderIcon(LayersOutline)
      },
      {
        key: "releases",
        label: renderLabel("shell.nav.releases", "/releases"),
        icon: renderIcon(CloudUploadOutline)
      }
    ]
  },
  {
    type: "group",
    key: "nav-logs",
    label: t("shell.nav.logs"),
    children: [
      {
        key: "attackLogs",
        label: renderLabel("shell.nav.attackLogs", "/attack-logs"),
        icon: renderIcon(WarningOutline)
      },
      {
        key: "blockedRejectedRecords",
        label: renderLabel("shell.nav.blockedRejectedRecords", "/blocked-rejected-records"),
        icon: renderIcon(FlashOutline)
      },
      {
        key: "dynamicBans",
        label: renderLabel("shell.nav.dynamicBans", "/dynamic-bans"),
        icon: renderIcon(WarningOutline)
      },
      {
        key: "accessLogs",
        label: renderLabel("shell.nav.accessLogs", "/access-logs"),
        icon: renderIcon(PulseOutline)
      },
      ...(authStore.canAudit
        ? [
            {
              key: "auditLogs",
              label: renderLabel("shell.nav.auditLogs", "/audit-logs"),
              icon: renderIcon(ReaderOutline)
            }
          ]
        : [])
    ]
  },
  {
    type: "group",
    key: "nav-system",
    label: t("shell.nav.system"),
    children: [
      {
        key: "protectionMigrationHealth",
        label: renderLabel("shell.nav.protectionMigrationHealth", "/protection-migration-health"),
        icon: renderIcon(MedkitOutline)
      },
      {
        key: "legacyCompatibility",
        label: t("shell.nav.legacyCompatibility"),
        icon: renderIcon(ListOutline),
        children: [
          {
            key: "rateLimits",
            label: renderLabel("shell.nav.rateLimits", "/rate-limits")
          }
        ]
      },
      {
        key: "settings",
        label: renderLabel("shell.nav.settings", "/settings"),
        icon: renderIcon(OptionsOutline)
      }
    ]
  }
])

const activeKey = computed(() => String(route.name || "dashboard"))
const themeIcon = computed(() => (themeStore.isDark ? SunnyOutline : MoonOutline))
const densityLabel = computed(() => t(themeStore.settings.density === "compact" ? "common.compact" : "common.comfortable"))
const pageTitle = computed(() => {
  const titleKey = typeof route.meta.titleKey === "string" ? route.meta.titleKey : "common.console"
  return t(titleKey)
})

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
        <span>{{ t("shell.statusOnline") }}</span>
      </div>

      <NMenu class="litewaf-menu" :value="activeKey" :options="menuOptions" :indent="18" />
    </NLayoutSider>

    <NLayout class="app-main">
      <NLayoutHeader bordered class="app-header">
        <div class="header-title">
          <NIcon size="22">
            <DocumentTextOutline />
          </NIcon>
          <div>
            <span>{{ pageTitle }}</span>
            <small>{{ themeStore.activePreset.label }} · {{ densityLabel }}</small>
          </div>
        </div>

        <div class="header-actions">
          <NTag type="success" size="small" round>{{ t("shell.runtimeBaseline") }}</NTag>
          <NTag type="info" size="small" round>{{ authStore.user?.role || t("shell.unauthenticated") }}</NTag>
          <NTooltip trigger="hover">
            <template #trigger>
              <LanguageSwitcher />
            </template>
            {{ t("language.label") }}
          </NTooltip>
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
            {{ t("shell.densityTooltip") }}
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
            {{ t("shell.themeTooltip") }}
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
            {{ t("shell.appearanceTooltip") }}
          </NTooltip>
          <NButton quaternary @click="signOut">{{ t("shell.signOut") }}</NButton>
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

.app-main {
  min-width: 0;
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
  min-width: 0;
  background:
    radial-gradient(circle at 56% -8%, color-mix(in srgb, var(--lw-accent) 10%, transparent), transparent 24%),
    var(--lw-shell-content),
    var(--lw-bg);
  color: var(--lw-text);
}

.app-content :deep(.n-scrollbar-content) {
  min-height: 100%;
  min-width: 0;
  max-width: 100%;
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
