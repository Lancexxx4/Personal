import { BookOpen, Code2, Coffee, Github, Mail, MapPin } from "lucide-react"
import { Markdown } from "@/components/Markdown"
import type { PostMeta } from "@/lib/api"

const aboutContent = `
## 你好，我是 Lance 👋

一名热爱编码与写作的开发者，目前专注于前端与全栈技术。
这个博客是我的数字自留地——记录技术探索中的踩坑与顿悟，也记录生活里的思考与感悟。

## 我在做什么

- 🔭 **工作上**：构建 Web 应用，关注性能与开发者体验
- 🌱 **学习中**：系统设计、Rust、AI 应用开发
- ✍️ **写作上**：每周更新一篇，技术与随笔交替

## 我的信条

> Stay hungry, stay foolish.
> 保持好奇，保持笨拙，保持记录。

## 为什么写博客

写作是思考的延伸。把模糊的想法变成清晰的文字，这个过程本身就是最好的学习。
如果这些文字恰好也帮到了你，那是额外的惊喜。
`

export function About({ posts }: { posts: PostMeta[] }) {
  const stats = [
    { icon: Code2, label: "技术文章", value: posts.filter((p) => p.category === "技术").length },
    { icon: BookOpen, label: "读书笔记", value: posts.filter((p) => p.category === "读书").length },
    { icon: Coffee, label: "生活随笔", value: posts.filter((p) => p.category === "随笔").length },
  ]

  return (
    <div>
      {/* 个人卡片 */}
      <section className="mb-10 flex flex-col items-start gap-6 rounded-2xl border border-border/70 bg-card/60 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-primary/40 text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
          L
        </div>
        <div className="flex-1">
          <h1 className="mb-1.5 text-2xl font-bold">Lance</h1>
          <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            开发者 / 写作者 / 终身学习者
          </p>
          <div className="flex gap-3">
            <a
              href="mailto:hi@lance.blog"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5" />
              邮箱
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* 统计 */}
      <section className="mb-10 grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border/70 bg-card/60 p-4 text-center sm:p-5"
          >
            <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      {/* 详细介绍（Markdown 渲染） */}
      <Markdown content={aboutContent} />
    </div>
  )
}
