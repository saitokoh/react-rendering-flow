import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Example01 from './examples/Example01_CounterBasic'
import Example02 from './examples/Example02_UseTransition'
import Example03 from './examples/Example03_UseDeferredValue'
import Example04 from './examples/Example04_TripleSetCountValue'
import Example05 from './examples/Example05_TripleSetCountUpdater'
import Example06 from './examples/Example06_FetchInBody'
import Example07 from './examples/Example07_ArrayPushMutation'
import Example08 from './examples/Example08_ConditionalHooks'
import Example09 from './examples/Example09_UseEffectNoDeps'
import Example10 from './examples/Example10_StrictModeDouble'

const examples = [
  { path: '01', element: <Example01 />, title: '01: Counter基本（スナップショット）' },
  { path: '02', element: <Example02 />, title: '02: useTransition 検索' },
  { path: '03', element: <Example03 />, title: '03: useDeferredValue 検索' },
  { path: '04', element: <Example04 />, title: '04: setCount(count+1) x3' },
  { path: '05', element: <Example05 />, title: '05: 更新関数 x3' },
  { path: '06', element: <Example06 />, title: '06: 関数本体でfetch（無限ループ）' },
  { path: '07', element: <Example07 />, title: '07: 配列pushミューテーション' },
  { path: '08', element: <Example08 />, title: '08: 条件分岐内Hook' },
  { path: '09', element: <Example09 />, title: '09: useEffect依存配列なし（無限ループ）' },
  { path: '10', element: <Example10 />, title: '10: StrictMode 二重実行' },
]

export { examples }

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          {examples.map(({ path, element }) => (
            <Route key={path} path={`/example/${path}`} element={
              <>
                <Link to="/" className="back-link">&larr; 一覧に戻る</Link>
                {element}
              </>
            } />
          ))}
        </Routes>
      </div>
    </HashRouter>
  )
}
