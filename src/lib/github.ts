/**
 * GitHub-as-CMS 存储适配层
 * 公开仓库读取无需鉴权；写操作需要用户的 GitHub Token（仅存浏览器 localStorage）
 */
import type { Post } from "@/data/posts"
import type { PostInput, PostMeta } from "@/lib/api"
import { parseFrontmatter, stringifyFrontmatter, slugify } from "@/lib/frontmatter"

const OWNER = "Lancexxx4"
const REPO = "Personal"
const BRANCH = "main"
const POSTS_PATH = "server/data/posts"
const API = `https://api.github.com/repos/${OWNER}/${REPO}`
const TOKEN_KEY = "lance-blog-github-token"

// ---- Token 管理 ----

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ""
}

export function setToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// ---- 工具 ----

function headers(withAuth = false): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const token = getToken()
  if (withAuth && token) h.Authorization = `Bearer ${token}`
  return h
}

/** GitHub API 的 base64 内容解码（支持中文） */
function decodeContent(base64: string): string {
  const bin = atob(base64.replace(/\n/g, ""))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** 中文安全的 base64 编码 */
function encodeContent(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

function readingTime(content: string): number {
  return Math.max(1, Math.round(content.replace(/\s/g, "").length / 400))
}

function toPost(slug: string, raw: string): Post {
  const { data, content } = parseFrontmatter(raw)
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    category: data.category || "随笔",
    tags: data.tags || [],
    excerpt:
      data.excerpt ||
      content.replace(/[#>*`\-\[\]|]/g, "").trim().slice(0, 120),
    readingTime: readingTime(content),
    content,
  }
}

async function ghFetch<T>(url: string, init?: RequestInit): Promise<T> {
  // no-store：GitHub API 未认证响应带 max-age=60 的 CDN 缓存，
  // 不禁用会导致删除/新建后列表长时间不刷新，看起来像"操作没生效"
  const res = await fetch(url, { cache: "no-store", ...init })
  if (!res.ok) {
    let msg = `${res.status}`
    try {
      msg = (await res.json()).message || msg
    } catch {
      /* ignore */
    }
    throw new Error(`GitHub API 错误: ${msg}`)
  }
  return res.json()
}

// ---- 读取 ----

interface ContentEntry {
  name: string
  type: string
}

/** 列出文章（自动过滤草稿） */
export async function ghListPosts(): Promise<PostMeta[]> {
  const entries = await ghFetch<ContentEntry[]>(
    `${API}/contents/${POSTS_PATH}?ref=${BRANCH}`,
    { headers: headers() }
  )
  const files = entries.filter((e) => e.type === "file" && e.name.endsWith(".md"))
  const posts = await Promise.all(
    files.map(async (f) => {
      const slug = f.name.replace(/\.md$/, "")
      const post = await ghGetPost(slug)
      return post
    })
  )
  return posts
    .filter((p): p is Post => p !== null)
    .map(({ content: _c, ...meta }) => meta)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** 获取单篇文章 */
export async function ghGetPost(slug: string): Promise<Post | null> {
  try {
    const file = await ghFetch<{ content: string }>(
      `${API}/contents/${POSTS_PATH}/${encodeURIComponent(slug)}.md?ref=${BRANCH}`,
      { headers: headers() }
    )
    const post = toPost(slug, decodeContent(file.content))
    return post
  } catch {
    return null
  }
}

// ---- 写入 ----

/** 获取文件 sha（更新/删除时需要）；不存在返回 undefined */
async function getFileSha(slug: string): Promise<string | undefined> {
  try {
    const file = await ghFetch<{ sha: string }>(
      `${API}/contents/${POSTS_PATH}/${encodeURIComponent(slug)}.md?ref=${BRANCH}`,
      { headers: headers(true) }
    )
    return file.sha
  } catch {
    return undefined
  }
}

/** 创建或更新文章（upsert） */
export async function ghSavePost(
  input: PostInput & { content: string },
  originalSlug?: string
): Promise<Post> {
  const token = getToken()
  if (!token) throw new Error("请先填写 GitHub Token")

  const slug = originalSlug || slugify(input.slug || input.title)
  const raw = stringifyFrontmatter(
    {
      title: input.title,
      date: input.date || new Date().toISOString().slice(0, 10),
      category: input.category || "随笔",
      tags: input.tags || [],
      excerpt: input.excerpt,
      draft: input.draft,
    },
    input.content || ""
  )

  const existingSha = await getFileSha(slug)
  if (!originalSlug && existingSha) {
    throw new Error(`slug 已存在: ${slug}`)
  }

  await ghFetch(`${API}/contents/${POSTS_PATH}/${encodeURIComponent(slug)}.md`, {
    method: "PUT",
    headers: { ...headers(true), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: originalSlug ? `docs: 更新文章 ${input.title}` : `docs: 新建文章 ${input.title}`,
      content: encodeContent(raw),
      branch: BRANCH,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  })
  return toPost(slug, raw)
}

/** 删除文章 */
export async function ghDeletePost(slug: string): Promise<void> {
  const token = getToken()
  if (!token) throw new Error("请先填写 GitHub Token")
  const sha = await getFileSha(slug)
  if (!sha) throw new Error("文章不存在")
  await ghFetch(`${API}/contents/${POSTS_PATH}/${encodeURIComponent(slug)}.md`, {
    method: "DELETE",
    headers: { ...headers(true), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `docs: 删除文章 ${slug}`,
      sha,
      branch: BRANCH,
    }),
  })
}
