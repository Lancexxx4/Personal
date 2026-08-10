/**
 * 种子脚本：把前端内置的 src/data/posts.ts 迁移为 server/data/posts/*.md
 * 用法: node server/seed.mjs   （仅在文章目录为空时写入）
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createPost, POSTS_DIR } from "./store.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const tmpFile = path.join(__dirname, ".tmp-posts.cjs")

// 已存在文章则跳过，避免覆盖用户数据
const existing = fs.existsSync(POSTS_DIR)
  ? fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"))
  : []
if (existing.length > 0) {
  console.log(`[seed] 已有 ${existing.length} 篇文章，跳过迁移`)
  process.exit(0)
}

// 用项目自带的 esbuild JS API 把 TS 数据文件转成 CJS 再加载
const { buildSync } = await import(pathToFileURL(path.join(root, "node_modules", "esbuild", "lib", "main.js")).href)
buildSync({
  entryPoints: [path.join(root, "src", "data", "posts.ts")],
  format: "cjs",
  platform: "node",
  outfile: tmpFile,
})

const { posts } = await import(pathToFileURL(tmpFile).href)

for (const p of posts) {
  createPost({
    title: p.title,
    slug: p.slug,
    date: p.date,
    category: p.category,
    tags: p.tags,
    excerpt: p.excerpt,
    content: p.content,
  })
  console.log(`[seed] 已迁移: ${p.slug}`)
}

try { fs.unlinkSync(tmpFile) } catch { /* 忽略清理失败 */ }
console.log(`[seed] 完成，共 ${posts.length} 篇`)
