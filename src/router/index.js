import { createRouter, createWebHashHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import HomeView from '../views/HomeView.vue'
import { getAuthToken, isVisitor } from '../auth/session'
import { resolveRouteAccess, VISITOR_FORBIDDEN_MESSAGE } from '../auth/permissions'

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
    meta: { title: '文章管理', requiresAuth: true, denyVisitor: true }
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
  const decision = resolveRouteAccess(to, {
    token: getAuthToken(),
    isVisitor: isVisitor.value
  })

  if (decision?.visitorForbidden) {
    ElMessage.warning(VISITOR_FORBIDDEN_MESSAGE)
    const { visitorForbidden, ...redirect } = decision
    return redirect
  }

  return decision
})

router.afterEach((to) => {
  document.title = `${to.meta.title} - CodeChronicles`
})

export default router
