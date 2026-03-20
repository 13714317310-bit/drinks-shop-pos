<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>销售记录</span>
        <el-button type="primary" :icon="Plus" @click="$router.push('/sales/create')">新建销售单</el-button>
      </div>
    </template>

    <!-- 筛选 -->
    <el-row :gutter="12" style="margin-bottom:12px">
      <el-col :span="5">
        <el-select v-model="filter.status" clearable placeholder="全部状态" @change="load">
          <el-option label="有效" value="active" />
          <el-option label="已作废" value="void" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select v-model="filter.customer_id" clearable filterable placeholder="筛选客户" @change="load">
          <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-col>
    </el-row>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="sale_no" label="单号" width="160" />
      <el-table-column prop="customer_name" label="客户" width="120" />
      <el-table-column prop="total_amount" label="总金额" width="110" align="right">
        <template #default="{ row }">¥{{ Number(row.total_amount).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="已收/欠款" width="130" align="right">
        <template #default="{ row }">
          <span v-if="row.status !== 'void'">
            <span style="color:#52c41a">¥{{ Number(row.paid_amount).toFixed(2) }}</span>
            <span v-if="row.total_amount > row.paid_amount" style="color:#f56c6c">
              / 欠¥{{ (row.total_amount - row.paid_amount).toFixed(2) }}
            </span>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="payment_method" label="收款方式" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="payTagType(row.payment_method)">{{ row.payment_method }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'void' ? 'info' : 'success'" size="small">
            {{ row.status === 'void' ? '已作废' : '有效' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="开单时间" width="160" />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row.id)">详情</el-button>
          <el-divider direction="vertical" />
          <el-button link type="primary" @click="printRow(row.id)">打印</el-button>
          <el-divider direction="vertical" v-if="row.status !== 'void'" />
          <el-popconfirm v-if="row.status !== 'void'" title="作废后库存将自动回补，确认作废？"
            @confirm="voidSale(row.id)" width="240">
            <template #reference>
              <el-button link type="danger">作废</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px;text-align:right">
      <el-pagination v-model:current-page="page" :page-size="pageSize"
        :total="total" layout="total, prev, pager, next" @current-change="load" />
    </div>
  </el-card>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailDialog" title="销售单详情" width="680px">
    <template v-if="detail">
      <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
        <el-descriptions-item label="单号">{{ detail.sale_no }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ detail.customer_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ detail.customer_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开单时间">{{ detail.created_at }}</el-descriptions-item>
        <el-descriptions-item label="收款方式">{{ detail.payment_method }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.note || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.items" border size="small">
        <el-table-column prop="product_name" label="商品" />
        <el-table-column prop="spec" label="规格" />
        <el-table-column prop="quantity" label="数量" width="70" align="center" />
        <el-table-column prop="unit_price" label="单价" width="90" align="right">
          <template #default="{ row }">¥{{ Number(row.unit_price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100" align="right">
          <template #default="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <div style="text-align:right;margin-top:12px;font-size:16px;font-weight:600">
        合计：¥{{ Number(detail.total_amount).toFixed(2) }}
      </div>
    </template>
    <template #footer>
      <el-button @click="printDetail">打印送货单</el-button>
      <el-button type="primary" @click="detailDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { saleApi, customerApi } from '../api'
import { printSaleOrder } from '../utils/print'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filter = ref({ status: '', customer_id: '' })
const customers = ref([])
const detailDialog = ref(false)
const detail = ref(null)

const payTagType = (m) => ({ '现金': '', '微信': 'success', '支付宝': 'primary', '挂账': 'danger' }[m] || '')

const load = async () => {
  loading.value = true
  const params = { page: page.value, pageSize }
  if (filter.value.status) params.status = filter.value.status
  if (filter.value.customer_id) params.customer_id = filter.value.customer_id
  const res = await saleApi.list(params)
  list.value = res.data || []
  total.value = res.total || 0
  loading.value = false
}

const voidSale = async (id) => {
  await saleApi.void(id)
  ElMessage.success('已作废，库存已回补')
  await load()
}

const viewDetail = async (id) => {
  const res = await saleApi.get(id)
  detail.value = res.data
  detailDialog.value = true
}

const printRow = async (id) => {
  const res = await saleApi.get(id)
  if (res.data) printSaleOrder(res.data)
}

const printDetail = () => {
  if (detail.value) printSaleOrder(detail.value)
}

onMounted(async () => {
  await load()
  const res = await customerApi.list()
  customers.value = res.data || []
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
