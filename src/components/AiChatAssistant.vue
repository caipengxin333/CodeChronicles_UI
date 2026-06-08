<template>
  <button class="ai-assistant" type="button" aria-label="打开 AI 助手" @click="openAssistant">
    <span>AI</span>
  </button>

  <el-drawer
    v-model="visible"
    class="ai-chat-drawer"
    direction="rtl"
    size="420px"
    :show-close="false"
    @opened="scrollToBottom"
  >
    <template #header>
      <div class="ai-chat-header">
        <div>
          <strong>AI 助手</strong>
          <p>结合最近对话，继续聊聊你的技术问题</p>
        </div>
        <button type="button" aria-label="关闭 AI 助手" @click="visible = false">×</button>
      </div>
    </template>

    <div class="ai-chat-layout">
      <div ref="messageListRef" class="ai-message-list">
        <div v-if="historyLoading" class="ai-chat-status">正在加载聊天记录...</div>

        <div v-else-if="messages.length === 0" class="ai-chat-empty">
          <span>AI</span>
          <strong>有什么想一起研究的？</strong>
          <p>可以问我 Spring、Vue、数据库或文章创作相关的问题。</p>
        </div>

        <div
          v-for="(item, index) in messages"
          :key="`${item.role}-${index}`"
          class="ai-message-row"
          :class="`is-${item.role.toLowerCase()}`"
        >
          <div class="ai-message-role">{{ getRoleLabel(item.role) }}</div>
          <div class="ai-message-bubble">
            <span v-if="item.content">{{ item.content }}</span>
            <span v-else class="ai-typing">正在思考<span>...</span></span>
          </div>
        </div>
      </div>

      <div class="ai-chat-composer">
        <el-input
          v-model="draft"
          type="textarea"
          resize="none"
          :rows="3"
          maxlength="2000"
          placeholder="输入你的问题，Enter 发送，Shift + Enter 换行"
          @keydown="handleInputKeydown"
        />
        <div class="ai-composer-actions">
          <span>{{ sending ? 'AI 正在回复...' : '内容由 AI 生成，请注意核实' }}</span>
          <el-button type="primary" :loading="sending" :disabled="!draft.trim()" @click="sendMessage">
            发送
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getChatHistory, streamChatMessage } from '../api/chat'
import { isAuthenticated } from '../auth/session'

const route = useRoute()
const router = useRouter()
const visible = ref(false)
const historyLoaded = ref(false)
const historyLoading = ref(false)
const sending = ref(false)
const draft = ref('')
const messages = ref([])
const messageListRef = ref(null)
let activeController = null

async function openAssistant() {
  if (!isAuthenticated.value) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath }
    })
    return
  }

  visible.value = true
  if (!historyLoaded.value) await loadHistory()
}

async function loadHistory() {
  historyLoading.value = true

  try {
    const data = await getChatHistory()
    messages.value = (Array.isArray(data) ? data : []).map(normalizeMessage)
    historyLoaded.value = true
    await scrollToBottom()
  } catch (error) {
    if (error.code !== 401) ElMessage.error(error.message || '聊天记录加载失败')
  } finally {
    historyLoading.value = false
  }
}

async function sendMessage() {
  const content = draft.value.trim()
  if (!content || sending.value) return

  draft.value = ''
  messages.value.push({ role: 'USER', content })
  messages.value.push({ role: 'ASSISTANT', content: '' })
  const assistantMessageIndex = messages.value.length - 1
  sending.value = true
  activeController = new AbortController()
  await scrollToBottom()

  try {
    await streamChatMessage(
      content,
      (chunk) => {
        messages.value[assistantMessageIndex].content += chunk
        scrollToBottom()
      },
      activeController.signal
    )
  } catch (error) {
    if (error.name !== 'AbortError' && error.code !== 401) {
      if (!messages.value[assistantMessageIndex]?.content) {
        messages.value.splice(assistantMessageIndex, 1)
      }
      if (!error.notified) ElMessage.error(error.message || 'AI 回复失败，请稍后重试')
    }
  } finally {
    sending.value = false
    activeController = null
    await scrollToBottom()
  }
}

function handleInputKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return

  event.preventDefault()
  sendMessage()
}

function normalizeMessage(item = {}) {
  const role = String(item.role || 'ASSISTANT').toUpperCase()
  return {
    role: ['USER', 'ASSISTANT', 'SYSTEM'].includes(role) ? role : 'ASSISTANT',
    content: String(item.content || '')
  }
}

function getRoleLabel(role) {
  if (role === 'USER') return '你'
  if (role === 'SYSTEM') return '系统'
  return 'AI'
}

async function scrollToBottom() {
  await nextTick()
  const element = messageListRef.value
  if (element) element.scrollTop = element.scrollHeight
}

onBeforeUnmount(() => activeController?.abort())
</script>
