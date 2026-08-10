import { ArrowLeft, Hash, Tags as TagsIcon } from "lucide-react"
import type { PostMeta } from "@/lib/api"
import { PostCard } from "@/components/PostCard"

export function Tags({ posts, activeTag }: { posts: PostMeta[]; activeTag?: string }) {
  const getByTag = (tag: string) => posts.filter((p) => p.tags.includes(tag))

  if (activeTag) {
    const tagged = getByTag(activeTag)
    return (
      <div>
        <a
          href="#/tags"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          全部标签
        </a>
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Hash className="h-6 w-6 text-primary" />
          {activeTag}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          共 {tagged.length} 篇文章
        </p>
        <div className="flex flex-col gap-5">
          {tagged.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    )
  }

  const allTags = [...new Set(posts.flatMap((p) => p.tags))]
  const maxCount = Math.max(1, ...allTags.map((t) => getByTag(t).length))

  return (
    <div>
      <div className="mb-10">
        <p className="mb-3 text-sm font-medium tracking-widest text-primary">
          TOPICS
        </p>
        <h1 className="mb-4 flex items-center gap-3 text-3xl font-bold">
          <TagsIcon className="h-7 w-7 text-primary" />
          标签分类
        </h1>
        <p className="text-muted-foreground">
          共 {allTags.length} 个标签 · {posts.length} 篇文章
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {allTags.map((tag) => {
          const count = getByTag(tag).length
          const scale = 0.85 + (count / maxCount) * 0.35
          return (
            <a
              key={tag}
              href={`#/tags/${encodeURIComponent(tag)}`}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
              style={{ fontSize: `${scale}rem` }}
            >
              <Hash className="h-4 w-4 text-primary/70 transition-colors group-hover:text-primary" />
              <span className="text-foreground/90">{tag}</span>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                {count}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
