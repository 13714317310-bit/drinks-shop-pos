// 数字转中文大写
function numToChinese(num) {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟']
  const bigUnits = ['', '万', '亿']
  if (num === 0) return '零元整'

  const str = Math.round(num * 100).toString()
  const fen = str.slice(-2).padStart(2, '0')
  const yuan = str.slice(0, -2) || '0'

  let result = ''
  const yuanArr = yuan.split('').reverse()
  for (let i = 0; i < yuanArr.length; i++) {
    const d = parseInt(yuanArr[i])
    const unit = units[i % 4]
    const bigUnit = i % 4 === 0 ? bigUnits[Math.floor(i / 4)] : ''
    if (d !== 0) result = digits[d] + unit + bigUnit + result
    else result = (result[0] !== '零' ? '零' : '') + result
  }
  result = result.replace(/^零+/, '') || '零'

  const fenStr = fen[1] !== '0'
    ? (fen[0] !== '0' ? `${digits[parseInt(fen[0])]}角${digits[parseInt(fen[1])]}分` : `${digits[parseInt(fen[1])]}分`)
    : (fen[0] !== '0' ? `${digits[parseInt(fen[0])]}角整` : '整')

  return result + '元' + fenStr
}

function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}

export function printSaleOrder(sale) {
  const items = sale.items || []
  const customer = sale._customer || {}
  const address = sale.customer_address || customer.address || ''
  const phone = sale.customer_phone || customer.phone || ''
  const debt = Number(sale.total_amount) - Number(sale.paid_amount)

  const rows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.product_name}</td>
      <td>${item.spec || ''}</td>
      <td>${item.quantity}</td>
      <td>¥${Number(item.unit_price).toFixed(2)}</td>
      <td>¥${Number(item.amount).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>送货单 ${sale.sale_no}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'SimSun', serif; font-size: 13px; padding: 20px; color: #000; }
    .header { text-align: center; margin-bottom: 12px; }
    .header h1 { font-size: 22px; margin-bottom: 4px; }
    .header h2 { font-size: 16px; font-weight: normal; }
    .info-row { display: flex; justify-content: space-between; margin: 6px 0; }
    .info-box { border: 1px solid #000; padding: 8px 12px; margin: 8px 0; }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 3px 8px; vertical-align: top; }
    table.goods { width: 100%; border-collapse: collapse; margin: 12px 0; }
    table.goods th, table.goods td { border: 1px solid #333; padding: 5px 8px; text-align: center; }
    table.goods th { background: #f0f0f0; font-weight: 600; }
    table.goods td:nth-child(2) { text-align: left; }
    .total-row { display: flex; justify-content: flex-end; font-size: 15px; font-weight: 700; margin: 6px 0; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 24px; }
    .sign-box { border-bottom: 1px solid #333; width: 140px; display: inline-block; height: 20px; }
    .debt-box { border: 1px solid #f00; color: #f00; padding: 4px 12px; display: inline-block; font-weight: 700; }
    @media print {
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧃 饮料小店</h1>
    <h2>送货单</h2>
  </div>
  <div class="info-row">
    <span>单号：<strong>${sale.sale_no}</strong></span>
    <span>日期：${sale.created_at?.split(' ')[0] || new Date().toLocaleDateString()}</span>
  </div>
  <div class="info-box">
    <table>
      <tr>
        <td width="70">客户：</td><td><strong>${sale.customer_name || '-'}</strong></td>
        <td width="70">电话：</td><td>${phone || '-'}</td>
      </tr>
      <tr>
        <td>地址：</td><td colspan="3">${address || '-'}</td>
      </tr>
    </table>
  </div>

  <table class="goods">
    <thead>
      <tr>
        <th width="40">序号</th>
        <th>商品名称</th>
        <th width="170">规格</th>
        <th width="60">数量</th>
        <th width="90">单价</th>
        <th width="100">金额</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${Array(Math.max(0, 5 - items.length)).fill('<tr><td colspan="6" style="height:24px"></td></tr>').join('')}
    </tbody>
  </table>

  <div class="total-row">合计：¥${Number(sale.total_amount).toFixed(2)}</div>

  <div class="info-box" style="margin-top:8px">
    <table>
      <tr>
        <td width="90">收款方式：</td><td><strong>${sale.payment_method}</strong></td>
        <td width="70">实收：</td><td>¥${Number(sale.paid_amount).toFixed(2)}</td>
      </tr>
      ${debt > 0 ? `<tr><td>挂账金额：</td><td colspan="3"><span class="debt-box">¥${debt.toFixed(2)}</span></td></tr>` : ''}
      <tr>
        <td>备注：</td><td colspan="3">${sale.note || ''}</td>
      </tr>
    </table>
  </div>

  <div class="sign-row">
    <span>经手人：<span class="sign-box"></span></span>
    <span>客户签字：<span class="sign-box"></span></span>
  </div>
</body>
</html>`

  openPrintWindow(html)
}

export function printReceipt(payment) {
  const amount = Number(payment.amount || 0)
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>收款收据</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'SimSun', serif; font-size: 13px; padding: 20px; width: 400px; }
    h2 { text-align: center; font-size: 18px; margin-bottom: 16px; }
    .receipt-body table { width: 100%; border-collapse: collapse; }
    .receipt-body td { padding: 8px 4px; border-bottom: 1px dashed #ccc; }
    .receipt-body td:first-child { color: #666; width: 90px; }
    .amount-big { font-size: 20px; font-weight: 700; color: #d00; }
    .footer { margin-top: 24px; text-align: right; border-top: 1px solid #333; padding-top: 8px; }
    @media print { body { width: auto; } }
  </style>
</head>
<body>
  <h2>🧃 收款收据</h2>
  <div class="receipt-body">
    <table>
      <tr><td>日期</td><td>${new Date().toLocaleDateString('zh-CN')}</td></tr>
      <tr><td>客户</td><td><strong>${payment.customer_name || '-'}</strong></td></tr>
      <tr><td>收款金额</td><td class="amount-big">¥${amount.toFixed(2)}</td></tr>
      <tr><td>大写</td><td>${numToChinese(amount)}</td></tr>
      <tr><td>收款方式</td><td>${payment.payment_method || '-'}</td></tr>
      <tr><td>对应单号</td><td>${payment.sale_no || '（综合收款）'}</td></tr>
      <tr><td>备注</td><td>${payment.note || '-'}</td></tr>
    </table>
  </div>
  <div class="footer">收款人签字：________________</div>
</body>
</html>`

  openPrintWindow(html)
}
