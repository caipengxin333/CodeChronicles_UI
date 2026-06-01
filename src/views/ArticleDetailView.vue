<template>
  <main class="blog-shell">
    <section v-loading="loading" class="article-detail">
      <router-link class="back-link" :to="{ name: 'home' }">返回首页</router-link>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="warning"
        show-icon
        :closable="false"
      />

      <template v-if="article">
        <img
          v-if="article.cover"
          class="detail-cover"
          :src="article.cover"
          :alt="article.title"
        />
        <div class="detail-meta">
          <el-tag effect="plain">{{ article.category }}</el-tag>
          <span>{{ article.date }}</span>
          <span>{{ article.views }} 阅读</span>
          <span>{{ article.likes }} 点赞</span>
          <span>{{ article.comments }} 评论</span>
        </div>
        <h1>{{ article.title }}</h1>
        <p class="detail-summary">{{ article.summary }}</p>
        <div class="article-tags">
          <el-tag v-for="tag in article.tags" :key="tag" round>{{ tag }}</el-tag>
        </div>
        <div class="detail-content">
          {{ article.content }}
        </div>
      </template>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleDetail } from '../api/blog'

const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const article = ref(null)

onMounted(loadArticleDetail)

async function loadArticleDetail() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getArticleDetail(route.params.id)
    article.value = normalizeArticle(data)
  } catch (error) {
    errorMessage.value = error.message || '文章详情接口暂不可用'
    article.value = normalizeArticle({
      id: route.params.id,
      title: '文章详情页',
      summary: '后端接口暂不可用时显示的占位内容。',
      category: '文章详情',
      content: `当前文章 ID：${route.params.id}。页面已接入 GET /api/articles/${route.params.id}，后端启动后会自动展示真实正文。`,
      tags: ['Spring Boot', 'Vue'],
      date: '2026-06-02',
      views: 0,
      likes: 0,
      comments: 0
    })
  } finally {
    loading.value = false
  }
}

function normalizeArticle(data = {}) {
  return {
    id: data.id,
    title: data.title,
    summary: data.summary || data.description || data.excerpt,
    cover: data.cover,
    category: data.category || data.categoryName || '技术文章',
    content: data.content || '',
    tags: data.tags || data.tagNames || [],
    date: data.date || data.publishedAt || data.createTime,
    views: data.views ?? data.viewCount ?? 0,
    likes: data.likes ?? data.likeCount ?? 0,
    comments: data.comments ?? data.commentCount ?? 0
  }
}
</script>
