import { useEffect, useState } from "react"
import { fetchPosts, type PostMeta } from "@/lib/api"

/** 加载文章列表（组件挂载时请求，API 不可用时回退到内置静态数据） */
export function usePosts() {
  const [posts, setPosts] = useState<PostMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { posts, loading }
}
