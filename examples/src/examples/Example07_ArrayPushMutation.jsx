import { useState } from 'react'

// 問題コード: push + 同じ参照を渡す
function BrokenTodoList() {
  const [items, setItems] = useState(['タスク1'])

  const handleAdd = () => {
    items.push(`タスク${items.length + 1}`)  // 配列に直接追加
    setItems(items)                           // 同じ参照を渡す → Bailout
  }

  return (
    <div>
      <h3 style={{ color: '#c62828' }}>問題コード（push + 同じ参照）</h3>
      <button onClick={handleAdd}>追加</button>
      <p style={{ fontSize: 13, color: '#888' }}>
        表示中: {items.length}件（ボタンを押しても画面は変わりません）
      </p>
      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
      <p style={{ color: '#c62828', fontSize: 14 }}>
        pushで中身は変わっていますが、参照が同じなので
        Bailoutが発動し画面が更新されません。
      </p>
    </div>
  )
}

// 修正コード: スプレッド構文で新しい配列を作る
function FixedTodoList() {
  const [items, setItems] = useState(['タスク1'])

  const handleAdd = () => {
    setItems([...items, `タスク${items.length + 1}`])  // 新しい配列 → 参照が変わる
  }

  return (
    <div>
      <h3 style={{ color: '#388e3c' }}>修正版（スプレッド構文）</h3>
      <button onClick={handleAdd}>追加</button>
      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
      <p style={{ color: '#388e3c', fontSize: 14 }}>
        スプレッド構文で新しい配列を作るため、参照が変わり正しく更新されます。
      </p>
    </div>
  )
}

export default function Example07_ArrayPushMutation() {
  return (
    <div className="example-card">
      <h2>Example 07: 配列pushミューテーション</h2>
      <p>
        <code>Array.push()</code> で直接変更して同じ参照を渡すと、
        <code>Object.is</code> で同一と判定され Bailout が発動します。
      </p>
      <div className="side-by-side" style={{ marginTop: 16 }}>
        <BrokenTodoList />
        <FixedTodoList />
      </div>
    </div>
  )
}
