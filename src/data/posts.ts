export interface Post {
  slug: string
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  readingTime: number
  content: string
}

export const posts: Post[] = [
  {
    slug: "why-i-started-blogging",
    title: "为什么我开始写博客",
    date: "2026-08-01",
    category: "随笔",
    tags: ["写作", "思考", "成长"],
    excerpt:
      "在这个信息碎片化的时代，我选择用长文记录思考。这篇文章聊聊我开始写博客的三个理由。",
    readingTime: 5,
    content: `
## 缘起

上周整理旧硬盘时，翻到了五年前写的一份学习笔记。那一刻我突然意识到：**很多想法如果不写下来，就真的消失了。**

记忆是不可靠的。我们以为自己会记住某个顿悟的瞬间，但三个月后，它只剩下一个模糊的轮廓。

## 三个理由

### 1. 写作是思考的磨刀石

> "我写作不是因为我知道答案，而是因为我想找到答案。"

把一个模糊的想法变成清晰的文字，这个过程会逼着你把逻辑补完。很多自以为想明白的事情，一写下来就发现漏洞百出。

### 2. 构建自己的知识资产

社交媒体上的内容是租来的土地，博客是自己的房子。每一篇文章都是一块砖：

- 五年后回头看，能看到自己认知的演进
- 别人可以通过文章了解你的思考方式
- 写作倒逼输入，形成正向循环

### 3. 连接同频的人

写作是成本最低的社交方式。一篇文章静静地躺在那里，总有人会因为它找到你。

## 写作计划

| 频率 | 内容 | 目标 |
| ---- | ---- | ---- |
| 每周一篇 | 技术或随笔 | 养成习惯 |
| 每月一篇 | 深度长文 | 沉淀思考 |

不求篇篇精品，但求**持续在场**。

## 最后

如果你也在犹豫要不要开始写点什么，我的建议是：**先写第一篇烂文章**。完美的开始不存在，开始了才可能完美。
`,
  },
  {
    slug: "react-hooks-deep-dive",
    title: "深入理解 React Hooks 的闭包陷阱",
    date: "2026-07-20",
    category: "技术",
    tags: ["React", "前端", "JavaScript"],
    excerpt:
      "useEffect 里的值为什么总是旧的？从闭包的底层原理出发，彻底搞懂 Hooks 中最容易踩的坑。",
    readingTime: 8,
    content: `
几乎每个写过 React 的人都遇到过这个经典问题：

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count) // 永远是 0！
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
\`\`\`

点击按钮后 count 明明变了，为什么定时器里打印的永远是 0？

## 问题的本质：闭包捕获的是"当时的值"

每次渲染，函数组件都会重新执行，创建一个**新的函数作用域**。这个作用域里的 \`count\` 是当次渲染的快照。

\`useEffect\` 的回调在依赖数组为 \`[]\` 时只注册一次，它闭包捕获的是**首次渲染**的那个 \`count\`（值为 0）。

\`\`\`txt
渲染 1: count = 0  →  effect 回调捕获 count(0)  ← 定时器一直用它
渲染 2: count = 1  →  新的作用域，但 effect 没有重新执行
渲染 3: count = 2  →  同上...
\`\`\`

## 三种解法

### 方案一：把依赖补全

\`\`\`jsx
useEffect(() => {
  const timer = setInterval(() => console.log(count), 1000)
  return () => clearInterval(timer)
}, [count]) // count 变化时重建定时器
\`\`\`

简单直接，但代价是每次 count 变化都要清除再创建定时器。

### 方案二：函数式更新

\`\`\`jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1) // 不依赖外部 count
  }, 1000)
  return () => clearInterval(timer)
}, [])
\`\`\`

\`setCount\` 接收函数时，参数永远是最新值，这是官方推荐的写法。

### 方案三：useRef 保存最新值

\`\`\`jsx
const countRef = useRef(count)
countRef.current = count // 每次渲染同步

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current) // 永远最新
  }, 1000)
  return () => clearInterval(timer)
}, [])
\`\`\`

ref 是可变对象，跨渲染共享，修改它不会触发重渲染。

## 心智模型

记住一句话就够了：

> **每次渲染都有自己的 props、state 和事件处理函数。**

Hooks 不是魔法，它只是 JavaScript 闭包。理解了"渲染快照"这个概念，所有闭包陷阱都会迎刃而解。

## 参考

- [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/) — Dan Abramov 的经典长文
- React 官方文档：useEffect 章节
`,
  },
  {
    slug: "my-vim-journey",
    title: "我的 Vim 入坑与真香实录",
    date: "2026-06-15",
    category: "技术",
    tags: ["Vim", "工具", "效率"],
    excerpt:
      "从连退出都不会，到离不开 Vim 的编辑哲学。记录一个月强制使用 Vim 的真实体验和配置分享。",
    readingTime: 6,
    content: `
第一次打开 Vim 的时候，我和所有人一样，盯着屏幕五分钟，最后靠搜索"如何退出 Vim"才逃出来。

一个月后的现在，我在 VS Code 里装了 Vim 插件，在浏览器里装了 Vimium，甚至觉得没有 hjkl 的编辑器都变慢了。

## 为什么坚持下来了

转折点出现在第二周。当我第一次用 \`ci"\` 改掉引号里的内容、用 \`dap\` 删掉整个段落时，那种**意念直达**的感觉让人上瘾。

Vim 的核心不是快捷键，而是一套**编辑语言**：

\`\`\`txt
动词 + 数量 + 对象

d  3  w   →  删除 3 个单词
c  i  "   →  修改引号内的内容
y  a  (   →  复制整个括号（含括号）
\`\`\`

一旦学会语法，你可以自由组合出上百种操作，而不需要背诵任何快捷键。

## 我的学习路径

1. **第 1 周**：\`vimtutor\` 过两遍，只用方向键和基本操作，写得很慢但别放弃
2. **第 2 周**：强制自己在所有编辑器里开 Vim 模式，学会 \`w b e f\` 移动
3. **第 3 周**：掌握 text object（\`i\` / \`a\` 系列），效率开始超过鼠标
4. **第 4 周**：学习宏、寄存器、跳转列表，彻底真香

## 极简配置

不折腾花哨插件，我的 \`.vimrc\` 只有几行核心配置：

\`\`\`vim
set number relativenumber
set ignorecase smartcase
set tabstop=2 shiftwidth=2 expandtab
set clipboard=unnamed
nnoremap ; :
\`\`\`

## 值不值得学

**值得，但要有正确的预期：**

- 它不会让你的编码速度翻倍
- 它会让编辑这件事变得更"顺手"、更少打断心流
- 肌肉记忆一旦形成，就再也回不去了

> 编辑器是程序员每天触摸最多的工具，值得为它投入一点时间。
`,
  },
  {
    slug: "reading-notes-atomic-habits",
    title: "《原子习惯》读书笔记：微小改变的惊人力量",
    date: "2026-05-28",
    category: "读书",
    tags: ["读书", "习惯", "自我提升"],
    excerpt:
      "每天进步 1%，一年后你会强大 37 倍。这本书改变了我对「自律」的理解——好习惯靠的不是意志力，而是系统设计。",
    readingTime: 7,
    content: `
## 核心公式

> 每天进步 1%，一年后：1.01³⁶⁵ ≈ **37.78**
> 每天退步 1%，一年后：0.99³⁶⁵ ≈ **0.03**

习惯是自我提升的复利。但这本书真正改变我的，不是这个被说烂的公式，而是下面这个观点：

**忘记目标，专注系统。**

- 目标是结果，系统是过程
- 赢家和输家往往有相同的目标
- 实现目标只是短暂的改变，系统层面的改变才是长久的

## 习惯养成的四定律

| 定律 | 培养好习惯 | 戒除坏习惯 |
| ---- | ---------- | ---------- |
| 提示 | 让它显而易见 | 让它无从显现 |
| 渴求 | 让它有吸引力 | 让它缺乏吸引力 |
| 反应 | 让它简便易行 | 让它难以施行 |
| 奖励 | 让它令人满足 | 让它令人厌恶 |

## 我实践有效的三条

### 1. 两分钟规则

> 新习惯的入门版本不应该超过两分钟。

"每天阅读" → "读一页"
"每天跑步" → "穿上跑鞋"

关键是**先成为那种人**，再优化行为。一个读了一页书的人，就是一个读者。

### 2. 习惯叠加

\`\`\`txt
在 [当前习惯] 之后，我会 [新习惯]

例：早上倒完咖啡后，我会写下今天最重要的三件事
\`\`\`

利用旧习惯作为新习惯的触发器，比设定闹钟提醒靠谱得多。

### 3. 环境设计 > 意志力

想多吃水果？把它放在餐桌正中央。想少刷手机？把它放到另一个房间充电。

**自制力最强的人，是最不需要用到自制力的人。**

## 一句摘抄

> "你不会提升到你目标的高度，你会下降到你系统的水平。"

这本书推荐给所有觉得"自己意志力不行"的人——问题从来不在意志力。
`,
  },
  {
    slug: "deploy-blog-with-vite",
    title: "从零搭建这个博客：技术选型与实现",
    date: "2026-08-10",
    category: "技术",
    tags: ["React", "Vite", "博客", "前端"],
    excerpt:
      "这个博客是如何诞生的？记录技术选型过程：React + Vite + Tailwind + Markdown 渲染，纯静态部署。",
    readingTime: 6,
    content: `
你现在看到的这个博客，从空目录到上线只用了一个下午。记录一下技术选型和实现思路。

## 技术栈

\`\`\`txt
React 19 + TypeScript    视图层
Vite                     构建工具（快就一个字）
Tailwind CSS + shadcn/ui 样式与组件
react-markdown           Markdown 渲染
rehype-highlight         代码语法高亮
\`\`\`

## 为什么是纯静态

博客的内容更新频率低、没有交互数据，用 SSR 或 CMS 都是杀鸡用牛刀。纯静态的优势：

- **部署简单**：构建产物扔到任何静态托管都能跑
- **速度极快**：没有服务端渲染开销，首屏就是一个 HTML
- **成本为零**：不需要服务器

## 文章数据的组织

文章直接以 TypeScript 对象的形式写在代码里：

\`\`\`ts
export interface Post {
  slug: string
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  content: string  // Markdown 原文
}
\`\`\`

后续可以轻松迁移到 \`.md\` 文件 + \`import.meta.glob\` 的方案，文章多了再演进。

## Markdown 渲染

\`\`\`tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
>
  {post.content}
</ReactMarkdown>
\`\`\`

- \`remark-gfm\` 支持表格、删除线、任务列表等 GFM 语法
- \`rehype-highlight\` 自动给代码块上语法高亮
- 配合 \`@tailwindcss/typography\` 的 \`prose\` 类，排版开箱即用

## 路由方案

静态托管最怕路由 404，所以用 **hash 路由**：

\`\`\`txt
#/              → 文章列表
#/post/:slug    → 文章详情
#/tags          → 标签分类
#/about         → 关于我
\`\`\`

不依赖任何服务端配置，刷新、分享链接都不会 404。

## 后续计划

- [ ] 接入评论系统（giscus）
- [ ] RSS 订阅
- [ ] 全文搜索
- [ ] 文章迁移到独立 Markdown 文件

博客是程序员的自留地，欢迎常来。
`,
  },
  {
    slug: "slow-life-in-fast-city",
    title: "在快节奏的城市里，过慢一点的生活",
    date: "2026-04-12",
    category: "随笔",
    tags: ["生活", "思考"],
    excerpt:
      "周末不赶时间地吃一顿早餐，走路时不看手机，睡前读半小时纸质书——一些让生活慢下来的小实验。",
    readingTime: 4,
    content: `
有段时间，我发现自己连吃一碗面都要开着视频，走路的几分钟也要刷完十几条信息。时间是填满了，心里却越来越空。

于是我做了几个"减速"小实验。

## 实验一：认真吃一顿早餐

周末的早上，不看任何屏幕，就安安静静吃一顿早餐。你会发现粥的温度、包子的热气、窗外的鸟叫，这些一直都在，只是从没被注意过。

## 实验二：走路时不看手机

通勤路上的十五分钟，从"信息摄入时间"变回"放空时间"。

> 无聊是创造力的土壤。所有的好点子，都是在洗澡、散步、发呆的时候冒出来的。

## 实验三：睡前半小时纸质书

手机放在客厅充电，床头只放一本书。两个变化：

1. 入睡明显变快了
2. 一个月多读完两本书

## 一些感悟

慢不是懒，也不是效率的反面。**慢是给注意力留白的艺术。**

快节奏的城市不会变慢，但我们可以选择自己的节奏。就像开车——重要的不是车能开多快，而是方向盘在谁手里。
`,
  },
]

export const categories = [...new Set(posts.map((p) => p.category))]

export const allTags = [...new Set(posts.flatMap((p) => p.tags))]

export function getPostsByTag(tag: string) {
  return posts.filter((p) => p.tags.includes(tag))
}

export function getPostsByCategory(category: string) {
  return posts.filter((p) => p.category === category)
}

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug)
}
