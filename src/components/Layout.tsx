import { useEffect, useState } from "react"
import { Feather, Menu, X } from "lucide-react"

const navItems = [
  { path: "#/", label: "文章" },
  { path: "#/tags", label: "标签" },
  { path: "#/about", label: "关于" },
  { path: "#/write", label: "写作" },
]

export function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/")
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash || "#/")
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return hash
}

export function Layout({ children, route }: { children: React.ReactNode; route: string }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [route])

  const isActive = (path: string) => {
    if (path === "#/") return route === "#/" || route.startsWith("#/post")
    return route.startsWith(path)
  }

  return (
    <div className="min-h-screen ambient-glow">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
              <Feather className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Lance<span className="text-primary">.</span>
            </span>
          </a>

          {/* 桌面导航 */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`rounded-md px-3.5 py-1.5 text-sm transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-accent sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* 移动端导航 */}
        {menuOpen && (
          <nav className="border-t border-border/60 px-4 py-2 sm:hidden">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`block rounded-md px-3 py-2.5 text-sm ${
                  isActive(item.path)
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            用文字记录思考 · 用代码构建世界
          </p>
          <p className="text-xs text-muted-foreground/60">
            © 2026 Lance · Built with React + Vite + Tailwind
          </p>
        </div>
      </footer>
    </div>
  )
}
