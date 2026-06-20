export type OrderType = 'lease' | 'sale';

export type OrderStatus = 
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type LeaseStatus = 
  | 'pending_shipment'
  | 'shipped'
  | 'in_use'
  | 'returning'
  | 'returned'
  | 'completed'
  | 'overdue';

export type PaymentMethod = 
  | 'alipay'
  | 'wechat'
  | 'bank_transfer'
  | 'credit_card'
  | 'cash';

export type Platform = 
  | 'official_website'
  | 'wechat_mini'
  | 'taobao'
  | 'jd'
  | 'pinduoduo'
  | 'douyin'
  | 'offline_store';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
}

export interface LeaseInfo {
  leasePeriod: number;
  leaseUnit: 'day' | 'month' | 'year';
  startDate: string;
  endDate: string;
  deposit: number;
  monthlyRent: number;
  leaseStatus: LeaseStatus;
  damageDeposit: number;
}

export interface Order {
  id: string;
  orderNo: string;
  type: OrderType;
  status: OrderStatus;
  platform: Platform;
  customer: Customer;
  products: Product[];
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentTime?: string;
  createTime: string;
  updateTime: string;
  remark?: string;
  assignee?: string;
  assignAmount?: number;
  sourceChannel?: string;
  leaseInfo?: LeaseInfo;
}

export interface OrderFilter {
  type?: OrderType;
  status?: OrderStatus;
  platform?: Platform;
  paymentMethod?: PaymentMethod;
  orderNo?: string;
  customerName?: string;
  customerPhone?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  assignee?: string;
  leaseStatus?: LeaseStatus;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface EnumOptions {
  orderTypes: SelectOption[];
  orderStatuses: SelectOption[];
  leaseStatuses: SelectOption[];
  platforms: SelectOption[];
  paymentMethods: SelectOption[];
  assignees: SelectOption[];
  sourceChannels: SelectOption[];
}

export const ORDER_TYPE_COLORS: Record<OrderType, string> = {
  lease: 'warning',
  sale: 'success'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: 'warning',
  paid: 'primary',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'info',
  refunded: 'danger'
};

export const LEASE_STATUS_COLORS: Record<LeaseStatus, string> = {
  pending_shipment: 'warning',
  shipped: 'primary',
  in_use: 'success',
  returning: 'info',
  returned: 'success',
  completed: 'success',
  overdue: 'danger'
};

export function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getLabelFromOptions(options: SelectOption[], value: string): string {
  const option = options.find(o => o.value === value);
  return option ? option.label : value;
}
