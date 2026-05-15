import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Home from '@/pages/Home.vue'
import CoursePage from '@/pages/CoursePage.vue'
import LessonPage from '@/pages/LessonPage.vue'
import JumpPage from '@/pages/JumpPage.vue'
import NotFound from '@/pages/NotFound.vue'
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import CourseManage from '@/pages/admin/CourseManage.vue'
import LessonForm from '@/pages/admin/LessonForm.vue'
import { auth } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    component: Login,
    meta: { title: 'Login' },
  },
  {
    path: '/register',
    component: Register,
    meta: { title: 'Register' },
  },
  {
    path: '/',
    component: Home,
    meta: { requiresAuth: true, title: 'Home' },
  },
  {
    path: '/admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin' },
  },
  {
    path: '/admin/courses/:slug/manage',
    component: CourseManage,
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Manage Course' },
  },
  {
    path: '/admin/courses/:slug/lessons/create',
    component: LessonForm,
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Create Lesson' },
  },
  {
    path: '/:course_slug/jump/:lesson_id',
    component: JumpPage,
    meta: { requiresAuth: true, title: 'Jump' },
  },
  {
    path: '/:course_slug/lessons/:lesson_id',
    component: LessonPage,
    meta: { requiresAuth: true, title: 'Lesson' },
  },
  {
    path: '/:course_slug',
    component: CoursePage,
    meta: { requiresAuth: true, title: 'Course' },
  },
  {
    path: '/:pathMatch(.*)*',
    component: NotFound,
    meta: { title: 'Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const titleMap = {
  Home: 'Home',
  Login: 'Login',
  Register: 'Register',
  Course: 'Course',
  Lesson: 'Lesson',
  Jump: 'Jump',
  Admin: 'Admin',
  'Manage Course': 'Manage Course',
  'Create Lesson': 'Create Lesson',
  'Not Found': 'Not Found',
}

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.token) {
    return '/login'
  }
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return '/'
  }
  if (!to.meta.requiresAuth && auth.token && (to.path === '/login' || to.path === '/register')) {
    return '/'
  }
  document.title = `${titleMap[to.meta.title] || 'WebTechStudio'} - WebTechStudio`
})

export default router
