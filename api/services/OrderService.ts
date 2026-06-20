import {
  Order,
  OrderFilterParams,
  PaginatedResponse,
  AssignOrderParams,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PLATFORM_LABELS,
  PAYMENT_METHOD_LABELS
} from '../types/order';
import { mockOrders } from '../data/orderGenerator';
import * as XLSX from 'xlsx';

let orders: Order[] = [...mockOrders];

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

    order.assignee = assignee;
    order.updateTime = new Date().toISOString();
    return order;
  }

  static batchAssign(orderIds: string[], assignee: string): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    orderIds.forEach(id => {
      const order = orders.find(o => o.id === id);
      if (order) {
        order.assignee = assignee;
        order.updateTime = new Date().toISOString();
        success++;
      } else {
        failed++;
      }
    });

    return { success, failed };
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
