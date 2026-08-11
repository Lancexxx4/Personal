import { useEffect, useState } from "react"
import { ArrowLeft, CalendarDays, Clock3, FolderOpen, PenLine } from "lucide-react"
import type { Post } from "@/data/posts"
import { fetchPost, getStoreMode, type PostMeta } from "@/lib/api"
import { Markdown } from "@/components/Markdown"

export function PostDetail({ slug, posts }: { slug: string; posts: PostMeta[] }) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPost(slug)
      .then((data) => {
        if (!cancelled) setPost(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    getStoreMode().then((m) => {
      if (!cancelled) setCanEdit(m === "api" || m === "github")
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-card/60" />
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-card/60" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-card/40" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <p className="mb-2 text-5xl">🕳️</p>
        <h1 className="mb-2 text-xl font-semibold">文章不存在</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          它可能已经被移动或删除了
        </p>
        <a
          href="#/"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          返回首页
        </a>
      </div>
    )
  }

  // 上一篇 / 下一篇（列表已按时间倒序）
  const index = posts.findIndex((p) => p.slug === slug)
  const newer = index > 0 ? posts[index - 1] : null
  const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null

  return (
    <article>
      <div className="mb-8 flex items-center justify-between">
        <a
          href="#/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回文章列表
        </a>
        {canEdit && (
          <a
            href={`#/edit/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <PenLine className="h-4 w-4" />
            编辑
          </a>
        )}
      </div>

      <header className="mb-8 border-b border-border/60 pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
            <FolderOpen className="h-3.5 w-3.5" />
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {post.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            约 {post.readingTime} 分钟读完
          </span>
        </div>
        <h1 className="mb-4 text-2xl font-bold leading-snug sm:text-3xl">
          {post.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <a
              key={tag}
              href={`#/tags/${encodeURIComponent(tag)}`}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
            >
              #{tag}
            </a>
          ))}
        </div>
      </header>

      <Markdown content={post.content} />

      {/* 上一篇 / 下一篇 */}
      <nav className="mt-14 grid gap-4 border-t border-border/60 pt-8 sm:grid-cols-2">
        {older ? (
          <a
            href={`#/post/${older.slug}`}
            className="post-card group rounded-xl border border-border/70 bg-card/60 p-4"
          >
            <p className="mb-1 text-xs text-muted-foreground">← 上一篇（更早）</p>
            <p className="text-sm font-medium leading-snug group-hover:text-primary">
              {older.title}
            </p>
          </a>
        ) : (
          <div />
        )}
        {newer && (
          <a
            href={`#/post/${newer.slug}`}
            className="post-card group rounded-xl border border-border/70 bg-card/60 p-4 text-right"
          >
            <p className="mb-1 text-xs text-muted-foreground">下一篇（更新）→</p>
            <p className="text-sm font-medium leading-snug group-hover:text-primary">
              {newer.title}
            </p>
          </a>
        )}
      </nav>
    </article>
  )
}
