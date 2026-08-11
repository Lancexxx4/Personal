import { posts as staticPosts, type Post } from "@/data/posts"
import { ghListPosts, ghGetPost, ghSavePost, ghDeletePost } from "@/lib/github"
import { parseFrontmatter, slugify } from "@/lib/frontmatter"

export type PostMeta = Omit<Post, "content">

export interface PostInput {
  title: string
  slug?: string
  date?: string
  category?: string
  tags?: string[]
  excerpt?: string
  draft?: boolean
  content?: string
}

/**
 * 存储模式（按优先级自动探测）：
 * - api：本地 Express 后端（npm run server），读写本地 md 文件
 * - github：浏览器可直连 GitHub API，读公开、写需 Token
 * - pages：同源静态文件（构建时导出的 posts/ 目录），只读但永远可达
 * - static：内置打包数据，最后兜底
 */
export type StoreMode = "api" | "github" | "pages" | "static"

let mode: StoreMode | null = null

export async function getStoreMode(): Promise<StoreMode> {
  if (mode) return mode
  try {
    const res = await fetch("/api/posts", { signal: AbortSignal.timeout(3000) })
    if (res.ok) return (mode = "api")
  } catch {
    /* 无本地后端 */
  }
  try {
    await ghListPosts()
    return (mode = "github")
  } catch {
    /* GitHub API 不可达 */
  }
  try {
    const res = await fetch("posts/index.json", { cache: "no-store" })
    if (res.ok) return (mode = "pages")
  } catch {
    /* 无静态导出 */
  }
  return (mode = "static")
}

/** 是否可写作（编辑按钮/写作页可用） */
export function canWrite(m: StoreMode): boolean {
  return m === "api" || m === "github"
}

/** 兼容旧调用 */
export const checkApi = async () => (await getStoreMode()) === "api"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    let msg = res.statusText
    try {
      msg = (await res.json()).error || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json()
}

/** 同源静态文件：md 原文 → Post */
function postFromRaw(slug: string, raw: string): Post {
  const { data, content } = parseFrontmatter(raw)
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    category: data.category || "随笔",
    tags: data.tags || [],
    excerpt:
      data.excerpt || content.replace(/[#>*`\-\[\]|]/g, "").trim().slice(0, 120),
    readingTime: Math.max(1, Math.round(content.replace(/\s/g, "").length / 400)),
    content,
  }
}

async function pagesGetPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`posts/${encodeURIComponent(slug)}.md`, { cache: "no-store" })
    if (!res.ok) return null
    return postFromRaw(slug, await res.text())
  } catch {
    return null
  }
}

export async function fetchPosts(): Promise<PostMeta[]> {
  const m = await getStoreMode()
  if (m === "api") return request<PostMeta[]>("/api/posts")
  if (m === "github") return ghListPosts()
  if (m === "pages") return (await request<PostMeta[]>("posts/index.json", { cache: "no-store" }))
  return staticPosts.map(({ content: _c, ...meta }) => meta)
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const m = await getStoreMode()
  if (m === "api") {
    try {
      return await request<Post>(`/api/posts/${encodeURIComponent(slug)}`)
    } catch {
      return null
    }
  }
  if (m === "github") return ghGetPost(slug)
  if (m === "pages") return pagesGetPost(slug)
  return staticPosts.find((p) => p.slug === slug) ?? null
}

export async function createPost(input: PostInput & { content: string }): Promise<Post> {
  const m = await getStoreMode()
  if (m === "api") {
    return request<Post>("/api/posts", { method: "POST", body: JSON.stringify(input) })
  }
  if (m === "github") return ghSavePost(input)
  throw new Error("当前环境不支持写作：请本地运行 npm run server，或确保浏览器能访问 GitHub API 后刷新")
}

export async function updatePost(
  slug: string,
  input: Partial<PostInput> & { content: string }
): Promise<Post> {
  const m = await getStoreMode()
  if (m === "api") {
    return request<Post>(`/api/posts/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  }
  if (m === "github") return ghSavePost({ title: "", ...input } as PostInput & { content: string }, slug)
  throw new Error("当前环境不支持写作：请本地运行 npm run server，或确保浏览器能访问 GitHub API 后刷新")
}

export async function deletePost(slug: string): Promise<void> {
  const m = await getStoreMode()
  if (m === "api") {
    await request(`/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" })
    return
  }
  if (m === "github") return ghDeletePost(slug)
  throw new Error("当前环境不支持删除：请本地运行 npm run server，或确保浏览器能访问 GitHub API 后刷新")
}

/** 解析导入的 Markdown（api 模式走后端，其余模式本地解析） */
export async function parseMarkdown(markdown: string): Promise<PostInput & { content: string }> {
  const m = await getStoreMode()
  if (m === "api") {
    return request("/api/posts/parse", { method: "POST", body: JSON.stringify({ markdown }) })
  }
  const { data, content } = parseFrontmatter(markdown)
  let title = data.title
  if (!title) {
    const h = content.match(/^#\s+(.+)$/m)
    title = h ? h[1].trim() : `未命名-${Date.now()}`
  }
  return {
    title,
    slug: data.slug || slugify(title),
    date: data.date || "",
    category: data.category || "",
    tags: data.tags || [],
    excerpt: data.excerpt || "",
    draft: Boolean(data.draft),
    content,
  }
}
