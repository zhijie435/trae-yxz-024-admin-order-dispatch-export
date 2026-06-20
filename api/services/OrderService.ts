import {
  Order,
  OperationLog,
  OperationType,
  OrderFilterParams,
  PaginatedResponse,
  AssignOrderParams,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PLATFORM_LABELS,
  PAYMENT_METHOD_LABELS,
  OPERATION_TYPE_LABELS
} from '../types/order';
import { mockOrders } from '../data/orderGenerator';
import { generateOperationLogs } from '../data/operationLogGenerator';
import * as XLSX from 'xlsx';

let orders: Order[] = [...mockOrders];
let operationLogMap: Map<string, OperationLog[]> = generateOperationLogs(orders);
let logSeq = 0;

export class OrderService {
  static findAll(params: OrderFilterParams = {}): PaginatedResponse<Order> {
    const {
      keyword,
      type = 'all',
      status = 'all',
      leaseStatus = 'all',
      platform = 'all',
      paymentMethod = 'all',
      assignee,
      sourceChannel,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      pageSize = 20,
      sortField = 'createTime',
      sortOrder = 'desc'
    } = params;

    let filtered = orders.filter(order => {
      if (type !== 'all' && order.type !== type) return false;
      if (status !== 'all' && order.status !== status) return false;
      if (leaseStatus !== 'all') {
        if (!order.leaseInfo || order.leaseInfo.leaseStatus !== leaseStatus) return false;
      }
      if (platform !== 'all' && order.platform !== platform) return false;
      if (paymentMethod !== 'all' && order.paymentMethod !== paymentMethod) return false;
      if (assignee && order.assignee !== assignee) return false;
      if (sourceChannel && order.sourceChannel !== sourceChannel) return false;

      if (startDate) {
        if (new Date(order.createTime) < new Date(startDate)) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(order.createTime) > end) return false;
      }

      if (minAmount !== undefined && order.paidAmount < minAmount) return false;
      if (maxAmount !== undefined && order.paidAmount > maxAmount) return false;

      if (keyword) {
        const kw = keyword.toLowerCase();
        const matchOrderNo = order.orderNo.toLowerCase().includes(kw);
        const matchCustomerName = order.customer.name.toLowerCase().includes(kw);
        const matchCustomerPhone = order.customer.phone.includes(kw);
        const matchProductName = order.products.some(p =>
          p.name.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw)
        );
        if (!matchOrderNo && !matchCustomerName && !matchCustomerPhone && !matchProductName) {
          return false;
        }
      }

      return true;
    });

    filtered = filtered.sort((a, b) => {
      let valA: any = a[sortField as keyof Order];
      let valB: any = b[sortField as keyof Order];

      if (sortField === 'paidAmount' || sortField === 'totalAmount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === 'createTime' || sortField === 'updateTime') {
        valA = new Date(valA as string).getTime();
        valB = new Date(valB as string).getTime();
      } else if (sortField === 'customer') {
        valA = (a.customer?.name || '').toString();
        valB = (b.customer?.name || '').toString();
      } else {
        valA = (valA || '').toString();
        valB = (valB || '').toString();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  static findById(id: string): Order | undefined {
    return orders.find(o => o.id === id);
  }

  static assign(params: AssignOrderParams): Order | null {
    const { orderId, assignee } = params;
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const beforeAssignee = order.assignee || '未指派';
    order.assignee = assignee;
    order.updateTime = new Date().toISOString();

    this.appendLog(order, beforeAssignee !== '未指派' ? 'reassign' : 'assign', {
      beforeValue: beforeAssignee,
      afterValue: assignee,
      operator: '管理员',
      operatorRole: '管理员',
      remark: beforeAssignee !== '未指派' ? `由 ${beforeAssignee} 改派为 ${assignee}` : `订单指派给 ${assignee}`
    });

    return order;
  }

  static batchAssign(orderIds: string[], assignee: string): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    orderIds.forEach(id => {
      const order = orders.find(o => o.id === id);
      if (order) {
        const beforeAssignee = order.assignee || '未指派';
        order.assignee = assignee;
        order.updateTime = new Date().toISOString();
        success++;

        this.appendLog(order, beforeAssignee !== '未指派' ? 'reassign' : 'assign', {
          beforeValue: beforeAssignee,
          afterValue: assignee,
          operator: '管理员',
          operatorRole: '管理员',
          remark: `批量操作：指派给 ${assignee}`
        });
      } else {
        failed++;
      }
    });

    return { success, failed };
  }

  private static appendLog(
    order: Order,
    type: OperationType,
    options: {
      beforeValue?: string;
      afterValue?: string;
      operator: string;
      operatorRole: string;
      remark?: string;
    }
  ): void {
    logSeq += 1;
    const log: OperationLog = {
      id: 'LOG' + Date.now() + String(logSeq).padStart(4, '0'),
      orderId: order.id,
      orderNo: order.orderNo,
      operationType: type,
      operationName: OPERATION_TYPE_LABELS[type],
      operator: options.operator,
      operatorRole: options.operatorRole,
      operateTime: new Date().toISOString(),
      beforeValue: options.beforeValue,
      afterValue: options.afterValue,
      remark: options.remark
    };

    const list = operationLogMap.get(order.id) || [];
    list.push(log);
    operationLogMap.set(order.id, list);
  }

  static getOperationLogs(orderId: string): OperationLog[] {
    const list = operationLogMap.get(orderId) || [];
    return [...list].sort(
      (a, b) => new Date(a.operateTime).getTime() - new Date(b.operateTime).getTime()
    );
  }

  static getOrderDetail(orderId: string): { order: Order; logs: OperationLog[] } | null {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    return { order, logs: this.getOperationLogs(orderId) };
  }

  static exportToExcel(params: OrderFilterParams = {}): Buffer {
    const result = this.findAll({ ...params, page: 1, pageSize: 99999 });
    const rows = result.list.map(order => {
      const productNames = order.products.map(p => p.name).join('、');
      const productSkus = order.products.map(p => p.sku).join('、');
      const productQuantities = order.products.map(p => `${p.name}×${p.quantity}`).join('、');

      const row: Record<string, any> = {
        '订单编号': order.orderNo,
        '订单类型': ORDER_TYPE_LABELS[order.type],
        '订单状态': ORDER_STATUS_LABELS[order.status],
        '来源平台': PLATFORM_LABELS[order.platform],
        '客户姓名': order.customer.name,
        '联系电话': order.customer.phone,
        '电子邮箱': order.customer.email || '-',
        '收货地址': order.customer.address,
        '商品名称': productNames,
        '商品SKU': productSkus,
        '商品明细': productQuantities,
        '订单总额(元)': order.totalAmount.toFixed(2),
        '优惠金额(元)': order.discountAmount.toFixed(2),
        '实付金额(元)': order.paidAmount.toFixed(2),
        '支付方式': PAYMENT_METHOD_LABELS[order.paymentMethod],
        '支付时间': order.paymentTime ? new Date(order.paymentTime).toLocaleString('zh-CN') : '-',
        '下单时间': new Date(order.createTime).toLocaleString('zh-CN'),
        '更新时间': new Date(order.updateTime).toLocaleString('zh-CN'),
        '指派人员': order.assignee || '未指派',
        '来源渠道': order.sourceChannel || '-',
        '备注': order.remark || '-'
      };

      if (order.type === 'lease' && order.leaseInfo) {
        Object.assign(row, {
          '租赁状态': LEASE_STATUS_LABELS[order.leaseInfo.leaseStatus],
          '租期': `${order.leaseInfo.leasePeriod}${order.leaseInfo.leaseUnit === 'day' ? '天' : order.leaseInfo.leaseUnit === 'month' ? '个月' : '年'}`,
          '租赁开始日期': order.leaseInfo.startDate,
          '租赁结束日期': order.leaseInfo.endDate,
          '月租金(元)': order.leaseInfo.monthlyRent.toFixed(2),
          '押金(元)': order.leaseInfo.deposit.toFixed(2),
          '物损押金(元)': order.leaseInfo.damageDeposit.toFixed(2)
        });
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '订单列表');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  static exportOrderDetail(orderId: string): Buffer | null {
    const detail = this.getOrderDetail(orderId);
    if (!detail) return null;

    const { order, logs } = detail;
    const wb = XLSX.utils.book_new();

    const infoRows: Array<{ 项目: string; 内容: string }> = [
      { 项目: '订单编号', 内容: order.orderNo },
      { 项目: '订单类型', 内容: ORDER_TYPE_LABELS[order.type] },
      { 项目: '订单状态', 内容: ORDER_STATUS_LABELS[order.status] },
      { 项目: '来源平台', 内容: PLATFORM_LABELS[order.platform] },
      { 项目: '来源渠道', 内容: order.sourceChannel || '-' },
      { 项目: '客户姓名', 内容: order.customer.name },
      { 项目: '联系电话', 内容: order.customer.phone },
      { 项目: '电子邮箱', 内容: order.customer.email || '-' },
      { 项目: '收货地址', 内容: order.customer.address },
      { 项目: '订单总额(元)', 内容: order.totalAmount.toFixed(2) },
      { 项目: '优惠金额(元)', 内容: order.discountAmount.toFixed(2) },
      { 项目: '实付金额(元)', 内容: order.paidAmount.toFixed(2) },
      { 项目: '支付方式', 内容: PAYMENT_METHOD_LABELS[order.paymentMethod] },
      { 项目: '支付时间', 内容: order.paymentTime ? new Date(order.paymentTime).toLocaleString('zh-CN') : '-' },
      { 项目: '下单时间', 内容: new Date(order.createTime).toLocaleString('zh-CN') },
      { 项目: '更新时间', 内容: new Date(order.updateTime).toLocaleString('zh-CN') },
      { 项目: '指派人员', 内容: order.assignee || '未指派' },
      { 项目: '备注', 内容: order.remark || '-' }
    ];

    if (order.type === 'lease' && order.leaseInfo) {
      const li = order.leaseInfo;
      infoRows.push(
        { 项目: '租赁状态', 内容: LEASE_STATUS_LABELS[li.leaseStatus] },
        {
          项目: '租期',
          内容: `${li.leasePeriod}${li.leaseUnit === 'day' ? '天' : li.leaseUnit === 'month' ? '个月' : '年'}`
        },
        { 项目: '租赁开始日期', 内容: li.startDate },
        { 项目: '租赁结束日期', 内容: li.endDate },
        { 项目: '月租金(元)', 内容: li.monthlyRent.toFixed(2) },
        { 项目: '押金(元)', 内容: li.deposit.toFixed(2) },
        { 项目: '物损押金(元)', 内容: li.damageDeposit.toFixed(2) }
      );
    }

    const infoWs = XLSX.utils.json_to_sheet(infoRows, { header: ['项目', '内容'] });
    infoWs['!cols'] = [{ wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, infoWs, '订单信息');

    const productRows = order.products.map((p, idx) => ({
      '序号': idx + 1,
      '商品名称': p.name,
      'SKU编码': p.sku,
      '单价(元)': p.unitPrice.toFixed(2),
      '数量': p.quantity,
      '小计(元)': p.totalPrice.toFixed(2)
    }));
    const productWs = XLSX.utils.json_to_sheet(productRows);
    productWs['!cols'] = [{ wch: 6 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, productWs, '商品明细');

    const logRows = logs.map((l, idx) => ({
      '序号': idx + 1,
      '操作类型': l.operationName,
      '操作人': l.operator,
      '操作角色': l.operatorRole,
      '操作时间': new Date(l.operateTime).toLocaleString('zh-CN'),
      '变更前': l.beforeValue || '-',
      '变更后': l.afterValue || '-',
      '备注': l.remark || '-'
    }));
    const logWs = XLSX.utils.json_to_sheet(logRows);
    logWs['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
      { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 36 }
    ];
    XLSX.utils.book_append_sheet(wb, logWs, '操作日志');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  static getStatistics() {
    const total = orders.length;
    const leaseCount = orders.filter(o => o.type === 'lease').length;
    const saleCount = orders.filter(o => o.type === 'sale').length;
    const totalAmount = orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const unassigned = orders.filter(o => !o.assignee || o.assignee === '未指派').length;

    const statusStats: Record<string, number> = {};
    orders.forEach(o => {
      const label = ORDER_STATUS_LABELS[o.status];
      statusStats[label] = (statusStats[label] || 0) + 1;
    });

    const platformStats: Record<string, number> = {};
    orders.forEach(o => {
      const label = PLATFORM_LABELS[o.platform];
      platformStats[label] = (platformStats[label] || 0) + 1;
    });

    return {
      total,
      leaseCount,
      saleCount,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      unassigned,
      statusStats,
      platformStats
    };
  }
}
