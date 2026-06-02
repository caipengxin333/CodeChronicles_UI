<template>
  <main class="blog-shell tech-shell" :style="shellStyle" @pointermove="updatePointer">
    <div class="cursor-aura" aria-hidden="true"></div>

    <section class="profile-banner">
      <div class="neural-grid" aria-hidden="true"></div>
      <div class="code-rain" aria-hidden="true">
        <span
          v-for="column in codeColumns"
          :key="column.text"
          :style="{ left: column.left, animationDelay: column.delay, animationDuration: column.duration }"
        >
          {{ column.text }}
        </span>
      </div>
      <div class="particle-field" aria-hidden="true">
        <i
          v-for="particle in particles"
          :key="particle.id"
          :style="{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration
          }"
        ></i>
      </div>

      <div class="profile-card">
        <div class="avatar-orbit">
          <el-avatar :size="76" :src="profile.avatar" />
        </div>
        <div class="profile-meta">
          <div class="profile-row">
            <h1>{{ profile.name }}</h1>
            <el-tag round type="success">{{ profile.role }}</el-tag>
          </div>
          <p>{{ profile.bio }}</p>
          <div class="profile-stats">
            <span>{{ profile.location }}</span>
            <span>{{ profile.followers }} 关注者</span>
            <span>{{ profile.articles }} 篇文章</span>
          </div>
        </div>
      </div>

      <el-button type="primary" round :icon="EditPen" @click="openArticleDialog">
        写文章
      </el-button>
    </section>

    <section class="content-grid">
      <aside class="left-panel">
        <div class="panel-title">技术标签</div>
        <el-scrollbar height="calc(100vh - 230px)">
          <button
            v-for="tag in tags"
            :key="tag.id ?? tag.name"
            class="tag-item"
            :class="{ active: selectedTagId === tag.id }"
            type="button"
            @click="selectTag(tag)"
          >
            <span>{{ tag.name }}</span>
            <el-badge :value="tag.count" type="info" />
          </button>
        </el-scrollbar>
      </aside>

      <section v-loading="articleLoading" class="center-panel">
        <div class="toolbar">
          <el-input
            v-model="keyword"
            :prefix-icon="Search"
            clearable
            placeholder="搜索文章、标签或关键字"
          />
          <el-segmented v-model="sortBy" :options="sortOptions" />
        </div>

        <el-empty v-if="filteredArticles.length === 0" description="暂无匹配文章" />

        <article
          v-for="article in filteredArticles"
          :key="article.id"
          class="article-card"
          role="button"
          tabindex="0"
          @click="openArticle(article.id)"
          @keydown.enter="openArticle(article.id)"
        >
          <img
            v-if="article.cover"
            class="article-cover"
            :src="article.cover"
            :alt="article.title"
            loading="lazy"
          />
          <div class="article-head">
            <div>
              <h2>{{ article.title }}</h2>
              <p>{{ article.summary }}</p>
            </div>
            <el-tag effect="plain">{{ article.category }}</el-tag>
          </div>
          <div class="article-tags">
            <el-tag v-for="tag in article.tags" :key="tag" round>{{ tag }}</el-tag>
          </div>
          <div class="article-foot">
            <span>{{ article.date }}</span>
            <span>{{ article.views }} 阅读</span>
            <span>{{ article.likes }} 点赞</span>
            <span>{{ article.comments }} 评论</span>
            <router-link
              class="read-link"
              :to="{ name: 'article-detail', params: { id: article.id } }"
              @click.stop
            >
              阅读全文
            </router-link>
          </div>
        </article>
      </section>

      <aside class="right-panel">
        <section class="qa-box">
          <div class="panel-title">问答精选</div>
          <div v-for="question in questions" :key="question.id" class="question-item">
            <h3>{{ question.title }}</h3>
            <p>{{ question.answer }}</p>
          </div>
        </section>

        <section class="qa-box">
          <div class="panel-title">近期计划</div>
          <el-timeline>
            <el-timeline-item
              v-for="item in roadmap"
              :key="item.title"
              :timestamp="item.time"
              placement="top"
            >
              {{ item.title }}
            </el-timeline-item>
          </el-timeline>
        </section>
      </aside>
    </section>

    <button class="ai-assistant" type="button" aria-label="打开 AI 助手">
      <span>AI</span>
    </button>

    <el-dialog
      v-model="articleDialogVisible"
      class="article-editor-dialog"
      width="720px"
      align-center
      destroy-on-close
      :show-close="!savingArticle"
    >
      <template #header>
        <div class="editor-dialog-title">
          <span class="editor-title-orb"></span>
          <div>
            <h2>发布技术文章</h2>
            <p>标题、摘要、分类和正文会提交给后端；日期、阅读量、点赞数等由后端生成。</p>
          </div>
        </div>
      </template>

      <el-form
        ref="articleFormRef"
        class="article-form"
        :model="articleForm"
        :rules="articleRules"
        label-position="top"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="articleForm.title"
            maxlength="160"
            placeholder="例如：Spring Boot + Vue 博客系统接口设计"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="articleForm.summary"
            maxlength="512"
            placeholder="用一两句话说明这篇文章解决什么问题"
            show-word-limit
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="分类" prop="category">
            <el-input
              v-model="articleForm.category"
              maxlength="64"
              placeholder="项目实战 / 后端实践 / 前端工程"
            />
          </el-form-item>

          <el-form-item label="封面图片 URL" prop="cover">
            <el-input
              v-model="articleForm.cover"
              maxlength="512"
              placeholder="https://example.com/cover.png"
            />
          </el-form-item>
        </div>

        <div v-if="articleForm.cover" class="cover-preview">
          <img :src="articleForm.cover" alt="文章封面预览" />
        </div>

        <el-form-item label="正文内容" prop="content">
          <el-input
            v-model="articleForm.content"
            placeholder="输入文章正文，后续可扩展 Markdown 编辑器"
            type="textarea"
            :rows="8"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="editor-actions">
          <el-button :disabled="savingArticle" @click="closeArticleDialog">取消</el-button>
          <el-button type="primary" :loading="savingArticle" @click="submitArticle">
            保存发布
          </el-button>
        </div>
      </template>
    </el-dialog>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { createArticle, getArticles, getProfile, getQuestions, getTags } from '../api/blog'

const router = useRouter()

const defaultProfile = {
  name: 'CodeChronicles',
  role: '全栈开发者',
  bio: '记录 Spring Boot、Vue、工程实践与日常踩坑，把复杂问题写清楚。',
  avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  location: 'Shanghai',
  followers: 1280,
  articles: 64
}

const profile = ref(defaultProfile)

const tags = ref([
  { id: null, name: '全部', count: 64 },
  { id: 1, name: 'Vue', count: 18 },
  { id: 2, name: 'Spring Boot', count: 22 },
  { id: 3, name: 'MySQL', count: 12 },
  { id: 4, name: 'Redis', count: 9 },
  { id: 5, name: '架构设计', count: 11 },
  { id: 6, name: '部署运维', count: 8 }
])

const articles = ref([
  {
    id: 1,
    title: '从零搭建 Spring Boot + Vue 的个人博客系统',
    summary: '拆解前后端分层、接口约定、登录鉴权和文章发布流程，适合作为项目起点。',
    category: '项目实战',
    cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    tags: ['Vue', 'Spring Boot'],
    date: '2026-05-28',
    views: 2680,
    likes: 126,
    comments: 34
  },
  {
    id: 2,
    title: 'Element Plus 后台布局的可维护写法',
    summary: '用组件边界、状态收敛和响应式布局，让管理端界面保持清爽。',
    category: '前端工程',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
    tags: ['Vue', 'Element Plus'],
    date: '2026-05-21',
    views: 1842,
    likes: 98,
    comments: 17
  },
  {
    id: 3,
    title: 'Redis 缓存穿透和热点 Key 的处理策略',
    summary: '结合实际接口流量，整理缓存空值、布隆过滤器、互斥锁和限流方案。',
    category: '后端实践',
    cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
    tags: ['Redis', 'Spring Boot'],
    date: '2026-05-16',
    views: 3210,
    likes: 156,
    comments: 41
  }
])

const questions = ref([
  {
    id: 1,
    title: '博客接口怎么规划更舒服？',
    answer: '先统一响应结构，再按 profile、tags、articles、questions 分模块扩展。'
  },
  {
    id: 2,
    title: '文章列表需要分页吗？',
    answer: '需要。前端预留 page、pageSize、tag、keyword，后端直接接 Query DTO。'
  }
])

const roadmap = ref([
  { title: '文章详情页', time: '本周' },
  { title: '登录与评论模块', time: '下周' },
  { title: '后台发布管理', time: '近期' }
])

const selectedTagId = ref(null)
const keyword = ref('')
const sortBy = ref('最新')
const sortOptions = ['最新', '热门', '评论']
const articleLoading = ref(false)
const shellStyle = ref({ '--pointer-x': '72%', '--pointer-y': '18%' })
const articleDialogVisible = ref(false)
const savingArticle = ref(false)
const articleFormRef = ref(null)

const articleForm = reactive({
  title: '',
  summary: '',
  cover: '',
  category: '',
  content: ''
})

const articleRules = {
  title: [
    { required: true, message: '请填写文章标题', trigger: 'blur' },
    { max: 160, message: '标题不能超过 160 个字符', trigger: 'blur' }
  ],
  summary: [
    { required: true, message: '请填写文章摘要', trigger: 'blur' },
    { max: 512, message: '摘要不能超过 512 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请填写文章分类', trigger: 'blur' },
    { max: 64, message: '分类不能超过 64 个字符', trigger: 'blur' }
  ],
  cover: [
    { max: 512, message: '封面地址不能超过 512 个字符', trigger: 'blur' },
    { validator: validateOptionalUrl, trigger: 'blur' }
  ],
  content: [{ required: true, message: '请填写文章正文', trigger: 'blur' }]
}

const codeColumns = [
  { text: 'const blog = await AI.compose()', left: '8%', delay: '-1s', duration: '12s' },
  { text: 'SpringBoot -> Vue -> ElementPlus', left: '25%', delay: '-5s', duration: '15s' },
  { text: 'SELECT * FROM knowledge WHERE tag = vue', left: '47%', delay: '-8s', duration: '13s' },
  { text: 'Redis.cache.hit && deploy.ready', left: '68%', delay: '-3s', duration: '16s' },
  { text: 'router.push({ name: article })', left: '84%', delay: '-10s', duration: '14s' }
]

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 13) % 84)}%`,
  top: `${12 + ((index * 17) % 70)}%`,
  delay: `${-(index % 7)}s`,
  duration: `${7 + (index % 6)}s`
}))

const filteredArticles = computed(() => {
  const word = keyword.value.trim().toLowerCase()

  return articles.value.filter((article) => {
    const matchesKeyword =
      !word ||
      [article.title, article.summary, article.category, ...article.tags]
        .join(' ')
        .toLowerCase()
        .includes(word)

    return matchesKeyword
  })
})

async function selectTag(tag) {
  selectedTagId.value = tag.id ?? null
  await loadArticles()
}

function openArticle(id) {
  router.push({ name: 'article-detail', params: { id } })
}

function openArticleDialog() {
  articleDialogVisible.value = true
}

function closeArticleDialog() {
  if (savingArticle.value) return
  articleDialogVisible.value = false
  resetArticleForm()
}

async function submitArticle() {
  if (!articleFormRef.value) return

  const valid = await articleFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingArticle.value = true

  try {
    await createArticle({
      title: articleForm.title.trim(),
      summary: articleForm.summary.trim(),
      cover: articleForm.cover.trim() || null,
      category: articleForm.category.trim(),
      content: articleForm.content.trim()
    })

    ElMessage.success('文章发布成功')
    articleDialogVisible.value = false
    resetArticleForm()
    await loadArticles()
  } catch (error) {
    ElMessage.error(error.message || '文章保存失败，请检查后端接口')
  } finally {
    savingArticle.value = false
  }
}

function resetArticleForm() {
  Object.assign(articleForm, {
    title: '',
    summary: '',
    cover: '',
    category: '',
    content: ''
  })

  nextTick(() => articleFormRef.value?.clearValidate())
}

function validateOptionalUrl(_rule, value, callback) {
  if (!value) {
    callback()
    return
  }

  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      callback()
      return
    }
  } catch {
    // Fall through to validation error.
  }

  callback(new Error('请填写有效的 http/https 图片地址'))
}

async function loadArticles() {
  articleLoading.value = true

  try {
    const articleData = await getArticles({
      page: 1,
      pageSize: 10,
      ...(selectedTagId.value ? { tagId: selectedTagId.value } : {})
    })
    const normalizedArticles = normalizeArticlePage(articleData)

    articles.value = normalizedArticles.list
    tags.value = tags.value.map((tag) =>
      tag.id === null ? { ...tag, count: normalizedArticles.total } : tag
    )
  } catch (error) {
    ElMessage.warning('文章接口暂不可用，已展示本地占位数据')
    console.info('Using local article mock data until the Spring Boot API is ready.', error)
  } finally {
    articleLoading.value = false
  }
}

function updatePointer(event) {
  shellStyle.value = {
    '--pointer-x': `${event.clientX}px`,
    '--pointer-y': `${event.clientY}px`
  }
}

onMounted(async () => {
  try {
    const [profileData, tagData, questionData] = await Promise.all([
      getProfile(),
      getTags(),
      getQuestions()
    ])

    profile.value = normalizeProfile(profileData)
    tags.value = [{ id: null, name: '全部', count: profile.value.articles }, ...normalizeTags(tagData)]
    questions.value = normalizeQuestions(questionData)
  } catch (error) {
    console.info('Using local mock data until the Spring Boot API is ready.', error)
  }

  await loadArticles()
})

function normalizeProfile(data = {}) {
  return {
    ...defaultProfile,
    name: data.name || data.nickname || data.account || defaultProfile.name,
    role: data.role || data.title || defaultProfile.role,
    bio: data.bio || data.description || defaultProfile.bio,
    avatar: data.avatar || data.avatarUrl || defaultProfile.avatar,
    location: data.location || data.city || defaultProfile.location,
    followers: data.followers ?? data.followerCount ?? defaultProfile.followers,
    articles: data.articles ?? data.articleCount ?? defaultProfile.articles
  }
}

function normalizeTags(data = []) {
  return data.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count: tag.count ?? tag.articleCount ?? 0
  }))
}

function normalizeArticlePage(data = {}) {
  const list = Array.isArray(data) ? data : data.list || data.records || data.content || []
  const total = Array.isArray(data) ? data.length : data.total ?? data.totalElements ?? list.length

  return {
    total,
    list: list.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.description || article.excerpt,
      cover: article.cover,
      category: article.category || article.categoryName || '技术文章',
      tags: article.tags || article.tagNames || [],
      date: article.date || article.publishedAt || article.createTime,
      views: article.views ?? article.viewCount ?? 0,
      likes: article.likes ?? article.likeCount ?? 0,
      comments: article.comments ?? article.commentCount ?? 0
    }))
  }
}

function normalizeQuestions(data = []) {
  return data.map((question) => ({
    id: question.id,
    title: question.title,
    answer: question.answer || question.description || question.summary
  }))
}
</script>
