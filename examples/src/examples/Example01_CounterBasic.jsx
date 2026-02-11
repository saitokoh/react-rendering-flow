import { useState, useCallback } from 'react'

export default function Example01_CounterBasic() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])

  const handleClick = useCallback(() => {
    setCount(count + 1)
    // setCount後もcountはスナップショットなので古い値のまま
    setLogs(prev => [...prev, `setCount(${count} + 1) 呼び出し後の count = ${count}`])
  }, [count])

  const handleReset = useCallback(() => {
    setCount(0)
    setLogs([])
  }, [])

  return (
    <div className="example-card">
      <h2>Example 01: Counter基本（スナップショット）</h2>
      <p>
        <code>setCount</code> を呼んだ直後の <code>count</code> はまだ古い値です。
        State は「スナップショット」として固定されています。
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
