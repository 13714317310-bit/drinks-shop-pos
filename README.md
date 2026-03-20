# 🧃 饮料小店进销存管理系统

简单实用的个体商铺进销存工具，支持开单、进货、收款、打印。

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus
- **后端**: Node.js + Express
- **数据库**: SQLite（单文件 `shop.db`，复制即备份）

---

## 快速开始

### 第一次安装（只需执行一次）

```bash
# 1. 安装依赖 + 构建前端
npm run init
```

> 需要 Node.js 18+，安装地址：https://nodejs.org

### 每次启动

```bash
npm start
```

启动后自动打开浏览器，访问 `http://localhost:3000`

**局域网访问**（手机/其他电脑）：将 `localhost` 换成本机 IP，如 `http://192.168.1.100:3000`

---

## 开发模式

前后端热重载：

```bash
npm run dev
```

- 后端：`http://localhost:3000`
- 前端 Vite：`http://localhost:5173`（自动代理 API）

---

## 功能说明

| 模块 | 功能 |
|------|------|
| **首页** | 今日销售额、待收款、库存预警、最近销售单 |
| **开单** | 选客户、加商品、设单价、选收款方式（现金/微信/支付宝/挂账）|
| **销售记录** | 查看历史、按客户/状态筛选、作废回补库存、打印送货单 |
| **欠款收款** | 按客户查看欠款明细、部分收款、收款历史、打印收据 |
| **进货记录** | 新增进货自动增加库存、查看历史 |
| **商品管理** | 增删改、库存低于预警值标红 |
| **客户管理** | 增删改、欠款自动计算、快速跳转收款 |

### 打印说明

- 开单保存后弹出「打印送货单」按钮
- 收款确认后自动弹出收据预览
- 销售记录列表每条均有「打印」按钮
- 打印时自动隐藏浏览器导航，适配 A4 纸

---

## 数据备份

数据全部存储在根目录 `shop.db` 文件中，**复制该文件即完成备份**。

恢复：将备份的 `shop.db` 替换回原位置，重启即可。

---

## 目录结构

```
drinks-shop-pos/
├── server/
│   ├── index.js          # Express 主服务
│   ├── database.js       # SQLite 初始化 + 种子数据
│   └── routes/           # API 路由
│       ├── dashboard.js
│       ├── products.js
│       ├── customers.js
│       ├── sales.js
│       ├── purchases.js
│       └── payments.js
├── client/               # Vue 3 前端
│   └── src/
│       ├── views/        # 页面组件
│       └── utils/print.js # 打印模板
├── shop.db               # SQLite 数据库（自动创建）
└── package.json
```

## 常见问题

**Q: 端口 3000 被占用？**
A: `PORT=3001 npm start`

**Q: 如何修改店铺名称？**
A: 编辑 `client/src/utils/print.js` 中的「饮料小店」字样，再 `npm run build`

**Q: 示例数据如何清除？**
A: 删除 `shop.db` 文件，重启后重新生成空数据库
