/**
 * 客户端 frontmatter 解析/生成（与服务端 gray-matter 输出格式保持一致）
 * 支持字段：title, date, category, tags[], excerpt, draft, slug
 */

export interface FrontmatterData {
  title?: string
  slug?: string
  date?: string
  category?: string
  tags?: string[]
  excerpt?: string
  draft?: boolean
}

/** 解析带 frontmatter 的 Markdown 原文 */
export function parseFrontmatter(raw: string): {
  data: FrontmatterData
  content: string
} {
  const data: FrontmatterData = {}
  let content = raw

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (match) {
    content = raw.slice(match[0].length)
    const lines = match[1].split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (!kv) continue
      const [, key, rawVal] = kv
      const val = rawVal.trim()

      if (key === "tags") {
        if (val.startsWith("[") && val.endsWith("]")) {
          // 行内数组: tags: [a, b]
          data.tags = val
            .slice(1, -1)
            .split(",")
            .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
            .filter(Boolean)
        } else if (val === "") {
          // 块状数组:
          // tags:
          //   - a
          //   - b
          const tags: string[] = []
          while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
            tags.push(lines[++i].replace(/^\s+-\s+/, "").trim().replace(/^['"]|['"]$/g, ""))
          }
          data.tags = tags
        }
      } else if (key === "draft") {
        data.draft = val === "true"
      } else {
        const cleaned = val.replace(/^['"]|['"]$/g, "")
        if (key === "title") data.title = cleaned
        else if (key === "slug") data.slug = cleaned
        else if (key === "date") data.date = cleaned
        else if (key === "category") data.category = cleaned
        else if (key === "excerpt") data.excerpt = cleaned
      }
    }
  }
  return { data, content: content.trim() }
}

/** 生成带 frontmatter 的 Markdown 原文（与 gray-matter stringify 风格一致） */
export function stringifyFrontmatter(data: FrontmatterData, content: string): string {
  const lines: string[] = ["---"]
  if (data.title) lines.push(`title: ${yamlScalar(data.title)}`)
  if (data.date) lines.push(`date: '${data.date}'`)
  if (data.category) lines.push(`category: ${yamlScalar(data.category)}`)
  if (data.tags?.length) {
    lines.push("tags:")
    for (const t of data.tags) lines.push(`  - ${yamlScalar(t)}`)
  }
  if (data.excerpt) lines.push(`excerpt: ${yamlScalar(data.excerpt)}`)
  lines.push(`draft: ${data.draft ? "true" : "false"}`)
  lines.push("---", "", content.trim(), "")
  return lines.join("\n")
}

/** 包含特殊字符时加引号 */
function yamlScalar(s: string): string {
  return /[:#\[\]{}",'&*?|<>!%@`]/.test(s) ? `'${s.replace(/'/g, "''")}'` : s
}

/** 生成 URL 友好的 slug（与服务端 store.js 规则一致） */
export function slugify(text: string): string {
  const slug = (text || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return slug || `post-${Date.now()}`
}
