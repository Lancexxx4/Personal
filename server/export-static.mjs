/**
 * 构建前把文章导出为静态文件（public/posts/），随站点一起部署。
 * 这样前端读取文章走同源静态文件，不依赖 api.github.com 的可达性。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { listPosts, POSTS_DIR } from "./store.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, "..", "public", "posts")

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

// 复制全部 md 文件（含草稿，前端按 index.json 过滤展示）
const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"))
for (const f of files) {
  fs.copyFileSync(path.join(POSTS_DIR, f), path.join(outDir, f))
}

// 生成文章索引（不含草稿）
const index = listPosts()
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2), "utf-8")

console.log(`[export-static] 已导出 ${files.length} 篇文章到 public/posts/`)
