import { useState, useTransition, memo } from 'react'

const allItems = Array.from({ length: 500 }, (_, i) => {
  const names = ['React', 'Redux', 'Remix', 'Router', 'RSC', 'Rollup', 'Recoil', 'Relay', 'RxJS', 'Radix']
  return `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`
})

// 各項目のレンダリングを意図的に遅くするコンポーネント
const SlowItem = memo(function SlowItem({ text }) {
  const startTime = performance.now()
  while (performance.now() - startTime < 2) {} // 1項目あたり約2ms
  return <li>{text}</li>
})

export default function Example02_UseTransition() {
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(allItems)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e) => {
    setQuery(e.target.value)             // 高優先: 入力欄をすぐ更新
    startTransition(() => {               // 低優先: リスト更新は後回しでOK
      setFiltered(allItems.filter(item =>
        item.toLowerCase().includes(e.target.value.toLowerCase())
      ))
    })
  }

  return (
    <div className="example-card">
      <h2>Example 02: useTransition 検索</h2>
      <p>
        各リスト項目のレンダリングに約2msかかります（意図的に遅くしています）。
        <code>useTransition</code> により入力欄は即座に反映され、
        重いリスト更新は低優先度で処理されます。
        素早く連続入力して <strong>「検索中...」</strong> の表示を確認してみてください。
      </p>
      <input
        value={query}
        onChange={handleChange}
        placeholder="React, Redux, Remix..."
        style={{ margin: '12px 0' }}
      />
      {isPending ? (
        <p style={{ color: '#f57c00', fontWeight: 'bold' }}>検索中...（低優先度で処理中）</p>
      ) : (
        <p style={{ color: '#888', fontSize: 13 }}>{filtered.length}件</p>
      )}
      <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
        <ul>
          {filtered.map((v, i) => <SlowItem key={i} text={v} />)}
        </ul>
      </div>
    </div>
  )
}
