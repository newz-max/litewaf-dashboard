# LiteWaf Dashboard

> Language / 语言: [中文](README.md) | [English](README.en.md)

LiteWaf Dashboard is the operator UI for LiteWaf. It is built with Vue 3, TypeScript, Vite, Naive UI, Pinia, Vue Router, ECharts, and Axios. It talks to the LiteWaf API through `/api`, and all API, deployment, rule, and operator documentation is maintained in the API repository.

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
