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

前端默认请求 `http://localhost:8080/api`，适合本地 Spring Boot 开发。后端文档中已允许 `http://localhost:5173` 和 `http://127.0.0.1:5173` 跨域访问。

可复制 `.env.example` 为 `.env` 并调整：

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

当前预留接口：

- `GET /api/profile`
- `GET /api/tags`
- `GET /api/articles?page=1&pageSize=10`
- `GET /api/articles/{id}`
- `POST /api/articles`
- `GET /api/questions`

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
