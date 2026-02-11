import { useState, useCallback } from 'react'

export default function Example05_TripleSetCountUpdater() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])

  const handleClick = useCallback(() => {
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)
    setLogs(prev => [
      ...prev,
      `クリック! setCount(prev => prev+1) を3回呼んだ → 結果: +3`,
    ])
  }, [])

  const handleReset = useCallback(() => {
    setCount(0)
    setLogs([])
  }, [])

  return (
    <div className="example-card">
      <h2>Example 05: 更新関数 x3</h2>
      <p>
        更新関数 <code>prev =&gt; prev + 1</code> を使うと、結果は <strong>3</strong> になります。
        更新関数はキュー内で順番に実行され、直前の結果が次の <code>prev</code> に渡されます。
        Example 04 と比較してみてください。
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
