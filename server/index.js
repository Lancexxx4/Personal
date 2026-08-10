import express from "express"
import cors from "cors"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  parseMarkdownImport,
} from "./store.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ""

app.use(cors())
app.use(express.json({ limit: "5mb" }))

/** 简单鉴权：设置了 ADMIN_TOKEN 环境变量后，写操作需带 x-admin-token 头 */
function guard(req, res, next) {
  if (!ADMIN_TOKEN) return next()
  if (req.headers["x-admin-token"] === ADMIN_TOKEN) return next()
  return res.status(401).json({ error: "未授权：缺少或错误的 x-admin-token" })
}

// ---- 只读接口 ----

app.get("/api/posts", (req, res) => {
  const includeDrafts = ADMIN_TOKEN
    ? req.headers["x-admin-token"] === ADMIN_TOKEN
    : req.query.all === "1"
  res.json(listPosts({ includeDrafts }))
})

app.get("/api/posts/:slug", (req, res) => {
  const post = getPost(req.params.slug)
  if (!post) return res.status(404).json({ error: "文章不存在" })
  res.json(post)
})

// ---- 写操作接口 ----

/** 创建文章：支持 {title, slug, ...content} 或 {markdown: 带 frontmatter 的原文} */
app.post("/api/posts", guard, (req, res) => {
  try {
    const input = req.body?.markdown
      ? parseMarkdownImport(req.body.markdown)
      : req.body
    if (!input?.title) return res.status(400).json({ error: "缺少标题" })
    const post = createPost(input)
    res.status(201).json(post)
  } catch (e) {
    res.status(409).json({ error: e.message })
  }
})

/** 预览解析导入的 Markdown（不落盘），供前端导入时回填表单 */
app.post("/api/posts/parse", guard, (req, res) => {
  if (!req.body?.markdown) return res.status(400).json({ error: "缺少 markdown 字段" })
  res.json(parseMarkdownImport(req.body.markdown))
})

app.put("/api/posts/:slug", guard, (req, res) => {
  const post = updatePost(req.params.slug, req.body || {})
  if (!post) return res.status(404).json({ error: "文章不存在" })
  res.json(post)
})

app.delete("/api/posts/:slug", guard, (req, res) => {
  if (!deletePost(req.params.slug)) return res.status(404).json({ error: "文章不存在" })
  res.json({ ok: true })
})

// ---- 统一错误处理（API 永远返回 JSON） ----
app.use((err, _req, res, _next) => {
  console.error("[lance-blog] 错误:", err.message)
  res.status(500).json({ error: err.message || "服务器内部错误" })
})

// ---- 生产模式：托管前端构建产物 ----

const distDir = path.join(__dirname, "..", "dist")
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"))
  })
}

app.listen(PORT, () => {
  console.log(`[lance-blog] API + 静态服务已启动: http://localhost:${PORT}`)
  console.log(`[lance-blog] 文章目录: ${path.join(__dirname, "data", "posts")}`)
  if (!ADMIN_TOKEN) {
    console.log("[lance-blog] 提示: 未设置 ADMIN_TOKEN，写接口未加保护（仅限本机使用）")
  }
})
