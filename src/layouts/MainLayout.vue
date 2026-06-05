<script setup lang="ts">
import { computed, h } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"
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
  ShieldOutline,
  ReaderOutline,
  RepeatOutline,
  RocketOutline,
  SkullOutline,
  LockClosedOutline,
  MedkitOutline,
  PricetagsOutline,
  ShieldCheckmarkOutline,
  SunnyOutline,
  WarningOutline
} from "@vicons/ionicons5"
import { useThemeStore } from "@/stores/theme"
import { useAuthStore } from "@/stores/auth"

const route = useRoute()
const themeStore = useThemeStore()
const authStore = useAuthStore()

function renderIcon(icon: typeof AnalyticsOutline) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function renderLabel(label: string, to: string) {
  return () => h(RouterLink, { to }, { default: () => label })
}

const menuOptions = computed<MenuOption[]>(() => [
  {
    key: "dashboard",
    label: renderLabel("仪表盘", "/"),
    icon: renderIcon(AnalyticsOutline)
  },
  {
    key: "sites",
    label: renderLabel("站点管理", "/sites"),
    icon: renderIcon(GlobeOutline)
  },
  {
    key: "protectionOverview",
    label: renderLabel("防护概览", "/protection-overview"),
    icon: renderIcon(ShieldOutline)
  },
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
  },
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
    key: "attackLogs",
    label: renderLabel("攻击日志", "/attack-logs"),
    icon: renderIcon(WarningOutline)
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
  {
    key: "releases",
    label: renderLabel("发布记录", "/releases"),
    icon: renderIcon(CloudUploadOutline)
  },
  {
    key: "protectionMigrationHealth",
    label: renderLabel("迁移健康检查", "/protection-migration-health"),
    icon: renderIcon(MedkitOutline)
  },
  ...(authStore.canAudit
    ? [
        {
          key: "auditLogs",
          label: renderLabel("审计日志", "/audit-logs"),
          icon: renderIcon(ReaderOutline)
        }
      ]
    : []),
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
])

const activeKey = computed(() => String(route.name || "dashboard"))
const themeIcon = computed(() => (themeStore.isDark ? SunnyOutline : MoonOutline))
</script>

<template>
  <NLayout class="app-shell" has-sider>
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="68"
      :width="232"
      show-trigger
      class="app-sider"
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

      <NMenu :value="activeKey" :options="menuOptions" />
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader bordered class="app-header">
        <div class="header-title">
          <NIcon size="22">
            <DocumentTextOutline />
          </NIcon>
          <span>{{ route.meta.title || "控制台" }}</span>
        </div>

        <div class="header-actions">
          <NTag type="success" size="small" round>Debian 12</NTag>
          <NTag type="info" size="small" round>{{ authStore.user?.role || "未登录" }}</NTag>
          <NButton circle quaternary @click="themeStore.toggleTheme">
            <template #icon>
              <NIcon>
                <component :is="themeIcon" />
              </NIcon>
            </template>
          </NButton>
          <NButton quaternary @click="authStore.signOut">退出</NButton>
        </div>
      </NLayoutHeader>

      <NLayoutContent class="app-content">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.app-shell {
  height: 100vh;
}

.app-sider {
  background:
    linear-gradient(180deg, rgba(15, 118, 110, 0.08), transparent 220px),
    var(--lw-panel);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 16px;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: #0f766e;
  color: #ffffff;
}

.brand-text {
  display: grid;
  line-height: 1.2;
}

.brand-text strong {
  font-size: 16px;
}

.brand-text span {
  color: var(--lw-text-muted);
  font-size: 12px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
}

.header-title,
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
}

.app-content {
  height: calc(100vh - 64px);
  padding: 20px;
  overflow: auto;
}
</style>
