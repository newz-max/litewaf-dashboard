# LiteWaf Dashboard 协作指南

## 仓库定位

本目录是 LiteWaf 后台管理页面的独立 Git 仓库，负责站点、规则、策略、发布、审计、黑白名单、限流和登录鉴权等控制台界面。

仓库边界：

- 当前目录 `codes/litewaf-dashboard` 是实际 Git 仓库。
- 根目录 `D:\Project\web_safe` 不是 Git 仓库。
- 后端改动在 `codes/litewaf-api` 仓库中提交。
- 网关目录 `codes/litewaf-gateway` 当前不是 Git 仓库。

## 技术栈

- Vue 3 + TypeScript。
- Vite 构建。
- Naive UI 组件库。
- Pinia 状态管理。
- Vue Router 路由。
- Axios API 客户端。
- ECharts / vue-echarts 用于图表。

## 目录职责

```text
src/api/
  Axios 客户端、API 类型和请求函数。

src/stores/
  Pinia store，例如主题、认证状态。

src/router/
  路由表、页面标题、登录守卫。

src/layouts/
  控制台主布局、侧边栏、顶部操作区。

src/views/
  路由级页面组件，组合 API 数据、表格、表单和页面状态。

src/composables/
  可复用状态和副作用逻辑。

src/assets/
  全局基础样式和设计变量。
```

## Vue 编码约定

- 统一使用 Composition API。
- SFC 使用 `<script setup lang="ts">`。
- SFC 顺序保持为 `<script>`、`<template>`、`<style scoped>`。
- 页面组件负责组合和展示；可复用或复杂逻辑抽到 `src/composables/`。
- 组件状态尽量保持最小，派生数据使用 `computed`。
- 原始表格数据来自 API，不在页面写 mock 业务数据。
- 空数据使用 `NEmpty`，错误状态使用 `NAlert` 或消息提示。
- 列表渲染必须使用稳定 key，不把 `v-if` 和 `v-for` 放在同一个元素上。
- 不使用 `v-html` 渲染不可信内容。

## API 和状态约定

- API 类型和请求函数统一放在 `src/api/litewaf.ts`。
- Axios 实例和拦截器统一放在 `src/api/client.ts`。
- 受保护 API 请求通过认证 store 提供 Bearer Token。
- API 返回 401 时应清理登录状态并回到登录页。
- Pinia store 在路由守卫中使用时，必须在 guard 函数内部调用 `useXxxStore()`。
- 不在视图组件中硬编码 API base URL，使用 `VITE_API_BASE_URL`。

## 权限和页面约定

- 登录页使用真实 `/api/v1/auth/login`，成功后保存 token、过期时间和用户角色。
- 路由使用 `meta.requiresAuth` 标记需要登录的页面。
- 角色边界：
  - `admin`：显示写入、发布、回滚等操作。
  - `auditor`：可查看审计和只读数据，不显示写操作。
  - `readonly`：只读配置，不显示写操作或审计入口。
- 菜单和按钮都要根据角色隐藏或禁用，不只依赖后端 403。
- 即使前端隐藏按钮，后端仍是最终权限边界。

## Naive UI 使用约定

- 根组件继续使用 `NConfigProvider`、`NMessageProvider`、`NNotificationProvider`、`NDialogProvider`、`NLoadingBarProvider`。
- 管理台布局使用 `NLayout`、`NLayoutSider`、`NLayoutHeader`。
- 表格优先使用 `NDataTable`。
- 表单优先使用 `NForm`、`NInput`、`NSelect`、`NInputNumber`、`NSwitch`、`NDatePicker`。
- 危险操作使用确认流程或清晰按钮状态。
- 不做营销式 landing page，默认首屏应是可操作的控制台。

## 样式和体验约定

- 样式优先写在组件内 `scoped CSS`，全局变量和基础样式放在 `src/assets/main.css`。
- 控制台界面保持克制、清晰、适合运维扫描；避免装饰性过强的页面。
- 卡片和面板不要层层嵌套，表格、筛选、表单应保持紧凑。
- 按钮、表单和表格在移动和桌面宽度下不能出现文字溢出或重叠。
- 图标优先使用现有 `@vicons/ionicons5`，不要手写不必要的 SVG。

## 测试和验证

常用命令：

```bash
npm install
npm run dev
npm run build
docker build -t litewaf-dashboard .
```

提交前至少运行：

```bash
npm run build
```

验证重点：

- TypeScript 类型检查通过。
- 登录、401 清理、路由守卫正常。
- 表格 loading、empty、error 状态正常。
- 角色化菜单和按钮展示符合权限。
- 发布确认、回滚、黑白名单、限流等页面使用真实 API。

## Git 约定

- Git commit message 默认使用中文。
- 不提交 `node_modules/`、`dist/`、日志文件或 `.env` 文件。
- 不回滚用户已有改动，除非用户明确要求。
