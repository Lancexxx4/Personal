# Lance 的个人博客

基于 React + Vite + Tailwind 的个人博客，文章以 Markdown 文件（frontmatter）为唯一数据源，Express 提供薄 API 层。

## 功能

- 文章列表 / 分类筛选 / 标签云
- Markdown 渲染（GFM、代码高亮、表格、任务列表）
- 写作页：在线编辑、实时预览、草稿
- 支持导入 .md 文件创建文章（自动解析 frontmatter）
- 双模式：本地后端模式可读写；纯静态部署自动回退内置数据（只读）

## 目录结构

```
src/                  前端（React 19 + Vite + Tailwind + shadcn/ui）
src/data/posts.ts     内置静态文章（无后端时的回退数据）
server/index.js       Express API + 静态托管（端口 3001）
server/store.js       Markdown 文件存储层（gray-matter）
server/data/posts/    文章数据源（slug.md）
```

## 本地运行

```bash
npm install
npm run build
npm run server        # http://localhost:3001（完整功能：写作/导入/编辑/删除）
```

开发模式：

```bash
npm run server        # 终端 1：后端
npm run dev           # 终端 2：Vite 热更新（已配置 /api 代理）
```

## 文章格式

`server/data/posts/my-post.md`：

```markdown
---
title: 文章标题
date: 2026-08-11
category: 技术
tags: [React, 前端]
excerpt: 一句话摘要
draft: false
---

## 正文（Markdown）
```

## API

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | /api/posts | 文章列表（不含草稿） |
| GET | /api/posts/:slug | 文章详情（含正文） |
| POST | /api/posts | 创建（字段或 `{markdown}` 原文导入） |
| POST | /api/posts/parse | 解析 Markdown 导入预览 |
| PUT | /api/posts/:slug | 更新 |
| DELETE | /api/posts/:slug | 删除 |

设置 `ADMIN_TOKEN` 环境变量后，写操作需携带 `x-admin-token` 请求头。

## 部署

- **GitHub Pages**：push 到 main 分支即自动构建部署（见 `.github/workflows/deploy.yml`）
- **完整后端版**：在任何 Node 20+ 服务器上 `npm ci && npm run build && npm run server`

## 存储模式（自动探测）

| 模式 | 触发条件 | 读写能力 |
| ---- | -------- | -------- |
| 本地 API | `npm run server` 运行中 | 读写（本地 md 文件） |
| GitHub | 纯静态部署（如 Pages），可访问 GitHub API | 读公开；写作时填入 fine-grained Token（Contents: Read and write，仅存浏览器）即可直接提交到仓库 |
| 静态回退 | 以上均不可用 | 只读（内置数据） |
