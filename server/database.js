const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'shop.db')
const db = new DatabaseSync(DB_PATH)

// 事务辅助函数（node:sqlite 没有 db.transaction()）
function withTransaction(fn) {
  db.exec('BEGIN TRANSACTION')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

function initDatabase() {
  db.exec("PRAGMA journal_mode = WAL")
  db.exec("PRAGMA foreign_keys = ON")

  db.exec(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    spec TEXT DEFAULT '',
    unit TEXT DEFAULT '瓶',
    buy_price REAL DEFAULT 0,
    sell_price REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    alert_stock INTEGER DEFAULT 10,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_no TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    customer_name TEXT DEFAULT '',
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    payment_method TEXT DEFAULT '现金',
    status TEXT DEFAULT 'active',
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    spec TEXT DEFAULT '',
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    spec TEXT DEFAULT '',
    quantity REAL NOT NULL,
    buy_price REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    supplier TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    customer_name TEXT DEFAULT '',
    sale_id INTEGER,
    sale_no TEXT DEFAULT '',
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT '现金',
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`)

  const productCount = db.prepare('SELECT COUNT(*) as cnt FROM products').get()
  if (productCount.cnt === 0) {
    seedData()
  }
}

function seedData() {
  // 示例商品
  const insertProduct = db.prepare(`
    INSERT INTO products (name, spec, unit, buy_price, sell_price, stock, alert_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  insertProduct.run('可口可乐', '330ml/罐 × 24罐/箱', '箱', 68, 85, 20, 5)
  insertProduct.run('农夫山泉', '550ml/瓶 × 24瓶/箱', '箱', 32, 42, 15, 5)
  insertProduct.run('红牛', '250ml/罐 × 24罐/箱', '箱', 155, 185, 8, 3)

  // 示例客户
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)
  `)
  insertCustomer.run('张老板', '13800138001', '学府路128号便利店')
  insertCustomer.run('李大姐', '13900139002', '创业大街56号超市')

  console.log('✅ 示例数据已初始化')
}

// 生成销售单号 XS + 年月日 + 4位序号
function generateSaleNo() {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')

  const prefix = `XS${dateStr}`
  const last = db.prepare(`
    SELECT sale_no FROM sales WHERE sale_no LIKE ? ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`)

  if (!last) return `${prefix}0001`
  const num = parseInt(last.sale_no.slice(-4)) + 1
  return `${prefix}${String(num).padStart(4, '0')}`
}

module.exports = { db, initDatabase, generateSaleNo, withTransaction }
