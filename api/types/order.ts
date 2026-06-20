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

export interface AssignOrderParams {
  orderId: string;
  assignee: string;
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

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  create: '创建订单',
  pay: '支付订单',
  process: '开始处理',
  ship: '订单发货',
  deliver: '确认送达',
  complete: '订单完成',
  cancel: '取消订单',
  refund: '订单退款',
  assign: '指派订单',
  reassign: '改派订单',
  remark: '更新备注',
  lease_start: '租赁开始',
  lease_return: '租赁归还',
  lease_overdue: '租赁逾期'
};

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

export const OPERATOR_ROLES = ['系统', '客服', '仓管', '财务', '运营', '管理员'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
};

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  pending_shipment: '待发货',
  shipped: '已发货',
  in_use: '使用中',
  returning: '归还中',
  returned: '已归还',
  completed: '已完成',
  overdue: '已逾期'
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  lease: '租赁单',
  sale: '销售单'
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  official_website: '官网',
  wechat_mini: '微信小程序',
  taobao: '淘宝',
  jd: '京东',
  pinduoduo: '拼多多',
  douyin: '抖音',
  offline_store: '线下门店'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  bank_transfer: '银行转账',
  credit_card: '信用卡',
  cash: '现金'
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

export const ASSIGNEES = [
  '张三', '李四', '王五', '赵六', '钱七',
  '孙八', '周九', '吴十', '郑十一', '王十二'
];

export const SOURCE_CHANNELS = [
  '搜索引擎', '社交媒体', '朋友推荐', '线下展会',
  '广告投放', '老客户', '自然流量', '合作伙伴'
];

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
