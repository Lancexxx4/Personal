import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const POSTS_DIR = path.join(__dirname, "data", "posts")

fs.mkdirSync(POSTS_DIR, { recursive: true })

/** 生成 URL 友好的 slug：保留中文、字母、数字、连字符 */
export function slugify(text) {
  const slug = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return slug || `post-${Date.now()}`
}

/** 估算阅读时长：中文约 400 字/分钟 */
function readingTime(content) {
  const chars = (content || "").replace(/\s/g, "").length
  return Math.max(1, Math.round(chars / 400))
}

function filePath(slug) {
  return path.join(POSTS_DIR, `${slug}.md`)
}

function toMeta(slug, data, content) {
  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : "",
    category: data.category || "随笔",
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: data.excerpt || (content || "").replace(/[#>*`\-\[\]|]/g, "").trim().slice(0, 120),
    draft: Boolean(data.draft),
    readingTime: readingTime(content),
  }
}

/** 列出全部文章元信息（按日期倒序），默认不含草稿 */
export function listPosts({ includeDrafts = false } = {}) {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"))
  const posts = files.map((f) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf-8")
    const { data, content } = matter(raw)
    return toMeta(f.replace(/\.md$/, ""), data, content)
  })
  return posts
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** 获取单篇文章（含 Markdown 正文） */
export function getPost(slug) {
  const fp = filePath(slug)
  if (!fs.existsSync(fp)) return null
  const { data, content } = matter(fs.readFileSync(fp, "utf-8"))
  return { ...toMeta(slug, data, content), content }
}

/** 创建文章，返回元信息；slug 冲突时抛错 */
export function createPost(input) {
  const slug = slugify(input.slug || input.title)
  if (fs.existsSync(filePath(slug))) {
    throw new Error(`slug 已存在: ${slug}`)
  }
  writePost(slug, input)
  return getPost(slug)
}

/** 更新文章（slug 不可变） */
export function updatePost(slug, input) {
  if (!fs.existsSync(filePath(slug))) return null
  const existing = getPost(slug)
  writePost(slug, { ...existing, ...input, slug })
  return getPost(slug)
}

export function deletePost(slug) {
  const fp = filePath(slug)
  if (!fs.existsSync(fp)) return false
  try {
    fs.unlinkSync(fp)
  } catch (e) {
    // 某些沙箱环境会拦截 unlink 但实际已删除；文件仍在才是真失败
    if (fs.existsSync(fp)) throw e
  }
  return true
}

function writePost(slug, input) {
  const frontmatter = {
    title: input.title || slug,
    date: input.date || new Date().toISOString().slice(0, 10),
    category: input.category || "随笔",
    tags: Array.isArray(input.tags) ? input.tags : [],
    excerpt: input.excerpt || "",
    draft: Boolean(input.draft),
  }
  const md = matter.stringify(`\n${(input.content || "").trim()}\n`, frontmatter)
  fs.writeFileSync(filePath(slug), md, "utf-8")
}

/**
 * 解析导入的 Markdown 原文（可带 frontmatter），返回结构化字段。
 * 无 frontmatter 时自动提取首个 # 标题作为文章标题。
 */
export function parseMarkdownImport(raw) {
  const { data, content } = matter(raw || "")
  let title = data.title
  if (!title) {
    const m = content.match(/^#\s+(.+)$/m)
    title = m ? m[1].trim() : `未命名-${Date.now()}`
  }
  return {
    title,
    slug: data.slug || slugify(title),
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : "",
    category: data.category || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: data.excerpt || "",
    draft: Boolean(data.draft),
    content: content.trim(),
  }
}
