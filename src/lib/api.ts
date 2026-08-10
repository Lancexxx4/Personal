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

/** 存储模式：本地 Express API → GitHub 仓库 → 内置静态数据 */
export type StoreMode = "api" | "github" | "static"

let mode: StoreMode | null = null

export async function getStoreMode(): Promise<StoreMode> {
  if (mode) return mode
  // 1. 本地后端
  try {
    const res = await fetch("/api/posts", { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      mode = "api"
      return mode
    }
  } catch {
    /* 无本地后端 */
  }
  // 2. GitHub 仓库
  try {
    await ghListPosts()
    mode = "github"
    return mode
  } catch {
    /* GitHub 不可达 */
  }
  // 3. 静态回退
  mode = "static"
  return mode
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

export async function fetchPosts(): Promise<PostMeta[]> {
  const m = await getStoreMode()
  if (m === "api") return request<PostMeta[]>("/api/posts")
  if (m === "github") return ghListPosts()
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
  return staticPosts.find((p) => p.slug === slug) ?? null
}

export async function createPost(input: PostInput & { content: string }): Promise<Post> {
  const m = await getStoreMode()
  if (m === "api") {
    return request<Post>("/api/posts", { method: "POST", body: JSON.stringify(input) })
  }
  if (m === "github") return ghSavePost(input)
  throw new Error("当前为静态模式，无法保存")
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
  throw new Error("当前为静态模式，无法保存")
}

export async function deletePost(slug: string): Promise<void> {
  const m = await getStoreMode()
  if (m === "api") {
    await request(`/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" })
    return
  }
  if (m === "github") return ghDeletePost(slug)
  throw new Error("当前为静态模式，无法删除")
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
