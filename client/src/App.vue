<template>
  <el-container class="app-layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapse ? '64px' : '200px'" class="aside">
      <div class="logo" @click="collapse = !collapse">
        <span class="logo-icon">🧃</span>
        <span v-if="!collapse" class="logo-text">饮料小店</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapse"
        :collapse-transition="false"
        router
        background-color="#001529"
        text-color="#ffffffa0"
        active-text-color="#ffffff"
        class="side-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/sales/create">
          <el-icon><DocumentAdd /></el-icon>
          <template #title>开单</template>
        </el-menu-item>
        <el-menu-item index="/sales">
          <el-icon><List /></el-icon>
          <template #title>销售记录</template>
        </el-menu-item>
        <el-menu-item index="/payments">
          <el-icon><Money /></el-icon>
          <template #title>欠款收款</template>
        </el-menu-item>
        <el-menu-item index="/purchases">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>进货记录</template>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <template #title>商品管理</template>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <template #title>客户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <el-header class="header">
        <span class="page-title">{{ pageTitle }}</span>
        <span class="header-date">{{ currentDate }}</span>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <keep-alive include="SaleList,Products,Customers,Purchases">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const collapse = ref(false)
const route = useRoute()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta?.title || '进销存管理')

const currentDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${'日一二三四五六'[d.getDay()]}`
})
</script>

<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; }
</style>

<style scoped>
.app-layout { height: 100vh; }
.aside {
  background: #001529;
  transition: width 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  cursor: pointer;
  border-bottom: 1px solid #ffffff15;
  flex-shrink: 0;
}
.logo-icon { font-size: 24px; flex-shrink: 0; }
.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-left: 10px;
  white-space: nowrap;
}
.side-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}
:deep(.el-menu-item.is-active) {
  background-color: #1677ff !important;
}
:deep(.el-menu-item:hover) {
  background-color: #ffffff15 !important;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.page-title { font-size: 16px; font-weight: 600; color: #333; }
.header-date { font-size: 13px; color: #999; }
.main {
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
