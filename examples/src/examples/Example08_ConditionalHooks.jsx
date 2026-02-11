import { useState, Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h3>React エラーをキャッチしました</h3>
          <p style={{ fontFamily: 'monospace', fontSize: 14, marginTop: 8 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={this.props.onReset}
            style={{ background: '#c62828', marginTop: 12 }}
          >
            リセットして最初からやり直す
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// 問題コード: 条件分岐の中でHookを呼ぶ
function Profile({ isLoggedIn }) {
  const [name] = useState('ゲスト')

  if (isLoggedIn) {
    const [email] = useState('')  // eslint-disable-line react-hooks/rules-of-hooks
    void email
  }

  const [theme] = useState('light')

  return (
    <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 4 }}>
      <p>name: {name} / theme: {theme}</p>
      <p style={{ fontSize: 13, color: '#888' }}>
        Hook数: {isLoggedIn ? '3個 (name, email, theme)' : '2個 (name, theme)'}
      </p>
    </div>
  )
}

export default function Example08_ConditionalHooks() {
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [key, setKey] = useState(0)

  const handleToggle = () => {
    // key は変えない → 同じコンポーネントインスタンスが再レンダリングされる
    setIsLoggedIn(prev => !prev)
  }

  const handleReset = () => {
    setIsLoggedIn(true)
    setKey(k => k + 1)
  }

  return (
    <div className="example-card">
      <h2>Example 08: 条件分岐内Hook</h2>
      <p>
        条件分岐の中で Hook を呼ぶと、呼び出し順序が変わりエラーになります。
        Fiber ノードの保管箱は呼び出し順の番号で管理されているためです。
      </p>

      <div style={{ background: '#fff3e0', border: '1px solid #f57c00', borderRadius: 4, padding: 12, margin: '12px 0', fontSize: 14 }}>
        <strong>手順:</strong> 現在 isLoggedIn=true（Hook 3つ）です。
        ボタンを押して false に切り替えると、Hook が2つに減り、
        順序がズレてエラーが発生します。
      </div>

      <div style={{ margin: '12px 0' }}>
        <button onClick={handleToggle}>
          isLoggedIn を {isLoggedIn ? 'true → false' : 'false → true'} に切り替え
        </button>
      </div>

      <ErrorBoundary key={key} onReset={handleReset}>
        <Profile isLoggedIn={isLoggedIn} />
      </ErrorBoundary>

      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 13, marginTop: 12, overflow: 'auto' }}>
{`function Profile({ isLoggedIn }) {
  const [name] = useState("ゲスト");       // 箱#0

  if (isLoggedIn) {
    const [email] = useState("");           // 箱#1 (trueの時だけ!)
  }

  const [theme] = useState("light");        // 箱#2 or 箱#1 ← ズレる!
  return <div>{name} - {theme}</div>;
}

// true  → 箱#0:name, 箱#1:email, 箱#2:theme
// false → 箱#0:name, 箱#1:theme ← emailの値を読んでしまう`}
      </pre>
    </div>
  )
}
