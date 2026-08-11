---
title: 深入理解 React Hooks 的闭包陷阱
date: '2026-07-20'
category: 技术
tags:
  - React
  - 前端
  - JavaScript
excerpt: useEffect 里的值为什么总是旧的？从闭包的底层原理出发，彻底搞懂 Hooks 中最容易踩的坑。
draft: false
---

几乎每个写过 React 的人都遇到过这个经典问题：

```jsx
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
```

点击按钮后 count 明明变了，为什么定时器里打印的永远是 0？

## 问题的本质：闭包捕获的是"当时的值"

每次渲染，函数组件都会重新执行，创建一个**新的函数作用域**。这个作用域里的 `count` 是当次渲染的快照。

`useEffect` 的回调在依赖数组为 `[]` 时只注册一次，它闭包捕获的是**首次渲染**的那个 `count`（值为 0）。

```txt
渲染 1: count = 0  →  effect 回调捕获 count(0)  ← 定时器一直用它
渲染 2: count = 1  →  新的作用域，但 effect 没有重新执行
渲染 3: count = 2  →  同上...
```

## 三种解法

### 方案一：把依赖补全

```jsx
useEffect(() => {
  const timer = setInterval(() => console.log(count), 1000)
  return () => clearInterval(timer)
}, [count]) // count 变化时重建定时器
```

简单直接，但代价是每次 count 变化都要清除再创建定时器。

### 方案二：函数式更新

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1) // 不依赖外部 count
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

`setCount` 接收函数时，参数永远是最新值，这是官方推荐的写法。

### 方案三：useRef 保存最新值

```jsx
const countRef = useRef(count)
countRef.current = count // 每次渲染同步

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current) // 永远最新
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

ref 是可变对象，跨渲染共享，修改它不会触发重渲染。

## 心智模型

记住一句话就够了：

> **每次渲染都有自己的 props、state 和事件处理函数。**

Hooks 不是魔法，它只是 JavaScript 闭包。理解了"渲染快照"这个概念，所有闭包陷阱都会迎刃而解。

## 参考

- [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/) — Dan Abramov 的经典长文
- React 官方文档：useEffect 章节
