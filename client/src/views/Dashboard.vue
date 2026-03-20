<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-label">今日销售额</div>
          <div class="stat-value">¥{{ fmt(data.todaySaleAmount) }}</div>
          <div class="stat-sub">共 {{ data.todaySaleCount }} 笔订单</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">待收款总额</div>
          <div class="stat-value">¥{{ fmt(data.totalDebt) }}</div>
          <div class="stat-sub">客户欠款合计</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" :class="data.alertCount > 0 ? 'red' : 'green'"
          style="cursor:pointer" @click="$router.push('/products')">
          <div class="stat-label">库存预警</div>
          <div class="stat-value">{{ data.alertCount }}</div>
          <div class="stat-sub">种商品库存不足（点击查看）</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple" style="cursor:pointer" @click="$router.push('/sales/create')">
          <div class="stat-label">快速开单</div>
          <div class="stat-value" style="font-size:36px">+</div>
          <div class="stat-sub">点击新建销售单</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <!-- 库存预警 -->
      <el-col :span="10" v-if="data.alertProducts?.length">
        <el-card class="card">
          <template #header>
            <span><el-icon style="color:#f56c6c;vertical-align:middle"><Warning /></el-icon> 库存预警商品</span>
          </template>
          <el-table :data="data.alertProducts" size="small" :show-header="false">
            <el-table-column prop="name" />
            <el-table-column prop="spec" width="160" />
            <el-table-column label="库存" width="80">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.stock }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="预警值" width="70" >
              <template #default="{ row }">
                <span style="color:#999">≤{{ row.alert_stock }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 最近销售 -->
      <el-col :span="data.alertProducts?.length ? 14 : 24">
        <el-card class="card">
          <template #header>
            <span>最近销售单</span>
            <el-button link type="primary" style="float:right" @click="$router.push('/sales')">查看全部</el-button>
          </template>
          <el-table :data="data.recentSales" size="small">
            <el-table-column prop="sale_no" label="单号" width="150" />
            <el-table-column prop="customer_name" label="客户" width="100" />
            <el-table-column prop="total_amount" label="金额">
              <template #default="{ row }">¥{{ fmt(row.total_amount) }}</template>
            </el-table-column>
            <el-table-column prop="payment_method" label="收款方式" />
            <el-table-column label="状态" width="70">
              <template #default="{ row }">
                <el-tag :type="row.status === 'void' ? 'info' : 'success'" size="small">
                  {{ row.status === 'void' ? '已作废' : '有效' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="150" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboardApi } from '../api'

const data = ref({
  todaySaleAmount: 0, todaySaleCount: 0,
  totalDebt: 0, alertCount: 0,
  alertProducts: [], recentSales: []
})

const fmt = (v) => Number(v || 0).toFixed(2)

onMounted(async () => {
  const res = await dashboardApi.get()
  if (res.success) data.value = res.data
})
</script>

<style scoped>
.dashboard { padding: 0; }
.stat-row { }
.stat-card {
  border-radius: 8px;
  padding: 20px;
  color: #fff;
  min-height: 110px;
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-card.blue { background: linear-gradient(135deg, #1677ff, #4096ff); }
.stat-card.orange { background: linear-gradient(135deg, #fa8c16, #ffa940); }
.stat-card.red { background: linear-gradient(135deg, #f5222d, #ff4d4f); }
.stat-card.green { background: linear-gradient(135deg, #52c41a, #73d13d); }
.stat-card.purple { background: linear-gradient(135deg, #722ed1, #9254de); }
.stat-label { font-size: 14px; opacity: 0.85; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.stat-sub { font-size: 12px; opacity: 0.75; }
.card { border-radius: 8px; }
</style>
