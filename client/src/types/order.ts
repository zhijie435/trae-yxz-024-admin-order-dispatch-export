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
  imageUrl?: string;
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
  sourceChannel?: string;
  leaseInfo?: LeaseInfo;
}

export interface OrderFilterParams {
  keyword?: string;
  type?: OrderType | 'all';
  status?: OrderStatus | 'all';
  leaseStatus?: LeaseStatus | 'all';
  platform?: Platform | 'all';
  paymentMethod?: PaymentMethod | 'all';
  assignee?: string;
  sourceChannel?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
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

export interface OrderStatistics {
  total: number;
  leaseCount: number;
  saleCount: number;
  totalAmount: number;
  unassigned: number;
  statusStats: Record<string, number>;
  platformStats: Record<string, number>;
}

export interface ConstantsData {
  orderTypes: Record<string, string>;
  orderStatuses: Record<string, string>;
  leaseStatuses: Record<string, string>;
  platforms: Record<string, string>;
  paymentMethods: Record<string, string>;
  assignees: string[];
  sourceChannels: string[];
}

export type OperationType =
  | 'create'
  | 'pay'
  | 'process'
  | 'ship'
  | 'deliver'
  | 'complete'
  | 'cancel'
  | 'refund'
  | 'assign'
  | 'reassign'
  | 'remark'
  | 'lease_start'
  | 'lease_return'
  | 'lease_overdue';

export interface OperationLog {
  id: string;
  orderId: string;
  orderNo: string;
  operationType: OperationType;
  operationName: string;
  operator: string;
  operatorRole: string;
  operateTime: string;
  beforeValue?: string;
  afterValue?: string;
  remark?: string;
}

export interface OrderDetail {
  order: Order;
  logs: OperationLog[];
}

export const OPERATION_TYPE_COLORS: Record<OperationType, string> = {
  create: '#52c41a',
  pay: '#1890ff',
  process: '#722ed1',
  ship: '#13c2c2',
  deliver: '#2f54eb',
  complete: '#52c41a',
  cancel: '#8c8c8c',
  refund: '#f5222d',
  assign: '#fa8c16',
  reassign: '#faad14',
  remark: '#b37feb',
  lease_start: '#1890ff',
  lease_return: '#13c2c2',
  lease_overdue: '#f5222d'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: '#faad14',
  paid: '#1890ff',
  processing: '#722ed1',
  shipped: '#13c2c2',
  delivered: '#2f54eb',
  completed: '#52c41a',
  cancelled: '#8c8c8c',
  refunded: '#f5222d'
};

export const LEASE_STATUS_COLORS: Record<LeaseStatus, string> = {
  pending_shipment: '#faad14',
  shipped: '#1890ff',
  in_use: '#52c41a',
  returning: '#13c2c2',
  returned: '#2f54eb',
  completed: '#722ed1',
  overdue: '#f5222d'
};
