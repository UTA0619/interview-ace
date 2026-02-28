# 🐕 わんこ健康ノート

小型犬の健康状態を管理できるWebアプリです。  
誰でもブラウザで開いてそのまま利用できます（会員登録不要・データは端末内に保存）。

## 公開URL（デプロイ後）

- このフォルダを Netlify / GitHub Pages などでデプロイすると、世界中からアクセスできるURLが発行されます。
- **最もかんたん:** 下記「方法1: Netlify Drop」なら、ブラウザだけで数分で公開できます。

---

## Web公開の手順

### 方法1: Netlify Drop（いちばんかんたん・無料）

**パソコン不要の作業はありません。ブラウザだけで完了します。**

1. ブラウザで **https://app.netlify.com/drop** を開く。
2. **「dog-health-app」フォルダの中身**（`index.html`・`app.js`・`styles.css` の3ファイル）を、まとめてドラッグしてウィンドウにドロップする。  
   - フォルダごとドロップしてもOKです。
3. アップロードが終わると、**https://○○○.netlify.app** のようなURLが表示されます。
4. このURLをコピーして、SNSやメールで共有すれば、**誰でも同じURLで利用**できます。

※ 無料のまま利用できます。Netlify のアカウントを作ると、同じURLを今後も維持・管理できます（作らなくても一時的なURLで利用可能な場合があります）。

### 方法2: Netlify でサイトとして管理（無料）

1. [Netlify](https://www.netlify.com/) にアクセスし、無料アカウントでログイン（GitHubでログイン可）。
2. 画面上部の **「Sites」** → **「Add new site」** → **「Deploy manually」** を選択。
3. **「dog-health-app」フォルダ全体**をドラッグ＆ドロップしてアップロード。
4. 数十秒後、`https://○○○.netlify.app` のようなURLが表示されます。このURLを共有すれば誰でも利用できます。

### 方法2: GitHub Pages

1. [GitHub](https://github.com/) でリポジトリを新規作成（例: `dog-health-app`）。
2. 作成したリポジトリの **「Settings」** → **「Pages」** を開く。
3. **Source** で **「Deploy from a branch」** を選び、**Branch** を `main`、フォルダを **`/ (root)`** にして保存。
4. リポジトリに **dog-health-app フォルダの中身**（`index.html`, `app.js`, `styles.css`）をコミット・プッシュ。
5. 数分後、`https://あなたのユーザー名.github.io/dog-health-app/` で公開されます（リポジトリ名がURLに入る場合があります）。

### 方法3: Vercel

1. [Vercel](https://vercel.com/) に無料アカウントでログイン。
2. **「Add New」** → **「Project」** で、Git リポジトリをインポートするか、**「Import Third-Party Git Repository」** の代わりに **CLI** でデプロイも可能。
3. ターミナルで `dog-health-app` フォルダに移動し、`npx vercel --yes` を実行すると、プロジェクトがアップロードされURLが発行されます。

---

データはブラウザの localStorage に保存されるため、サーバー側のデータベースは不要です。  
大切な記録は定期的にメモやスクリーンショットでバックアップすることをおすすめします。
