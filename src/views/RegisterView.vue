<template>
  <main class="login-shell" :style="shellStyle" @pointermove="updatePointer">
    <div class="cursor-aura" aria-hidden="true"></div>
    <div class="login-grid-bg" aria-hidden="true"></div>
    <div class="login-orb orb-one" aria-hidden="true"></div>
    <div class="login-orb orb-two" aria-hidden="true"></div>

    <section class="login-panel register-panel">
      <div class="login-brand">
        <span class="login-brand-mark">CC</span>
        <div>
          <h1>注册账号</h1>
          <p>创建后台账号，开启你的技术内容管理空间。</p>
        </div>
      </div>

      <el-form
        ref="registerFormRef"
        class="login-form"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            :prefix-icon="User"
            autocomplete="tel"
            clearable
            maxlength="11"
            placeholder="请输入 11 位手机号"
            @input="normalizePhone"
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            clearable
            maxlength="64"
            placeholder="例如：蔡鹏鑫"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            :prefix-icon="Lock"
            :suffix-icon="passwordVisible ? View : Hide"
            autocomplete="new-password"
            placeholder="包含大小写字母和数字"
            :type="passwordVisible ? 'text' : 'password'"
            @click-suffix="passwordVisible = !passwordVisible"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            :prefix-icon="Lock"
            autocomplete="new-password"
            placeholder="请再次输入密码"
            :type="passwordVisible ? 'text' : 'password'"
          />
        </el-form-item>

        <el-form-item label="头像地址" prop="avatar">
          <el-input
            v-model="registerForm.avatar"
            clearable
            maxlength="512"
            placeholder="https://example.com/avatar.png"
          />
        </el-form-item>

        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="registerForm.bio"
            maxlength="512"
            placeholder="专注 Java 后端和 AI 应用开发"
            :rows="3"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <div class="register-inline-grid">
          <el-form-item label="角色 / 技术方向" prop="role">
            <el-input
              v-model="registerForm.role"
              clearable
              maxlength="128"
              placeholder="Java 后端开发"
            />
          </el-form-item>

          <el-form-item label="所在地" prop="location">
            <el-input
              v-model="registerForm.location"
              clearable
              maxlength="128"
              placeholder="北京"
            />
          </el-form-item>
        </div>

        <el-form-item label="技能标签" prop="skills">
          <div class="register-list-field">
            <div v-if="registerForm.skills.length" class="register-chip-list">
              <el-tag
                v-for="skill in registerForm.skills"
                :key="skill"
                closable
                type="primary"
                @close="removeSkill(skill)"
              >
                {{ skill }}
              </el-tag>
            </div>
            <div class="register-add-row">
              <el-input
                v-model="skillDraft"
                clearable
                maxlength="64"
                placeholder="输入技能，如 Java"
                @keyup.enter="addSkill"
              />
              <el-button :icon="Plus" type="primary" plain @click="addSkill">添加</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="外部链接" prop="links">
          <div class="register-list-field">
            <div
              v-for="(link, index) in registerForm.links"
              :key="index"
              class="register-link-row"
            >
              <el-input v-model="link.label" maxlength="64" placeholder="GitHub" />
              <el-input v-model="link.url" maxlength="512" placeholder="https://github.com/..." />
              <el-button :icon="Delete" plain type="danger" @click="removeLink(index)" />
            </div>
            <el-button :icon="Plus" plain @click="addLink">添加链接</el-button>
          </div>
        </el-form-item>

        <div class="login-actions">
          <el-button
            class="login-button"
            type="primary"
            :loading="registerLoading"
            @click="submitRegister"
          >
            注册
          </el-button>
          <el-button class="register-button" :disabled="registerLoading" @click="goLogin">
            返回登录
          </el-button>
        </div>
      </el-form>

      <p class="login-hint">
        注册成功后会刷新页面并跳转登录页，请使用新账号登录。
      </p>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Hide, Lock, Plus, User, View } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { register } from '../api/auth'

const route = useRoute()
const router = useRouter()
const registerFormRef = ref(null)
const registerLoading = ref(false)
const passwordVisible = ref(false)
const skillDraft = ref('')
const shellStyle = ref({ '--pointer-x': '78%', '--pointer-y': '18%' })

const registerForm = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  avatar: '',
  bio: '',
  role: '',
  location: '',
  skills: [],
  links: [{ label: 'GitHub', url: '' }]
})

const registerRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 64, message: '昵称最多 64 字符', trigger: 'blur' }
  ],
  avatar: [
    { validator: validateOptionalHttpUrl, trigger: 'blur' }
  ],
  bio: [
    { max: 512, message: '个人简介最多 512 字符', trigger: 'blur' }
  ],
  role: [
    { max: 128, message: '角色最多 128 字符', trigger: 'blur' }
  ],
  location: [
    { max: 128, message: '所在地最多 128 字符', trigger: 'blur' }
  ],
  links: [
    { validator: validateLinks, trigger: 'blur' }
  ]
}

function updatePointer(event) {
  shellStyle.value = {
    '--pointer-x': `${event.clientX}px`,
    '--pointer-y': `${event.clientY}px`
  }
}

function normalizePhone(value) {
  registerForm.phone = value.replace(/\D/g, '').slice(0, 11)
}

async function submitRegister() {
  if (!registerFormRef.value) return

  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  registerLoading.value = true

  try {
    await register(buildRegisterPayload())

    ElMessage.success('注册成功，请登录')
    redirectToLogin()
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请检查输入信息')
  } finally {
    registerLoading.value = false
  }
}

function buildRegisterPayload() {
  return {
    phone: registerForm.phone.trim(),
    password: registerForm.password,
    nickname: registerForm.nickname.trim(),
    avatar: normalizeOptionalValue(registerForm.avatar),
    bio: normalizeOptionalValue(registerForm.bio),
    role: normalizeOptionalValue(registerForm.role),
    location: normalizeOptionalValue(registerForm.location),
    skills: registerForm.skills.map((skill) => skill.trim()).filter(Boolean),
    links: registerForm.links
      .map((link) => ({
        label: normalizeOptionalValue(link.label),
        url: normalizeOptionalValue(link.url)
      }))
      .filter((link) => link.label && link.url)
  }
}

function redirectToLogin() {
  const redirect = route.query.redirect
  const query = typeof redirect === 'string' && redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''

  window.location.href = `/login${query}`
}

function goLogin() {
  router.push({
    name: 'login',
    query: route.query.redirect ? { redirect: route.query.redirect } : {}
  })
}

function addSkill() {
  const skill = skillDraft.value.trim()
  if (!skill) return

  if (skill.length > 64) {
    ElMessage.warning('单个技能最多 64 字符')
    return
  }

  if (!registerForm.skills.includes(skill)) {
    registerForm.skills.push(skill)
  }

  skillDraft.value = ''
  registerFormRef.value?.validateField('skills')
}

function removeSkill(skill) {
  registerForm.skills = registerForm.skills.filter((item) => item !== skill)
}

function addLink() {
  registerForm.links.push({ label: '', url: '' })
}

function removeLink(index) {
  registerForm.links.splice(index, 1)
}

function normalizeOptionalValue(value) {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

function validatePhone(_rule, value, callback) {
  if (/^\d{11}$/.test(value)) {
    callback()
    return
  }

  callback(new Error('请输入正确手机号'))
}

function validatePassword(_rule, value, callback) {
  if (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) {
    callback()
    return
  }

  callback(new Error('密码必须包含大写字母、小写字母和数字'))
}

function validateConfirmPassword(_rule, value, callback) {
  if (value === registerForm.password) {
    callback()
    return
  }

  callback(new Error('两次输入的密码不一致'))
}

function validateOptionalHttpUrl(_rule, value, callback) {
  if (!value || /^https?:\/\/.+/i.test(value.trim())) {
    callback()
    return
  }

  callback(new Error('请输入 http 或 https 地址'))
}

function validateLinks(_rule, value, callback) {
  const invalidLink = value.find((link) => {
    const label = link.label.trim()
    const url = link.url.trim()

    if (!label && !url) return false
    if (!label || !url) return false
    if (label.length > 64 || url.length > 512) return true
    return !/^https?:\/\/.+/i.test(url)
  })

  if (!invalidLink) {
    callback()
    return
  }

  callback(new Error('外部链接需填写标签，并使用 http 或 https 地址'))
}
</script>
