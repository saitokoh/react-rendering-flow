import { useState, useEffect, useRef } from 'react'

const MAX_RENDERS = 20

// 問題コード: 依存配列なしuseEffect（安全に停止）
function BrokenCounter() {
  const [count, setCount] = useState(0)
  const renderCount = useRef(0)
  const [logs, setLogs] = useState([])
  const stopped = useRef(false)

  renderCount.current++

  useEffect(() => {
    if (renderCount.current >= MAX_RENDERS) {
      if (!stopped.current) {
        stopped.current = true
        setLogs(prev => [...prev, `⚠ ${MAX_RENDERS}回に到達 - 安全のため停止`])
      }
      return
    }
    setLogs(prev => [...prev, `Effect実行: setCount(${count} + 1)`])
    setCount(count + 1)
  })

  return (
    <div>
      <h3 style={{ color: '#c62828' }}>問題コード（依存配列なし）</h3>
      <p>Count: {count} / レンダリング: {renderCount.current}回</p>
      <div className="log-area" style={{ maxHeight: 150 }}>
        {logs.map((log, i) => <p key={i}>{log}</p>)}
      </div>
      <p style={{ color: '#c62828', fontSize: 14, marginTop: 8 }}>
        依存配列がないため毎回Effectが実行され、無限ループになります。
        （安全のため{MAX_RENDERS}回で停止しています）
      </p>
    </div>
  )
}

// 修正コード: 空の依存配列で初回のみ
function FixedCounter() {
  const [count, setCount] = useState(0)
  const renderCount = useRef(0)
  const [logs, setLogs] = useState([])

  renderCount.current++

  useEffect(() => {
    setLogs(prev => [...prev, 'Effect実行（初回のみ）: setCount(1)'])
    setCount(1)
  }, [])  // 空配列 = 初回マウント時のみ

  return (
    <div>
      <h3 style={{ color: '#388e3c' }}>修正版（空の依存配列）</h3>
      <p>Count: {count} / レンダリング: {renderCount.current}回</p>
      <div className="log-area" style={{ maxHeight: 150 }}>
        {logs.map((log, i) => <p key={i}>{log}</p>)}
      </div>
      <p style={{ color: '#388e3c', fontSize: 14, marginTop: 8 }}>
        空の依存配列で初回マウント時のみEffectが実行されます。
      </p>
    </div>
  )
}

export default function Example09_UseEffectNoDeps() {
  const [key, setKey] = useState(0)

  return (
    <div className="example-card">
      <h2>Example 09: useEffect 依存配列なし（無限ループ）</h2>
      <p>
        <code>useEffect</code> に依存配列を渡さないと、毎回のレンダリング後にEffectが実行されます。
        その中で <code>setState</code> を呼ぶと無限ループになります。
      </p>
      <button onClick={() => setKey(k => k + 1)} style={{ marginBottom: 12 }}>
        リセット（再マウント）
      </button>
      <div className="side-by-side" key={key}>
        <BrokenCounter />
        <FixedCounter />
      </div>
    </div>
  )
}
