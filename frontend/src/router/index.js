import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Random from '../views/Random.vue'
import Profile from '../views/Profile.vue'
import ArticleDetail from '../views/ArticleDetail.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ResetPassword from '../views/ResetPassword.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/random',
        name: 'Random',
        component: Random
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile
    },
    {
        path: '/article/:id',
        name: 'ArticleDetail',
        component: ArticleDetail
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/register',
        name: 'Register',
        component: Register
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: ResetPassword
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router