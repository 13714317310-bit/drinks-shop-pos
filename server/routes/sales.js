const express = require('express')
const router = express.Router()
const { db, generateSaleNo, withTransaction } = require('../database')

// 获取销售单列表
router.get('/', (req, res) => {
  const { status, customer_id, page = 1, pageSize = 20 } = req.query
  let where = []
  let params = []

  if (status) { where.push('s.status = ?'); params.push(status) }
  if (customer_id) { where.push('s.customer_id = ?'); params.push(Number(customer_id)) }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const offset = (Number(page) - 1) * Number(pageSize)

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM sales s ${whereStr}`).get(...params)
  const sales = db.prepare(`
    SELECT s.*, c.phone as customer_phone
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    ${whereStr}
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset)

  res.json({ success: true, data: sales, total: total.cnt })
})

// 获取单张销售单（含明细）
router.get('/:id', (req, res) => {
  const sale = db.prepare(`
    SELECT s.*, c.phone as customer_phone, c.address as customer_address
    FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
    WHERE s.id = ?
  `).get(req.params.id)

  if (!sale) return res.status(404).json({ success: false, message: '销售单不存在' })

  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(req.params.id)
  res.json({ success: true, data: { ...sale, items } })
})

// 创建销售单
router.post('/', (req, res) => {
  const { customer_id, customer_name, items, payment_method, note } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: '请至少添加一个商品' })
  }

  try {
    const sale = withTransaction(() => {
      const sale_no = generateSaleNo()
      const total_amount = items.reduce((sum, i) => sum + i.amount, 0)
      const paid_amount = payment_method === '挂账' ? 0 : total_amount

      for (const item of items) {
        if (item.product_id) {
          const product = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.product_id)
          if (product && product.stock < item.quantity) {
            throw new Error(`商品「${product.name}」库存不足（库存：${product.stock}，需要：${item.quantity}）`)
          }
        }
      }

      const saleResult = db.prepare(`
        INSERT INTO sales (sale_no, customer_id, customer_name, total_amount, paid_amount, payment_method, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(sale_no, customer_id || null, customer_name || '', total_amount, paid_amount, payment_method || '现金', note || '')

      const sale_id = saleResult.lastInsertRowid

      const insertItem = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, product_name, spec, quantity, unit_price, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const item of items) {
        insertItem.run(sale_id, item.product_id || null, item.product_name, item.spec || '', item.quantity, item.unit_price, item.amount)
        if (item.product_id) {
          db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id)
        }
      }

      return db.prepare('SELECT * FROM sales WHERE id = ?').get(sale_id)
    })
    res.json({ success: true, data: sale })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 作废销售单
router.post('/:id/void', (req, res) => {
  try {
    withTransaction(() => {
      const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id)
      if (!sale) throw new Error('销售单不存在')
      if (sale.status === 'void') throw new Error('该单已作废')

      const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(req.params.id)
      for (const item of items) {
        if (item.product_id) {
          db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id)
        }
      }
      db.prepare(`UPDATE sales SET status='void' WHERE id=?`).run(req.params.id)
    })
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

module.exports = router
