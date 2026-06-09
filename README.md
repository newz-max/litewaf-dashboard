# LiteWaf Dashboard

LiteWaf Dashboard 是 LiteWaf 的后台管理前端，基于 Vue 3、TypeScript、Vite 和 Naive UI。

English summary: LiteWaf Dashboard is the operator UI for LiteWaf. It is built with Vue 3, TypeScript, Vite, Naive UI, Pinia, Vue Router, ECharts, and Axios. It talks to the LiteWaf API through `/api`, and all API, deployment, rule, and operator documentation is maintained in the API repository.

## 相关仓库

- 前端管理台：[litewaf-dashboard](https://github.com/newz-max/litewaf-dashboard)
- 后端 API 与项目文档：[litewaf-api](https://github.com/newz-max/litewaf-api)
- OpenResty 数据面网关：[litewaf-gateway](https://github.com/newz-max/litewaf-gateway)
- API、部署、规则和公开文档维护在后端仓库的 `doc/`、`deploy/` 和 `rules/` 目录中；公开文档入口见 `doc/文档索引.md`，日常后台操作见 `doc/使用说明.md`。

## English Guide

Related repositories:

- Dashboard: [litewaf-dashboard](https://github.com/newz-max/litewaf-dashboard)
- API and project docs: [litewaf-api](https://github.com/newz-max/litewaf-api)
- OpenResty data-plane gateway: [litewaf-gateway](https://github.com/newz-max/litewaf-gateway)

Use this repository for dashboard source code only. Public API, deployment, rule, and operator documentation lives in the API repository under `doc/`, `deploy/`, and `rules/`. Start from `doc/文档索引.md`; day-to-day dashboard operation is covered in `doc/使用说明.md`.

Local development:

```bash
npm install
npm run dev
```

The Vite dev server defaults to `http://localhost:5173` and proxies `/api` to `http://localhost:8080`.

Build and container image:

```bash
npm run build
docker build -t litewaf-dashboard .
```

When contributing, keep page data connected to real API calls. If an API is unavailable, show loading, empty, or error states instead of hard-coded mock business data.

## 技术栈

```text
Vue 3
TypeScript
Vite
Naive UI
Pinia
Vue Router
ECharts
Axios
```

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

开发环境会将 `/api` 代理到：

```text
http://localhost:8080
```

## 构建

```bash
npm run build
```

## Docker

```bash
docker build -t litewaf-dashboard .
docker run --rm -p 8081:80 litewaf-dashboard
```

镜像构建阶段使用 `node:22-bookworm`，运行阶段使用 `nginx:1.27-alpine`，以减少前端静态服务运行时体积。宿主机推荐 Debian 12 minimal，同时兼容主流 Linux + Docker Compose 环境。

## 许可证

本仓库采用 [Apache License 2.0](LICENSE)。你可以按该许可证使用、复制、修改、分发和商业使用本项目。
