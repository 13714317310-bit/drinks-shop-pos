<template>
  <div class="sale-create">
    <el-row :gutter="16">
      <!-- 左侧：客户 + 商品列表 -->
      <el-col :span="17">
        <el-card class="section-card">
          <template #header><span class="section-title">📋 选择客户</span></template>
          <el-row :gutter="12" align="middle">
            <el-col :span="10">
              <el-select v-model="form.customer_id" placeholder="选择客户（可不选）"
                filterable clearable style="width:100%" @change="onCustomerChange">
                <el-option v-for="c in customers" :key="c.id"
                  :label="`${c.name}${c.phone ? ' - '+c.phone : ''}`" :value="c.id" />
              </el-select>
            </el-col>
            <el-col :span="8" v-if="selectedCustomer">
              <el-descriptions :column="1" size="small" style="margin:0">
                <el-descriptions-item label="地址">{{ selectedCustomer.address || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-col>
            <el-col :span="6">
              <el-input v-model="form.customer_name" placeholder="或直接输入客户名"
                v-if="!form.customer_id" />
            </el-col>
          </el-row>
        </el-card>

        <el-card class="section-card" style="margin-top:12px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="section-title">🧃 添加商品</span>
              <el-button size="small" type="primary" plain :icon="Plus" @click="addItem">添加行</el-button>
            </div>
          </template>

          <el-table :data="form.items" border size="default">
            <el-table-column label="序号" width="55" align="center">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="180">
              <template #default="{ row, $index }">
                <el-select v-model="row.product_id" filterable placeholder="选择商品"
                  style="width:100%" @change="(id) => onProductChange(id, $index)">
                  <el-option v-for="p in products" :key="p.id"
                    :label="p.name" :value="p.id">
                    <span>{{ p.name }}</span>
                    <span style="float:right;color:#999;font-size:12px">库存:{{ p.stock }}</span>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="规格" width="160">
              <template #default="{ row }">
                <el-input v-model="row.spec" placeholder="规格" size="default" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="0.01" :precision="2" :controls="false"
                  style="width:100%" @change="calcRow(row)" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="110">
              <template #default="{ row }">
                <el-input-number v-model="row.unit_price" :min="0" :precision="2" :controls="false"
                  style="width:100%" @change="calcRow(row)" />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100" align="right">
              <template #default="{ row }">
                <span style="font-weight:600;color:#333">¥{{ row.amount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="50" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" :icon="Delete" @click="removeItem($index)" />
              </template>
            </el-table-column>
          </el-table>

          <div v-if="form.items.length === 0" class="empty-tip">
            点击「添加行」选择商品
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：结算区 -->
      <el-col :span="7">
        <el-card class="section-card checkout-card">
          <template #header><span class="section-title">💰 结算</span></template>

          <div class="total-display">
            <span class="total-label">合计金额</span>
            <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
          </div>

          <el-divider />

          <el-form label-width="80px" label-position="left">
            <el-form-item label="收款方式">
              <el-radio-group v-model="form.payment_method">
                <el-radio-button v-for="m in payMethods" :key="m" :label="m">{{ m }}</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="备注">
              <el-input v-model="form.note" type="textarea" :rows="3" placeholder="备注（可不填）" />
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="form.payment_method === '挂账'" class="debt-tip">
            <el-alert type="warning" :closable="false" show-icon>
              <template #title>将产生欠款 ¥{{ totalAmount.toFixed(2) }}</template>
            </el-alert>
          </div>

          <el-button type="primary" size="large" style="width:100%;margin-top:12px"
            :loading="saving" :disabled="form.items.length === 0"
            @click="saveSale">
            保存开单
          </el-button>
          <el-button style="width:100%;margin-top:8px" @click="resetForm">清空重填</el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- 开单成功弹窗 -->
    <el-dialog v-model="successDialog" title="开单成功 🎉" width="420px" :close-on-click-modal="false">
      <div style="text-align:center;padding:16px 0">
        <div style="font-size:18px;margin-bottom:8px">单号：<strong>{{ lastSale?.sale_no }}</strong></div>
        <div style="font-size:16px;color:#333">金额：<strong style="color:#f56c6c">¥{{ Number(lastSale?.total_amount || 0).toFixed(2) }}</strong></div>
        <div style="margin-top:8px;color:#666">{{ lastSale?.payment_method }}</div>
      </div>
      <template #footer>
        <el-button @click="printSale">打印送货单</el-button>
        <el-button type="primary" @click="continueNew">继续开单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { productApi, customerApi, saleApi } from '../api'
import { printSaleOrder } from '../utils/print'

const products = ref([])
const customers = ref([])
const saving = ref(false)
const successDialog = ref(false)
const lastSale = ref(null)
const lastSaleDetail = ref(null)

const payMethods = ['现金', '微信', '支付宝', '挂账']

const emptyForm = () => ({
  customer_id: null,
  customer_name: '',
  items: [],
  payment_method: '现金',
  note: ''
})
const form = ref(emptyForm())

const selectedCustomer = computed(() => {
  if (!form.value.customer_id) return null
  return customers.value.find(c => c.id === form.value.customer_id)
})

const totalAmount = computed(() =>
  form.value.items.reduce((s, i) => s + (i.amount || 0), 0)
)

const onCustomerChange = (id) => {
  if (id) form.value.customer_name = ''
}

const addItem = () => {
  form.value.items.push({ product_id: null, product_name: '', spec: '', quantity: 1, unit_price: 0, amount: 0 })
}

const onProductChange = (productId, idx) => {
  const product = products.value.find(p => p.id === productId)
  if (!product) return
  const item = form.value.items[idx]
  item.product_name = product.name
  item.spec = product.spec
  item.unit_price = product.sell_price
  item.amount = parseFloat((item.quantity * item.unit_price).toFixed(2))
}

const calcRow = (row) => {
  row.amount = parseFloat((row.quantity * row.unit_price).toFixed(2))
}

const removeItem = (idx) => {
  form.value.items.splice(idx, 1)
}

const saveSale = async () => {
  if (form.value.items.length === 0) {
    return ElMessage.warning('请添加至少一个商品')
  }
  for (const item of form.value.items) {
    if (!item.product_name) return ElMessage.warning('请选择商品')
    if (!item.quantity || item.quantity <= 0) return ElMessage.warning('数量必须大于0')
  }

  saving.value = true
  try {
    const payload = {
      customer_id: form.value.customer_id,
      customer_name: form.value.customer_id
        ? selectedCustomer.value?.name
        : form.value.customer_name,
      items: form.value.items,
      payment_method: form.value.payment_method,
      note: form.value.note
    }
    const res = await saleApi.create(payload)
    if (res.success) {
      lastSale.value = res.data
      // 获取详情用于打印
      const detail = await saleApi.get(res.data.id)
      lastSaleDetail.value = detail.data
      // 同步客户地址
      if (selectedCustomer.value) {
        lastSaleDetail.value._customer = selectedCustomer.value
      }
      successDialog.value = true
      await loadProducts() // 刷新库存
    }
  } finally {
    saving.value = false
  }
}

const printSale = () => {
  if (lastSaleDetail.value) {
    printSaleOrder(lastSaleDetail.value)
  }
}

const continueNew = () => {
  successDialog.value = false
  resetForm()
}

const resetForm = () => {
  form.value = emptyForm()
}

const loadProducts = async () => {
  const res = await productApi.list()
  products.value = res.data || []
}

onMounted(async () => {
  await loadProducts()
  const res = await customerApi.list()
  customers.value = res.data || []
})
</script>

<style scoped>
.sale-create { }
.section-card { border-radius: 8px; }
.section-title { font-size: 15px; font-weight: 600; }
.empty-tip {
  text-align: center;
  color: #bbb;
  padding: 32px 0;
  font-size: 14px;
}
.checkout-card { position: sticky; top: 0; }
.total-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
.total-label { font-size: 15px; color: #666; }
.total-amount { font-size: 28px; font-weight: 700; color: #f56c6c; }
.debt-tip { margin-bottom: 8px; }
</style>
