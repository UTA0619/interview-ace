# Webで公開する手順（誰でも見れるようにする）

このアプリをインターネット上に公開するには **Vercel** へのデプロイが最も簡単です。無料プランで利用できます。

## 1. 準備

### 1-1. リポジトリにプッシュ（GitHub / GitLab / Bitbucket）

```bash
cd /Users/newworld/Documents
git init
git add .
git commit -m "Initial commit"
# GitHub などにリポジトリを作成し、以下でプッシュ
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git branch -M main
git push -u origin main
```

### 1-2. 環境変数を用意

デプロイ前に以下をメモしておきます（Vercel のダッシュボードで入力します）。

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase のプロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase の service_role key（Webhook 用） |
| `STRIPE_SECRET_KEY` | Stripe のシークレットキー |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook の署名シークレット |
| `STRIPE_PRICE_ID_PRO` | 月額980円の Price ID |
| `OPENAI_API_KEY` | OpenAI API キー（面接機能用） |
| `NEXT_PUBLIC_APP_URL` | 公開後のURL（例: `https://あなたのアプリ.vercel.app`） |

## 2. Vercel にデプロイ

1. ** [Vercel](https://vercel.com) にアクセス**し、GitHub アカウントでログインします。

2. **「Add New…」→「Project」** を選択し、先ほどプッシュしたリポジトリをインポートします。

3. **Framework Preset** は「Next.js」のまま、**Root Directory** はそのままで問題ありません。

4. **Environment Variables** で、上記の環境変数をすべて追加します。  
   - Production / Preview / Development のどれに効かせるか選べます（本番だけなら Production でOK）。

5. **「Deploy」** をクリックしてビルド・デプロイを開始します。

6. 完了すると **本番URL**（例: `https://interview-app-xxx.vercel.app`）が発行されます。  
   このURLを **誰でも開ける状態** にしたい場合は、Vercel のデフォルトのまま（認証なし）で問題ありません。

## 3. 公開後の設定

- **NEXT_PUBLIC_APP_URL** を、発行された本番URL（例: `https://interview-app-xxx.vercel.app`）に更新し、Vercel で再デプロイすると、Stripe のリダイレクト先などが正しく動きます。
- **Stripe Webhook** のエンドポイントを、  
  `https://あなたのアプリ.vercel.app/api/stripe/webhook`  
  に設定し、イベントを有効にします。

これで、そのURLを知っている人なら誰でもアプリにアクセスできます。
