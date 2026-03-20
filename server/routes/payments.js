const express = require('express')
const router = express.Router()
const { db, withTransaction } = require('../database')

// 获取欠款明细（按客户）
router.get('/debts/:customer_id', (req, res) => {
  const sales = db.prepare(`
    SELECT id, sale_no, total_amount, paid_amount,
           (total_amount - paid_amount) as debt_amount,
           payment_method, created_at, status
    FROM sales
    WHERE customer_id = ? AND status = 'active' AND total_amount > paid_amount
    ORDER BY id ASC
  `).all(req.params.customer_id)

  res.json({ success: true, data: sales })
})

// 获取收款历史（按客户）
router.get('/history/:customer_id', (req, res) => {
  const list = db.prepare(`
    SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC
  `).all(req.params.customer_id)
  res.json({ success: true, data: list })
})

// 收款
router.post('/', (req, res) => {
  const { customer_id, customer_name, sale_id, sale_no, amount, payment_method, note } = req.body

  if (!customer_id || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: '收款信息不完整' })
  }

  try {
    const payment = withTransaction(() => {
      const result = db.prepare(`
        INSERT INTO payments (customer_id, customer_name, sale_id, sale_no, amount, payment_method, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(customer_id, customer_name || '', sale_id || null, sale_no || '', amount, payment_method || '现金', note || '')

      if (sale_id) {
        const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(sale_id)
        if (sale) {
          const newPaid = Math.min(sale.paid_amount + amount, sale.total_amount)
          db.prepare('UPDATE sales SET paid_amount = ? WHERE id = ?').run(newPaid, sale_id)
        }
      } else {
        let remaining = amount
        const unpaidSales = db.prepare(`
          SELECT * FROM sales WHERE customer_id = ? AND status = 'active' AND total_amount > paid_amount ORDER BY id ASC
        `).all(customer_id)
        for (const sale of unpaidSales) {
          if (remaining <= 0) break
          const owed = sale.total_amount - sale.paid_amount
          const pay = Math.min(remaining, owed)
          db.prepare('UPDATE sales SET paid_amount = paid_amount + ? WHERE id = ?').run(pay, sale.id)
          remaining -= pay
        }
      }

      return db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid)
    })
    res.json({ success: true, data: payment })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

module.exports = router
