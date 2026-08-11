---
title: 从零搭建这个博客：技术选型与实现
date: '2026-08-10'
category: 技术
tags:
  - React
  - Vite
  - 博客
  - 前端
excerpt: 这个博客是如何诞生的？记录技术选型过程：React + Vite + Tailwind + Markdown 渲染，纯静态部署。
draft: false
---

你现在看到的这个博客，从空目录到上线只用了一个下午。记录一下技术选型和实现思路。

## 技术栈

```txt
React 19 + TypeScript    视图层
Vite                     构建工具（快就一个字）
Tailwind CSS + shadcn/ui 样式与组件
react-markdown           Markdown 渲染
rehype-highlight         代码语法高亮
```

## 为什么是纯静态

博客的内容更新频率低、没有交互数据，用 SSR 或 CMS 都是杀鸡用牛刀。纯静态的优势：

- **部署简单**：构建产物扔到任何静态托管都能跑
- **速度极快**：没有服务端渲染开销，首屏就是一个 HTML
- **成本为零**：不需要服务器

## 文章数据的组织

文章直接以 TypeScript 对象的形式写在代码里：

```ts
export interface Post {
  slug: string
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  content: string  // Markdown 原文
}
```

后续可以轻松迁移到 `.md` 文件 + `import.meta.glob` 的方案，文章多了再演进。

## Markdown 渲染

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
>
  {post.content}
</ReactMarkdown>
```

- `remark-gfm` 支持表格、删除线、任务列表等 GFM 语法
- `rehype-highlight` 自动给代码块上语法高亮
- 配合 `@tailwindcss/typography` 的 `prose` 类，排版开箱即用

## 路由方案

静态托管最怕路由 404，所以用 **hash 路由**：

```txt
#/              → 文章列表
#/post/:slug    → 文章详情
#/tags          → 标签分类
#/about         → 关于我
```

不依赖任何服务端配置，刷新、分享链接都不会 404。

## 后续计划

- [ ] 接入评论系统（giscus）
- [ ] RSS 订阅
- [ ] 全文搜索
- [ ] 文章迁移到独立 Markdown 文件

博客是程序员的自留地，欢迎常来。
