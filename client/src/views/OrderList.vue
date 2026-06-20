<template>
  <div class="order-list-page">
    <el-card class="filter-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Filter /></el-icon>
            多维度筛选
          </span>
          <div class="header-actions">
            <el-button @click="toggleAdvancedFilter">
              <el-icon><Setting /></el-icon>
              {{ showAdvancedFilter ? '收起高级筛选' : '展开高级筛选' }}
            </el-button>
            <el-button @click="resetFilter">
              <el-icon><RefreshRight /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="filterForm" label-width="100px" @submit.prevent>
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="订单类型">
              <el-select 
                v-model="filterForm.type" 
                placeholder="全部" 
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in enumOptions?.orderTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="订单状态">
              <el-select 
                v-model="filterForm.status" 
                placeholder="全部" 
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in enumOptions?.orderStatuses"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属平台">
              <el-select 
                v-model="filterForm.platform" 
                placeholder="全部" 
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in enumOptions?.platforms"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="支付方式">
              <el-select 
                v-model="filterForm.paymentMethod" 
                placeholder="全部" 
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in enumOptions?.paymentMethods"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="订单编号">
              <el-input 
                v-model="filterForm.orderNo" 
                placeholder="请输入订单编号" 
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户姓名">
              <el-input 
                v-model="filterForm.customerName" 
                placeholder="请输入客户姓名" 
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系电话">
              <el-input 
                v-model="filterForm.customerPhone" 
                placeholder="请输入联系电话" 
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="指派人">
              <el-select 
                v-model="filterForm.assignee" 
                placeholder="全部" 
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in enumOptions?.assignees"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-collapse-transition>
          <div v-show="showAdvancedFilter">
            <el-row :gutter="24">
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
                <el-form-item label="金额范围">
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <el-input-number 
                      v-model="filterForm.minAmount" 
                      :min="0" 
                      placeholder="最小"
                      controls-position="right"
                      style="flex: 1"
                    />
                    <span>-</span>
                    <el-input-number 
                      v-model="filterForm.maxAmount" 
                      :min="0" 
                      placeholder="最大"
                      controls-position="right"
                      style="flex: 1"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="租赁状态">
                  <el-select 
                    v-model="filterForm.leaseStatus" 
                    placeholder="全部" 
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in enumOptions?.leaseStatuses"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="来源渠道">
                  <el-select 
                    v-model="sourceChannelFilter" 
                    placeholder="全部" 
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in enumOptions?.sourceChannels"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="指派阶段">
                  <el-select 
                    v-model="filterForm.assignStage" 
                    placeholder="全部" 
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in enumOptions?.assignStages"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>

        <el-row justify="end">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-icon><List /></el-icon>
            订单列表
            <el-tag type="info" class="total-tag">共 {{ paginatedData.total }} 条</el-tag>
          </div>
          <div class="table-actions">
            <el-button type="success" @click="handleExport" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="paginatedData.list"
        border
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="订单编号">
                <el-tag type="primary">{{ row.orderNo }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="订单类型">
                <el-tag :type="getTagType(ORDER_TYPE_COLORS[row.type])">
                  {{ getLabel('orderTypes', row.type) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="订单状态">
                <el-tag :type="getTagType(ORDER_STATUS_COLORS[row.status])">
                  {{ getLabel('orderStatuses', row.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="所属平台">
                {{ getLabel('platforms', row.platform) }}
              </el-descriptions-item>
              <el-descriptions-item label="支付方式">
                {{ getLabel('paymentMethods', row.paymentMethod) }}
              </el-descriptions-item>
              <el-descriptions-item label="指派人">
                <el-tag :type="row.assignee === '未指派' ? 'danger' : 'info'">
                  {{ row.assignee || '未指派' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item v-if="row.assignAmount !== undefined && row.assignAmount !== null" label="指派金额">
                <span style="color: #67c23a; font-weight: bold; font-size: 15px;">
                  {{ formatAmount(row.assignAmount) }}
                  <el-tag type="success" size="small" style="margin-left: 4px;">门店结算</el-tag>
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="商品总额">
                <span v-if="row.assignAmount !== undefined && row.assignAmount !== null" style="color: #909399; text-decoration: line-through;">
                  {{ formatAmount(row.totalAmount) }}
                </span>
                <span v-else style="color: #f56c6c; font-weight: bold;">
                  {{ formatAmount(row.totalAmount) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="优惠金额">
                <span style="color: #67c23a;">
                  -{{ formatAmount(row.discountAmount) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="实付金额">
                <span style="color: #409eff; font-weight: bold;">
                  {{ formatAmount(row.assignAmount !== undefined && row.assignAmount !== null ? row.assignAmount : row.paidAmount) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="支付时间">
                {{ formatDate(row.paymentTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="下单时间">
                {{ formatDate(row.createTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(row.updateTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="客户姓名">
                {{ row.customer.name }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">
                {{ row.customer.phone }}
              </el-descriptions-item>
              <el-descriptions-item label="电子邮箱">
                {{ row.customer.email || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="收货地址" :span="3">
                {{ row.customer.address }}
              </el-descriptions-item>
              <el-descriptions-item label="指派阶段">
                <el-tag 
                  v-if="row.assignStage"
                  :type="getTagType(ASSIGN_STAGE_COLORS[row.assignStage])" 
                  size="small"
                >
                  {{ ASSIGN_STAGE_LABELS[row.assignStage] }}
                </el-tag>
                <span v-else style="color: #909399;">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="是否总部兜底">
                <el-tag v-if="row.isHqTakeover" type="warning" size="small">是</el-tag>
                <span v-else style="color: #909399;">否</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="row.rejectReason" label="拒单原因" :span="3">
                <span style="color: #f56c6c;">{{ row.rejectReason }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="来源渠道">
                {{ row.sourceChannel || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ row.remark || '-' }}
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="row.leaseInfo" class="lease-info">
              <h4 class="section-title">
                <el-icon><Clock /></el-icon>
                租赁信息
              </h4>
              <el-descriptions :column="4" border size="small">
                <el-descriptions-item label="租期">
                  {{ row.leaseInfo.leasePeriod }}{{ row.leaseInfo.leaseUnit === 'day' ? '天' : row.leaseInfo.leaseUnit === 'month' ? '月' : '年' }}
                </el-descriptions-item>
                <el-descriptions-item label="租赁开始">
                  {{ row.leaseInfo.startDate }}
                </el-descriptions-item>
                <el-descriptions-item label="租赁结束">
                  {{ row.leaseInfo.endDate }}
                </el-descriptions-item>
                <el-descriptions-item label="租赁状态">
                  <el-tag :type="getTagType(LEASE_STATUS_COLORS[row.leaseInfo.leaseStatus])">
                    {{ getLabel('leaseStatuses', row.leaseInfo.leaseStatus) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="押金">
                  {{ formatAmount(row.leaseInfo.deposit) }}
                </el-descriptions-item>
                <el-descriptions-item label="月租金">
                  {{ formatAmount(row.leaseInfo.monthlyRent) }}
                </el-descriptions-item>
                <el-descriptions-item label="物损押金">
                  {{ formatAmount(row.leaseInfo.damageDeposit) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="products-info">
              <h4 class="section-title">
                <el-icon><Goods /></el-icon>
                商品信息
              </h4>
              <el-table :data="row.products" border size="small">
                <el-table-column label="商品图片" width="100">
                  <template #default="{ row: product }">
                    <el-image 
                      :src="product.imageUrl" 
                      :preview-src-list="[product.imageUrl]"
                      fit="cover"
                      style="width: 60px; height: 60px; border-radius: 4px;"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="商品名称" min-width="200" />
                <el-table-column prop="sku" label="SKU编码" width="150" />
                <el-table-column prop="quantity" label="数量" width="100" align="center" />
                <el-table-column label="单价" width="120" align="right">
                  <template #default="{ row: product }">
                    {{ formatAmount(product.unitPrice) }}
                  </template>
                </el-table-column>
                <el-table-column label="小计" width="120" align="right">
                  <template #default="{ row: product }">
                    <span style="color: #f56c6c; font-weight: bold;">
                      {{ formatAmount(product.totalPrice) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column 
          prop="orderNo" 
          label="订单编号" 
          width="200" 
          fixed="left"
          sortable="custom"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewDetail(row)">
              {{ row.orderNo }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="订单类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTagType(ORDER_TYPE_COLORS[row.type])" size="small">
              {{ getLabel('orderTypes', row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="订单状态" width="100" align="center" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="getTagType(ORDER_STATUS_COLORS[row.status])" size="small">
              {{ getLabel('orderStatuses', row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="所属平台" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getLabel('platforms', row.platform) }}
          </template>
        </el-table-column>

        <el-table-column prop="customer.name" label="客户姓名" width="100" />
        <el-table-column prop="customer.phone" label="联系电话" width="130" />

        <el-table-column 
          label="订单金额" 
          width="150" 
          align="right"
          sortable="custom"
        >
          <template #default="{ row }">
            <div v-if="row.assignAmount !== undefined && row.assignAmount !== null">
              <div style="color: #f56c6c; font-weight: 600;">
                {{ formatAmount(row.assignAmount) }}
                <el-tag type="success" size="small" style="margin-left: 4px;">指派</el-tag>
              </div>
              <div style="font-size: 12px; color: #909399; text-decoration: line-through;">
                下单 {{ formatAmount(row.totalAmount) }}
              </div>
            </div>
            <div v-else>
              <span style="color: #f56c6c; font-weight: 600;">
                {{ formatAmount(row.totalAmount) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="实付金额" width="130" align="right">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600;">
              {{ formatAmount(row.assignAmount !== undefined && row.assignAmount !== null ? row.assignAmount : row.paidAmount) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            {{ getLabel('paymentMethods', row.paymentMethod) }}
          </template>
        </el-table-column>

        <el-table-column label="指派人" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.assignee === '未指派' ? 'danger' : ''" 
              size="small"
            >
              {{ row.assignee || '未指派' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="指派阶段" width="110" align="center">
          <template #default="{ row }">
            <el-tag 
              v-if="row.assignStage"
              :type="getTagType(ASSIGN_STAGE_COLORS[row.assignStage])" 
              size="small"
            >
              {{ ASSIGN_STAGE_LABELS[row.assignStage] }}
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>

        <el-table-column label="拒单原因" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.rejectReason" style="color: #f56c6c;">
              {{ row.rejectReason }}
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="createTime" 
          label="下单时间" 
          width="180" 
          sortable="custom"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="来源渠道" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.sourceChannel || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="340" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <template v-if="row.assignStage === 'assigned'">
              <el-button type="danger" link size="small" @click="handleReject(row)">
                <el-icon><Close /></el-icon>
                拒单
              </el-button>
              <el-button type="success" link size="small" @click="handleAssign(row)">
                <el-icon><User /></el-icon>
                改派
              </el-button>
            </template>
            <template v-else-if="row.assignStage === 'store_rejected'">
              <el-button type="warning" link size="small" @click="handleHqTakeover(row)">
                <el-icon><OfficeBuilding /></el-icon>
                兜底
              </el-button>
              <el-button type="success" link size="small" @click="handleHqTransfer(row)">
                <el-icon><Switch /></el-icon>
                转派
              </el-button>
              <el-button type="danger" link size="small" @click="handleHqCancel(row)">
                <el-icon><Close /></el-icon>
                取消
              </el-button>
            </template>
            <template v-else>
              <el-button type="success" link size="small" @click="handleAssign(row)">
                <el-icon><User /></el-icon>
                指派
              </el-button>
            </template>
            <el-button type="warning" link size="small" @click="handleEditStatus(row)">
              <el-icon><Edit /></el-icon>
              状态
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="paginatedData.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog 
      v-model="detailDialogVisible" 
      title="订单详情" 
      width="900px"
      destroy-on-close
    >
      <template v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">
            <el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单类型">
            <el-tag :type="getTagType(ORDER_TYPE_COLORS[currentOrder.type])">
              {{ getLabel('orderTypes', currentOrder.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getTagType(ORDER_STATUS_COLORS[currentOrder.status])">
              {{ getLabel('orderStatuses', currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属平台">
            {{ getLabel('platforms', currentOrder.platform) }}
          </el-descriptions-item>
          <el-descriptions-item label="客户姓名">
            {{ currentOrder.customer.name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentOrder.customer.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ currentOrder.customer.address }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.assignAmount !== undefined && currentOrder.assignAmount !== null" label="指派金额">
            <span style="color: #67c23a; font-weight: bold; font-size: 16px;">
              {{ formatAmount(currentOrder.assignAmount) }}
              <el-tag type="success" size="small" style="margin-left: 8px;">门店结算金额</el-tag>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="商品总额">
            <span v-if="currentOrder.assignAmount !== undefined && currentOrder.assignAmount !== null" style="color: #909399; text-decoration: line-through;">
              {{ formatAmount(currentOrder.totalAmount) }}
            </span>
            <span v-else style="color: #f56c6c; font-weight: bold;">
              {{ formatAmount(currentOrder.totalAmount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span style="color: #409eff; font-weight: bold;">
              {{ formatAmount(currentOrder.assignAmount !== undefined && currentOrder.assignAmount !== null ? currentOrder.assignAmount : currentOrder.paidAmount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ getLabel('paymentMethods', currentOrder.paymentMethod) }}
          </el-descriptions-item>
          <el-descriptions-item label="支付时间">
            {{ formatDate(currentOrder.paymentTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ formatDate(currentOrder.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(currentOrder.updateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="指派人">
            {{ currentOrder.assignee || '未指派' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentOrder.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title" style="margin-top: 20px;">商品列表</h4>
        <el-table :data="currentOrder.products" border>
          <el-table-column label="商品图片" width="100">
            <template #default="{ row }">
              <el-image 
                :src="row.imageUrl" 
                :preview-src-list="[row.imageUrl]"
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px;"
              />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="200" />
          <el-table-column prop="sku" label="SKU编码" width="150" />
          <el-table-column prop="quantity" label="数量" width="100" align="center" />
          <el-table-column label="单价" width="120" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">
              <span style="color: #f56c6c; font-weight: bold;">
                {{ formatAmount(row.totalPrice) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="currentOrder.leaseInfo" style="margin-top: 20px;">
          <h4 class="section-title">租赁信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="租期">
              {{ currentOrder.leaseInfo.leasePeriod }}{{ currentOrder.leaseInfo.leaseUnit === 'day' ? '天' : currentOrder.leaseInfo.leaseUnit === 'month' ? '月' : '年' }}
            </el-descriptions-item>
            <el-descriptions-item label="租赁状态">
              <el-tag :type="getTagType(LEASE_STATUS_COLORS[currentOrder.leaseInfo.leaseStatus])">
                {{ getLabel('leaseStatuses', currentOrder.leaseInfo.leaseStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="租赁开始">
              {{ currentOrder.leaseInfo.startDate }}
            </el-descriptions-item>
            <el-descriptions-item label="租赁结束">
              {{ currentOrder.leaseInfo.endDate }}
            </el-descriptions-item>
            <el-descriptions-item label="押金">
              {{ formatAmount(currentOrder.leaseInfo.deposit) }}
            </el-descriptions-item>
            <el-descriptions-item label="月租金">
              {{ formatAmount(currentOrder.leaseInfo.monthlyRent) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignDialogVisible" title="订单指派" width="450px">
      <template v-if="currentOrder">
        <p style="margin-bottom: 16px;">
          订单编号：<el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
        </p>
        <el-form label-width="100px">
          <el-form-item label="下单金额">
            <span style="color: #f56c6c; font-weight: bold; font-size: 16px;">
              ¥{{ currentOrder.totalAmount.toFixed(2) }}
            </span>
          </el-form-item>
          <el-form-item label="指派人">
            <el-select 
              v-model="selectedAssignee" 
              placeholder="请选择指派人" 
              style="width: 100%"
            >
              <el-option
                v-for="item in enumOptions?.assignees"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="指派金额">
            <el-input-number
              v-model="assignAmount"
              :min="0"
              :max="currentOrder.totalAmount"
              :precision="2"
              :step="100"
              :controls="true"
              style="width: 100%"
              placeholder="请输入指派金额"
            />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              指派金额不能大于客户下单金额
            </div>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAssign" 
          :loading="assigning"
          :disabled="!canConfirmAssign"
        >确认指派</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="修改订单状态" width="400px">
      <template v-if="currentOrder">
        <p style="margin-bottom: 16px;">
          订单编号：<el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
        </p>
        <p style="margin-bottom: 16px;">
          当前状态：
          <el-tag :type="getTagType(ORDER_STATUS_COLORS[currentOrder.status])">
            {{ getLabel('orderStatuses', currentOrder.status) }}
          </el-tag>
        </p>
        <el-select 
          v-model="selectedStatus" 
          placeholder="请选择新状态" 
          style="width: 100%"
          size="large"
        >
          <el-option
            v-for="item in enumOptions?.orderStatuses"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </template>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStatus" :loading="statusUpdating">确认修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="门店拒单" width="450px">
      <template v-if="currentOrder">
        <p style="margin-bottom: 16px;">
          订单编号：<el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
        </p>
        <el-form label-width="100px">
          <el-form-item label="当前指派人">
            <el-tag>{{ currentOrder.assignee || '未指派' }}</el-tag>
          </el-form-item>
          <el-form-item label="下单金额">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ currentOrder.totalAmount.toFixed(2) }}
            </span>
          </el-form-item>
          <el-form-item label="拒单原因" required>
            <el-input
              v-model="rejectReason"
              type="textarea"
              :rows="3"
              placeholder="请输入拒单原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="confirmReject" 
          :loading="rejecting"
          :disabled="!rejectReason.trim()"
        >确认拒单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="hqTakeoverDialogVisible" title="总部兜底接单" width="450px">
      <template v-if="currentOrder">
        <el-alert
          title="门店拒单后由总部兜底接单"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <p style="margin-bottom: 16px;">
          订单编号：<el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
        </p>
        <el-form label-width="100px">
          <el-form-item label="拒单原因">
            <span style="color: #f56c6c;">{{ currentOrder.rejectReason || '-' }}</span>
          </el-form-item>
          <el-form-item label="下单金额">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ currentOrder.totalAmount.toFixed(2) }}
            </span>
          </el-form-item>
          <el-form-item label="指派金额" required>
            <el-input-number
              v-model="hqTakeoverAmount"
              :min="0"
              :max="currentOrder.totalAmount"
              :precision="2"
              :step="100"
              :controls="true"
              style="width: 100%"
              placeholder="请输入总部兜底指派金额"
            />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              指派金额不能大于客户下单金额
            </div>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="hqTakeoverDialogVisible = false">取消</el-button>
        <el-button 
          type="warning" 
          @click="confirmHqTakeover" 
          :loading="hqTakeoverLoading"
          :disabled="hqTakeoverAmount <= 0"
        >确认兜底</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="hqTransferDialogVisible" title="总部转派" width="450px">
      <template v-if="currentOrder">
        <el-alert
          title="门店拒单后由总部转派给其他指派人"
          type="info"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <p style="margin-bottom: 16px;">
          订单编号：<el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
        </p>
        <el-form label-width="100px">
          <el-form-item label="拒单原因">
            <span style="color: #f56c6c;">{{ currentOrder.rejectReason || '-' }}</span>
          </el-form-item>
          <el-form-item label="下单金额">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ currentOrder.totalAmount.toFixed(2) }}
            </span>
          </el-form-item>
          <el-form-item label="转派对象" required>
            <el-select 
              v-model="hqTransferAssignee" 
              placeholder="请选择转派对象" 
              style="width: 100%"
            >
              <el-option
                v-for="item in transferAssigneeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="指派金额" required>
            <el-input-number
              v-model="hqTransferAmount"
              :min="0"
              :max="currentOrder.totalAmount"
              :precision="2"
              :step="100"
              :controls="true"
              style="width: 100%"
              placeholder="请输入转派金额"
            />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              指派金额不能大于客户下单金额
            </div>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="hqTransferDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmHqTransfer" 
          :loading="hqTransferLoading"
          :disabled="!hqTransferAssignee || hqTransferAmount <= 0"
        >确认转派</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="hqCancelDialogVisible" title="沟通取消订单" width="450px">
      <template v-if="currentOrder">
        <el-alert
          title="与客户沟通后取消订单，订单状态将变为已取消"
          type="error"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <p style="margin-bottom: 16px;">
          订单编号：<el-tag type="primary">{{ currentOrder.orderNo }}</el-tag>
        </p>
        <el-form label-width="100px">
          <el-form-item label="当前状态">
            <el-tag :type="getTagType(ORDER_STATUS_COLORS[currentOrder.status])">
              {{ getLabel('orderStatuses', currentOrder.status) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="下单金额">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ currentOrder.totalAmount.toFixed(2) }}
            </span>
          </el-form-item>
          <el-form-item label="取消原因" required>
            <el-input
              v-model="hqCancelReason"
              type="textarea"
              :rows="3"
              placeholder="请输入沟通取消原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="hqCancelDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="confirmHqCancel" 
          :loading="hqCancelLoading"
          :disabled="!hqCancelReason.trim()"
        >确认取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  View,
  User,
  Edit,
  Filter,
  Setting,
  RefreshRight,
  Refresh,
  Search,
  Download,
  List,
  Clock,
  Goods,
  Close,
  OfficeBuilding,
  Switch
} from '@element-plus/icons-vue'
import type { 
  Order, 
  OrderFilter, 
  PaginationParams, 
  PaginatedResponse,
  EnumOptions,
  OrderStatus,
  AssignStage
} from '@/types/order'
import { 
  ORDER_TYPE_COLORS, 
  ORDER_STATUS_COLORS, 
  LEASE_STATUS_COLORS,
  ASSIGN_STAGE_LABELS,
  ASSIGN_STAGE_COLORS,
  ASSIGNEE_HQ_TAKEOVER,
  formatDate, 
  formatAmount 
} from '@/types/order'
import { 
  getOrders, 
  getEnumOptions, 
  exportOrdersToExcel,
  assignOrder,
  updateOrderStatus,
  rejectOrder,
  hqTakeoverOrder,
  hqTransferOrder,
  hqCancelOrder
} from '@/api/order'

function getTagType(color: string | undefined): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  if (!color) return 'info'
  return color as 'primary' | 'success' | 'info' | 'warning' | 'danger'
}

const loading = ref(false)
const exporting = ref(false)
const assigning = ref(false)
const statusUpdating = ref(false)
const showAdvancedFilter = ref(false)
const assignAmount = ref<number>(0)

const rejecting = ref(false)
const hqTakeoverLoading = ref(false)
const hqTransferLoading = ref(false)
const hqCancelLoading = ref(false)

const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const hqTakeoverDialogVisible = ref(false)
const hqTakeoverAmount = ref<number>(0)

const hqTransferDialogVisible = ref(false)
const hqTransferAssignee = ref('')
const hqTransferAmount = ref<number>(0)

const hqCancelDialogVisible = ref(false)
const hqCancelReason = ref('')

const enumOptions = ref<EnumOptions | null>(null)
const dateRange = ref<string[]>([])
const sourceChannelFilter = ref<string | undefined>(undefined)

const filterForm = reactive<OrderFilter>({
  type: undefined,
  status: undefined,
  platform: undefined,
  paymentMethod: undefined,
  orderNo: '',
  customerName: '',
  customerPhone: '',
  startDate: undefined,
  endDate: undefined,
  minAmount: undefined,
  maxAmount: undefined,
  assignee: undefined,
  leaseStatus: undefined,
  assignStage: undefined
})

const canConfirmAssign = computed(() => {
  if (!currentOrder.value) return false
  return (
    selectedAssignee.value !== '' &&
    assignAmount.value > 0 &&
    assignAmount.value <= currentOrder.value.totalAmount
  )
})

const transferAssigneeOptions = computed(() => {
  if (!enumOptions.value?.assignees) return []
  return enumOptions.value.assignees.filter(
    item => item.value !== ASSIGNEE_HQ_TAKEOVER
  )
})

const pagination = reactive<PaginationParams>({
  page: 1,
  pageSize: 20,
  sortField: undefined,
  sortOrder: undefined
})

const paginatedData = reactive<PaginatedResponse<Order>>({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20
})

const detailDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const currentOrder = ref<Order | null>(null)
const selectedAssignee = ref('')
const selectedStatus = ref<OrderStatus | ''>('')

const fetchEnumOptions = async () => {
  try {
    const res = await getEnumOptions()
    enumOptions.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const filter: OrderFilter = {
      ...filterForm,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }
    const res = await getOrders(filter, pagination)
    paginatedData.list = res.data.list
    paginatedData.total = res.data.total
    paginatedData.page = res.data.page
    paginatedData.pageSize = res.data.pageSize
  } catch (e: any) {
    ElMessage.error(e.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

const handleRefresh = () => {
  fetchOrders()
}

const resetFilter = () => {
  filterForm.type = undefined
  filterForm.status = undefined
  filterForm.platform = undefined
  filterForm.paymentMethod = undefined
  filterForm.orderNo = ''
  filterForm.customerName = ''
  filterForm.customerPhone = ''
  filterForm.minAmount = undefined
  filterForm.maxAmount = undefined
  filterForm.assignee = undefined
  filterForm.leaseStatus = undefined
  filterForm.assignStage = undefined
  dateRange.value = []
  sourceChannelFilter.value = undefined
}

const toggleAdvancedFilter = () => {
  showAdvancedFilter.value = !showAdvancedFilter.value
}

const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  pagination.sortField = order ? prop : undefined
  pagination.sortOrder = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : undefined
  fetchOrders()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchOrders()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchOrders()
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要导出当前筛选条件下的 ${paginatedData.total} 条订单数据吗？`,
      '确认导出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    exporting.value = true
    const filter: OrderFilter = {
      ...filterForm,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }
    await exportOrdersToExcel(filter)
    ElMessage.success('导出成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '导出失败')
    }
  } finally {
    exporting.value = false
  }
}

const handleViewDetail = (row: Order) => {
  currentOrder.value = row
  detailDialogVisible.value = true
}

const handleAssign = (row: Order) => {
  currentOrder.value = row
  selectedAssignee.value = row.assignee || ''
  assignAmount.value = row.assignAmount || 0
  assignDialogVisible.value = true
}

const confirmAssign = async () => {
  if (!selectedAssignee.value) {
    ElMessage.warning('请选择指派人')
    return
  }
  if (!currentOrder.value) return
  
  assigning.value = true
  try {
    await assignOrder(currentOrder.value.id, selectedAssignee.value, assignAmount.value)
    ElMessage.success('指派成功')
    assignDialogVisible.value = false
    fetchOrders()
  } catch (e: any) {
    ElMessage.error(e.message || '指派失败')
  } finally {
    assigning.value = false
  }
}

const handleEditStatus = (row: Order) => {
  currentOrder.value = row
  selectedStatus.value = row.status
  statusDialogVisible.value = true
}

const confirmStatus = async () => {
  if (!selectedStatus.value) {
    ElMessage.warning('请选择订单状态')
    return
  }
  if (!currentOrder.value) return
  
  statusUpdating.value = true
  try {
    await updateOrderStatus(currentOrder.value.id, selectedStatus.value as OrderStatus)
    ElMessage.success('状态修改成功')
    statusDialogVisible.value = false
    fetchOrders()
  } catch (e: any) {
    ElMessage.error(e.message || '状态修改失败')
  } finally {
    statusUpdating.value = false
  }
}

const handleReject = (row: Order) => {
  currentOrder.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写拒单原因')
    return
  }
  if (!currentOrder.value) return

  rejecting.value = true
  try {
    await rejectOrder(currentOrder.value.id, rejectReason.value.trim())
    ElMessage.success('拒单成功')
    rejectDialogVisible.value = false
    fetchOrders()
  } catch (e: any) {
    ElMessage.error(e.message || '拒单失败')
  } finally {
    rejecting.value = false
  }
}

const handleHqTakeover = (row: Order) => {
  currentOrder.value = row
  hqTakeoverAmount.value = row.totalAmount * 0.8
  hqTakeoverDialogVisible.value = true
}

const confirmHqTakeover = async () => {
  if (hqTakeoverAmount.value <= 0) {
    ElMessage.warning('请输入有效的指派金额')
    return
  }
  if (!currentOrder.value) return

  hqTakeoverLoading.value = true
  try {
    await hqTakeoverOrder(currentOrder.value.id, hqTakeoverAmount.value)
    ElMessage.success('总部兜底接单成功')
    hqTakeoverDialogVisible.value = false
    fetchOrders()
  } catch (e: any) {
    ElMessage.error(e.message || '总部兜底接单失败')
  } finally {
    hqTakeoverLoading.value = false
  }
}

const handleHqTransfer = (row: Order) => {
  currentOrder.value = row
  hqTransferAssignee.value = ''
  hqTransferAmount.value = row.totalAmount * 0.8
  hqTransferDialogVisible.value = true
}

const confirmHqTransfer = async () => {
  if (!hqTransferAssignee.value) {
    ElMessage.warning('请选择转派对象')
    return
  }
  if (hqTransferAmount.value <= 0) {
    ElMessage.warning('请输入有效的指派金额')
    return
  }
  if (!currentOrder.value) return

  hqTransferLoading.value = true
  try {
    await hqTransferOrder(
      currentOrder.value.id,
      hqTransferAssignee.value,
      hqTransferAmount.value
    )
    ElMessage.success('总部转派成功')
    hqTransferDialogVisible.value = false
    fetchOrders()
  } catch (e: any) {
    ElMessage.error(e.message || '总部转派失败')
  } finally {
    hqTransferLoading.value = false
  }
}

const handleHqCancel = (row: Order) => {
  currentOrder.value = row
  hqCancelReason.value = ''
  hqCancelDialogVisible.value = true
}

const confirmHqCancel = async () => {
  if (!hqCancelReason.value.trim()) {
    ElMessage.warning('请填写取消原因')
    return
  }
  if (!currentOrder.value) return

  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？取消后不可恢复。',
      '确认取消订单',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  hqCancelLoading.value = true
  try {
    await hqCancelOrder(currentOrder.value.id, hqCancelReason.value.trim())
    ElMessage.success('订单已取消')
    hqCancelDialogVisible.value = false
    fetchOrders()
  } catch (e: any) {
    ElMessage.error(e.message || '取消订单失败')
  } finally {
    hqCancelLoading.value = false
  }
}

const getLabel = (type: keyof EnumOptions, value: string): string => {
  if (!enumOptions.value) return value
  const options = enumOptions.value[type]
  const option = options.find(o => o.value === value)
  return option ? option.label : value
}

watch(
  () => filterForm.type,
  (newType) => {
    if (newType !== 'lease') {
      filterForm.leaseStatus = undefined
    }
  }
)

onMounted(() => {
  fetchEnumOptions()
  fetchOrders()
})
</script>

<style scoped>
.order-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1600px;
  margin: 0 auto;
}

.filter-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.table-card {
  border-radius: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-tag {
  margin-left: 12px;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 16px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lease-info,
.products-info {
  margin-top: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
