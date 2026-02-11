import { useState, useCallback } from 'react'

export default function Example04_TripleSetCountValue() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])

  const handleClick = useCallback(() => {
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
    setLogs(prev => [
      ...prev,
      `クリック! setCount(${count}+1) を3回呼んだ → 結果: ${count + 1}（全て同じスナップショット）`,
    ])
  }, [count])

  const handleReset = useCallback(() => {
    setCount(0)
    setLogs([])
  }, [])

  return (
    <div className="example-card">
      <h2>Example 04: setCount(count+1) x3</h2>
      <p>
        3回 <code>setCount(count + 1)</code> を呼んでも、結果は <strong>1</strong> にしかなりません。
        <code>count</code> はスナップショット（定数）なので、3回とも同じ値を渡しています。
      </p>
      <div style={{ margin: '16px 0' }}>
        <button onClick={handleClick}>Count: {count}</button>
        <button onClick={handleReset} style={{ background: '#666' }}>リセット</button>
      </div>
      <div className="log-area">
        {logs.length === 0 && <p>ボタンをクリックするとログが表示されます</p>}
        {logs.map((log, i) => <p key={i}>{log}</p>)}
      </div>
    </div>
  )
}
