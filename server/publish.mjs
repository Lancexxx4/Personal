/**
 * 一键发布：把文章变更提交并推送到 GitHub（触发 Pages 自动部署）
 * 用法: node server/publish.mjs [提交信息]
 * 推送带 3 次重试（绕过本地失效代理），全部失败时保留本地提交，下次自动补推
 */
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const message = process.argv[2] || "docs: 更新博客文章"

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf-8" }).trim()
}

// 无网络代理参数（本机代理 127.0.0.1:7890 常未运行，直连更稳）
const NO_PROXY = ["-c", "http.proxy=", "-c", "https.proxy="]

export function publish(msg = message) {
  git(["add", "server/data", "public/posts", "src/data"])

  const pending = git(["status", "--porcelain"])
  const ahead = git(["rev-list", "--count", "origin/main..HEAD"])
  if (!pending && ahead === "0") {
    console.log("[publish] 没有需要发布的变更")
    return true
  }
  if (pending) {
    git(["commit", "-m", msg])
    console.log(`[publish] 已提交: ${msg}`)
  } else {
    console.log(`[publish] 有 ${ahead} 个本地提交待推送`)
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      git([...NO_PROXY, "push", "origin", "main"])
      console.log("[publish] 推送成功，GitHub Pages 约 1 分钟后更新")
      return true
    } catch {
      console.log(`[publish] 推送失败（第 ${attempt}/3 次），${attempt < 3 ? "3 秒后重试…" : ""}`)
      if (attempt < 3) {
        const until = Date.now() + 3000
        while (Date.now() < until) { /* 忙等，避免引入依赖 */ }
      }
    }
  }
  console.log("[publish] 推送多次失败（网络问题），提交已保存在本地，下次发布时会自动补推")
  return false
}

// 直接运行：node server/publish.mjs
if (process.argv[1] && process.argv[1].endsWith("publish.mjs")) {
  publish()
}
