import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首页', public: true }
  },
  {
    path: '/articles/manage',
    name: 'article-manage',
    component: () => import('../views/ArticleManageView.vue'),
    meta: { title: '文章管理', requiresAuth: true }
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: () => import('../views/ArticleDetailView.vue'),
    meta: { title: '文章详情', public: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: '注册', public: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const token = localStorage.getItem('codechronicles_token')

  if (to.meta.public) {
    if (token && (to.name === 'login' || to.name === 'register')) {
      return { name: 'home' }
    }

    return true
  }

  if (!token) {
    return {
      name: 'login',
      query: to.fullPath === '/' ? {} : { redirect: to.fullPath }
    }
  }

  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title} - CodeChronicles`
})

export default router
