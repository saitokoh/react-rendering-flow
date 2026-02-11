import { useState, useEffect, useRef } from 'react'

const MAX_RENDERS = 20

// 問題コード: 関数本体で直接fetchする（20回で安全停止）
function BrokenUserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const renderCount = useRef(0)
  const [logs, setLogs] = useState([])
  const stopped = useRef(false)

  renderCount.current++

  // 関数本体で直接APIを呼んでいる（モック版）
  if (renderCount.current < MAX_RENDERS) {
    // 本来は fetch() だが、デモ用に setTimeout で模擬
    setTimeout(() => {
      if (!stopped.current) {
        setLogs(prev => [...prev, `fetch完了 → setUser() (render #${renderCount.current})`])
        setUser({ name: `ユーザー${userId}`, id: userId })
      }
    }, 100)
  } else if (!stopped.current) {
    stopped.current = true
    setTimeout(() => {
      setLogs(prev => [...prev, `⚠ ${MAX_RENDERS}回に到達 - 安全のため停止`])
    }, 0)
  }

  return (
    <div>
      <h3 style={{ color: '#c62828' }}>問題コード（関数本体でfetch）</h3>
      <p>レンダリング: {renderCount.current}回 / user: {user?.name ?? 'null'}</p>
      <div className="log-area" style={{ maxHeight: 150 }}>
        {logs.length === 0 && <p>ログが表示されます...</p>}
        {logs.map((log, i) => <p key={i}>{log}</p>)}
      </div>
      <p style={{ color: '#c62828', fontSize: 14, marginTop: 8 }}>
        関数本体で fetch → setUser → 再レンダリング → fetch → ... と無限ループになります。
        （安全のため{MAX_RENDERS}回で停止しています）
      </p>
    </div>
  )
}

// 修正コード: useEffectで副作用を隔離
function FixedUserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const renderCount = useRef(0)
  const [logs, setLogs] = useState([])

  renderCount.current++

  useEffect(() => {
    setLoading(true)
    setLogs(prev => [...prev, `useEffect実行: userId=${userId} のfetch開始`])
    const timer = setTimeout(() => {
      setUser({ name: `ユーザー${userId}`, id: userId })
      setLoading(false)
      setLogs(prev => [...prev, `fetch完了 → setUser()`])
    }, 500)
    return () => clearTimeout(timer)
  }, [userId])

  return (
    <div>
      <h3 style={{ color: '#388e3c' }}>修正版（useEffect使用）</h3>
      <p>レンダリング: {renderCount.current}回 / user: {user?.name ?? 'null'}</p>
      {loading && <p>読み込み中...</p>}
      <div className="log-area" style={{ maxHeight: 150 }}>
        {logs.length === 0 && <p>ログが表示されます...</p>}
        {logs.map((log, i) => <p key={i}>{log}</p>)}
      </div>
      <p style={{ color: '#388e3c', fontSize: 14, marginTop: 8 }}>
        useEffect + 依存配列で、userIdが変わったときだけfetchします。
      </p>
    </div>
  )
}

export default function Example06_FetchInBody() {
  const [userId, setUserId] = useState(1)
  const [key, setKey] = useState(0)

  return (
    <div className="example-card">
      <h2>Example 06: 関数本体でfetch（無限ループ）</h2>
      <p>
        関数本体に副作用を書くと無限ループになります。
        <code>useEffect</code> で隔離するのが正しい方法です。
      </p>
      <div style={{ margin: '12px 0' }}>
        <button onClick={() => { setUserId(id => id + 1); setKey(k => k + 1) }}>
          userId を変更 (現在: {userId})
        </button>
        <button onClick={() => setKey(k => k + 1)} style={{ background: '#666' }}>
          リセット（再マウント）
        </button>
      </div>
      <div className="side-by-side" key={key}>
        <BrokenUserProfile userId={userId} />
        <FixedUserProfile userId={userId} />
      </div>
    </div>
  )
}
