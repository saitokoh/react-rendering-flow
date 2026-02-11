---
marp: true
theme: default
paginate: true
header: 'React勉強会：関数コンポーネントの動作順序を極める'
footer: '© 2024 React Study Group'
style: |
  section {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 28px;
    line-height: 1.4;
  }
  h1 { color: #61dafb; }
  h2 { border-bottom: 2px solid #61dafb; padding-bottom: 5px; }
  h3 { color: #4CAF50; }
  code { background: #f4f4f4; color: #e91e63; padding: 2px 5px; border-radius: 3px; }
  pre code { color: inherit; padding: 10px; display: block; overflow-x: auto; }
  blockquote {
    border-left: 5px solid #ffc107;
    padding-left: 15px;
    margin-left: 0;
    font-style: italic;
    color: #555;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
---

# モダンフロントエンド勉強会
## 関数コンポーネントの「動作順序」を極める

**講師: 齋藤浩平**

---

## まず、質問です

ボタンをクリックすると、コンソールには何が表示されるでしょうか？

```javascript
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    console.log(count); // ← ここで何が出力される？
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

---

## この勉強会のゴール

先ほどの答えは **`0`** です。

`setCount` を呼んだのに、なぜ `count` は変わっていないのか？

この勉強会では、**この動作がなぜそうなるのか**を
Reactの内部の仕組みから理解し、説明できるようになることを目指します。

---

## 本日のアジェンダ

1.  **Reactの3つのフェーズ**
    -   Render, Commit, Passive Effects
2.  **舞台裏の司令塔：React Fiber**
    -   中断・再開、優先度制御
3.  **Render Phaseの最適化**
    -   Automatic Batching / Bailout
4.  **問題で理解を深めよう**（Q1〜Q5）
    -   スナップショット、更新関数、副作用、ミューテーション、Hookのルール

---

# 1. Reactの3つのフェーズ

---

## 1. Reactの3つのフェーズ

Reactは、1つの画面更新を以下の3段階で処理します。

-   **① Render Phase (レンダリング)** — 何を表示すべきか計算する
-   **② Commit Phase (コミット)** — 実際のDOMに反映する
-   **③ Effect Phase（useEffectの実行）** — 画面描画後に副作用を実行する

それぞれ詳しく見ていきましょう。

---

### ① Render Phase — きっかけ

関数コンポーネントを実行し、仮想DOMを生成して前回との**差分を抽出**する。

**きっかけ（トリガー）**:

- `setState` の呼び出し（`useState`）
- `dispatch` の呼び出し（`useReducer`）
- Contextの値の変更（`useContext`）
- 親コンポーネントの再レンダリング
- 初回マウント

> Render Phaseは自動では起きません。**何かのトリガー**があって初めて開始されます。

---

### ① Render Phase — Current Tree と WIP Tree

<div style="font-size: 20px;">

Reactは内部に**2つのFiberツリー**を持っています。

<div style="display: flex; gap: 15px; margin-top: 8px;">
  <div style="flex: 1; background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 10px;">
    <b>Current Tree</b><br/>
    今<b>画面に表示されている</b>状態を表すツリー。Commit後はこちらが「正」になる。
  </div>
  <div style="flex: 1; background: #fff3e0; border: 2px solid #f57c00; border-radius: 8px; padding: 10px;">
    <b>WIP Tree（Work In Progress）</b><br/>
    Render Phase中に<b>新しく構築される</b>ツリー。関数コンポーネントを実行し、ここに結果を書き込む。
  </div>
</div>

**Render Phaseで起きること：**

1. トリガーを受けて、**setStateのキューを処理**し最終的なstateの値を計算
2. 対象の関数コンポーネントを実行（`useState`は計算済みの値を返すだけ）
3. JSXから**仮想DOM**（UIの設計図）を生成
4. 仮想DOMの情報を元に **WIP Tree**（Fiberノード）を構築・更新
5. Current Tree と WIP Tree を比較して**差分を検出**
6. この処理は**中断・再開が可能**（ユーザー操作を優先できる）

> 仮想DOMは「何を表示したいか」、FiberツリーはそれにHookや優先度などの「どう処理するか」を加えた作業用データです。

</div>

---

### ① Render Phase — Commitへの引き継ぎ

WIP Treeの構築が完了すると、差分情報を持ったまま**Commit Phase**へ進みます。

Commit後、WIP Tree が新しい **Current Tree** に昇格します。
（この仕組みは「**ダブルバッファリング**」と呼ばれます）

<div style="display: flex; align-items: center; gap: 10px; margin-top: 20px; font-size: 20px;">
  <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 10px 15px; text-align: center;">
    <b>Current Tree</b><br/>count: 0
  </div>
  <div>→ Render →</div>
  <div style="background: #fff3e0; border: 2px solid #f57c00; border-radius: 8px; padding: 10px 15px; text-align: center;">
    <b>WIP Tree</b><br/>count: 1
  </div>
  <div>→ Commit →</div>
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 8px; padding: 10px 15px; text-align: center;">
    <b>WIP が新 Current に</b><br/>count: 1
  </div>
</div>

> 古い Current Tree は次回の WIP Tree として再利用されます。

---

### ② Commit Phase (コミット)

Render Phaseで計算した差分を、**実際のDOM**に反映する。

- 変更があった要素だけを**最小限の操作**でDOMに書き込む
- この処理は**同期的**に行われ、中断されない
- DOM更新が完了した時点では、まだブラウザの**画面描画は行われていない**

---

### ③ Effect Phase（useEffectの実行）

ブラウザが画面を**描画した後**に、副作用を実行する。

- `useEffect` に渡したコールバックがここで実行される
- **非同期**で実行されるため、画面描画をブロックしない
- 前回のエフェクトがあれば、先に**クリーンアップ**してから新しいエフェクトを実行

---

### DOM書き換え と ブラウザ描画 は別のタイミング

<div style="font-size: 20px; margin-top: 10px;">

<div style="display: flex; align-items: stretch; gap: 0; margin-bottom: 15px;">
  <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px 0 0 8px; padding: 10px 14px; text-align: center; flex: 1;">
    <b>Render Phase</b><br/>仮想DOMの差分計算
  </div>
  <div style="background: #fff3e0; border: 2px solid #f57c00; padding: 10px 14px; text-align: center; flex: 1;">
    <b>Commit Phase</b><br/><b>DOM を書き換え</b><br/><span style="color:#c62828;">※ まだ画面は古いまま</span>
  </div>
  <div style="background: #f3e5f5; border: 2px solid #7b1fa2; padding: 10px 14px; text-align: center; flex: 1;">
    <b>ブラウザ描画</b><br/>書き換わったDOMを<br/><b>画面にペイント</b>
  </div>
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 0 8px 8px 0; padding: 10px 14px; text-align: center; flex: 1;">
    <b>Passive Effects</b><br/><code>useEffect</code> 実行<br/>画面描画の<b>後</b>
  </div>
</div>

</div>

**DOM書き換え（Commit）** = JavaScriptがDOMツリーのデータを変更する処理
**ブラウザ描画（Paint）** = 変更されたDOMを画面のピクセルとして描き出す処理

- Commit Phase でDOMは書き換わるが、画面にはまだ**反映されていない**
- ブラウザが次の描画タイミングで画面に**ペイント**する
- `useEffect` はそのペイントの**後**に実行される → 画面描画をブロックしない

---

### 補足: useLayoutEffect というフックもある

実は `useEffect` と似たフックに **`useLayoutEffect`** があります。
違いは**実行タイミング**です。

<div style="font-size: 20px; margin-top: 10px;">

<div style="display: flex; align-items: stretch; gap: 0; margin-bottom: 15px;">
  <div style="background: #fff3e0; border: 2px solid #f57c00; border-radius: 8px 0 0 8px; padding: 10px 14px; text-align: center; flex: 1;">
    <b>Commit</b><br/>DOM書き換え
  </div>
  <div style="background: #fce4ec; border: 2px solid #c62828; padding: 10px 14px; text-align: center; flex: 1;">
    <b style="color:#c62828;">useLayoutEffect</b><br/>ここで<b>同期的</b>に実行<br/>描画を<b>ブロック</b>する
  </div>
  <div style="background: #f3e5f5; border: 2px solid #7b1fa2; padding: 10px 14px; text-align: center; flex: 1;">
    <b>ブラウザ描画</b><br/>画面にペイント
  </div>
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 0 8px 8px 0; padding: 10px 14px; text-align: center; flex: 1;">
    <b style="color:#388e3c;">useEffect</b><br/>ここで<b>非同期</b>に実行<br/>描画の<b>後</b>
  </div>
</div>

</div>

- `useLayoutEffect` はDOM書き換え後、ブラウザ描画の**前**に同期的に実行される
- DOM要素のサイズ計測や位置の微調整など、**描画前に確定させたい処理**に使う
- 通常は `useEffect` で十分。`useLayoutEffect` はチラツキ防止など限定的な場面で使う

---

## 最初の問題を3つのフェーズで追う

ボタンをクリックしたとき、何が起きるのか？

<div style="font-size: 16px;">

```javascript
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);  // ← ここで count は変わる？
    console.log(count);   // ← 何が出力される？
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

</div>

<div style="display: flex; align-items: center; gap: 8px; margin-top: 20px; font-size: 18px;">
  <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 8px 12px; text-align: center; flex: 1;">
    <b>① クリック</b><br/>
    <code>setCount(0+1)</code><br/>
    更新を<b>キューに積む</b>だけ<br/>
    <code>console.log</code> → <b style="color:#e91e63;">0</b>
  </div>
  <div style="font-size: 24px;">→</div>
  <div style="background: #fff3e0; border: 2px solid #f57c00; border-radius: 8px; padding: 8px 12px; text-align: center; flex: 1;">
    <b>② Render Phase</b><br/>
    <span style="color:#c62828; font-size: 14px;">キューを処理し最終値を計算</span><br/>
    <code>Counter()</code> を再実行<br/>
    <code>useState</code> が <b>1</b> を返す<br/>
    新しいJSXを生成
  </div>
  <div style="font-size: 24px;">→</div>
  <div style="background: #fce4ec; border: 2px solid #c62828; border-radius: 8px; padding: 8px 12px; text-align: center; flex: 1;">
    <b>③ Commit Phase</b><br/>
    DOMを更新<br/>
    <code>"Count: 0"</code><br/>→ <code>"Count: 1"</code>
  </div>
  <div style="font-size: 24px;">→</div>
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 8px; padding: 8px 12px; text-align: center; flex: 1;">
    <b>④ Effects</b><br/>
    画面描画後<br/>
    <code>useEffect</code><br/>が実行される
  </div>
</div>

---

## なぜ `console.log(count)` は `0` なのか？

<div style="display: flex; gap: 20px; margin-top: 10px;">
<div style="flex: 1;">

### ポイント: Stateは「スナップショット」

`setCount` は **今の `count` を書き換えない**。
更新を **キューに積む** だけ。

```javascript
const handleClick = () => {
  // この関数の中では count は常に 0
  setCount(0 + 1); // "次は1にして" とキューに積む
  console.log(0);  // まだ 0 のまま！
};
```

</div>
<div style="flex: 1;">

### 時系列で見ると

<div style="font-size: 20px; line-height: 1.8;">

| 順番 | 何が起きるか | `count` の値 |
|:---:|---|:---:|
| 1 | `handleClick()` 開始 | **0** |
| 2 | `setCount(0 + 1)` キューに積む | **0** |
| 3 | `console.log(count)` | **0** |
| 4 | `handleClick()` 終了 | **0** |
| 5 | Render Phase 開始：キューを処理 | — |
| 6 | `useState(0)` が計算済みの **1** を返す | **1** ← ここで変わる |

</div>
</div>
</div>

---

# 2. 舞台裏の司令塔：React Fiber

---

## 2. 舞台裏の司令塔：React Fiber

これら全てのフェーズを管理しているのが **React Fiber** です。

-   **役割**: 更新の優先順位を決め、関数の実行を管理する「スケジューラー」。
-   **特徴**:
    -   **Render Phase**: ユーザーの入力を優先するために「中断・再開」が可能。
    -   **Commit Phase以降**: ユーザーの混乱を防ぐため、同期的にDOMを書き換える。

---

### Render Phaseの中断・再開とは？

Fiberが無かった頃（React 15以前）は、Render Phaseが始まると
すべてのコンポーネントを**一気に処理し終えるまで止まれなかった**。

その間、ユーザーの操作（キー入力やクリック）は**待たされてしまう**。

<div style="font-size: 20px; margin-top: 15px;">

<div style="display: flex; align-items: stretch; gap: 0; margin-bottom: 10px;">
  <div style="background: #ffcdd2; border: 2px solid #c62828; border-radius: 8px; padding: 10px; text-align: center; flex: 1;">
    <b>旧: 一括処理</b><br/>
    Render（長い）────────────→ Commit<br/>
    <span style="color:#c62828;">この間ずっとUIがフリーズ</span>
  </div>
</div>

<div style="display: flex; align-items: stretch; gap: 0;">
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 8px; padding: 10px; text-align: center; flex: 1;">
    <b>Fiber: 分割処理</b><br/>
    Render → <b style="color:#1976d2;">中断</b> → ユーザー入力処理 → <b style="color:#388e3c;">再開</b> → Render → Commit<br/>
    <span style="color:#388e3c;">UIが応答し続ける</span>
  </div>
</div>

</div>

---

### 中断・再開の実例: 検索フォーム

```javascript
import { useState, useTransition } from "react";

const allItems = ["React", "Redux", "Remix", "Router", "RSC", "Rollup"];

function Search() {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(allItems);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value);             // 高優先: 入力欄をすぐ更新
    startTransition(() => {               // 低優先: フィルタ結果は後回しでOK
      setFiltered(allItems.filter(item =>
        item.toLowerCase().includes(e.target.value.toLowerCase())
      ));
    });
  };

  return (<>
    <input value={query} onChange={handleChange} />
    {isPending ? <p>検索中...</p> : <ul>{filtered.map(v => <li>{v}</li>)}</ul>}
  </>);
}
```

---

### useTransition とは

State更新の**優先度を下げる**ためのReact標準フック。

```javascript
const [isPending, startTransition] = useTransition();
```

| 戻り値 | 説明 |
|---|---|
| `isPending` | 低優先の更新が処理中なら `true`（ローディング表示に使える） |
| `startTransition` | この中で呼んだ `setState` が**低優先度**になる |

- `startTransition` の**外**で呼んだ `setState` → すぐにRender（高優先）
- `startTransition` の**中**で呼んだ `setState` → 後回しにしてよいRender（低優先）
- Fiberは高優先の更新が来ると、低優先のRenderを**中断**して先に処理する

---

### 中断・再開の仕組み

`useTransition` で包んだ更新は**低優先度**としてマークされます。

<div style="font-size: 20px; margin-top: 10px;">

| 順番 | 何が起きるか | 優先度 |
|:---:|---|:---:|
| 1 | ユーザーが「あ」と入力 | — |
| 2 | `setQuery("あ")` → 入力欄を即座に再レンダリング | **高** |
| 3 | `startTransition` 内の `setResults` → Render開始 | **低** |
| 4 | ユーザーが続けて「い」と入力 | — |
| 5 | Fiberが低優先のRenderを**中断** | — |
| 6 | `setQuery("あい")` → 入力欄を即座に再レンダリング | **高** |
| 7 | 新しい `setResults` で Renderを**再開** | **低** |

</div>

> Fiberは更新ごとに優先度を判断し、**ユーザーが体感する応答性**を最大化します。

---

### ちなみに: useDeferredValue

同様に優先度を下げる仕組みとして **`useDeferredValue`** というフックもあります。

`useTransition` が `setState` の呼び出しを低優先にするのに対し、
`useDeferredValue` は**値の反映そのもの**を遅延させます。

<div style="font-size: 18px;">

```javascript
import { useState, useDeferredValue } from "react";

const allItems = ["React", "Redux", "Remix", "Router", "RSC", "Rollup"];

// 親: 入力を管理する
function Search() {
  const [query, setQuery] = useState("");
  return (<>
    <input value={query} onChange={e => setQuery(e.target.value)} />
    <Results query={query} />
  </>);
}

// 子: propsで受け取るので自分では setState できない → useDeferredValue
function Results({ query }) {
  const deferredQuery = useDeferredValue(query); // 値の反映を後回しに
  const results = allItems.filter(item => item.includes(deferredQuery));
  return <ul>{results.map(v => <li>{v}</li>)}</ul>;
}
```

</div>

---

### 補足: Reactが自動で決める優先度

開発者がフックで操作しなくても、Reactは**イベントの種類**に応じて自動的に優先度を割り当てています。

<div style="font-size: 20px;">

| 優先度 | イベントの例 | 理由 |
|---|---|---|
| **最高（同期）** | `click`, `keydown`, `keyup`, `input`, `change`, `focus`, `blur`, `submit`, `mousedown`, `mouseup`, `touchstart`, `touchend` | ユーザーが即座に反応を期待する離散的な操作 |
| **やや低い** | `mousemove`, `mouseenter`, `mouseleave`, `scroll`, `touchmove`, `drag`, `dragover` | 連続的に大量発生するので、すべて即処理すると重い |
| **低（Transition）** | `startTransition` 内の更新 | 開発者が明示的に後回しを指定 |

</div>

同じ `setState` でも `onClick` 内と `onScroll` 内では異なる優先度になります。
開発者が意識しなくても、Fiberが裏側で最適なスケジューリングを行っています。

---

# 3. Render Phaseの最適化

---

## Render Phaseの最適化: Automatic Batching

`handleClick` の中で `setState` を複数回呼んだら、Renderも複数回走る？

```javascript
const handleClick = () => {
  setCount(c => c + 1);  // State更新1
  setName("React");      // State更新2
  setFlag(f => !f);      // State更新3
  // => 3回ではなく、1回だけ Render Phase が走る！
};
```

- Reactは1つのイベントハンドラ内の `setState` をすべて**キューに溜める**
- ハンドラ終了後に**まとめて1回だけ**Render Phaseを実行する
- この仕組みを **Automatic Batching** と呼ぶ
- **誰が？**: React Fiberがスケジュール管理している

> 不要な再レンダリングを防ぎ、パフォーマンスを自動で最適化してくれます。

---

## Render Phaseの最適化: Bailout（ベイルアウト）

<div style="font-size: 20px;">

`setState` を呼んでも、Render Phaseが**スキップ**されることがある。

```javascript
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(0); // 現在の値と同じ → Render Phase は走らない！
};
```

- `setState` に渡された新しい値と現在の値を **`Object.is`** で比較
- **同じ値**なら Render Phase を**スキップ**（再レンダリングもEffectも実行されない）

| ケース | `Object.is` | Renderは？ |
|---|---|---|
| `setCount(0)` で現在値が `0` | `true`（同じ） | **スキップ** |
| `setCount(1)` で現在値が `0` | `false`（違う） | **実行** |
| `setUser({...user})` で中身が同じ | `false`（参照が違う） | **実行される** ← 注意！ |

> オブジェクトや配列は**参照**で比較されるため、中身が同じでも新しいオブジェクトを作ると Bailout されません。

</div>

---

# 4. 問題で理解を深めよう

---

## 4. 問題で理解を深めよう

ここからは問題形式で進めます。
これまで学んだ仕組みを使って、コードの動作を予測してみましょう。

---

## Q1. `setCount` を3回呼ぶと？

ボタンを1回クリックすると、`count` は何になるでしょうか？

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

---

## A1. 答え: `1`

3回 `setCount` を呼んでいるのに `1` にしかならない！

```javascript
const handleClick = () => {
  // この関数内の count はスナップショット → 常に 0
  setCount(0 + 1); // "次は1にして" と予約
  setCount(0 + 1); // "次は1にして" と予約（上書き）
  setCount(0 + 1); // "次は1にして" と予約（上書き）
};
```

- `count` はスナップショット（定数）なので、関数内では **ずっと `0`**
- 3回とも `setCount(1)` を呼んでいるのと同じ
- Automatic Batching により Render は**1回だけ**実行される

---

## Q2. 更新関数を使うとどうなる？

ボタンを1回クリックすると、`count` は何になるでしょうか？

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

---

## A2. 答え: `3`

<div style="font-size: 22px;">

Q1 とほぼ同じコードなのに結果が違う！

```javascript
const handleClick = () => {
  setCount(prev => prev + 1); // 0 → 1
  setCount(prev => prev + 1); // 1 → 2
  setCount(prev => prev + 1); // 2 → 3
};
```

- `prev => prev + 1` は **更新関数**。スナップショットではなく**直前の値**を受け取る
- Reactは更新関数を**キュー（行列）**に入れ、順番に実行する
- 直前の結果が次の `prev` に渡されるため、正しく積み上がる

</div>

---

## A2. 補足: なぜ `prev` に正しい値が入るのか？

<div style="font-size: 20px;">

`useState` を呼ぶたびに、Fiberノード内に**番号付きの保管箱**が作られます。
返される `setXxx` は**自分が何番の箱か記憶している**ので、値が混ざりません。

<div style="display: flex; gap: 15px; margin-top: 15px;">
  <div style="flex: 1;">

```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState("React");
```

  </div>
  <div style="flex: 1;">
    <div style="background: #f5f5f5; border: 2px solid #333; border-radius: 8px; padding: 10px;">
      <b>Fiberノードの保管箱</b>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 6px; padding: 8px; flex: 1; text-align: center;">
          <b>箱 #0</b><br/>
          値: <code>0</code><br/>
          ← <code>setCount</code> が担当
        </div>
        <div style="background: #fff3e0; border: 2px solid #f57c00; border-radius: 6px; padding: 8px; flex: 1; text-align: center;">
          <b>箱 #1</b><br/>
          値: <code>"React"</code><br/>
          ← <code>setName</code> が担当
        </div>
      </div>
    </div>
  </div>
</div>

`setCount(prev => prev + 1)` を呼ぶと：
1. `setCount` は「自分は **箱 #0** の担当」と知っている
2. 箱 #0 から現在値 `0` を取り出して `prev` に渡す
3. `prev + 1` の結果 `1` を箱 #0 に書き戻す

→ `setName` の箱 #1 とは**完全に独立**しているので、値が混ざることはありません。

</div>

---

## Q3. 関数の中でAPIを呼ぶとどうなる？

このコードには問題があります。何が起きるでしょうか？

```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // 関数本体で直接APIを呼んでいる
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => setUser(data));

  return <div>{user?.name}</div>;
}
```

---

## A3. 答え: 無限ループ

<div style="font-size: 22px;">

1. 関数本体で `fetch` → レスポンス受信 → `setUser(data)` が呼ばれる
2. `setUser` が Render Phase をトリガー → 関数が**再実行**される
3. また `fetch` が実行される → `setUser` → Render → `fetch` → ...

**原因**: 関数本体は**純粋**であるべき。副作用（API呼び出し等）を直接書いてはいけない。

**対策**: 副作用は `useEffect` の中に隔離する。

```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]); // userId が変わったときだけ実行

  return <div>{user?.name}</div>;
}
```

</div>

---

## Q4. 配列にpushして画面を更新したい

ボタンをクリックすると、リストに項目が追加される…はずですが、何が起きるでしょうか？

```javascript
function TodoList() {
  const [items, setItems] = useState(["タスク1"]);

  const handleAdd = () => {
    items.push("タスク2");  // 配列に直接追加
    setItems(items);        // setStateで更新
  };

  return (<>
    <button onClick={handleAdd}>追加</button>
    <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
  </>);
}
```

---

## A4. 答え: 画面が更新されない

<div style="font-size: 22px;">

`items.push()` で中身は変わっているのに、画面には反映されない！

- `items.push("タスク2")` → 元の配列を**直接変更**（ミューテーション）
- `setItems(items)` → 同じ配列の**同じ参照**を渡している
- React は `Object.is(前の値, 新しい値)` で比較 → `true`（同じ参照）
- **Bailout** が発動 → Render Phase がスキップされる！

**対策**: 新しい配列を作って渡す（スプレッド構文）

```javascript
const handleAdd = () => {
  setItems([...items, "タスク2"]); // 新しい配列を作る → 参照が変わる → 更新される
};
```

> オブジェクトも同様です。`{...obj, key: newValue}` で新しいオブジェクトを作りましょう。

</div>

---

## Q5. 条件分岐の中でHookを呼ぶ

このコードには問題があります。何が起きるでしょうか？

```javascript
function Profile({ isLoggedIn }) {
  const [name, setName] = useState("ゲスト");

  if (isLoggedIn) {
    const [email, setEmail] = useState("");  // ログイン時だけ使いたい
  }

  const [theme, setTheme] = useState("light");

  return <div>{name} - {theme}</div>;
}
```

---

## A5. 答え: エラーになる

<div style="font-size: 20px;">

React はエラーを出します: **Hooks の呼び出し順序が変わってはいけない。**

A2補足で説明した通り、Fiberノードの保管箱は**呼び出し順の番号**で管理されています。

<div style="display: flex; gap: 15px; margin-top: 10px;">
  <div style="flex: 1; background: #e8f5e9; border: 2px solid #388e3c; border-radius: 8px; padding: 10px;">
    <b>isLoggedIn = true のとき</b><br/>
    箱#0: <code>name</code><br/>
    箱#1: <code>email</code><br/>
    箱#2: <code>theme</code>
  </div>
  <div style="flex: 1; background: #ffcdd2; border: 2px solid #c62828; border-radius: 8px; padding: 10px;">
    <b>isLoggedIn = false のとき</b><br/>
    箱#0: <code>name</code><br/>
    箱#1: <code>theme</code> ← <b style="color:#c62828;">ズレた！</b><br/>
    <code>theme</code> が <code>email</code> の箱を読んでしまう
  </div>
</div>

**ルール**: Hookは**必ずコンポーネントのトップレベル**で、**毎回同じ順序**で呼ぶこと。

**対策**: 条件分岐はHookの**中**で行う。

```javascript
const [email, setEmail] = useState("");  // 常に呼ぶ
// isLoggedIn のときだけ email を使う（呼び出し自体は毎回行う）
```

</div>

---

## Q6. useEffect の中で setState を呼ぶ

このコードを実行するとどうなるでしょうか？

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // 毎回カウントを +1 したい
  });

  return <p>Count: {count}</p>;
}
```

---

## A6. 答え: 無限ループ

<div style="font-size: 20px;">

画面がフリーズするか、Reactが「再レンダリングが多すぎる」とエラーを出します。

<div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 18px;">
  <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 8px; text-align: center; flex: 1;">
    <b>Render</b><br/>count: 0
  </div>
  <div>→</div>
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 8px; padding: 8px; text-align: center; flex: 1;">
    <b>Effect実行</b><br/><code>setCount(1)</code>
  </div>
  <div>→</div>
  <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 8px; text-align: center; flex: 1;">
    <b>再Render</b><br/>count: 1
  </div>
  <div>→</div>
  <div style="background: #e8f5e9; border: 2px solid #388e3c; border-radius: 8px; padding: 8px; text-align: center; flex: 1;">
    <b>Effect実行</b><br/><code>setCount(2)</code>
  </div>
  <div>→ ∞</div>
</div>

**原因**: `useEffect` の**依存配列がない** → **毎回のRender後に実行**される
→ `setCount` が Render をトリガー → また Effect → また Render → ...

**対策**: 依存配列を正しく指定する

```javascript
// 初回だけ実行したい場合
useEffect(() => { setCount(1); }, []);  // 空配列 = 初回マウント時のみ（countを使わない）

// count が変わったときだけ実行したい場合
useEffect(() => { /* countを使う処理 */ }, [count]);  // countが依存
```

> `useEffect` には**必ず依存配列を書く**習慣をつけましょう。

</div>

---

## 5. まとめ

<div style="font-size: 22px;">

1. **3つのフェーズ**: Render → Commit → Passive Effects の順で画面が更新される。
2. **`setState` はキューに積むだけ**: 今の変数は書き換わらない（スナップショット）。
3. **React Fiber**: 優先度に応じてRender Phaseの中断・再開を管理するスケジューラー。
4. **Automatic Batching**: 複数の `setState` → Render Phaseは1回だけ。
5. **Bailout**: `Object.is` で参照を比較し、同じならRenderをスキップ。

</div>

---

# ご清聴ありがとうございました！

### 質疑応答

---

## おまけ: 開発時にコンソールログが2回出る？

以下のコードで、初回表示時にコンソールに何が出力されるでしょうか？

```javascript
// Strict Mode が有効（デフォルト）
function App() {
  console.log("Render!");
  return <h1>Hello</h1>;
}
```

---

## おまけ: 答え — `"Render!"` が2回出力される

```
Render!
Render!
```

- React の **Strict Mode** は開発モードでコンポーネントを**意図的に2回実行**する
- 関数が純粋かどうか（副作用がないか）を検証するため
- **本番ビルドでは1回だけ**実行される

> Strict Mode による2回実行で挙動が変わるなら、そのコードには副作用が混入しています。
> クリーンアップ関数を適切に書くことで対処できます。
