const express = require('express')
const router = express.Router()
const { db } = require('../database')

// 获取商品列表
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all()
  res.json({ success: true, data: products })
})

// 新增商品
router.post('/', (req, res) => {
  const { name, spec, unit, buy_price, sell_price, stock, alert_stock } = req.body
  if (!name) return res.status(400).json({ success: false, message: '商品名称不能为空' })

  const stmt = db.prepare(`
    INSERT INTO products (name, spec, unit, buy_price, sell_price, stock, alert_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(name, spec || '', unit || '瓶', buy_price || 0, sell_price || 0, stock || 0, alert_stock || 10)
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: product })
})

// 编辑商品
router.put('/:id', (req, res) => {
  const { name, spec, unit, buy_price, sell_price, stock, alert_stock } = req.body
  if (!name) return res.status(400).json({ success: false, message: '商品名称不能为空' })

  db.prepare(`
    UPDATE products SET name=?, spec=?, unit=?, buy_price=?, sell_price=?, stock=?, alert_stock=?
    WHERE id=?
  `).run(name, spec || '', unit || '瓶', buy_price || 0, sell_price || 0, stock || 0, alert_stock || 10, req.params.id)

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: product })
})

// 删除商品
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
