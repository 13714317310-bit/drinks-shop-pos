<template>
  <el-row :gutter="16">
    <!-- 左侧：客户欠款列表 -->
    <el-col :span="9">
      <el-card>
        <template #header><span>客户欠款</span></template>
        <el-input v-model="search" placeholder="搜索客户" clearable style="margin-bottom:12px"
          prefix-icon="Search" />
        <div class="customer-list">
          <div v-for="c in filteredCustomers" :key="c.id"
            class="customer-item" :class="{ active: selectedId === c.id }"
            @click="selectCustomer(c)">
            <div class="c-name">{{ c.name }}</div>
            <div class="c-info">{{ c.phone }}</div>
            <div class="c-debt" :class="c.debt > 0 ? 'has-debt' : 'no-debt'">
              {{ c.debt > 0 ? `欠款 ¥${Number(c.debt).toFixed(2)}` : '无欠款' }}
            </div>
          </div>
          <div v-if="filteredCustomers.length === 0" class="empty-tip">暂无客户</div>
        </div>
      </el-card>
    </el-col>

    <!-- 右侧：欠款明细 + 收款 -->
    <el-col :span="15">
      <template v-if="selectedCustomer">
        <!-- 客户信息 -->
        <el-card style="margin-bottom:12px">
          <div class="cust-header">
            <div>
              <span style="font-size:18px;font-weight:600">{{ selectedCustomer.name }}</span>
              <span style="margin-left:12px;color:#666">{{ selectedCustomer.phone }}</span>
            </div>
            <div>
              <span style="font-size:16px;color:#f56c6c;font-weight:700">
                待收款合计：¥{{ Number(selectedCustomer.debt || 0).toFixed(2) }}
              </span>
              <el-button type="primary" style="margin-left:16px" @click="openPayDialog(null)">
                一键收款
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 欠款明细 -->
        <el-card style="margin-bottom:12px">
          <template #header><span>欠款明细（逐单）</span></template>
          <el-table :data="debts" border size="small" v-loading="debtLoading">
            <el-table-column prop="sale_no" label="销售单号" width="160" />
            <el-table-column prop="created_at" label="开单时间" width="140" />
            <el-table-column prop="total_amount" label="单据金额" width="100" align="right">
              <template #default="{ row }">¥{{ Number(row.total_amount).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="paid_amount" label="已收" width="90" align="right">
              <template #default="{ row }">¥{{ Number(row.paid_amount).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="debt_amount" label="待收" width="90" align="right">
              <template #default="{ row }">
                <span style="color:#f56c6c;font-weight:600">¥{{ Number(row.debt_amount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="openPayDialog(row)">收款</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 收款历史 -->
        <el-card>
          <template #header><span>收款历史</span></template>
          <el-table :data="history" border size="small" v-loading="histLoading">
            <el-table-column prop="created_at" label="收款时间" width="150" />
            <el-table-column prop="amount" label="金额" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#52c41a;font-weight:600">+¥{{ Number(row.amount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="payment_method" label="方式" width="80" />
            <el-table-column prop="sale_no" label="对应单号" />
            <el-table-column prop="note" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>
      </template>

      <el-empty v-else description="← 选择左侧客户查看欠款详情" style="margin-top:60px" />
    </el-col>
  </el-row>

  <!-- 收款弹窗 -->
  <el-dialog v-model="payDialog" title="收款" width="440px">
    <el-form :model="payForm" :rules="payRules" ref="payFormRef" label-width="90px">
      <el-form-item label="客户">
        <span style="font-weight:600">{{ selectedCustomer?.name }}</span>
        <span style="margin-left:8px;color:#f56c6c" v-if="payForm.sale_no">
          （单号: {{ payForm.sale_no }}）
        </span>
      </el-form-item>
      <el-form-item label="待收金额" v-if="payForm.debt_amount">
        <span style="color:#f56c6c;font-weight:600">¥{{ Number(payForm.debt_amount).toFixed(2) }}</span>
      </el-form-item>
      <el-form-item label="收款金额" prop="amount">
        <el-input-number v-model="payForm.amount" :min="0.01" :precision="2"
          style="width:100%" :max="payForm.debt_amount || 999999" />
      </el-form-item>
      <el-form-item label="收款方式">
        <el-radio-group v-model="payForm.payment_method">
          <el-radio-button v-for="m in ['现金','微信','支付宝']" :key="m" :label="m">{{ m }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="payForm.note" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="payDialog = false">取消</el-button>
      <el-button type="primary" :loading="paying" @click="confirmPay">确认收款</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { customerApi, paymentApi } from '../api'
import { printReceipt } from '../utils/print'

const route = useRoute()
const customers = ref([])
const search = ref('')
const selectedId = ref(null)
const selectedCustomer = ref(null)
const debts = ref([])
const history = ref([])
const debtLoading = ref(false)
const histLoading = ref(false)

const payDialog = ref(false)
const paying = ref(false)
const payFormRef = ref()
const payForm = ref({ amount: 0, payment_method: '现金', note: '', sale_id: null, sale_no: '', debt_amount: 0 })
const payRules = { amount: [{ required: true, message: '请输入金额' }] }

const filteredCustomers = computed(() => {
  if (!search.value) return customers.value
  return customers.value.filter(c =>
    c.name.includes(search.value) || (c.phone && c.phone.includes(search.value))
  )
})

const loadCustomers = async () => {
  const res = await customerApi.list()
  customers.value = res.data || []
}

const selectCustomer = async (c) => {
  selectedId.value = c.id
  selectedCustomer.value = c
  await loadDebt(c.id)
  await loadHistory(c.id)
}

const loadDebt = async (id) => {
  debtLoading.value = true
  const res = await paymentApi.debts(id)
  debts.value = res.data || []
  debtLoading.value = false
}

const loadHistory = async (id) => {
  histLoading.value = true
  const res = await paymentApi.history(id)
  history.value = res.data || []
  histLoading.value = false
}

const openPayDialog = (debtRow) => {
  if (debtRow) {
    payForm.value = {
      amount: Number(debtRow.debt_amount),
      payment_method: '现金',
      note: '',
      sale_id: debtRow.id,
      sale_no: debtRow.sale_no,
      debt_amount: debtRow.debt_amount
    }
  } else {
    const totalDebt = debts.value.reduce((s, d) => s + d.debt_amount, 0)
    payForm.value = {
      amount: Number(totalDebt.toFixed(2)),
      payment_method: '现金',
      note: '',
      sale_id: null,
      sale_no: '',
      debt_amount: totalDebt
    }
  }
  payDialog.value = true
  payFormRef.value?.clearValidate()
}

const confirmPay = async () => {
  await payFormRef.value.validate()
  paying.value = true
  try {
    const payload = {
      customer_id: selectedCustomer.value.id,
      customer_name: selectedCustomer.value.name,
      sale_id: payForm.value.sale_id,
      sale_no: payForm.value.sale_no,
      amount: payForm.value.amount,
      payment_method: payForm.value.payment_method,
      note: payForm.value.note
    }
    const res = await paymentApi.create(payload)
    if (res.success) {
      ElMessage.success('收款成功')
      payDialog.value = false
      // 打印收据
      printReceipt({ ...payload, ...res.data, customer_name: selectedCustomer.value.name })
      // 刷新
      await loadCustomers()
      selectedCustomer.value = customers.value.find(c => c.id === selectedId.value)
      await loadDebt(selectedId.value)
      await loadHistory(selectedId.value)
    }
  } finally {
    paying.value = false
  }
}

onMounted(async () => {
  await loadCustomers()
  // 支持从客户页跳转过来
  const cid = route.query.customer_id
  if (cid) {
    const c = customers.value.find(c => c.id == cid)
    if (c) await selectCustomer(c)
  }
})
</script>

<style scoped>
.customer-list { max-height: calc(100vh - 220px); overflow-y: auto; }
.customer-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.customer-item:hover { background: #f0f7ff; }
.customer-item.active { background: #e6f4ff; border-color: #1677ff; }
.c-name { font-weight: 600; font-size: 15px; }
.c-info { font-size: 12px; color: #999; margin: 2px 0; }
.c-debt { font-size: 13px; }
.has-debt { color: #f56c6c; font-weight: 600; }
.no-debt { color: #52c41a; }
.cust-header {
  display: flex; justify-content: space-between; align-items: center;
}
.empty-tip { text-align: center; color: #bbb; padding: 24px 0; }
</style>
