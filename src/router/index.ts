import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
    {
        path: '/',
        component: () => import('../layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            { path: '', component: () => import('../pages/IndexPage.vue') },
            { path: 'tags', component: () => import('../pages/TagManagerPage.vue') }
        ]
    },
    {
        path: '/login',
        component: () => import('../pages/LoginPage.vue'),
        meta: { requiresGuest: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    if (authStore.loading) {
        await authStore.initialize()
    }

    const isAuthenticated = !!authStore.user

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
