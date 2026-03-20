<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>客户管理</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增客户</el-button>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="name" label="客户姓名" min-width="120" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="debt" label="欠款金额" width="120" align="right">
        <template #default="{ row }">
          <span :style="row.debt > 0 ? 'color:#f56c6c;font-weight:600' : 'color:#52c41a'">
            ¥{{ Number(row.debt || 0).toFixed(2) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="添加时间" width="160" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/payments?customer_id=${row.id}`)">收款</el-button>
          <el-divider direction="vertical" />
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-popconfirm title="确认删除该客户？" @confirm="remove(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑客户' : '新增客户'" width="460px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="客户姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入客户姓名" />
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入送货地址" />
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
import { customerApi } from '../api'

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()

const emptyForm = () => ({ id: null, name: '', phone: '', address: '' })
const form = ref(emptyForm())
const rules = { name: [{ required: true, message: '请输入客户姓名' }] }

const load = async () => {
  loading.value = true
  const res = await customerApi.list()
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
      await customerApi.update(form.value.id, form.value)
    } else {
      await customerApi.create(form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  try {
    await customerApi.remove(id)
    ElMessage.success('删除成功')
    await load()
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
