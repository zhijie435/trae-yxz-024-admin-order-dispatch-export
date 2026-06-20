<template>
  <div class="page-container">
    <div class="detail-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
        <div class="title-block">
          <h1>
            订单详情
            <span v-if="order.id" :class="['order-type-tag', order.type]">
              {{ order.type === 'lease' ? '租赁单' : '销售单' }}
            </span>
          </h1>
          <div class="order-no">订单编号：{{ order.orderNo || '加载中...' }}</div>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="success" :icon="Download" :loading="exporting" @click="handleExport">
          导出详情
        </el-button>
        <el-button :icon="Refresh" @click="loadDetail">刷新</el-button>
      </div>
    </div>

    <el-row v-if="order.id" :gutter="16">
      <el-col :span="16">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-title">
              <el-icon><Document /></el-icon>
              <span>订单基础信息</span>
              <el-tag
                :color="getStatusColor(order)"
                effect="dark"
                size="small"
                style="border: none; margin-left: 8px"
              >
                {{ getStatusText(order) }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="订单编号">
              <strong style="color: #1890ff">{{ order.orderNo }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="订单类型">
              <span :class="['order-type-tag', order.type]">
                {{ order.type === 'lease' ? '租赁单' : '销售单' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :color="getStatusColor(order)" effect="dark" style="border: none">
                {{ getStatusText(order) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="来源平台">
              {{ constants.platforms[order.platform] || order.platform }}
            </el-descriptions-item>
            <el-descriptions-item label="来源渠道">
              {{ order.sourceChannel || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              {{ constants.paymentMethods[order.paymentMethod] || order.paymentMethod }}
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">
              {{ formatDate(order.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ order.paymentTime ? formatDate(order.paymentTime) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDate(order.updateTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="指派人员">
              <el-tag
                v-if="order.assignee && order.assignee !== '未指派'"
                type="primary"
                effect="light"
              >
                <el-icon><UserFilled /></el-icon>
                {{ order.assignee }}
              </el-tag>
              <el-tag v-else type="info" effect="plain">未指派</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="指派阶段">
              <el-tag
                v-if="order.assignStage"
                :color="ASSIGN_STAGE_COLORS[order.assignStage]"
                effect="dark"
                size="small"
                style="border: none"
              >
                {{ ASSIGN_STAGE_LABELS[order.assignStage] }}
              </el-tag>
              <span v-else style="color: #ccc">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="指派金额">
              <span v-if="order.assignAmount !== undefined" style="color: #f5222d; font-weight: 500">
                ¥{{ formatMoney(order.assignAmount) }}
              </span>
              <span v-else style="color: #ccc">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="是否总部兜底">
              <el-tag v-if="order.isHqTakeover" type="warning" effect="dark" size="small" style="border: none">
                是
              </el-tag>
              <span v-else style="color: #999">否</span>
            </el-descriptions-item>
            <el-descriptions-item label="拒单原因" :span="2">
              <span v-if="order.rejectReason" style="color: #f5222d">{{ order.rejectReason }}</span>
              <span v-else style="color: #ccc">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ order.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-title">
              <el-icon><User /></el-icon>
              <span>用户信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户姓名">
              <strong>{{ order.customer.name }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              <el-link :href="`tel:${order.customer.phone}`" type="primary">
                <el-icon><Phone /></el-icon>
                {{ order.customer.phone }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="电子邮箱">
              {{ order.customer.email || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="客户编号">
              {{ order.customer.id }}
            </el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">
              <el-icon><Location /></el-icon>
              {{ order.customer.address }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-title">
              <el-icon><Goods /></el-icon>
              <span>商品明细</span>
              <span class="title-extra">共 {{ order.products.length }} 件商品</span>
            </div>
          </template>
          <el-table :data="order.products" border stripe>
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="商品图片" width="80" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="row.imageUrl"
                  :src="row.imageUrl"
                  style="width: 50px; height: 50px"
                  fit="cover"
                />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" min-width="180" />
            <el-table-column prop="sku" label="SKU编码" width="160" />
            <el-table-column label="单价(元)" width="130" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column label="小计(元)" width="140" align="right">
              <template #default="{ row }">
                <strong style="color: #f5222d">¥{{ formatMoney(row.totalPrice) }}</strong>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="section-card amount-card">
          <template #header>
            <div class="card-title">
              <el-icon><Wallet /></el-icon>
              <span>金额信息</span>
            </div>
          </template>
          <div class="amount-list">
            <div class="amount-row">
              <span class="label">订单总额</span>
              <span class="value">¥{{ formatMoney(order.totalAmount) }}</span>
            </div>
            <div class="amount-row">
              <span class="label">优惠金额</span>
              <span class="value discount">-¥{{ formatMoney(order.discountAmount) }}</span>
            </div>
            <el-divider style="margin: 12px 0" />
            <div class="amount-row total">
              <span class="label">实付金额</span>
              <span class="value paid">¥{{ formatMoney(order.paidAmount) }}</span>
            </div>
            <template v-if="order.assignAmount !== undefined">
              <el-divider style="margin: 12px 0" />
              <div class="amount-row">
                <span class="label">指派金额</span>
                <span class="value" style="color: #fa8c16; font-weight: 500">
                  ¥{{ formatMoney(order.assignAmount) }}
                </span>
              </div>
            </template>
          </div>

          <template v-if="order.type === 'lease' && order.leaseInfo">
            <el-divider content-position="left">租赁信息</el-divider>
            <div class="lease-detail">
              <div class="amount-row">
                <span class="label">租赁状态</span>
                <el-tag
                  :color="LEASE_STATUS_COLORS[order.leaseInfo.leaseStatus]"
                  effect="dark"
                  size="small"
                  style="border: none"
                >
                  {{ constants.leaseStatuses[order.leaseInfo.leaseStatus] }}
                </el-tag>
              </div>
              <div class="amount-row">
                <span class="label">租期</span>
                <span class="value">
                  {{ order.leaseInfo.leasePeriod }}
                  {{ order.leaseInfo.leaseUnit === 'day' ? '天' : order.leaseInfo.leaseUnit === 'month' ? '个月' : '年' }}
                </span>
              </div>
              <div class="amount-row">
                <span class="label">起止日期</span>
                <span class="value small">
                  {{ order.leaseInfo.startDate }}<br />至 {{ order.leaseInfo.endDate }}
                </span>
              </div>
              <div class="amount-row">
                <span class="label">月租金</span>
                <span class="value">¥{{ formatMoney(order.leaseInfo.monthlyRent) }}</span>
              </div>
              <div class="amount-row">
                <span class="label">押金</span>
                <span class="value">¥{{ formatMoney(order.leaseInfo.deposit) }}</span>
              </div>
              <div class="amount-row">
                <span class="label">物损押金</span>
                <span class="value">¥{{ formatMoney(order.leaseInfo.damageDeposit) }}</span>
              </div>
            </div>
          </template>
        </el-card>

        <el-card shadow="hover" class="section-card status-card">
          <template #header>
            <div class="card-title">
              <el-icon><Clock /></el-icon>
              <span>状态时间线</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in statusTimeline"
              :key="log.id"
              :timestamp="formatDate(log.operateTime)"
              placement="top"
              :color="OPERATION_TYPE_COLORS[log.operationType]"
            >
              <div class="timeline-content">
                <div class="timeline-title">
                  <el-tag
                    :color="OPERATION_TYPE_COLORS[log.operationType]"
                    effect="dark"
                    size="small"
                    style="border: none"
                  >
                    {{ log.operationName }}
                  </el-tag>
                  <span class="timeline-operator">{{ log.operator }}（{{ log.operatorRole }}）</span>
                </div>
                <div v-if="log.remark" class="timeline-remark">{{ log.remark }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-if="loading" shadow="never" class="section-card loading-card">
      <el-skeleton :rows="8" animated />
    </el-card>

    <el-card v-if="order.id" shadow="hover" class="section-card">
      <template #header>
        <div class="card-title">
          <el-icon><List /></el-icon>
          <span>操作日志</span>
          <span class="title-extra">共 {{ logs.length }} 条记录</span>
          <el-button
            link
            type="primary"
            :icon="Download"
            :loading="exporting"
            style="margin-left: auto"
            @click="handleExport"
          >
            导出详情
          </el-button>
        </div>
      </template>
      <el-table :data="logs" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="操作类型" width="130">
          <template #default="{ row }">
            <el-tag
              :color="OPERATION_TYPE_COLORS[row.operationType]"
              effect="dark"
              size="small"
              style="border: none"
            >
              {{ row.operationName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            <div>
              <div style="font-weight: 500">{{ row.operator }}</div>
              <div style="font-size: 12px; color: #999">{{ row.operatorRole }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="180">
          <template #default="{ row }">{{ formatDate(row.operateTime) }}</template>
        </el-table-column>
        <el-table-column label="变更前" width="140">
          <template #default="{ row }">
            <span v-if="row.beforeValue" class="change-value before">{{ row.beforeValue }}</span>
            <span v-else style="color: #ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="变更后" width="140">
          <template #default="{ row }">
            <span v-if="row.afterValue" class="change-value after">{{ row.afterValue }}</span>
            <span v-else style="color: #ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  Download,
  Refresh,
  Document,
  User,
  Phone,
  Location,
  Goods,
  Wallet,
  Clock,
  List,
  UserFilled
} from '@element-plus/icons-vue';
import { orderApi } from '../api/order';
import type {
  Order,
  OperationLog,
  ConstantsData,
  OperationType
} from '../types/order';
import {
  ORDER_STATUS_COLORS,
  LEASE_STATUS_COLORS,
  OPERATION_TYPE_COLORS,
  ASSIGN_STAGE_LABELS,
  ASSIGN_STAGE_COLORS
} from '../types/order';

const route = useRoute();
const router = useRouter();

const orderId = computed(() => route.params.id as string);

const order = ref<Order>({} as Order);
const logs = ref<OperationLog[]>([]);
const constants = ref<ConstantsData>({
  orderTypes: {},
  orderStatuses: {},
  leaseStatuses: {},
  platforms: {},
  paymentMethods: {},
  assignees: [],
  sourceChannels: []
});
const loading = ref(true);
const exporting = ref(false);

const statusTimeline = computed(() => {
  const timelineTypes: OperationType[] = [
    'create',
    'pay',
    'assign',
    'reassign',
    'store_reject',
    'hq_takeover',
    'hq_transfer',
    'hq_cancel',
    'process',
    'ship',
    'deliver',
    'complete',
    'cancel',
    'refund',
    'lease_start',
    'lease_return',
    'lease_overdue'
  ];
  return logs.value.filter(l => timelineTypes.includes(l.operationType));
});

async function loadConstants() {
  try {
    const res = await orderApi.getConstants();
    if (res.code === 0) {
      constants.value = res.data;
    }
  } catch (error) {
    console.error('加载常量失败:', error);
  }
}

async function loadDetail() {
  if (!orderId.value) {
    ElMessage.error('订单ID不存在');
    return;
  }
  loading.value = true;
  try {
    const res = await orderApi.getDetailWithLogs(orderId.value);
    if (res.code === 0) {
      order.value = res.data.order;
      logs.value = res.data.logs;
    } else {
      ElMessage.error(res.message || '加载订单详情失败');
    }
  } catch (error) {
    console.error('加载订单详情失败:', error);
    ElMessage.error('加载订单详情失败，请重试');
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/orders');
}

async function handleExport() {
  if (!orderId.value) return;
  exporting.value = true;
  try {
    ElMessage.info('正在导出订单详情，请稍候...');
    const blob = await orderApi.exportOrderDetail(orderId.value);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    const orderNo = order.value.orderNo || orderId.value;
    link.setAttribute('download', `订单详情_${orderNo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
  } finally {
    exporting.value = false;
  }
}

function formatMoney(value: number): string {
  if (value === undefined || value === null) return '0.00';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getStatusText(o: Order): string {
  if (o.type === 'lease' && o.leaseInfo) {
    return constants.value.leaseStatuses[o.leaseInfo.leaseStatus] || '';
  }
  return constants.value.orderStatuses[o.status] || '';
}

function getStatusColor(o: Order): string {
  if (o.type === 'lease' && o.leaseInfo) {
    return LEASE_STATUS_COLORS[o.leaseInfo.leaseStatus] || '#999';
  }
  return ORDER_STATUS_COLORS[o.status] || '#999';
}

onMounted(() => {
  loadConstants();
  loadDetail();
});
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-block h1 {
  font-size: 22px;
  color: #1f1f1f;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-no {
  color: #666;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.section-card {
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f1f1f;
}

.title-extra {
  margin-left: 8px;
  font-size: 13px;
  color: #999;
  font-weight: normal;
}

.order-type-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.order-type-tag.lease {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.order-type-tag.sale {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.amount-card .amount-list {
  padding: 4px 0;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.amount-row .label {
  color: #666;
  font-size: 14px;
}

.amount-row .value {
  font-weight: 500;
  color: #333;
}

.amount-row .value.discount {
  color: #fa8c16;
}

.amount-row.total .label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.amount-row.total .value.paid {
  font-size: 22px;
  font-weight: 700;
  color: #f5222d;
}

.amount-row .value.small {
  font-size: 12px;
  text-align: right;
}

.lease-detail {
  padding-top: 4px;
}

.timeline-content {
  padding-bottom: 4px;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeline-operator {
  font-size: 13px;
  color: #666;
}

.timeline-remark {
  font-size: 13px;
  color: #999;
  line-height: 1.6;
}

.change-value.before {
  color: #8c8c8c;
  text-decoration: line-through;
}

.change-value.after {
  color: #1890ff;
  font-weight: 500;
}
</style>
