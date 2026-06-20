import { Order, OrderFilterParams, AssignStage } from '../types/order';

export function filterOrders(orders: Order[], params: OrderFilterParams): Order[] {
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
    assignStage = 'all',
    city,
    isCrossCityAssign
  } = params;

  return orders.filter(order => {
    if (!matchesType(order, type)) return false;
    if (!matchesStatus(order, status)) return false;
    if (!matchesLeaseStatus(order, leaseStatus)) return false;
    if (!matchesPlatform(order, platform)) return false;
    if (!matchesPaymentMethod(order, paymentMethod)) return false;
    if (!matchesAssignee(order, assignee)) return false;
    if (!matchesSourceChannel(order, sourceChannel)) return false;
    if (!matchesDateRange(order, startDate, endDate)) return false;
    if (!matchesAmountRange(order, minAmount, maxAmount)) return false;
    if (!matchesKeyword(order, keyword)) return false;
    if (!matchesAssignStage(order, assignStage)) return false;
    if (!matchesCity(order, city)) return false;
    if (!matchesCrossCity(order, isCrossCityAssign)) return false;

    return true;
  });
}

function matchesType(order: Order, type: OrderFilterParams['type']): boolean {
  return type === 'all' || order.type === type;
}

function matchesStatus(order: Order, status: OrderFilterParams['status']): boolean {
  return status === 'all' || order.status === status;
}

function matchesLeaseStatus(order: Order, leaseStatus: OrderFilterParams['leaseStatus']): boolean {
  if (leaseStatus === 'all') return true;
  if (!order.leaseInfo) return false;
  return order.leaseInfo.leaseStatus === leaseStatus;
}

function matchesPlatform(order: Order, platform: OrderFilterParams['platform']): boolean {
  return platform === 'all' || order.platform === platform;
}

function matchesPaymentMethod(order: Order, paymentMethod: OrderFilterParams['paymentMethod']): boolean {
  return paymentMethod === 'all' || order.paymentMethod === paymentMethod;
}

function matchesAssignee(order: Order, assignee?: string): boolean {
  if (!assignee) return true;
  return order.assignee === assignee;
}

function matchesSourceChannel(order: Order, sourceChannel?: string): boolean {
  if (!sourceChannel) return true;
  return order.sourceChannel === sourceChannel;
}

function matchesDateRange(order: Order, startDate?: string, endDate?: string): boolean {
  const orderTime = new Date(order.createTime).getTime();

  if (startDate) {
    const startTime = new Date(startDate).getTime();
    if (orderTime < startTime) return false;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (orderTime > end.getTime()) return false;
  }

  return true;
}

function matchesAmountRange(order: Order, minAmount?: number, maxAmount?: number): boolean {
  if (minAmount !== undefined && order.paidAmount < minAmount) return false;
  if (maxAmount !== undefined && order.paidAmount > maxAmount) return false;
  return true;
}

function matchesKeyword(order: Order, keyword?: string): boolean {
  if (!keyword) return true;

  const kw = keyword.toLowerCase();
  const matchOrderNo = order.orderNo.toLowerCase().includes(kw);
  const matchCustomerName = order.customer.name.toLowerCase().includes(kw);
  const matchCustomerPhone = order.customer.phone.includes(kw);
  const matchProductName = order.products.some(p =>
    p.name.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw)
  );

  return matchOrderNo || matchCustomerName || matchCustomerPhone || matchProductName;
}

function matchesAssignStage(order: Order, assignStage: OrderFilterParams['assignStage']): boolean {
  if (assignStage === 'all') return true;
  const orderStage = order.assignStage ?? 'pending_assign';
  return orderStage === assignStage;
}

function matchesCity(order: Order, city?: string): boolean {
  if (!city) return true;
  return order.city === city;
}

function matchesCrossCity(order: Order, isCrossCityAssign?: boolean): boolean {
  if (isCrossCityAssign === undefined) return true;
  return order.isCrossCityAssign === isCrossCityAssign;
}

export function sortOrders(
  orders: Order[],
  sortField: string = 'createTime',
  sortOrder: 'asc' | 'desc' = 'desc'
): Order[] {
  return [...orders].sort((a, b) => {
    const valA = getSortValue(a, sortField);
    const valB = getSortValue(b, sortField);

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

function getSortValue(order: Order, field: string): number | string {
  switch (field) {
    case 'paidAmount':
    case 'totalAmount':
    case 'discountAmount':
    case 'assignAmount':
      return Number(order[field as keyof Order]) || 0;

    case 'createTime':
    case 'updateTime':
    case 'paymentTime':
      return new Date((order[field as keyof Order] as string) || 0).getTime();

    case 'customer':
      return (order.customer?.name || '').toString();

    case 'orderNo':
      return order.orderNo;

    case 'status':
      return order.status;

    case 'type':
      return order.type;

    default:
      return (order[field as keyof Order] || '').toString();
  }
}

export function paginateOrders<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): { list: T[]; total: number; page: number; pageSize: number } {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const list = items.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}
