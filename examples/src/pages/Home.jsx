import { Link } from 'react-router-dom'
import { examples } from '../App'

export default function Home() {
  return (
    <>
      <h1>React レンダリング例題集</h1>
      <p style={{ marginBottom: 20 }}>
        勉強会スライドのサンプルコードを実際に動かして確認できます。
      </p>
      <ul className="example-list">
        {examples.map(({ path, title }) => (
          <li key={path}>
            <Link to={`/example/${path}`}>{title}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
