# CodeChronicles UI

个人博客前端，基于 Vue 3 + Vite + Element Plus。

## 运行

```bash
npm install
npm run dev
```

默认开发服务为 `http://localhost:5173`。

项目已提供 `.npmrc`，默认使用淘宝 npm 镜像 `https://registry.npmmirror.com` 安装依赖。

## 后端接口

前端按环境访问后端：

- 本地开发：Vite 将 `/api` 代理到 `http://localhost:8080`
- 生产环境：直接请求 `http://39.107.229.170:8080/api`

可复制 `.env.example` 为 `.env` 并调整：

```bash
VITE_API_BASE_URL=http://39.107.229.170:8080/api
```

## 生产部署

构建生产文件：

```bash
npm run build
```

将生成的 `dist` 目录部署到服务器：

```text
/var/www/codechronicles/dist
```

项目提供了前端静态资源 Nginx 配置示例：

```text
deploy/nginx.conf
```

配置中的服务器 IP 为：

```text
39.107.229.170
```

Spring Boot 服务需要监听服务器的 `8080` 端口，并允许前端页面来源进行跨域访问。

前端使用 Hash 路由，生产页面地址示例：

```text
http://39.107.229.170:8081/#/login
http://39.107.229.170:8081/#/articles/1
```

`#` 后面的路由只由浏览器端 Vue Router 处理，不会向静态服务器请求 `/login` 或 `/articles/1`。

当前预留接口：

- `GET /api/profile`
- `GET /api/tags`
- `GET /api/articles?page=1&pageSize=10`
- `GET /api/articles/{id}`
- `POST /api/articles`
- `POST /api/articles/drafts`
- `PUT /api/articles/{id}`
- `DELETE /api/articles/{id}`
- `POST /api/articles/{id}/submit`
- `GET /api/my/articles?page=1&pageSize=10`
- `GET /api/admin/articles?page=1&pageSize=10`
- `POST /api/admin/articles/{id}/review`
- `GET /api/questions`
- `GET /api/captcha`
- `POST /api/login`
- `POST /api/register`
- `GET /api/me`
- `POST /api/logout`

登录提交字段：

```json
{
  "phone": "13800138000",
  "password": "Aa123456",
  "captchaKey": "31b61b45-51f7-4938-a32c-4ea4ed8e9b42",
  "captcha": "abcd"
}
```

注册页面调用 `POST /api/register`，提交用户与 profile 初始化信息：

```json
{
  "phone": "13800138000",
  "password": "Aa123456",
  "nickname": "蔡鹏鑫",
  "avatar": "https://example.com/avatar.png",
  "bio": "专注 Java 后端和 AI 应用开发",
  "role": "Java 后端开发",
  "location": "北京",
  "skills": ["Java", "Spring Boot", "MySQL"],
  "links": [
    {
      "label": "GitHub",
      "url": "https://github.com/caipengxin333"
    }
  ]
}
```

注册成功后，前端会刷新页面并跳转到登录页，由用户使用新账号登录。

登录后首页初始化会调用 `GET /api/me` 获取当前登录用户信息，请求头由 Axios 拦截器自动添加：

```http
Authorization: Bearer <token>
```

成功响应示例：

```json
{
  "id": 1,
  "phone": "13800138000",
  "nickname": "蔡鹏鑫",
  "name": "蔡鹏鑫",
  "avatar": "https://example.com/avatar.png",
  "role": "Java 后端开发",
  "bio": "专注 Java 后端和 AI 应用开发",
  "location": "北京",
  "followers": 0,
  "articleCount": 12,
  "tagCount": 8,
  "questionCount": 3,
  "skills": ["Java", "Spring Boot", "MySQL"],
  "links": [
    {
      "label": "GitHub",
      "url": "https://github.com/caipengxin333"
    }
  ]
}
```

如果接口返回 HTTP 401 或响应体 `code === 401`，前端会清理本地 token 并跳转登录页。

新增文章提交字段：

```json
{
  "title": "文章标题",
  "summary": "文章摘要",
  "cover": "https://example.com/cover.png",
  "category": "项目实战",
  "content": "文章正文"
}
```

`id`、`publishedAt`、`updatedAt`、`views`、`likes`、`comments` 等字段由后端生成或维护。

## 项目结构

```text
src/
  api/          # Axios 实例与后端接口封装
  router/       # Vue Router 路由配置
  views/        # 页面级组件，如首页、文章详情页
  styles/       # 全局样式
  App.vue       # 应用根容器，只承载 router-view
  main.js       # 应用入口，挂载 Element Plus 和 Router
```

响应可以直接返回数据，也可以使用统一结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```
