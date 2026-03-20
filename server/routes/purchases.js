const express = require('express')
const router = express.Router()
const { db, withTransaction } = require('../database')

// 获取进货列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)

  const total = db.prepare('SELECT COUNT(*) as cnt FROM purchases').get()
  const list = db.prepare(`
    SELECT * FROM purchases ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(Number(pageSize), offset)

  res.json({ success: true, data: list, total: total.cnt })
})

// 新增进货
router.post('/', (req, res) => {
  const { product_id, product_name, spec, quantity, buy_price, supplier, note } = req.body

  if (!product_name || !quantity) {
    return res.status(400).json({ success: false, message: '商品和数量不能为空' })
  }

  try {
    const purchase = withTransaction(() => {
      const total_amount = (buy_price || 0) * quantity
      const result = db.prepare(`
        INSERT INTO purchases (product_id, product_name, spec, quantity, buy_price, total_amount, supplier, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(product_id || null, product_name, spec || '', quantity, buy_price || 0, total_amount, supplier || '', note || '')

      if (product_id) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, product_id)
        if (buy_price) {
          db.prepare('UPDATE products SET buy_price = ? WHERE id = ?').run(buy_price, product_id)
        }
      }

      return db.prepare('SELECT * FROM purchases WHERE id = ?').get(result.lastInsertRowid)
    })
    res.json({ success: true, data: purchase })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 删除进货记录（不回滚库存，仅删除记录）
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM purchases WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
