import { Layout, useHashRoute } from "@/components/Layout"
import { usePosts } from "@/hooks/usePosts"
import { Home } from "@/pages/Home"
import { PostDetail } from "@/pages/PostDetail"
import { Tags } from "@/pages/Tags"
import { About } from "@/pages/About"
import { Write } from "@/pages/Write"
import "./App.css"

function App() {
  const route = useHashRoute()
  const { posts, loading } = usePosts()

  let page: React.ReactNode
  if (route.startsWith("#/post/")) {
    page = (
      <PostDetail
        slug={decodeURIComponent(route.slice("#/post/".length))}
        posts={posts}
      />
    )
  } else if (route.startsWith("#/tags/")) {
    page = (
      <Tags
        posts={posts}
        activeTag={decodeURIComponent(route.slice("#/tags/".length))}
      />
    )
  } else if (route.startsWith("#/tags")) {
    page = <Tags posts={posts} />
  } else if (route.startsWith("#/about")) {
    page = <About posts={posts} />
  } else if (route.startsWith("#/write")) {
    page = <Write key="write" />
  } else if (route.startsWith("#/edit/")) {
    page = (
      <Write
        key={route}
        editSlug={decodeURIComponent(route.slice("#/edit/".length))}
      />
    )
  } else {
    page = <Home posts={posts} loading={loading} />
  }

  return <Layout route={route}>{page}</Layout>
}

export default App
