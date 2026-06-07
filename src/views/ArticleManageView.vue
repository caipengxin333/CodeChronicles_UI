<template>
  <main class="blog-shell manage-shell" :style="shellStyle" @pointermove="updatePointer">
    <div class="cursor-aura" aria-hidden="true"></div>

    <section class="manage-hero">
      <div>
        <router-link class="back-link" :to="{ name: 'home' }">返回首页</router-link>
        <p class="profile-kicker">{{ isAdmin ? 'Review Center' : 'Article Workspace' }}</p>
        <h1>{{ isAdmin ? '文章审核' : '文章管理' }}</h1>
        <p>{{ isAdmin ? '审核所有用户提交的文章，支持通过或拒绝并填写原因。' : '管理草稿、审核中、已发布和被拒绝文章。修改后会重新进入审核流程。' }}</p>
      </div>
      <el-button v-if="!isAdmin" type="primary" round :icon="EditPen" @click="openCreateDialog">
        写文章
      </el-button>
    </section>

    <section class="manage-grid">
      <aside class="manage-list-panel">
        <div class="manage-tabs">
          <button
            v-for="item in statusTabs"
            :key="item.value || 'ALL'"
            :class="{ active: statusFilter === item.value }"
            type="button"
            @click="changeStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div v-loading="listLoading" class="manage-list">
          <el-empty v-if="articles.length === 0" description="暂无文章" />

          <button
            v-for="article in articles"
            :key="article.id"
            class="manage-article-item"
            :class="{ active: selectedArticle?.id === article.id }"
            type="button"
            @click="selectArticle(article)"
          >
            <span class="manage-item-top">
              <strong>{{ article.title }}</strong>
              <el-tag :type="getStatusMeta(article.status).type" size="small">
                {{ getStatusMeta(article.status).label }}
              </el-tag>
            </span>
            <span>{{ article.summary || '暂无摘要' }}</span>
            <span class="manage-item-meta">
              <em>{{ article.category || '未分类' }}</em>
              <em>{{ article.date || article.updatedAt || '未发布' }}</em>
            </span>
          </button>
        </div>

        <el-pagination
          v-if="total > pageSize"
          v-model:current-page="page"
          background
          layout="prev, pager, next"
          :page-size="pageSize"
          :total="total"
          @current-change="loadArticles"
        />
      </aside>

      <section v-loading="detailLoading" class="manage-detail-panel">
        <el-empty v-if="!selectedArticle" description="请选择一篇文章查看详情" />

        <template v-else>
          <div class="manage-detail-head">
            <div>
              <el-tag :type="getStatusMeta(selectedArticle.status).type">
                {{ getStatusMeta(selectedArticle.status).label }}
              </el-tag>
              <h2>{{ selectedArticle.title }}</h2>
              <p>{{ selectedArticle.summary }}</p>
            </div>
            <div class="manage-detail-actions">
              <el-button v-if="isAdmin" :icon="EditPen" type="primary" plain @click="openReviewDialog">
                审核
              </el-button>
              <el-button v-if="!isAdmin" :icon="EditPen" type="primary" plain @click="openEditDialog">
                修改
              </el-button>
              <el-button v-if="!isAdmin" :icon="Delete" type="danger" plain @click="confirmDelete">
                删除
              </el-button>
            </div>
          </div>

          <img
            v-if="selectedArticle.cover"
            class="manage-detail-cover"
            :src="selectedArticle.cover"
            :alt="selectedArticle.title"
          />

          <div class="manage-detail-meta">
            <span>分类：{{ selectedArticle.category || '未分类' }}</span>
            <span>阅读：{{ selectedArticle.views }}</span>
            <span>点赞：{{ selectedArticle.likes }}</span>
            <span>评论：{{ selectedArticle.comments }}</span>
          </div>

          <div v-if="selectedArticle.tags.length" class="article-tags">
            <el-tag v-for="tag in selectedArticle.tags" :key="tag" round>{{ tag }}</el-tag>
          </div>

          <el-alert
            v-if="selectedArticle.rejectReason"
            :title="`拒绝原因：${selectedArticle.rejectReason}`"
            type="warning"
            show-icon
            :closable="false"
          />

          <article class="manage-detail-content">
            {{ selectedArticle.content || '暂无正文内容。' }}
          </article>
        </template>
      </section>
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
            <h2>{{ editingArticleId ? '修改文章' : '写文章' }}</h2>
            <p>{{ editingArticleId ? '保存后文章会重新进入审核流程。' : '提交后文章会进入待审核状态。' }}</p>
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
          <el-input v-model="articleForm.summary" maxlength="512" show-word-limit type="textarea" :rows="3" />
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
          <el-button :disabled="savingArticle" @click="articleDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingArticle" @click="submitArticle">
            {{ editingArticleId ? '保存修改' : '提交审核' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      class="article-editor-dialog"
      width="560px"
      align-center
      :show-close="!reviewSaving"
    >
      <template #header>
        <div class="editor-dialog-title">
          <span class="editor-title-orb"></span>
          <div>
            <h2>审核文章</h2>
            <p>通过后文章发布；拒绝时请填写清晰原因，方便作者修改。</p>
          </div>
        </div>
      </template>

      <div class="review-target">
        <el-tag :type="getStatusMeta(selectedArticle?.status).type">
          {{ getStatusMeta(selectedArticle?.status).label }}
        </el-tag>
        <strong>{{ selectedArticle?.title }}</strong>
      </div>

      <el-form class="article-form" label-position="top">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectReason"
            maxlength="512"
            placeholder="选择拒绝时必填，例如：内容不完整，请补充实践步骤"
            show-word-limit
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="editor-actions">
          <el-button :disabled="reviewSaving" @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="danger" plain :loading="reviewSaving" @click="submitReview(false)">
            拒绝
          </el-button>
          <el-button type="primary" :loading="reviewSaving" @click="submitReview(true)">
            同意
          </el-button>
        </div>
      </template>
    </el-dialog>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, EditPen } from '@element-plus/icons-vue'
import { getCurrentUser } from '../api/auth'
import AiChatAssistant from '../components/AiChatAssistant.vue'
import {
  createArticle,
  deleteArticle,
  getAdminArticles,
  getArticleDetail,
  getMyArticles,
  reviewArticle,
  updateArticle
} from '../api/blog'

const statusTabs = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'DRAFT' },
  { label: '审核中', value: 'PENDING_REVIEW' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已拒绝', value: 'REJECTED' }
]

const statusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  PENDING_REVIEW: { label: '审核中', type: 'warning' },
  PUBLISHED: { label: '已发布', type: 'success' },
  REJECTED: { label: '已拒绝', type: 'danger' }
}

const articles = ref([])
const selectedArticle = ref(null)
const statusFilter = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const listLoading = ref(false)
const detailLoading = ref(false)
const articleDialogVisible = ref(false)
const savingArticle = ref(false)
const editingArticleId = ref(null)
const articleFormRef = ref(null)
const currentUser = ref(null)
const reviewDialogVisible = ref(false)
const reviewSaving = ref(false)
const rejectReason = ref('')
const shellStyle = ref({ '--pointer-x': '72%', '--pointer-y': '18%' })

const isAdmin = computed(() => {
  const roleText = String(currentUser.value?.userRole || currentUser.value?.role || '').trim()
  const normalizedRole = roleText.toUpperCase()
  const account = String(currentUser.value?.account || '').toLowerCase()
  const phone = String(currentUser.value?.phone || '')

  return (
    normalizedRole === 'ADMIN' ||
    normalizedRole.includes('ADMIN') ||
    roleText.includes('管理员') ||
    account === 'admin' ||
    phone === '19999999999'
  )
})

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

onMounted(async () => {
  await loadCurrentUser()
  await loadArticles()
})

function updatePointer(event) {
  shellStyle.value = {
    '--pointer-x': `${event.clientX}px`,
    '--pointer-y': `${event.clientY}px`
  }
}

async function changeStatus(status) {
  statusFilter.value = status
  page.value = 1
  await loadArticles()
}

async function loadArticles() {
  listLoading.value = true

  try {
    const query = {
      page: page.value,
      pageSize,
      ...(statusFilter.value ? { status: statusFilter.value } : {})
    }
    const data = isAdmin.value ? await getAdminArticles(query) : await getMyArticles(query)
    const normalized = normalizeArticlePage(data)

    articles.value = normalized.list
    total.value = normalized.total
    selectedArticle.value = articles.value[0] || null

    if (selectedArticle.value) {
      await loadArticleDetail(selectedArticle.value)
    }
  } catch (error) {
    ElMessage.error(error.message || (isAdmin.value ? '审核文章列表加载失败' : '我的文章列表加载失败'))
  } finally {
    listLoading.value = false
  }
}

async function loadCurrentUser() {
  try {
    currentUser.value = await getCurrentUser()
  } catch (error) {
    currentUser.value = null
    console.info('Failed to load current user before article management mode detection.', error)
  }
}

async function selectArticle(article) {
  selectedArticle.value = article
  await loadArticleDetail(article)
}

async function loadArticleDetail(article) {
  detailLoading.value = true

  try {
    const detail = await getArticleDetail(article.id)
    selectedArticle.value = normalizeArticle({ ...article, ...detail })
  } catch (error) {
    selectedArticle.value = normalizeArticle(article)
    if (article.status === 'PUBLISHED') {
      ElMessage.warning(error.message || '文章详情加载失败，已展示列表信息')
    }
  } finally {
    detailLoading.value = false
  }
}

function openCreateDialog() {
  editingArticleId.value = null
  resetArticleForm()
  articleDialogVisible.value = true
}

function openEditDialog() {
  if (!selectedArticle.value) return

  editingArticleId.value = selectedArticle.value.id
  Object.assign(articleForm, {
    title: selectedArticle.value.title || '',
    summary: selectedArticle.value.summary || '',
    cover: selectedArticle.value.cover || '',
    category: selectedArticle.value.category || '',
    content: selectedArticle.value.content || '',
    tagNames: selectedArticle.value.tags.join(', ')
  })
  articleDialogVisible.value = true
  nextTick(() => articleFormRef.value?.clearValidate())
}

function openReviewDialog() {
  if (!selectedArticle.value) return

  rejectReason.value = selectedArticle.value.rejectReason || ''
  reviewDialogVisible.value = true
}

async function submitArticle() {
  if (!articleFormRef.value) return

  const valid = await articleFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingArticle.value = true

  try {
    const payload = buildArticlePayload()

    if (editingArticleId.value) {
      await updateArticle(editingArticleId.value, payload)
      ElMessage.success('文章修改成功，已重新提交审核')
    } else {
      await createArticle(payload)
      ElMessage.success('文章已提交审核')
    }

    articleDialogVisible.value = false
    await loadArticles()
  } catch (error) {
    ElMessage.error(error.message || '文章保存失败')
  } finally {
    savingArticle.value = false
  }
}

async function confirmDelete() {
  if (!selectedArticle.value) return

  try {
    await ElMessageBox.confirm(
      `确定删除《${selectedArticle.value.title}》吗？删除后列表中将不再展示。`,
      '删除文章',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteArticle(selectedArticle.value.id)
    ElMessage.success('文章已删除')
    await loadArticles()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function submitReview(approved) {
  if (!selectedArticle.value) return

  const reason = rejectReason.value.trim()

  if (!approved && !reason) {
    ElMessage.warning('拒绝文章时请填写拒绝原因')
    return
  }

  reviewSaving.value = true

  try {
    await reviewArticle(selectedArticle.value.id, {
      approved,
      rejectReason: approved ? '' : reason
    })

    ElMessage.success(approved ? '审核已通过' : '审核已拒绝')
    reviewDialogVisible.value = false
    rejectReason.value = ''
    await loadArticles()
  } catch (error) {
    ElMessage.error(error.message || '审核提交失败')
  } finally {
    reviewSaving.value = false
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

function normalizeArticlePage(data = {}) {
  const list = Array.isArray(data) ? data : data.list || data.records || data.content || []
  const normalizedList = list.map(normalizeArticle)

  return {
    total: Array.isArray(data) ? data.length : data.total ?? data.totalElements ?? normalizedList.length,
    list: normalizedList
  }
}

function normalizeArticle(data = {}) {
  return {
    id: data.id,
    title: data.title || '未命名文章',
    summary: data.summary || data.description || data.excerpt || '',
    cover: data.cover || '',
    category: data.category || data.categoryName || '技术文章',
    content: data.content || '',
    status: data.status || 'PENDING_REVIEW',
    authorUserId: data.authorUserId,
    reviewTime: data.reviewTime || data.review_time || null,
    reviewerUserId: data.reviewerUserId || data.reviewer_user_id || null,
    rejectReason: data.rejectReason || data.reject_reason || '',
    tags: data.tags || data.tagNames || [],
    date: data.date || data.publishedAt || data.updatedAt || data.createTime || '',
    updatedAt: data.updatedAt || data.updateTime || '',
    views: data.views ?? data.viewCount ?? 0,
    likes: data.likes ?? data.likeCount ?? 0,
    comments: data.comments ?? data.commentCount ?? 0
  }
}

function getStatusMeta(status) {
  return statusMap[status] || { label: status || '未知', type: 'info' }
}
</script>
