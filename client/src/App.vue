<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1 class="logo">
          <el-icon><ShoppingCart /></el-icon>
          全平台订单管理系统
        </h1>
        <div class="header-right">
          <el-tag type="primary">{{ stats.total }} 条订单</el-tag>
          <el-tag type="success">{{ stats.saleCount }} 销售单</el-tag>
          <el-tag type="warning">{{ stats.leaseCount }} 租赁单</el-tag>
        </div>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getOrderStats } from '@/api/order'

const stats = ref({
  total: 0,
  saleCount: 0,
  leaseCount: 0
})

const fetchStats = async () => {
  try {
    const res = await getOrderStats()
    stats.value = res
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo .el-icon {
  font-size: 28px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
}
</style>
