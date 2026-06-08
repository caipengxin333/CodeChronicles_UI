<template>
  <main class="blog-shell tech-shell" :style="shellStyle" @pointermove="updatePointer">
    <div class="cursor-aura" aria-hidden="true"></div>

    <button class="logout-button" type="button" @click="confirmLogout">
      退出
    </button>

    <el-tag v-if="isVisitor" class="visitor-mode-badge" round type="warning">
      游客模式
    </el-tag>

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
        <div class="profile-main">
          <div class="avatar-orbit">
            <el-avatar :size="92" :src="profile.avatar" />
          </div>
          <div class="profile-meta">
            <div class="profile-kicker">Current Profile</div>
            <div class="profile-row">
              <h1>{{ profile.name }}</h1>
              <el-tag round type="success">{{ profile.role }}</el-tag>
            </div>
            <p>{{ profile.bio }}</p>
            <div class="profile-tags-row">
              <div v-if="profile.skills.length" class="profile-inline-group">
                <span class="profile-inline-label">技能栈</span>
                <div class="profile-skills">
                  <el-tag v-for="skill in profile.skills" :key="skill" round type="primary">
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              <div v-if="profile.links.length" class="profile-inline-group">
                <span class="profile-inline-label">链接</span>
                <div class="profile-links">
                  <a
                    v-for="link in profile.links"
                    :key="`${link.label}-${link.url}`"
                    :href="link.url"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {{ link.label }}
                  </a>
                </div>
              </div>
            </div>
            <div class="profile-stats">
              <span v-if="profile.location" class="stat-chip">
                <strong>{{ profile.location }}</strong>
                <small>所在地</small>
              </span>
              <span class="stat-chip">
                <strong>{{ profile.followers }}</strong>
                <small>关注者</small>
              </span>
              <span class="stat-chip">
                <strong>{{ profile.articleCount }}</strong>
                <small>文章</small>
              </span>
              <span class="stat-chip">
                <strong>{{ profile.tagCount }}</strong>
                <small>标签</small>
              </span>
              <span class="stat-chip">
                <strong>{{ profile.questionCount }}</strong>
                <small>问答</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isVisitor" class="profile-actions">
        <span class="profile-action-label">Ready to publish</span>
        <el-button round plain @click="router.push({ name: 'article-manage' })">
          文章管理
        </el-button>
        <el-button type="primary" round :icon="EditPen" @click="openArticleDialog">
          写文章
        </el-button>
      </div>
      <div v-else class="profile-actions visitor-profile-actions">
        <el-alert
          title="游客模式仅支持文章浏览和 AI 对话"
          type="info"
          show-icon
          :closable="false"
        />
      </div>
    </section>

    <section class="content-grid">
      <aside class="left-panel">
        <div class="side-panel-sticky">
          <div class="panel-title">技术标签</div>
          <el-scrollbar height="calc(100vh - 150px)">
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
        </div>
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

        <div v-if="articleTotal > 0" class="article-pagination-panel">
          <span>共 {{ articleTotal }} 篇文章</span>
          <el-pagination
            background
            layout="sizes, prev, pager, next, jumper"
            :current-page="articlePage"
            :page-size="articlePageSize"
            :page-sizes="[5, 10, 20, 30]"
            :total="articleTotal"
            @current-change="changeArticlePage"
            @size-change="changeArticlePageSize"
          />
        </div>
      </section>

      <aside class="right-panel">
        <div class="side-panel-sticky right-panel-sticky">
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
        </div>
      </aside>
    </section>

    <AiChatAssistant />

    <el-dialog
      v-model="articleDialogVisible"
      class="article-editor-dialog"
      width="760px"
      align-center
      destroy-on-close
      :show-close="!savingArticle"
    >
      <template #header>
        <div class="editor-dialog-title">
          <span class="editor-title-orb"></span>
          <div>
            <h2>写文章</h2>
            <p>提交后文章会进入待审核状态。</p>
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
          <el-input v-model="articleForm.title" maxlength="160" show-word-limit />
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="articleForm.summary"
            maxlength="512"
            show-word-limit
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="分类" prop="category">
            <el-input v-model="articleForm.category" maxlength="64" />
          </el-form-item>

          <el-form-item label="封面图片 URL" prop="cover">
            <el-input v-model="articleForm.cover" maxlength="512" />
          </el-form-item>
        </div>

        <el-form-item label="标签名称" prop="tagNames">
          <el-input
            v-model="articleForm.tagNames"
            placeholder="多个标签用逗号分隔，如 Spring Boot, MyBatis；不填写则由 AI 自动解析生成标签"
          />
        </el-form-item>

        <el-form-item label="正文内容" prop="content">
          <el-input v-model="articleForm.content" type="textarea" :rows="9" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="editor-actions">
          <el-button :disabled="savingArticle" @click="closeArticleDialog">取消</el-button>
          <el-button type="primary" :loading="savingArticle" @click="submitArticle">
            提交审核
          </el-button>
        </div>
      </template>
    </el-dialog>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Search } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser, logout } from '../api/auth'
import { createArticle, getArticles, getQuestions, getTags } from '../api/blog'
import AiChatAssistant from '../components/AiChatAssistant.vue'
import {
  clearAuthSession,
  getAuthToken,
  isAuthenticated,
  isVisitor
} from '../auth/session'
import { VISITOR_ACTION_MESSAGE } from '../auth/permissions'

const route = useRoute()
const router = useRouter()

const defaultProfile = {
  name: 'CodeChronicles',
  role: '全栈开发者',
  bio: '记录 Spring Boot、Vue、工程实践与日常踩坑，把复杂问题写清楚。',
  avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  location: 'Shanghai',
  followers: 0,
  articleCount: 0,
  publishedArticleCount: 0,
  tagCount: 0,
  questionCount: 0,
  skills: ['Vue', 'Spring Boot', 'MySQL'],
  links: [{ label: 'GitHub', url: 'https://github.com' }]
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
const articlePage = ref(1)
const articlePageSize = ref(10)
const articleTotal = ref(articles.value.length)
const shellStyle = ref({ '--pointer-x': '72%', '--pointer-y': '18%' })
const articleDialogVisible = ref(false)
const savingArticle = ref(false)
const articleFormRef = ref(null)

const articleForm = reactive({
  title: '',
  summary: '',
  cover: '',
  category: '',
  content: '',
  tagNames: ''
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
  articlePage.value = 1
  await loadArticles()
}

async function changeArticlePage(page) {
  articlePage.value = page
  await loadArticles()
  scrollToArticleList()
}

async function changeArticlePageSize(pageSize) {
  articlePageSize.value = pageSize
  articlePage.value = 1
  await loadArticles()
  scrollToArticleList()
}

function scrollToArticleList() {
  document.querySelector('.center-panel')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

function openArticle(id) {
  router.push({ name: 'article-detail', params: { id } })
}

function openArticleDialog() {
  if (!isAuthenticated.value) {
    router.push({
      name: 'login',
      query: { redirect: '/?writeArticle=1' }
    })
    return
  }

  if (isVisitor.value) {
    ElMessage.info(VISITOR_ACTION_MESSAGE)
    return
  }

  resetArticleForm()
  articleDialogVisible.value = true
}

async function confirmLogout() {
  try {
    await ElMessageBox.confirm('确定要退出当前登录吗？', '退出登录', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      type: 'warning',
      customClass: 'logout-confirm'
    })

    await logout()
    ElMessage.success('已退出登录')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.warning(error.message || '退出接口异常，已清理本地登录状态')
    } else {
      return
    }
  }

  clearAuthState()
  await router.replace({ name: 'login' })
}

function clearAuthState() {
  clearAuthSession()
}

function closeArticleDialog() {
  if (savingArticle.value) return
  articleDialogVisible.value = false
  resetArticleForm()
}

async function submitArticle() {
  if (isVisitor.value) {
    ElMessage.info(VISITOR_ACTION_MESSAGE)
    return
  }

  if (!articleFormRef.value) return

  const valid = await articleFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingArticle.value = true

  try {
    await createArticle(buildArticlePayload())
    ElMessage.success('文章已提交审核')
    articleDialogVisible.value = false
    resetArticleForm()
    await router.push({ name: 'article-manage' })
  } catch (error) {
    if (!error.notified) ElMessage.error(error.message || '文章保存失败')
  } finally {
    savingArticle.value = false
  }
}

function buildArticlePayload() {
  return {
    title: articleForm.title.trim(),
    summary: articleForm.summary.trim(),
    cover: articleForm.cover.trim() || null,
    category: articleForm.category.trim(),
    content: articleForm.content.trim(),
    tagNames: articleForm.tagNames
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
}

function resetArticleForm() {
  Object.assign(articleForm, {
    title: '',
    summary: '',
    cover: '',
    category: '',
    content: '',
    tagNames: ''
  })

  nextTick(() => articleFormRef.value?.clearValidate())
}

async function loadArticles() {
  articleLoading.value = true

  try {
    const articleData = await getArticles({
      page: articlePage.value,
      pageSize: articlePageSize.value,
      ...(selectedTagId.value ? { tagId: selectedTagId.value } : {})
    })
    const normalizedArticles = normalizeArticlePage(articleData)

    articles.value = normalizedArticles.list
    articleTotal.value = normalizedArticles.total
    tags.value = tags.value.map((tag) =>
      tag.id === null ? { ...tag, count: normalizedArticles.total } : tag
    )
  } catch (error) {
    articleTotal.value = articles.value.length
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
  const token = getAuthToken()
  const requests = await Promise.allSettled([
    token ? getCurrentUser() : Promise.resolve(null),
    getTags(),
    getQuestions()
  ])

  const [profileResult, tagResult, questionResult] = requests

  if (profileResult.status === 'fulfilled' && profileResult.value) {
    profile.value = normalizeProfile(profileResult.value)
  } else {
    profile.value = normalizeProfile()
    if (profileResult.status === 'rejected') {
      console.info('Current user profile request failed; numeric statistics use 0.', profileResult.reason)
    }
  }

  if (tagResult.status === 'fulfilled') {
    tags.value = [
      { id: null, name: '全部', count: profile.value.articleCount },
      ...normalizeTags(tagResult.value)
    ]
  } else {
    tags.value = tags.value.map((tag) =>
      tag.id === null ? { ...tag, count: profile.value.articleCount } : tag
    )
    console.info('Using local tag data until the tag API is ready.', tagResult.reason)
  }

  if (questionResult.status === 'fulfilled') {
    questions.value = normalizeQuestions(questionResult.value)
  } else {
    console.info('Using local question data until the question API is ready.', questionResult.reason)
  }

  await loadArticles()

  if (route.query.writeArticle === '1' && token && !isVisitor.value) {
    openArticleDialog()
    await router.replace({ name: 'home' })
  }
})

function normalizeProfile(data = {}) {
  return {
    ...defaultProfile,
    id: data.id,
    phone: data.phone || '',
    name: data.name || data.nickname || data.account || defaultProfile.name,
    nickname: data.nickname || data.name || defaultProfile.name,
    role: data.role || data.title || defaultProfile.role,
    bio: data.bio || data.description || defaultProfile.bio,
    avatar: data.avatar || data.avatarUrl || defaultProfile.avatar,
    location: data.location || data.city || defaultProfile.location,
    followers: normalizeStatistic(data.followers ?? data.followerCount),
    articleCount: normalizeStatistic(data.articleCount ?? data.articles),
    publishedArticleCount: normalizeStatistic(data.publishedArticleCount),
    tagCount: normalizeStatistic(data.tagCount ?? data.tagsCount),
    questionCount: normalizeStatistic(data.questionCount ?? data.questionsCount),
    skills: normalizeProfileSkills(data.skills),
    links: normalizeProfileLinks(data.links)
  }
}

function normalizeStatistic(value) {
  const statistic = Number(value)
  return Number.isFinite(statistic) && statistic >= 0 ? statistic : 0
}

function normalizeProfileSkills(skills = defaultProfile.skills) {
  return Array.isArray(skills)
    ? skills.map((skill) => String(skill).trim()).filter(Boolean)
    : defaultProfile.skills
}

function normalizeProfileLinks(links = defaultProfile.links) {
  if (!Array.isArray(links)) return defaultProfile.links

  return links
    .map((link) => ({
      label: String(link.label || '').trim(),
      url: String(link.url || '').trim()
    }))
    .filter((link) => link.label && /^https?:\/\//i.test(link.url))
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
