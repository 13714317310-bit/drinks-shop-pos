const express = require('express')
const router = express.Router()
const { db } = require('../database')

// 获取客户列表（含欠款计算）
router.get('/', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*,
      COALESCE(SUM(CASE WHEN s.status='active' THEN s.total_amount - s.paid_amount ELSE 0 END), 0) AS debt
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `).all()
  res.json({ success: true, data: customers })
})

// 获取单个客户（含欠款）
router.get('/:id', (req, res) => {
  const customer = db.prepare(`
    SELECT c.*,
      COALESCE(SUM(CASE WHEN s.status='active' THEN s.total_amount - s.paid_amount ELSE 0 END), 0) AS debt
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id)
  if (!customer) return res.status(404).json({ success: false, message: '客户不存在' })
  res.json({ success: true, data: customer })
})

// 新增客户
router.post('/', (req, res) => {
  const { name, phone, address } = req.body
  if (!name) return res.status(400).json({ success: false, message: '客户姓名不能为空' })

  const result = db.prepare(`
    INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)
  `).run(name, phone || '', address || '')

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: { ...customer, debt: 0 } })
})

// 编辑客户
router.put('/:id', (req, res) => {
  const { name, phone, address } = req.body
  if (!name) return res.status(400).json({ success: false, message: '客户姓名不能为空' })

  db.prepare(`
    UPDATE customers SET name=?, phone=?, address=? WHERE id=?
  `).run(name, phone || '', address || '', req.params.id)

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: customer })
})

// 删除客户
router.delete('/:id', (req, res) => {
  const debt = db.prepare(`
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) as debt
    FROM sales WHERE customer_id=? AND status='active'
  `).get(req.params.id)

  if (debt.debt > 0) {
    return res.status(400).json({ success: false, message: `该客户还有 ¥${debt.debt.toFixed(2)} 未收款，无法删除` })
  }

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
