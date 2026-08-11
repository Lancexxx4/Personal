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
  createPost,
  deletePost,
  fetchPost,
  getStoreMode,
  parseMarkdown,
  updatePost,
  type StoreMode,
} from "@/lib/api"
import { getToken, setToken } from "@/lib/github"
import { Markdown } from "@/components/Markdown"

const inputCls =
  "w-full rounded-lg border border-border bg-card/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
const labelCls = "mb-1.5 block text-sm font-medium text-foreground/90"

export function Write({ editSlug }: { editSlug?: string }) {
  const [storeMode, setStoreMode] = useState<StoreMode | null>(null)
  const [token, setTokenInput] = useState(getToken())
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
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getStoreMode().then(setStoreMode)
  }, [])

  // 编辑模式：加载已有文章
  useEffect(() => {
    if (!editSlug || !storeMode || storeMode === "static") return
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
  }, [editSlug, storeMode])

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
    if (storeMode === "github") {
      if (!token.trim()) {
        setMessage({ type: "err", text: "请先填写 GitHub Token" })
        return
      }
      setToken(token.trim())
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
    if (!editSlug || deleting) return
    // 第一步：进入确认状态（不用 window.confirm，内嵌页面会被拦截）
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    if (storeMode === "github") {
      if (!token.trim()) {
        setMessage({ type: "err", text: "请先填写 GitHub Token" })
        setConfirmingDelete(false)
        return
      }
      setToken(token.trim())
    }
    setDeleting(true)
    setMessage(null)
    try {
      await deletePost(editSlug)
      // 删除成功，自动跳转回首页
      window.location.hash = "#/"
    } catch (e) {
      setMessage({ type: "err", text: `删除失败：${(e as Error).message}` })
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  // 只读模式（GitHub API 不可达且无本地后端）时给出指引
  if (storeMode === "static" || storeMode === "pages") {
    return (
      <div className="py-20 text-center">
        <p className="mb-2 text-5xl">🔌</p>
        <h1 className="mb-2 text-xl font-semibold">当前为只读模式</h1>
        <div className="mx-auto mb-6 max-w-md text-left text-sm leading-relaxed text-muted-foreground">
          <p className="mb-3">你的浏览器无法访问 GitHub API，在线写作不可用。可选方案：</p>
          <p className="mb-2">
            <b className="text-foreground">方案一（推荐）</b>：本地运行
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-primary">npm run server</code>
            后访问 localhost:3001 写作，保存后自动发布上线（无需手动 git 操作）
          </p>
          <p>
            <b className="text-foreground">方案二</b>：开启网络代理让浏览器能访问
            api.github.com，刷新后填 Token 即可在线写作
          </p>
        </div>
        <a
          href="#/"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          返回首页
        </a>
      </div>
    )
  }

  if (storeMode === null) {
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

      {/* GitHub 模式：Token 配置 */}
      {storeMode === "github" && (
        <div className="mb-6 rounded-xl border border-border/70 bg-card/60 p-4">
          <p className="mb-2 text-sm font-medium">
            GitHub 存储模式
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              文章将保存到 GitHub 仓库
            </span>
          </p>
          {token ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                ✓ Token 已配置（仅保存在本浏览器）
              </p>
              <button
                onClick={() => {
                  setToken("")
                  setTokenInput("")
                }}
                className="text-xs text-muted-foreground underline hover:text-destructive"
              >
                清除 Token
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="password"
                className={inputCls}
                value={token}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="粘贴 GitHub Personal Access Token"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                在 GitHub → Settings → Developer settings → Personal access tokens (fine-grained)
                创建，仅授权 Personal 仓库的 <b>Contents: Read and write</b> 权限。
                Token 只存在本浏览器 localStorage，保存文章时才会用到。
              </p>
            </div>
          )}
        </div>
      )}

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
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                  confirmingDelete
                    ? "bg-destructive font-medium text-destructive-foreground hover:opacity-90"
                    : "border border-destructive/40 text-destructive hover:bg-destructive/10"
                }`}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? "删除中…" : confirmingDelete ? "再点一次确认删除" : "删除文章"}
              </button>
              {confirmingDelete && !deleting && (
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  取消
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
