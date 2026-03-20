import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000
})

http.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export const productApi = {
  list: () => http.get('/products'),
  create: (data) => http.post('/products', data),
  update: (id, data) => http.put(`/products/${id}`, data),
  remove: (id) => http.delete(`/products/${id}`)
}

export const customerApi = {
  list: () => http.get('/customers'),
  get: (id) => http.get(`/customers/${id}`),
  create: (data) => http.post('/customers', data),
  update: (id, data) => http.put(`/customers/${id}`, data),
  remove: (id) => http.delete(`/customers/${id}`)
}

export const saleApi = {
  list: (params) => http.get('/sales', { params }),
  get: (id) => http.get(`/sales/${id}`),
  create: (data) => http.post('/sales', data),
  void: (id) => http.post(`/sales/${id}/void`)
}

export const purchaseApi = {
  list: (params) => http.get('/purchases', { params }),
  create: (data) => http.post('/purchases', data),
  remove: (id) => http.delete(`/purchases/${id}`)
}

export const paymentApi = {
  debts: (customerId) => http.get(`/payments/debts/${customerId}`),
  history: (customerId) => http.get(`/payments/history/${customerId}`),
  create: (data) => http.post('/payments', data)
}

export const dashboardApi = {
  get: () => http.get('/dashboard')
}
