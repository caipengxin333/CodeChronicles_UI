<template>
  <main class="login-shell" :style="shellStyle" @pointermove="updatePointer">
    <div class="cursor-aura" aria-hidden="true"></div>
    <div class="login-grid-bg" aria-hidden="true"></div>
    <div class="login-orb orb-one" aria-hidden="true"></div>
    <div class="login-orb orb-two" aria-hidden="true"></div>

    <section class="login-panel">
      <div class="login-brand">
        <span class="login-brand-mark">CC</span>
        <div>
          <h1>CodeChronicles</h1>
          <p>登录后台，继续记录你的技术编年史。</p>
        </div>
      </div>

      <el-form
        ref="loginFormRef"
        class="login-form"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="loginForm.phone"
            :prefix-icon="User"
            autocomplete="tel"
            clearable
            maxlength="11"
            placeholder="请输入 11 位手机号"
            @input="normalizePhone"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            :prefix-icon="Lock"
            :suffix-icon="passwordVisible ? View : Hide"
            autocomplete="current-password"
            placeholder="请输入密码"
            :type="passwordVisible ? 'text' : 'password'"
            @click-suffix="passwordVisible = !passwordVisible"
          />
        </el-form-item>

        <el-form-item label="图形验证码" prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="loginForm.captcha"
              :prefix-icon="PictureRounded"
              maxlength="4"
              placeholder="输入 4 位验证码"
              @keyup.enter="submitLogin"
            />
            <button
              class="captcha-card captcha-image-card"
              type="button"
              title="点击刷新验证码"
              @click="loadCaptcha"
            >
              <img v-if="captchaImage" :src="captchaImage" alt="图形验证码" />
              <span v-else>刷新</span>
            </button>
          </div>
        </el-form-item>

        <div class="login-actions">
          <el-button class="login-button" type="primary" :loading="loginLoading" @click="submitLogin">
            登录
          </el-button>
          <el-button class="register-button" :disabled="loginLoading" @click="goRegister">
            注册账号
          </el-button>
        </div>
      </el-form>

      <p class="login-hint">
        已预留请求载荷：<code>phone</code>、<code>password</code>、<code>captchaKey</code>、<code>captcha</code>
      </p>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Hide, Lock, PictureRounded, User, View } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { getCaptcha, login } from '../api/auth'

const route = useRoute()
const router = useRouter()
const loginFormRef = ref(null)
const loginLoading = ref(false)
const passwordVisible = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')
const shellStyle = ref({ '--pointer-x': '78%', '--pointer-y': '18%' })

const loginForm = reactive({
  phone: '',
  password: '',
  captcha: ''
})

const loginRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入图形验证码', trigger: 'blur' },
    { len: 4, message: '验证码为 4 位字符', trigger: 'blur' }
  ]
}

onMounted(loadCaptcha)

function updatePointer(event) {
  shellStyle.value = {
    '--pointer-x': `${event.clientX}px`,
    '--pointer-y': `${event.clientY}px`
  }
}

function normalizePhone(value) {
  loginForm.phone = value.replace(/\D/g, '').slice(0, 11)
}

async function loadCaptcha() {
  try {
    const data = await getCaptcha()
    captchaKey.value = data.captchaKey || ''
    captchaImage.value = data.image || ''
  } catch (error) {
    captchaKey.value = ''
    captchaImage.value = ''
    ElMessage.error(error.message || '验证码加载失败')
  }

  loginForm.captcha = ''
  loginFormRef.value?.clearValidate('captcha')
}

async function submitLogin() {
  if (!loginFormRef.value) return

  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (!captchaKey.value) {
    ElMessage.error('验证码未加载，请刷新验证码')
    await loadCaptcha()
    return
  }

  loginLoading.value = true

  try {
    const result = await login({
      phone: loginForm.phone.trim(),
      password: loginForm.password,
      captchaKey: captchaKey.value,
      captcha: loginForm.captcha
    })

    const token = resolveToken(result)

    if (token) {
      localStorage.setItem('codechronicles_token', token)
    }

    ElMessage.success('登录成功')
    await router.replace(getRedirectPath())
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请检查手机号、密码或验证码')
    await loadCaptcha()
  } finally {
    loginLoading.value = false
  }
}

function resolveToken(result) {
  if (typeof result === 'string') return result
  return result?.token || result?.accessToken || result?.data?.token || ''
}

function getRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}

function goRegister() {
  router.push({
    name: 'register',
    query: route.query.redirect ? { redirect: route.query.redirect } : {}
  })
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
</script>
