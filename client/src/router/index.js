import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '首页' } },
  { path: '/products', component: () => import('../views/Products.vue'), meta: { title: '商品管理' } },
  { path: '/customers', component: () => import('../views/Customers.vue'), meta: { title: '客户管理' } },
  { path: '/sales', component: () => import('../views/SaleList.vue'), meta: { title: '销售单' } },
  { path: '/sales/create', component: () => import('../views/SaleCreate.vue'), meta: { title: '新建销售单' } },
  { path: '/purchases', component: () => import('../views/Purchases.vue'), meta: { title: '进货记录' } },
  { path: '/payments', component: () => import('../views/Payments.vue'), meta: { title: '欠款收款' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
