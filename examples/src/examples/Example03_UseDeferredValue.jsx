import { useState, useDeferredValue, memo } from 'react'

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

// 子: propsで受け取るので自分では setState できない → useDeferredValue
function Results({ query }) {
  const deferredQuery = useDeferredValue(query)
  const isStale = query !== deferredQuery
  const results = allItems.filter(item =>
    item.toLowerCase().includes(deferredQuery.toLowerCase())
  )

  return (
    <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      {isStale ? (
        <p style={{ color: '#f57c00', fontWeight: 'bold' }}>更新中...（値の反映を遅延中）</p>
      ) : (
        <p style={{ color: '#888', fontSize: 13 }}>{results.length}件</p>
      )}
      <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
        <ul>
          {results.map((v, i) => <SlowItem key={i} text={v} />)}
        </ul>
      </div>
    </div>
  )
}

// 親: 入力を管理する
export default function Example03_UseDeferredValue() {
  const [query, setQuery] = useState('')

  return (
    <div className="example-card">
      <h2>Example 03: useDeferredValue 検索</h2>
      <p>
        各リスト項目のレンダリングに約2msかかります（意図的に遅くしています）。
        <code>useDeferredValue</code> は値の反映そのものを遅延させます。
        子コンポーネントが props で値を受け取り、自分では <code>setState</code> できない場合に便利です。
        素早く連続入力して <strong>「更新中...」</strong> の表示とリストの半透明化を確認してみてください。
        Example 02 と比較してみてください。
      </p>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="React, Redux, Remix..."
        style={{ margin: '12px 0' }}
      />
      <Results query={query} />
    </div>
  )
}
