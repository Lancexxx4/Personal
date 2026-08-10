import { CalendarDays, Clock3, FolderOpen } from "lucide-react"
import type { PostMeta } from "@/lib/api"

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <a href={`#/post/${post.slug}`} className="block">
      <article className="post-card rounded-xl border border-border/70 bg-card/60 p-5 sm:p-6">
        <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 text-primary/90">
            <FolderOpen className="h-3.5 w-3.5" />
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {post.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            约 {post.readingTime} 分钟
          </span>
        </div>
        <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
          {post.title}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs text-secondary-foreground/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </a>
  )
}
