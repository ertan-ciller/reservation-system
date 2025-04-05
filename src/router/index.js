import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/admin',
    name: 'admin-login',
    component: () => import('../views/AdminLogin.vue')
  },
  {
    path: '/admin/reservations',
    name: 'admin-reservations',
    component: () => import('../views/AdminReservations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth durumunu kontrol et
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener()
        resolve(user)
      },
      reject
    )
  })
}

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser()
  console.log('Current route:', to.path)
  console.log('User status:', user ? 'Logged in' : 'Not logged in')

  // Admin rezervasyonlar sayfası kontrolü
  if (to.name === 'admin-reservations' && !user) {
    console.log('Redirecting to admin login')
    next({ name: 'admin-login' })
    return
  }

  // Giriş yapmış kullanıcı admin login sayfasına erişmeye çalışırsa
  if (to.name === 'admin-login' && user) {
    console.log('Redirecting to admin reservations')
    next({ name: 'admin-reservations' })
    return
  }

  next()
})

export default router 