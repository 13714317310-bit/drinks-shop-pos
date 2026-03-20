const express = require('express')
const router = express.Router()
const { db } = require('../database')

router.get('/', (req, res) => {
  const today = new Date()
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')

  // 今日销售额 & 开单数
  const todaySales = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
    FROM sales
    WHERE date(created_at) = ? AND status = 'active'
  `).get(todayStr)

  // 待收款总额
  const totalDebt = db.prepare(`
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) as debt
    FROM sales WHERE status = 'active'
  `).get()

  // 库存预警商品数
  const alertCount = db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE stock <= alert_stock
  `).get()

  // 库存预警商品列表
  const alertProducts = db.prepare(`
    SELECT id, name, spec, stock, alert_stock FROM products WHERE stock <= alert_stock ORDER BY stock ASC
  `).all()

  // 最近5条销售单
  const recentSales = db.prepare(`
    SELECT id, sale_no, customer_name, total_amount, payment_method, status, created_at
    FROM sales ORDER BY id DESC LIMIT 5
  `).all()

  res.json({
    success: true,
    data: {
      todaySaleAmount: todaySales.total,
      todaySaleCount: todaySales.count,
      totalDebt: totalDebt.debt,
      alertCount: alertCount.count,
      alertProducts,
      recentSales
    }
  })
})

module.exports = router
