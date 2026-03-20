const express = require('express')
const cors = require('cors')
const path = require('path')
const session = require('express-session')
const { initDatabase, db } = require('./database')

const app = express()
const PORT = process.env.PORT || 3000
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

initDatabase()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: process.env.SESSION_SECRET || 'drinks-shop-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}))

app.get('/login', (req, res) => {
  const error = req.query.error ? '密码错误，请重试' : ''
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>登录 - 饮料小店进销存</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
      background:linear-gradient(135deg,#001529,#003a70);
      display:flex;align-items:center;justify-content:center;min-height:100vh}
    .box{background:#fff;border-radius:16px;padding:48px 40px;width:360px;text-align:center;
      box-shadow:0 20px 60px rgba(0,0,0,.3)}
    .icon{font-size:56px;margin-bottom:12px}
    h1{font-size:22px;color:#333;margin-bottom:4px}
    .sub{color:#999;font-size:14px;margin-bottom:28px}
    input{width:100%;padding:12px 16px;border:1px solid #e0e0e0;border-radius:8px;
      font-size:16px;outline:none;transition:border .2s}
    input:focus{border-color:#1677ff}
    button{width:100%;padding:13px;background:#1677ff;color:#fff;border:none;
      border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-top:16px;
      transition:background .2s}
    button:hover{background:#0958d9}
    .error{color:#f56c6c;font-size:13px;margin-top:10px}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">🧃</div>
    <h1>饮料小店进销存</h1>
    <p class="sub">请输入访问密码</p>
    <form method="POST" action="/login">
      <input type="password" name="password" placeholder="请输入密码" autofocus autocomplete="current-password" />
      <button type="submit">进入系统</button>
      ${error ? `<p class="error">${error}</p>` : ''}
    </form>
  </div>
</body>
</html>`)
})

app.post('/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.authenticated = true
    res.redirect('/')
  } else {
    res.redirect('/login?error=1')
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/login')
})

function requireAuth(req, res, next) {
  if (!ADMIN_PASSWORD) return next()
  if (req.session.authenticated) return next()
  if (req.path.startsWith('/api')) {
    return res.status(401).json({ success: false, message: '请先登录' })
  }
  res.redirect('/login')
}

app.get('/api/backup', requireAuth, (req, res) => {
  const data = {
    exportTime: new Date().toLocaleString('zh-CN'),
    products:  db.prepare('SELECT * FROM products').all(),
    customers: db.prepare('SELECT * FROM customers').all(),
    sales:     db.prepare('SELECT * FROM sales').all(),
    saleItems: db.prepare('SELECT * FROM sale_items').all(),
    purchases: db.prepare('SELECT * FROM purchases').all(),
    payments:  db.prepare('SELECT * FROM payments').all(),
  }
  res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`)
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(data, null, 2))
})

app.use('/api', requireAuth)
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/products',  require('./routes/products'))
app.use('/api/customers', require('./routes/customers'))
app.use('/api/sales',     require('./routes/sales'))
app.use('/api/purchases', require('./routes/purchases'))
app.use('/api/payments',  require('./routes/payments'))

const publicDir = path.join(__dirname, 'public')
app.use(requireAuth, express.static(publicDir))

app.get('*', requireAuth, (req, res) => {
  const fs = require('fs')
  const indexFile = path.join(publicDir, 'index.html')
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile)
  } else {
    res.status(404).send('<h2>请先构建前端：npm run init</h2>')
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🧃 饮料小店进销存系统已启动`)
  console.log(`📍 本机访问: http://localhost:${PORT}`)
  if (ADMIN_PASSWORD) {
    console.log(`🔒 密码保护已开启`)
  } else {
    console.log(`⚠️  未设置密码，建议设置 ADMIN_PASSWORD 环境变量`)
  }
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => {
      import('open').then(({ default: open }) => open(`http://localhost:${PORT}`)).catch(() => {})
    }, 500)
  }
})

module.exports = app
