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

export type AssignStage =
  | 'pending_assign'
  | 'assigned'
  | 'store_rejected'
  | 'hq_handled';

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

export const ASSIGNEE_HQ_TAKEOVER = '总部兜底';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
}

export interface Assignee {
  id: string;
  name: string;
  city: string;
  level?: 'primary' | 'secondary' | 'normal';
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
  assignStage?: AssignStage;
  rejectReason?: string;
  isHqTakeover?: boolean;
  city: string;
  isCrossCityAssign?: boolean;
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
  assignStage?: AssignStage;
  city?: string;
  isCrossCityAssign?: boolean;
  keyword?: string;
  sourceChannel?: string;
}

export interface CrossCityAssignParams {
  orderId: string;
  assignee: string;
  assignAmount?: number;
  allowCrossCity?: boolean;
  crossCitySurchargeRate?: number;
}

export interface BatchAssignResult {
  success: number;
  failed: number;
  errors: Array<{ orderId: string; message: string }>;
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
  assignStages: SelectOption[];
  cities: SelectOption[];
}

export const CITIES = [
  '北京市', '上海市', '广州市', '深圳市', '杭州市',
  '成都市', '武汉市', '西安市', '南京市', '重庆市',
  '苏州市', '天津市', '长沙市', '郑州市', '东莞市',
  '青岛市', '沈阳市', '宁波市', '昆明市', '大连市'
];

export const PARTNER_LEVEL_LABELS: Record<string, string> = {
  primary: '金牌合伙人',
  secondary: '银牌合伙人',
  normal: '普通合伙人'
};

export const PARTNER_LEVEL_COLORS: Record<string, string> = {
  primary: '#faad14',
  secondary: '#1890ff',
  normal: '#8c8c8c'
};

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

export const ASSIGN_STAGE_LABELS: Record<AssignStage, string> = {
  pending_assign: '待指派',
  assigned: '已指派',
  store_rejected: '门店拒单',
  hq_handled: '总部已处理'
};

export const ASSIGN_STAGE_COLORS: Record<AssignStage, string> = {
  pending_assign: 'info',
  assigned: 'primary',
  store_rejected: 'danger',
  hq_handled: 'success'
};
