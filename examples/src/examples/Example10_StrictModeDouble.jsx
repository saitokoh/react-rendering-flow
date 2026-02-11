import { useState, useEffect, useRef } from 'react'

function HelloComponent() {
  const [logs, setLogs] = useState([])
  const renderCount = useRef(0)

  renderCount.current++

  useEffect(() => {
    // StrictModeではマウント→アンマウント→再マウントが行われる
    setLogs(prev => [...prev, `useEffect 実行 (renderCount=${renderCount.current})`])
    return () => {
      setLogs(prev => [...prev, 'useEffect クリーンアップ'])
    }
  }, [])

  return (
    <div>
      <h1>Hello</h1>
      <p>レンダリング回数 (ref): {renderCount.current}</p>
      <p style={{ fontSize: 13, color: '#888' }}>
        StrictMode では開発時にコンポーネントが2回レンダリングされ、
        useEffect もマウント→クリーンアップ→再マウントされます。
        ブラウザのコンソールも確認してみてください。
      </p>
      <div className="log-area">
        {logs.length === 0 && <p>マウント後にログが表示されます</p>}
        {logs.map((log, i) => <p key={i}>{log}</p>)}
      </div>
    </div>
  )
}

export default function Example10_StrictModeDouble() {
  const [mounted, setMounted] = useState(false)

  return (
    <div className="example-card">
      <h2>Example 10: StrictMode 二重実行</h2>
      <p>
        React の <code>StrictMode</code> は開発モードでコンポーネントを意図的に2回実行します。
        関数が純粋かどうか（副作用がないか）を検証するためです。
        本番ビルドでは1回だけ実行されます。
      </p>
      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 13, margin: '12px 0', overflow: 'auto' }}>
{`// Strict Mode が有効（デフォルト）
function App() {
  console.log("Render!");
  return <h1>Hello</h1>;
}
// → "Render!" が2回出力される`}
      </pre>
      <button onClick={() => setMounted(m => !m)}>
        {mounted ? 'アンマウント' : 'マウントして確認'}
      </button>
      {mounted && (
        <div style={{ marginTop: 16 }}>
          <HelloComponent />
        </div>
      )}
    </div>
  )
}
