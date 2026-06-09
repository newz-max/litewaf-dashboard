<script setup lang="ts">
import { computed } from "vue"
import { themePresets, type ThemeDensity, type ThemeMode, type ThemeMotion } from "@/theme/presets"
import { useThemeStore } from "@/stores/theme"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const themeStore = useThemeStore()

const presetOptions = computed(() =>
  themePresets.map((preset) => ({
    label: preset.label,
    value: preset.id
  }))
)

const previewRows = computed(() => [
  { label: t("settings.preview.sqlInjection"), value: t("settings.preview.blocked"), tone: "danger" },
  { label: t("settings.preview.highFrequency"), value: t("settings.preview.observing"), tone: "warning" },
  { label: t("settings.preview.release"), value: t("settings.preview.ready"), tone: "success" }
])

function updateMode(value: string | number) {
  themeStore.setMode(value as ThemeMode)
}

function updateDensity(value: string | number) {
  themeStore.setDensity(value as ThemeDensity)
}

function updateMotion(value: string | number) {
  themeStore.setMotion(value as ThemeMotion)
}

function updateRadius(value: number | null) {
  if (typeof value === "number") {
    themeStore.setRadius(value)
  }
}
</script>

<template>
  <section class="section section-pad appearance-section">
    <div class="section-head">
      <div>
        <h2 class="section-title">{{ t("settings.appearanceTitle") }}</h2>
        <p class="section-subtitle">{{ t("settings.appearanceSubtitle") }}</p>
      </div>
      <NButton secondary @click="themeStore.resetTheme">{{ t("settings.resetDefault") }}</NButton>
    </div>

    <div class="appearance-grid">
      <div class="control-panel">
        <NForm label-placement="top">
          <NFormItem :label="t('settings.preset')">
            <NSelect
              :value="themeStore.settings.presetId"
              :options="presetOptions"
              @update:value="themeStore.setPreset"
            />
          </NFormItem>

          <NFormItem :label="t('settings.displayMode')">
            <NRadioGroup :value="themeStore.settings.mode" @update:value="updateMode">
              <NRadioButton value="system">{{ t("settings.systemMode") }}</NRadioButton>
              <NRadioButton value="light">{{ t("settings.lightMode") }}</NRadioButton>
              <NRadioButton value="dark">{{ t("settings.darkMode") }}</NRadioButton>
            </NRadioGroup>
          </NFormItem>

          <NFormItem :label="t('settings.density')">
            <NRadioGroup :value="themeStore.settings.density" @update:value="updateDensity">
              <NRadioButton value="comfortable">{{ t("common.comfortable") }}</NRadioButton>
              <NRadioButton value="compact">{{ t("common.compact") }}</NRadioButton>
            </NRadioGroup>
          </NFormItem>

          <div class="inline-controls">
            <NFormItem :label="t('settings.accentColor')">
              <NColorPicker
                :value="themeStore.settings.accentColor"
                :show-alpha="false"
                @update:value="themeStore.setAccentColor"
              />
            </NFormItem>

            <NFormItem :label="t('settings.radius')">
              <NInputNumber
                :value="themeStore.settings.radius"
                :min="4"
                :max="12"
                :step="1"
                @update:value="updateRadius"
              />
            </NFormItem>
          </div>

          <NFormItem :label="t('settings.motion')">
            <NRadioGroup :value="themeStore.settings.motion" @update:value="updateMotion">
              <NRadioButton value="on">{{ t("settings.motionOn") }}</NRadioButton>
              <NRadioButton value="reduced">{{ t("settings.motionReduced") }}</NRadioButton>
            </NRadioGroup>
          </NFormItem>
        </NForm>
      </div>

      <div class="preview-panel">
        <div class="preview-card">
          <div class="preview-topline">
            <span>{{ t("settings.livePreview") }}</span>
            <NTag type="success" size="small">{{ themeStore.activeModeLabel }}</NTag>
          </div>
          <div class="preview-title">{{ t("settings.previewTitle") }}</div>
          <div class="preview-metrics">
            <div class="preview-metric">
              <span>{{ t("settings.wafHits") }}</span>
              <strong>1,286</strong>
            </div>
            <div class="preview-metric danger">
              <span>{{ t("settings.blocked") }}</span>
              <strong>312</strong>
            </div>
            <div class="preview-metric">
              <span>{{ t("settings.observed") }}</span>
              <strong>74</strong>
            </div>
          </div>
          <NAlert type="warning" :bordered="false">
            {{ t("settings.previewNotice") }}
          </NAlert>
          <div class="preview-rows" :aria-label="t('settings.previewRowsLabel')">
            <div
              v-for="row in previewRows"
              :key="row.label"
              class="preview-row"
              :class="`preview-row-${row.tone}`"
            >
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
            </div>
          </div>
          <div class="preview-actions">
            <NButton type="primary">{{ t("settings.primaryAction") }}</NButton>
            <NButton secondary>{{ t("settings.secondaryAction") }}</NButton>
          </div>
          <div class="palette-row">
            <span
              v-for="color in themeStore.settings.chartPalette"
              :key="color"
              class="palette-chip"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.appearance-section {
  overflow: hidden;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 760;
}

.section-subtitle {
  margin: 5px 0 0;
  color: var(--lw-text-muted);
  font-size: 13px;
}

.appearance-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  gap: 18px;
}

.control-panel,
.preview-panel {
  min-width: 0;
}

.inline-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 12px;
}

.preview-card {
  display: grid;
  gap: 14px;
  min-height: 100%;
  padding: 18px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--lw-accent) 14%, transparent), transparent 42%),
    var(--lw-panel-muted);
  box-shadow: var(--lw-shadow);
}

.preview-topline,
.preview-actions,
.palette-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.preview-topline {
  justify-content: space-between;
  color: var(--lw-text-muted);
  font-size: 12px;
}

.preview-title {
  color: var(--lw-text);
  font-size: 20px;
  font-weight: 780;
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.preview-metric {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
}

.preview-metric span {
  color: var(--lw-text-muted);
  font-size: 12px;
}

.preview-metric strong {
  color: var(--lw-accent);
  font-size: 22px;
  line-height: 1;
}

.preview-metric.danger strong {
  color: var(--lw-danger);
}

.preview-rows {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.preview-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);
  background: color-mix(in srgb, var(--lw-panel) 86%, var(--lw-bg));
}

.preview-row span {
  min-width: 0;
  overflow: hidden;
  color: var(--lw-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-row strong {
  color: var(--lw-text);
  font-size: 12px;
}

.preview-row-danger strong {
  color: var(--lw-danger);
}

.preview-row-warning strong {
  color: var(--lw-warning);
}

.preview-row-success strong {
  color: var(--lw-success);
}

.palette-chip {
  flex: 0 0 auto;
  width: 28px;
  height: 14px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lw-panel) 72%, var(--lw-border));
}

@media (max-width: 980px) {
  .appearance-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .section-head,
  .preview-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .palette-row {
    flex-wrap: wrap;
  }

  .inline-controls,
  .preview-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
