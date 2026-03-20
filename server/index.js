const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDatabase } = require('./database')

const app = express()
const PORT = process.env.PORT || 3000

// 初始化数据库
initDatabase()

app.use(cors())
app.use(express.json())

// API 路由
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/products', require('./routes/products'))
app.use('/api/customers', require('./routes/customers'))
app.use('/api/sales', require('./routes/sales'))
app.use('/api/purchases', require('./routes/purchases'))
app.use('/api/payments', require('./routes/payments'))

// 提供前端静态文件
const publicDir = path.join(__dirname, 'public')
app.use(express.static(publicDir))

// SPA 路由回退
app.get('*', (req, res) => {
  const indexFile = path.join(publicDir, 'index.html')
  const fs = require('fs')
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile)
  } else {
    res.status(404).send(`
      <h2>请先构建前端</h2>
      <p>运行: <code>npm run init</code></p>
      <p>或开发模式: <code>npm run dev</code></p>
    `)
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🧃 饮料小店进销存系统已启动`)
  console.log(`📍 本机访问: http://localhost:${PORT}`)
  console.log(`🌐 局域网访问: http://<本机IP>:${PORT}\n`)

  // 自动打开浏览器
  setTimeout(() => {
    import('open').then(({ default: open }) => {
      open(`http://localhost:${PORT}`)
    }).catch(() => {})
  }, 500)
})

module.exports = app
