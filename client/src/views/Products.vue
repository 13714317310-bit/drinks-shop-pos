<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>商品管理</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增商品</el-button>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" border row-key="id"
      :row-class-name="rowClass">
      <el-table-column prop="name" label="商品名称" min-width="140" />
      <el-table-column prop="spec" label="规格" min-width="180" />
      <el-table-column prop="unit" label="单位" width="70" align="center" />
      <el-table-column prop="buy_price" label="进价" width="90" align="right">
        <template #default="{ row }">¥{{ row.buy_price.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="sell_price" label="售价" width="90" align="right">
        <template #default="{ row }">¥{{ row.sell_price.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="90" align="center">
        <template #default="{ row }">
          <span :style="row.stock <= row.alert_stock ? 'color:#f56c6c;font-weight:600' : ''">
            {{ row.stock }}
          </span>
          <el-tag v-if="row.stock <= row.alert_stock" type="danger" size="small" style="margin-left:4px">低</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="alert_stock" label="预警值" width="80" align="center" />
      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-popconfirm title="确认删除该商品？" @confirm="remove(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 新增/编辑弹窗 -->
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="form.name" placeholder="如：可口可乐" />
      </el-form-item>
      <el-form-item label="规格">
        <el-input v-model="form.spec" placeholder="如：330ml/罐 × 24罐/箱" />
      </el-form-item>
      <el-form-item label="单位">
        <el-select v-model="form.unit" style="width:100%">
          <el-option v-for="u in units" :key="u" :label="u" :value="u" />
        </el-select>
      </el-form-item>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="进价">
            <el-input-number v-model="form.buy_price" :min="0" :precision="2" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="售价">
            <el-input-number v-model="form.sell_price" :min="0" :precision="2" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="当前库存">
            <el-input-number v-model="form.stock" :min="0" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预警值">
            <el-input-number v-model="form.alert_stock" :min="0" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>
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
import { productApi } from '../api'

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const units = ['箱', '瓶', '罐', '桶', '包', '件']

const emptyForm = () => ({ id: null, name: '', spec: '', unit: '箱', buy_price: 0, sell_price: 0, stock: 0, alert_stock: 10 })
const form = ref(emptyForm())

const rules = { name: [{ required: true, message: '请输入商品名称' }] }

const rowClass = ({ row }) => row.stock <= row.alert_stock ? 'alert-row' : ''

const load = async () => {
  loading.value = true
  const res = await productApi.list()
  list.value = res.data || []
  loading.value = false
}

const openDialog = (row = null) => {
  form.value = row ? { ...row } : emptyForm()
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.value.id) {
      await productApi.update(form.value.id, form.value)
    } else {
      await productApi.create(form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  await productApi.remove(id)
  ElMessage.success('删除成功')
  await load()
}

onMounted(load)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
:deep(.alert-row td) { background: #fff2f0 !important; }
</style>
