import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from "unplugin-vue-components/resolvers"

const apiProxyTarget = process.env.VITE_DEV_PROXY_TARGET || "http://localhost:8080"

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
        {
          "naive-ui": [
            "useDialog",
            "useLoadingBar",
            "useMessage",
            "useNotification"
          ]
        }
      ],
      dts: "src/auto-imports.d.ts"
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: "src/components.d.ts"
    })
  ],
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          naive: ["naive-ui", "@vicons/ionicons5"],
          charts: ["echarts", "vue-echarts", "echarts-gl", "@geo-maps/countries-land-10km"]
        }
      }
    },
    chunkSizeWarningLimit: 900
  }
})
