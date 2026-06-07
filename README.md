# LiteWaf Dashboard

LiteWaf Dashboard 是 LiteWaf 的后台管理前端，基于 Vue 3、TypeScript、Vite 和 Naive UI。

## 相关仓库

- 前端管理台：[litewaf-dashboard](https://github.com/newz-max/litewaf-dashboard)
- 后端 API 与项目文档：[litewaf-api](https://github.com/newz-max/litewaf-api)
- OpenResty 数据面网关：[litewaf-gateway](https://github.com/newz-max/litewaf-gateway)
- API、部署、规则和公开文档维护在后端仓库的 `doc/`、`deploy/` 和 `rules/` 目录中；公开文档入口见 `doc/文档索引.md`，日常后台操作见 `doc/使用说明.md`。

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
