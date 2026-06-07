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

        <div class="article-interaction-bar">
          <el-button
            class="article-like-button"
            :class="{ liked: article.liked }"
            :loading="likeLoading"
            :disabled="likeCoolingDown"
            round
            @click="toggleLike"
          >
            {{ article.liked ? '取消点赞' : '点赞文章' }} · {{ article.likes }}
          </el-button>
          <span v-if="likeCoolingDown" class="interaction-tip">请稍后再操作</span>
        </div>
      </template>
    </section>

    <section v-if="article" id="comments" class="article-comments">
      <div class="comments-heading">
        <div>
          <span class="section-kicker">DISCUSSION</span>
          <h2>文章评论</h2>
        </div>
        <span>{{ article.comments }} 条互动</span>
      </div>

      <div class="comment-composer">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          :placeholder="isLoggedIn ? '写下你的想法…' : '登录后参与评论'"
          :disabled="!isLoggedIn"
        />
        <div class="composer-actions">
          <span>{{ commentSubmitTip }}</span>
          <el-button v-if="!isLoggedIn" type="primary" plain @click="goToLogin">
            登录后评论
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="commentSubmitting"
            :disabled="commentCoolingDown"
            @click="submitComment"
          >
            发表评论
          </el-button>
        </div>
      </div>

      <div v-loading="commentsLoading" class="comment-list">
        <el-empty
          v-if="!commentsLoading && comments.length === 0"
          description="还没有评论，来写第一条吧"
        />

        <article v-for="comment in comments" :key="comment.id" class="comment-thread">
          <div class="comment-main">
            <el-avatar :size="42" :src="comment.userAvatar">
              {{ getUserInitial(comment.userName) }}
            </el-avatar>
            <div class="comment-body">
              <div class="comment-author">
                <strong>{{ comment.userName }}</strong>
                <time>{{ formatCommentTime(comment.createdAt) }}</time>
              </div>
              <p>{{ comment.content }}</p>
              <el-button link type="primary" @click="openReply(comment, comment)">回复</el-button>
            </div>
          </div>

          <div v-if="comment.replies.length" class="comment-replies">
            <div v-for="reply in comment.replies" :key="reply.id" class="comment-reply">
              <el-avatar :size="34" :src="reply.userAvatar">
                {{ getUserInitial(reply.userName) }}
              </el-avatar>
              <div class="comment-body">
                <div class="comment-author">
                  <strong>{{ reply.userName }}</strong>
                  <time>{{ formatCommentTime(reply.createdAt) }}</time>
                </div>
                <p>
                  <span v-if="reply.replyToUserName" class="reply-target">
                    回复 @{{ reply.replyToUserName }}：
                  </span>
                  {{ reply.content }}
                </p>
                <el-button link type="primary" @click="openReply(comment, reply)">回复</el-button>
              </div>
            </div>
          </div>

          <div v-if="replyingRootId === comment.id" class="reply-composer">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="3"
              maxlength="1000"
              show-word-limit
              :placeholder="`回复 @${replyTarget?.userName || ''}`"
              @keyup.esc="closeReply"
            />
            <div class="composer-actions">
              <el-button @click="closeReply">取消</el-button>
              <el-button
                type="primary"
                :loading="commentSubmitting"
                :disabled="commentCoolingDown"
                @click="submitReply"
              >
                提交回复
              </el-button>
            </div>
          </div>
        </article>
      </div>

      <el-pagination
        v-if="commentTotal > commentPageSize"
        class="comment-pagination"
        background
        layout="prev, pager, next"
        :current-page="commentPage"
        :page-size="commentPageSize"
        :total="commentTotal"
        @current-change="changeCommentPage"
      />
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import {
  createArticleComment,
  getArticleComments,
  getArticleDetail,
  likeArticle,
  unlikeArticle
} from '../api/blog'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const article = ref(null)
const likeLoading = ref(false)
const likeCoolingDown = ref(false)
const commentsLoading = ref(false)
const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentPageSize = 20
const commentContent = ref('')
const commentSubmitting = ref(false)
const commentCoolingDown = ref(false)
const replyingRootId = ref(null)
const replyTarget = ref(null)
const replyContent = ref('')
let likeCooldownTimer
let commentCooldownTimer

const isLoggedIn = computed(() => Boolean(localStorage.getItem('codechronicles_token')))
const commentSubmitTip = computed(() => {
  if (!isLoggedIn.value) return '文章与评论可公开阅读，互动需要登录'
  if (commentCoolingDown.value) return '评论已提交，请等待 10 秒后再次操作'
  return '请友善交流，评论最多 1000 字'
})

onMounted(async () => {
  await Promise.all([loadArticleDetail(), loadComments()])
})

onBeforeUnmount(() => {
  window.clearTimeout(likeCooldownTimer)
  window.clearTimeout(commentCooldownTimer)
})

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
      comments: 0,
      liked: false
    })
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  commentsLoading.value = true

  try {
    const data = await getArticleComments(route.params.id, {
      page: commentPage.value,
      pageSize: commentPageSize
    })
    const normalized = normalizeCommentPage(data)
    comments.value = normalized.list
    commentTotal.value = normalized.total
  } catch (error) {
    comments.value = []
    commentTotal.value = 0
    ElMessage.error(error.message || '评论加载失败')
  } finally {
    commentsLoading.value = false
  }
}

async function toggleLike() {
  if (!ensureLoggedIn()) return
  if (likeLoading.value || likeCoolingDown.value) return

  likeLoading.value = true
  startLikeCooldown()

  try {
    const data = article.value.liked
      ? await unlikeArticle(route.params.id)
      : await likeArticle(route.params.id)

    article.value = {
      ...article.value,
      liked: Boolean(data.liked),
      likes: data.likes ?? article.value.likes
    }
    ElMessage.success(data.liked ? '点赞成功' : '已取消点赞')
  } catch (error) {
    if (error.message?.includes('不能重复点赞')) {
      article.value.liked = true
    } else if (error.message?.includes('尚未点赞')) {
      article.value.liked = false
    }
    ElMessage.warning(error.message || '点赞操作失败，请稍后重试')
  } finally {
    likeLoading.value = false
  }
}

async function submitComment() {
  await submitCommentRequest(commentContent.value, null, () => {
    commentContent.value = ''
  })
}

async function submitReply() {
  if (!replyTarget.value) return
  await submitCommentRequest(replyContent.value, replyTarget.value.id, closeReply)
}

async function submitCommentRequest(content, parentCommentId, onSuccess) {
  if (!ensureLoggedIn()) return
  if (commentSubmitting.value || commentCoolingDown.value) return

  const normalizedContent = content.trim()
  if (!normalizedContent) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  commentSubmitting.value = true

  try {
    await createArticleComment(route.params.id, {
      content: normalizedContent,
      parentCommentId
    })
    onSuccess()
    startCommentCooldown()
    article.value.comments += 1
    commentPage.value = 1
    await loadComments()
    ElMessage.success(parentCommentId ? '回复成功' : '评论发表成功')
  } catch (error) {
    ElMessage.warning(error.message || '评论提交失败，请稍后重试')
  } finally {
    commentSubmitting.value = false
  }
}

function openReply(rootComment, targetComment) {
  if (!ensureLoggedIn()) return
  replyingRootId.value = rootComment.id
  replyTarget.value = targetComment
  replyContent.value = ''
}

function closeReply() {
  replyingRootId.value = null
  replyTarget.value = null
  replyContent.value = ''
}

async function changeCommentPage(page) {
  commentPage.value = page
  closeReply()
  await loadComments()
  document.querySelector('#comments')?.scrollIntoView({ behavior: 'smooth' })
}

function ensureLoggedIn() {
  if (isLoggedIn.value) return true
  ElMessage.info('请先登录后再进行互动')
  goToLogin()
  return false
}

function goToLogin() {
  router.push({
    name: 'login',
    query: { redirect: route.fullPath }
  })
}

function startLikeCooldown() {
  likeCoolingDown.value = true
  window.clearTimeout(likeCooldownTimer)
  likeCooldownTimer = window.setTimeout(() => {
    likeCoolingDown.value = false
  }, 3000)
}

function startCommentCooldown() {
  commentCoolingDown.value = true
  window.clearTimeout(commentCooldownTimer)
  commentCooldownTimer = window.setTimeout(() => {
    commentCoolingDown.value = false
  }, 10000)
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
    comments: data.comments ?? data.commentCount ?? 0,
    liked: Boolean(data.liked)
  }
}

function normalizeCommentPage(data = {}) {
  const list = Array.isArray(data) ? data : data.list || data.records || []

  return {
    total: data.total ?? list.length,
    list: list.map(normalizeComment)
  }
}

function normalizeComment(comment = {}) {
  return {
    id: comment.id,
    articleId: comment.articleId,
    userId: comment.userId,
    userName: comment.userName || '匿名用户',
    userAvatar: comment.userAvatar || '',
    rootCommentId: comment.rootCommentId ?? null,
    replyToCommentId: comment.replyToCommentId ?? null,
    replyToUserName: comment.replyToUserName ?? null,
    content: comment.content || '',
    createdAt: comment.createdAt,
    replies: Array.isArray(comment.replies) ? comment.replies.map(normalizeComment) : []
  }
}

function getUserInitial(userName = '') {
  return userName.trim().slice(0, 1).toUpperCase() || 'U'
}

function formatCommentTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}
</script>
