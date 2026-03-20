# polarGPT Preview 新手部署指南

这份文档只做一件事：把 `polarGPT` 部署出一个可访问的 Preview 版本。

适合你现在这种情况：

- 已经有本地项目代码
- 已经有 GitHub 账号
- 已经有 Google AI API key
- 还没有 Supabase 和 Vercel 账号
- 想先练手，不急着上正式生产环境

## 第 1 步：先看本地还缺什么

在项目目录运行：

```bash
cd /Users/huangyiteng/Desktop/web-ai
npm run preview:doctor
```

这个命令会告诉你：

- `.env` 里还缺哪些值
- GitHub 远端仓库有没有配置
- 下一步最应该做什么

如果你补完配置后不确定是否完整，再跑一次这个命令。

## 第 2 步：准备本地 `.env`

你至少要补齐这些值：

- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

### 2.1 生成管理员密码哈希

```bash
npm run hash:admin -- "你准备登录后台时要用的密码"
```

把输出粘贴到 [`.env`](/Users/huangyiteng/Desktop/web-ai/.env) 的 `ADMIN_PASSWORD_HASH=` 后面。

### 2.2 填入 Gemini API key

把你已经有的 API key 粘贴到 [`.env`](/Users/huangyiteng/Desktop/web-ai/.env) 的 `GEMINI_API_KEY=` 后面。

### 2.3 暂时保留这两个默认值

- `SESSION_SECRET`：项目已经生成好了
- `APP_BASE_URL=http://localhost:3000`：本地开发先保持这样即可

## 第 3 步：创建 GitHub 仓库并推送代码

### 3.1 在 GitHub 网页创建空仓库

仓库名固定用：`polargpt`

注意：

- 不要勾选 `Add a README file`
- 不要勾选 `.gitignore`
- 不要勾选 License

### 3.2 在本地连接远端仓库

```bash
git remote add origin git@github.com:fallqaq/polargpt.git
git push -u origin main
```

如果你用的是 HTTPS，也可以把 `git@github.com:...` 换成 GitHub 页面给你的 HTTPS 地址。

## 第 4 步：创建 Supabase Preview 项目

### 4.1 注册并登录 Supabase

建议直接用 GitHub 账号登录，省掉记一套新密码。

### 4.2 创建新项目

建议参数固定为：

- Project name: `polargpt-preview`
- Region: `Southeast Asia (Singapore)`

原因很简单：你主要用户在中国/亚洲，这个区域更合适。Supabase 后续如果想改区域，通常需要新建项目再迁移。

### 4.3 执行数据库初始化 SQL

项目创建完成后，打开 Supabase 的 `SQL Editor`，把 [`202603200001_polar_gpt_init.sql`](/Users/huangyiteng/Desktop/web-ai/supabase/migrations/202603200001_polar_gpt_init.sql) 全部执行。

执行成功后，系统会创建：

- `conversations`
- `messages`
- `attachments`
- `chat-attachments` 私有存储桶

### 4.4 复制这三个值到本地 `.env`

从 Supabase 项目设置里找到并复制：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

粘贴到 [`.env`](/Users/huangyiteng/Desktop/web-ai/.env) 对应位置。

## 第 5 步：跑本地预发布检查

现在执行：

```bash
npm run preview:ready
```

这个命令会按顺序执行：

```bash
npm run deploy:check
npm run typecheck
npm test
npm run build
```

只有这一步全部通过，才继续去 Vercel。

## 第 6 步：注册 Vercel 并导入 GitHub 仓库

### 6.1 注册并登录 Vercel

建议直接用 GitHub 登录。

### 6.2 导入项目

在 Vercel 里选择：

- `Add New...`
- `Project`
- 选择 GitHub 上的 `polargpt`

框架保持自动识别成 `Nuxt`，不要手改构建命令。

## 第 7 步：只配置 Preview 环境变量

在 Vercel 项目设置里，把下面这些变量添加到 Preview 环境：

- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`
- `APP_BASE_URL=https://preview.example.com`

第一次先用 `https://preview.example.com` 只是为了让配置完整。

等真正的 Preview URL 生成后，再把 `APP_BASE_URL` 改成真实的 Preview 地址，并重新部署一次。

## 第 8 步：触发 Preview 部署

Vercel 只有在非 `main` 分支时才会生成 Preview。

在本地运行：

```bash
git checkout -b codex/preview-setup
git commit --allow-empty -m "Trigger preview deployment"
git push -u origin codex/preview-setup
```

这样 Vercel 就会给你生成一个 Preview URL。

## 第 9 步：Preview 验收

拿到 Preview URL 后，先验证健康检查：

```text
https://<你的-preview-url>/api/health
```

你应该看到：

- HTTP `200`
- JSON 里有 `"ok": true`

然后再做这几个页面级验证：

1. 打开 `/login`
2. 用你的管理员密码登录
3. 新建一个会话
4. 发一条纯文本消息
5. 上传一张图片
6. 上传一个 PDF 或 Markdown 文件
7. 重命名会话
8. 搜索会话
9. 删除会话

## 第 10 步：如果出错，看哪里

优先按这个顺序排查：

1. 本地再跑一次 `npm run preview:doctor`
2. 本地再跑一次 `npm run preview:ready`
3. 看 Vercel 的 Runtime Logs
4. 看 Supabase Logs
5. 对照 [operations.md](/Users/huangyiteng/Desktop/web-ai/docs/operations.md)

## 你现在最推荐的下一步

如果你现在要继续，最短路径是：

1. 在 GitHub 创建空仓库 `polargpt`
2. 注册 Supabase 并创建 `polargpt-preview`
3. 把 Supabase 三个 key 粘到 [`.env`](/Users/huangyiteng/Desktop/web-ai/.env)
4. 运行 `npm run preview:doctor`
5. 运行 `npm run preview:ready`
6. 再去 Vercel 导入仓库
