<template>
  <div class="page-container">
    <div class="page-header">
      <h1>订单管理中心</h1>
      <div class="sub-title">全平台订单统一管理，支持多维度筛选、指派与批量导出</div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="4">
        <div class="stat-card">
          <el-icon :size="32" color="#1890ff"><DataLine /></el-icon>
          <div class="stat-value" style="color: #1890ff">{{ statistics.total }}</div>
          <div class="stat-label">订单总数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <el-icon :size="32" color="#52c41a"><Goods /></el-icon>
          <div class="stat-value" style="color: #52c41a">{{ statistics.saleCount }}</div>
          <div class="stat-label">销售单</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <el-icon :size="32" color="#722ed1"><Clock /></el-icon>
          <div class="stat-value" style="color: #722ed1">{{ statistics.leaseCount }}</div>
          <div class="stat-label">租赁单</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <el-icon :size="32" color="#fa8c16"><Wallet /></el-icon>
          <div class="stat-value" style="color: #fa8c16">¥{{ formatMoney(statistics.totalAmount) }}</div>
          <div class="stat-label">交易总额</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <el-icon :size="32" color="#f5222d"><User /></el-icon>
          <div class="stat-value" style="color: #f5222d">{{ statistics.unassigned }}</div>
          <div class="stat-label">待指派订单</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <el-icon :size="32" color="#13c2c2"><List /></el-icon>
          <div class="stat-value" style="color: #13c2c2">{{ total }}</div>
          <div class="stat-label">当前筛选结果</div>
        </div>
      </el-col>
    </el-row>

    <div class="card filter-card">
      <el-form :model="filterForm" label-width="90px" size="default">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="关键词">
              <el-input
                v-model="filterForm.keyword"
                placeholder="订单号/客户姓名/电话/商品名称/SKU"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="订单类型">
              <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 100%">
                <el-option label="全部" value="all" />
                <el-option label="租赁单" value="lease" />
                <el-option label="销售单" value="sale" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="订单状态">
              <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 100%">
                <el-option label="全部" value="all" />
                <el-option
                  v-for="(label, key) in constants.orderStatuses"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="租赁状态">
              <el-select v-model="filterForm.leaseStatus" placeholder="全部" clearable style="width: 100%">
                <el-option label="全部" value="all" />
                <el-option
                  v-for="(label, key) in constants.leaseStatuses"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="来源平台">
              <el-select v-model="filterForm.platform" placeholder="全部" clearable style="width: 100%">
                <el-option label="全部" value="all" />
                <el-option
                  v-for="(label, key) in constants.platforms"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="支付方式">
              <el-select v-model="filterForm.paymentMethod" placeholder="全部" clearable style="width: 100%">
                <el-option label="全部" value="all" />
                <el-option
                  v-for="(label, key) in constants.paymentMethods"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="指派人员">
              <el-select v-model="filterForm.assignee" placeholder="全部" clearable style="width: 100%">
                <el-option
                  v-for="name in constants.assignees"
                  :key="name"
                  :label="name"
                  :value="name"
                />
                <el-option label="未指派" value="未指派" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="来源渠道">
              <el-select v-model="filterForm.sourceChannel" placeholder="全部" clearable style="width: 100%">
                <el-option
                  v-for="channel in constants.sourceChannels"
                  :key="channel"
                  :label="channel"
                  :value="channel"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="下单时间">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="金额区间">
              <el-input-group>
                <el-input-number
                  v-model="filterForm.minAmount"
                  :min="0"
                  :controls="false"
                  placeholder="最低金额"
                  style="width: 50%"
                />
                <el-input-number
                  v-model="filterForm.maxAmount"
                  :min="0"
                  :controls="false"
                  placeholder="最高金额"
                  style="width: 50%"
                />
              </el-input-group>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-form-item label-width="0">
              <el-space>
                <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
                <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              </el-space>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="card">
      <div v-if="selectedOrders.length > 0" class="selected-bar">
        <span>
          已选择 <span class="selected-count">{{ selectedOrders.length }}</span> 条订单
        </span>
        <el-space>
          <el-select
            v-model="batchAssignee"
            placeholder="选择指派人"
            style="width: 150px"
          >
            <el-option
              v-for="name in constants.assignees"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
          <el-button type="primary" :icon="UserFilled" @click="handleBatchAssign" :disabled="!batchAssignee">
            批量指派
          </el-button>
          <el-button type="success" :icon="Download" @click="handleExportSelected">
            导出所选
          </el-button>
          <el-button @click="clearSelection">取消选择</el-button>
        </el-space>
      </div>

      <div class="table-toolbar">
        <el-space>
          <el-button type="success" :icon="Download" @click="handleExportAll">
            导出当前筛选结果
          </el-button>
          <el-button :icon="RefreshRight" @click="loadOrders">刷新</el-button>
        </el-space>
        <el-space>
          <el-select
            v-model="pageSize"
            style="width: 120px"
            @change="handlePageSizeChange"
          >
            <el-option :value="10" label="10条/页" />
            <el-option :value="20" label="20条/页" />
            <el-option :value="50" label="50条/页" />
            <el-option :value="100" label="100条/页" />
          </el-select>
        </el-space>
      </div>

      <el-table
        v-loading="loading"
        :data="orders"
        row-key="id"
        border
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="序号" type="index" width="60" align="center" :index="indexMethod" />

        <el-table-column label="订单信息" min-width="240">
          <template #default="{ row }">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px">
                <span :class="['order-type-tag', row.type]">
                  {{ row.type === 'lease' ? '租赁' : '销售' }}
                </span>
                <el-link type="primary" @click="showDetail(row)" style="font-weight: 600">
                  {{ row.orderNo }}
                </el-link>
              </div>
              <el-tag
                :color="getStatusColor(row)"
                effect="dark"
                size="small"
                style="border: none"
              >
                {{ getStatusText(row) }}
              </el-tag>
              <span style="margin-left: 8px; color: #999; font-size: 12px">
                {{ constants.platforms[row.platform] }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="客户信息" min-width="220">
          <template #default="{ row }">
            <div class="customer-info">
              <div class="name">
                {{ row.customer.name }}
                <el-tag size="small" style="margin-left: 6px">{{ row.customer.phone }}</el-tag>
              </div>
              <div v-if="row.customer.email" class="phone">{{ row.customer.email }}</div>
              <div class="address" :title="row.customer.address">
                <el-icon><Location /></el-icon>
                {{ row.customer.address }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="商品信息" min-width="280">
          <template #default="{ row }">
            <div class="product-list">
              <div v-for="product in row.products.slice(0, 2)" :key="product.id" class="product-item">
                <div>
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-sku">[{{ product.sku }}]</span>
                </div>
                <div class="product-meta">
                  ¥{{ formatMoney(product.unitPrice) }} × {{ product.quantity }} =
                  <strong style="color: #f5222d">¥{{ formatMoney(product.totalPrice) }}</strong>
                </div>
              </div>
              <div v-if="row.products.length > 2" style="color: #1890ff; font-size: 12px">
                等 {{ row.products.length }} 件商品...
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="金额" width="150" align="right" sortable="custom" prop="paidAmount">
          <template #default="{ row }">
            <div class="amount-info">
              <div class="amount-total">¥{{ formatMoney(row.paidAmount) }}</div>
              <div v-if="row.discountAmount > 0" class="amount-discount">
                优惠 ¥{{ formatMoney(row.discountAmount) }}
              </div>
              <div v-if="row.totalAmount !== row.paidAmount" class="amount-original">
                原价 ¥{{ formatMoney(row.totalAmount) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column v-if="showLeaseColumn" label="租赁详情" width="200">
          <template #default="{ row }">
            <div v-if="row.type === 'lease' && row.leaseInfo" class="lease-info">
              <div class="row">
                <span class="label">租期:</span>
                <span class="value">
                  {{ row.leaseInfo.leasePeriod }}
                  {{ row.leaseInfo.leaseUnit === 'day' ? '天' : row.leaseInfo.leaseUnit === 'month' ? '个月' : '年' }}
                </span>
              </div>
              <div class="row">
                <span class="label">状态:</span>
                <el-tag
                  size="small"
                  :color="LEASE_STATUS_COLORS[row.leaseInfo.leaseStatus]"
                  effect="dark"
                  style="border: none"
                >
                  {{ constants.leaseStatuses[row.leaseInfo.leaseStatus] }}
                </el-tag>
              </div>
              <div class="row">
                <span class="label">起止:</span>
                <span class="value" style="font-size: 11px">
                  {{ row.leaseInfo.startDate }} ~ {{ row.leaseInfo.endDate }}
                </span>
              </div>
            </div>
            <span v-else style="color: #ccc">—</span>
          </template>
        </el-table-column>

        <el-table-column label="下单时间" width="170" sortable="custom" prop="createTime">
          <template #default="{ row }">
            <div class="time-info">
              <div><el-icon><Calendar /></el-icon> {{ formatDate(row.createTime) }}</div>
              <div style="font-size: 12px; color: #999">
                支付: {{ row.paymentTime ? formatDate(row.paymentTime) : '-' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="指派人员" width="130">
          <template #default="{ row }">
            <div class="assignee-info">
              <el-tag v-if="row.assignee && row.assignee !== '未指派'" type="primary" effect="light">
                <el-icon><UserFilled /></el-icon>
                {{ row.assignee }}
              </el-tag>
              <el-tag v-else type="info" effect="plain">未指派</el-tag>
              <el-button
                link
                type="primary"
                size="small"
                @click="showAssignDialog(row)"
              >
                {{ row.assignee && row.assignee !== '未指派' ? '改派' : '指派' }}
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="{ row }">
            <el-space :size="4">
              <el-button link type="primary" size="small" @click="showDetail(row)">
                <el-icon><View /></el-icon>预览
              </el-button>
              <el-button link type="success" size="small" @click="goDetail(row)">
                详情<el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 20px">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="订单详情" width="900px" destroy-on-close>
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单编号" :span="1">
          <strong>{{ currentOrder.orderNo }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="订单类型" :span="1">
          <span :class="['order-type-tag', currentOrder.type]">
            {{ currentOrder.type === 'lease' ? '租赁单' : '销售单' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag
            :color="getStatusColor(currentOrder)"
            effect="dark"
            style="border: none"
          >
            {{ getStatusText(currentOrder) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="来源平台">
          {{ constants.platforms[currentOrder.platform] }}
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentOrder.customer.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.customer.phone }}</el-descriptions-item>
        <el-descriptions-item label="电子邮箱" :span="1">
          {{ currentOrder.customer.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="1">
          {{ currentOrder.customer.address }}
        </el-descriptions-item>
        <el-descriptions-item label="订单总额">¥{{ formatMoney(currentOrder.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">¥{{ formatMoney(currentOrder.discountAmount) }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">
          <strong style="color: #f5222d; font-size: 16px">¥{{ formatMoney(currentOrder.paidAmount) }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ constants.paymentMethods[currentOrder.paymentMethod] }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          {{ currentOrder.paymentTime ? formatDate(currentOrder.paymentTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDate(currentOrder.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(currentOrder.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="指派人员">
          {{ currentOrder.assignee || '未指派' }}
        </el-descriptions-item>
        <el-descriptions-item label="来源渠道">
          {{ currentOrder.sourceChannel || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentOrder.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">商品明细</el-divider>
      <el-table v-if="currentOrder" :data="currentOrder.products" border>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="sku" label="SKU编码" width="160" />
        <el-table-column label="单价(元)" width="120" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column label="小计(元)" width="130" align="right">
          <template #default="{ row }">
            <strong style="color: #f5222d">¥{{ formatMoney(row.totalPrice) }}</strong>
          </template>
        </el-table-column>
      </el-table>

      <el-divider v-if="currentOrder?.type === 'lease'" content-position="left">租赁信息</el-divider>
      <el-descriptions v-if="currentOrder?.type === 'lease' && currentOrder.leaseInfo" :column="3" border>
        <el-descriptions-item label="租赁状态">
          <el-tag
            :color="LEASE_STATUS_COLORS[currentOrder.leaseInfo.leaseStatus]"
            effect="dark"
            style="border: none"
          >
            {{ constants.leaseStatuses[currentOrder.leaseInfo.leaseStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="租期">
          {{ currentOrder.leaseInfo.leasePeriod }}
          {{ currentOrder.leaseInfo.leaseUnit === 'day' ? '天' : currentOrder.leaseInfo.leaseUnit === 'month' ? '个月' : '年' }}
        </el-descriptions-item>
        <el-descriptions-item label="月租金">¥{{ formatMoney(currentOrder.leaseInfo.monthlyRent) }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ currentOrder.leaseInfo.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ currentOrder.leaseInfo.endDate }}</el-descriptions-item>
        <el-descriptions-item label="押金">¥{{ formatMoney(currentOrder.leaseInfo.deposit) }}</el-descriptions-item>
        <el-descriptions-item label="物损押金" :span="3">
          ¥{{ formatMoney(currentOrder.leaseInfo.damageDeposit) }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignVisible" title="订单指派" width="420px" destroy-on-close>
      <el-form v-if="assignOrder" label-width="100px">
        <el-form-item label="订单编号">
          <span style="font-weight: 600; color: #1890ff">{{ assignOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item label="当前指派">
          {{ assignOrder.assignee || '未指派' }}
        </el-form-item>
        <el-form-item label="指派人员" required>
          <el-select v-model="selectedAssignee" placeholder="请选择指派人" style="width: 100%">
            <el-option
              v-for="name in constants.assignees"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign" :disabled="!selectedAssignee">
          确认指派
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Refresh,
  Download,
  RefreshRight,
  UserFilled,
  Location,
  Calendar,
  View,
  DataLine,
  Goods,
  Clock,
  Wallet,
  User,
  List,
  ArrowRight
} from '@element-plus/icons-vue';
import { orderApi } from '../api/order';
import type {
  Order,
  OrderFilterParams,
  OrderStatistics,
  ConstantsData
} from '../types/order';
import { ORDER_STATUS_COLORS, LEASE_STATUS_COLORS } from '../types/order';

const router = useRouter();

const loading = ref(false);
const orders = ref<Order[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const sortField = ref('createTime');
const sortOrder = ref<'asc' | 'desc'>('desc');

const statistics = ref<OrderStatistics>({
  total: 0,
  leaseCount: 0,
  saleCount: 0,
  totalAmount: 0,
  unassigned: 0,
  statusStats: {},
  platformStats: {}
});

const constants = ref<ConstantsData>({
  orderTypes: {},
  orderStatuses: {},
  leaseStatuses: {},
  platforms: {},
  paymentMethods: {},
  assignees: [],
  sourceChannels: []
});

const filterForm = reactive<OrderFilterParams>({
  keyword: '',
  type: 'all',
  status: 'all',
  leaseStatus: 'all',
  platform: 'all',
  paymentMethod: 'all',
  assignee: '',
  sourceChannel: '',
  startDate: '',
  endDate: '',
  minAmount: undefined,
  maxAmount: undefined
});

const dateRange = ref<string[] | null>(null);

const selectedOrders = ref<Order[]>([]);
const batchAssignee = ref('');

const detailVisible = ref(false);
const currentOrder = ref<Order | null>(null);

const assignVisible = ref(false);
const assignOrder = ref<Order | null>(null);
const selectedAssignee = ref('');

const showLeaseColumn = computed(() => {
  return filterForm.type === 'all' || filterForm.type === 'lease';
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

async function loadStatistics() {
  try {
    const res = await orderApi.getStatistics();
    if (res.code === 0) {
      statistics.value = res.data;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

async function loadOrders() {
  loading.value = true;
  try {
    const params: OrderFilterParams = {
      ...filterForm,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await orderApi.getList(params);
    if (res.code === 0) {
      orders.value = res.data.list;
      total.value = res.data.total;
    } else {
      ElMessage.error(res.message || '加载订单列表失败');
    }
  } catch (error) {
    console.error('加载订单列表失败:', error);
    ElMessage.error('加载订单列表失败，请重试');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  loadOrders();
}

function handleReset() {
  Object.assign(filterForm, {
    keyword: '',
    type: 'all',
    status: 'all',
    leaseStatus: 'all',
    platform: 'all',
    paymentMethod: 'all',
    assignee: '',
    sourceChannel: '',
    startDate: '',
    endDate: '',
    minAmount: undefined,
    maxAmount: undefined
  });
  dateRange.value = null;
  currentPage.value = 1;
  sortField.value = 'createTime';
  sortOrder.value = 'desc';
  loadOrders();
}

function handleSelectionChange(selection: Order[]) {
  selectedOrders.value = selection;
}

function clearSelection() {
  selectedOrders.value = [];
  batchAssignee.value = '';
}

function handleSortChange({ prop, order }: { prop?: string; order?: string }) {
  if (prop && order) {
    sortField.value = prop;
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
    loadOrders();
  }
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadOrders();
}

function handleCurrentChange(page: number) {
  currentPage.value = page;
  loadOrders();
}

function indexMethod(index: number) {
  return (currentPage.value - 1) * pageSize.value + index + 1;
}

function showDetail(row: Order) {
  currentOrder.value = row;
  detailVisible.value = true;
}

function goDetail(row: Order) {
  router.push(`/orders/${row.id}`);
}

function showAssignDialog(row: Order) {
  assignOrder.value = row;
  selectedAssignee.value = row.assignee && row.assignee !== '未指派' ? row.assignee : '';
  assignVisible.value = true;
}

async function confirmAssign() {
  if (!assignOrder.value || !selectedAssignee.value) return;
  try {
    const res = await orderApi.assign(assignOrder.value.id, selectedAssignee.value);
    if (res.code === 0) {
      ElMessage.success('指派成功');
      assignVisible.value = false;
      loadOrders();
      loadStatistics();
    } else {
      ElMessage.error(res.message || '指派失败');
    }
  } catch (error) {
    console.error('指派失败:', error);
    ElMessage.error('指派失败，请重试');
  }
}

async function handleBatchAssign() {
  if (selectedOrders.value.length === 0 || !batchAssignee.value) return;
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selectedOrders.value.length} 条订单指派给「${batchAssignee.value}」吗？`,
      '批量指派确认',
      { type: 'warning' }
    );
    const orderIds = selectedOrders.value.map(o => o.id);
    const res = await orderApi.batchAssign(orderIds, batchAssignee.value);
    if (res.code === 0) {
      ElMessage.success(res.message);
      clearSelection();
      loadOrders();
      loadStatistics();
    } else {
      ElMessage.error(res.message || '批量指派失败');
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('批量指派失败:', e);
      ElMessage.error('批量指派失败，请重试');
    }
  }
}

async function handleExportAll() {
  doExport(filterForm);
}

async function handleExportSelected() {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要导出的订单');
    return;
  }
  const ids = selectedOrders.value.map(o => o.id).join(',');
  doExport({ ...filterForm, keyword: ids });
}

async function doExport(params: OrderFilterParams) {
  try {
    ElMessage.info('正在导出，请稍候...');
    const blob = await orderApi.exportExcel(params);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `订单列表_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
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

function getStatusText(order: Order): string {
  if (order.type === 'lease' && order.leaseInfo) {
    return constants.value.leaseStatuses[order.leaseInfo.leaseStatus] || '';
  }
  return constants.value.orderStatuses[order.status] || '';
}

function getStatusColor(order: Order): string {
  if (order.type === 'lease' && order.leaseInfo) {
    return LEASE_STATUS_COLORS[order.leaseInfo.leaseStatus] || '#999';
  }
  return ORDER_STATUS_COLORS[order.status] || '#999';
}

onMounted(() => {
  loadConstants();
  loadStatistics();
  loadOrders();
});
</script>
