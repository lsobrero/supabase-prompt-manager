import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        component: () => import('../layouts/MainLayout.vue'),
        children: [
            { path: '', component: () => import('../pages/IndexPage.vue') },
            { path: 'tags', component: () => import('../pages/TagManagerPage.vue') }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
