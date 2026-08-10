import { posts as staticPosts, type Post } from "@/data/posts"

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

let apiOk: boolean | null = null

/** 探测后端 API 是否可用（结果缓存，静态部署时自动回退到内置数据） */
export async function checkApi(): Promise<boolean> {
  if (apiOk !== null) return apiOk
  try {
    const res = await fetch("/api/posts", { signal: AbortSignal.timeout(3000) })
    apiOk = res.ok
  } catch {
    apiOk = false
  }
  return apiOk
}

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
  if (await checkApi()) return request<PostMeta[]>("/api/posts")
  return staticPosts.map(({ content: _c, ...meta }) => meta)
}

export async function fetchPost(slug: string): Promise<Post | null> {
  if (await checkApi()) {
    try {
      return await request<Post>(`/api/posts/${encodeURIComponent(slug)}`)
    } catch {
      return null
    }
  }
  return staticPosts.find((p) => p.slug === slug) ?? null
}

export async function createPost(input: PostInput): Promise<Post> {
  return request<Post>("/api/posts", { method: "POST", body: JSON.stringify(input) })
}

export async function updatePost(slug: string, input: Partial<PostInput>): Promise<Post> {
  return request<Post>(`/api/posts/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export async function deletePost(slug: string): Promise<void> {
  await request(`/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" })
}

/** 让后端解析 Markdown 原文（含 frontmatter），用于导入时回填表单 */
export async function parseMarkdown(markdown: string): Promise<PostInput & { content: string }> {
  return request("/api/posts/parse", { method: "POST", body: JSON.stringify({ markdown }) })
}
