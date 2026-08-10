import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileUp,
  Loader2,
  Save,
  Trash2,
} from "lucide-react"
import {
  checkApi,
  createPost,
  deletePost,
  fetchPost,
  parseMarkdown,
  updatePost,
} from "@/lib/api"
import { Markdown } from "@/components/Markdown"

const inputCls =
  "w-full rounded-lg border border-border bg-card/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
const labelCls = "mb-1.5 block text-sm font-medium text-foreground/90"

export function Write({ editSlug }: { editSlug?: string }) {
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState("")
  const [tagsStr, setTagsStr] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [draft, setDraft] = useState(false)
  const [content, setContent] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkApi().then(setApiOk)
  }, [])

  // 编辑模式：加载已有文章
  useEffect(() => {
    if (!editSlug || !apiOk) return
    fetchPost(editSlug).then((post) => {
      if (!post) return
      setTitle(post.title)
      setSlug(post.slug)
      setDate(post.date)
      setCategory(post.category)
      setTagsStr(post.tags.join(", "))
      setExcerpt(post.excerpt)
      setContent(post.content)
    })
  }, [editSlug, apiOk])

  /** 导入 .md 文件：交给后端解析 frontmatter 后回填表单 */
  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = await parseMarkdown(text)
      setTitle(parsed.title || "")
      setSlug(parsed.slug || "")
      if (parsed.date) setDate(parsed.date)
      if (parsed.category) setCategory(parsed.category)
      if (parsed.tags?.length) setTagsStr(parsed.tags.join(", "))
      if (parsed.excerpt) setExcerpt(parsed.excerpt)
      setDraft(Boolean(parsed.draft))
      setContent(parsed.content || "")
      setMessage({ type: "ok", text: `已导入「${parsed.title}」，检查后可保存` })
    } catch (e) {
      setMessage({ type: "err", text: `导入失败：${(e as Error).message}` })
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ type: "err", text: "请填写标题" })
      return
    }
    setSaving(true)
    setMessage(null)
    const input = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      date,
      category: category.trim() || "随笔",
      tags: tagsStr.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      excerpt: excerpt.trim(),
      draft,
      content,
    }
    try {
      const saved = editSlug
        ? await updatePost(editSlug, input)
        : await createPost(input)
      window.location.hash = `#/post/${encodeURIComponent(saved.slug)}`
    } catch (e) {
      setMessage({ type: "err", text: `保存失败：${(e as Error).message}` })
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editSlug) return
    if (!window.confirm(`确定删除文章「${title}」吗？此操作不可恢复。`)) return
    try {
      await deletePost(editSlug)
      window.location.hash = "#/"
    } catch (e) {
      setMessage({ type: "err", text: `删除失败：${(e as Error).message}` })
    }
  }

  // 后端不可用（纯静态部署）时提示
  if (apiOk === false) {
    return (
      <div className="py-20 text-center">
        <p className="mb-2 text-5xl">🔌</p>
        <h1 className="mb-2 text-xl font-semibold">后端服务未启动</h1>
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          写作功能需要后端 API 支持。请在项目目录运行
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-primary">npm run server</code>
          后刷新页面。
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

  if (apiOk === null) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <a
          href={editSlug ? `#/post/${encodeURIComponent(editSlug)}` : "#/"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </a>
        <h1 className="text-lg font-semibold">{editSlug ? "编辑文章" : "写新文章"}</h1>
      </div>

      {/* 导入 Markdown 文件 */}
      <div
        className="mb-6 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        onClick={() => fileRef.current?.click()}
      >
        <FileUp className="h-4 w-4" />
        导入 Markdown 文件（支持 frontmatter，自动解析标题/日期/分类/标签）
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImport(f)
            e.target.value = ""
          }}
        />
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>标题 *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />
          </div>
          <div>
            <label className={labelCls}>Slug（留空自动生成）</label>
            <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-first-post" disabled={Boolean(editSlug)} />
          </div>
          <div>
            <label className={labelCls}>日期</label>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>分类</label>
            <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="技术 / 随笔 / 读书…" />
          </div>
        </div>

        <div>
          <label className={labelCls}>标签（逗号分隔）</label>
          <input className={inputCls} value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="React, 前端, 效率" />
        </div>

        <div>
          <label className={labelCls}>摘要（留空自动截取正文）</label>
          <textarea className={`${inputCls} resize-none`} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="一两句话概括这篇文章…" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/90">正文（Markdown）</label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "隐藏预览" : "实时预览"}
            </button>
          </div>
          <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
            <textarea
              className={`${inputCls} min-h-[420px] resize-y font-mono leading-relaxed`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"## 在这里用 Markdown 写作…\n\n支持代码块、表格、引用、任务列表等 GFM 语法。"}
            />
            {showPreview && (
              <div className="max-h-[520px] overflow-y-auto rounded-lg border border-border bg-card/40 p-5">
                {content.trim() ? (
                  <Markdown content={content} />
                ) : (
                  <p className="text-sm text-muted-foreground">预览内容将显示在这里…</p>
                )}
              </div>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
            className="h-4 w-4 accent-amber-500"
          />
          存为草稿（不在博客中公开显示）
        </label>

        <div className="flex items-center gap-3 border-t border-border/60 pt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editSlug ? "保存修改" : "发布文章"}
          </button>
          {editSlug && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-5 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              删除文章
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
