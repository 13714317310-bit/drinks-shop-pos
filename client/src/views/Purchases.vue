<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>进货记录</span>
        <el-button type="primary" :icon="Plus" @click="openDialog">新增进货</el-button>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="product_name" label="商品名称" min-width="140" />
      <el-table-column prop="spec" label="规格" min-width="160" />
      <el-table-column prop="quantity" label="数量" width="90" align="center" />
      <el-table-column prop="buy_price" label="进价" width="100" align="right">
        <template #default="{ row }">¥{{ Number(row.buy_price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="total_amount" label="总金额" width="110" align="right">
        <template #default="{ row }">¥{{ Number(row.total_amount).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="supplier" label="供应商" width="130" />
      <el-table-column prop="note" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column prop="created_at" label="进货时间" width="160" />
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-popconfirm title="仅删除记录，不回滚库存" @confirm="remove(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
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

  <!-- 新增进货弹窗 -->
  <el-dialog v-model="dialogVisible" title="新增进货" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item label="商品" prop="product_id">
        <el-select v-model="form.product_id" filterable placeholder="选择商品"
          style="width:100%" @change="onProductChange">
          <el-option v-for="p in products" :key="p.id"
            :label="`${p.name} (库存:${p.stock})`" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="规格">
        <el-input v-model="form.spec" placeholder="规格（自动填入）" />
      </el-form-item>
      <el-form-item label="进货数量" prop="quantity">
        <el-input-number v-model="form.quantity" :min="1" style="width:100%" />
      </el-form-item>
      <el-form-item label="进货单价">
        <el-input-number v-model="form.buy_price" :min="0" :precision="2" style="width:100%" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-input v-model="form.supplier" placeholder="如：康师傅经销商" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.note" />
      </el-form-item>
      <el-form-item label="本次总额">
        <span style="font-size:18px;font-weight:700;color:#f56c6c">
          ¥{{ (form.quantity * form.buy_price).toFixed(2) }}
        </span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { purchaseApi, productApi } from '../api'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const products = ref([])

const emptyForm = () => ({ product_id: null, product_name: '', spec: '', quantity: 1, buy_price: 0, supplier: '', note: '' })
const form = ref(emptyForm())

const rules = {
  product_id: [{ required: true, message: '请选择商品' }],
  quantity: [{ required: true, message: '请填写数量' }]
}

const load = async () => {
  loading.value = true
  const res = await purchaseApi.list({ page: page.value, pageSize })
  list.value = res.data || []
  total.value = res.total || 0
  loading.value = false
}

const openDialog = () => {
  form.value = emptyForm()
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

const onProductChange = (id) => {
  const p = products.value.find(p => p.id === id)
  if (p) {
    form.value.product_name = p.name
    form.value.spec = p.spec
    form.value.buy_price = p.buy_price
  }
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await purchaseApi.create(form.value)
    ElMessage.success('进货成功，库存已更新')
    dialogVisible.value = false
    await load()
    // 刷新商品库存
    const res = await productApi.list()
    products.value = res.data || []
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  await purchaseApi.remove(id)
  ElMessage.success('已删除')
  await load()
}

onMounted(async () => {
  await load()
  const res = await productApi.list()
  products.value = res.data || []
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
