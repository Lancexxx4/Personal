import { useState } from "react"
import type { PostMeta } from "@/lib/api"
import { PostCard } from "@/components/PostCard"

export function Home({ posts, loading }: { posts: PostMeta[]; loading: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categories = [...new Set(posts.map((p) => p.category))]
  const filtered = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts

  return (
    <div>
      {/* 头部介绍 */}
      <section className="mb-10">
        <p className="mb-3 text-sm font-medium tracking-widest text-primary">
          WELCOME TO MY BLOG
        </p>
        <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">
          你好，我是 Lance
        </h1>
        <p className="max-w-xl leading-relaxed text-muted-foreground">
          在这里记录技术探索、读书笔记和生活思考。
          写作于我而言，是与自己对话，也是与世界连接的方式。
        </p>
      </section>

      {/* 分类筛选 */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            activeCategory === null
              ? "bg-primary font-medium text-primary-foreground"
              : "border border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          全部 ({posts.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              activeCategory === cat
                ? "bg-primary font-medium text-primary-foreground"
                : "border border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {cat} ({posts.filter((p) => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border/70 bg-card/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无文章</p>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
