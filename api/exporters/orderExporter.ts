import * as XLSX from 'xlsx';
import {
  Order,
  OperationLog,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PLATFORM_LABELS,
  PAYMENT_METHOD_LABELS,
  ASSIGN_STAGE_LABELS
} from '../types/order';

const EXPORT_HEADERS = [
  '订单编号', '订单类型', '订单状态', '所属城市', '指派阶段', '跨城市指派',
  '来源平台', '客户姓名', '联系电话', '电子邮箱', '收货地址',
  '商品名称', '商品SKU', '商品明细',
  '订单总额(元)', '优惠金额(元)', '实付金额(元)', '指派金额(元)',
  '支付方式', '支付时间', '下单时间', '更新时间',
  '指派人员', '来源渠道', '备注',
  '租赁状态', '租期', '租赁开始日期', '租赁结束日期',
  '月租金(元)', '押金(元)', '物损押金(元)'
];

const INFO_SECTION_HEADERS = ['项目', '内容'];

interface OrderExportRow {
  [key: string]: string | number;
}

export function buildExportRows(orders: Order[]): OrderExportRow[] {
  return orders.map(order => buildSingleOrderRow(order));
}

function buildSingleOrderRow(order: Order): OrderExportRow {
  const productNames = order.products.map(p => p.name).join('、');
  const productSkus = order.products.map(p => p.sku).join('、');
  const productQuantities = order.products.map(p => `${p.name}×${p.quantity}`).join('、');
  const leaseFields = buildLeaseFields(order);

  return {
    '订单编号': order.orderNo,
    '订单类型': ORDER_TYPE_LABELS[order.type],
    '订单状态': ORDER_STATUS_LABELS[order.status],
    '所属城市': order.city || '-',
    '指派阶段': order.assignStage ? ASSIGN_STAGE_LABELS[order.assignStage] : '待指派',
    '跨城市指派': order.isCrossCityAssign ? '是' : '否',
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
    '指派金额(元)': order.assignAmount?.toFixed(2) || '-',
    '支付方式': PAYMENT_METHOD_LABELS[order.paymentMethod],
    '支付时间': order.paymentTime ? formatDateTime(order.paymentTime) : '-',
    '下单时间': formatDateTime(order.createTime),
    '更新时间': formatDateTime(order.updateTime),
    '指派人员': order.assignee || '未指派',
    '来源渠道': order.sourceChannel || '-',
    '备注': order.remark || '-',
    ...leaseFields
  };
}

function buildLeaseFields(order: Order): Partial<OrderExportRow> {
  if (order.type !== 'lease' || !order.leaseInfo) {
    return {
      '租赁状态': '-',
      '租期': '-',
      '租赁开始日期': '-',
      '租赁结束日期': '-',
      '月租金(元)': '-',
      '押金(元)': '-',
      '物损押金(元)': '-'
    };
  }

  const { leaseInfo } = order;
  const unit = leaseInfo.leaseUnit === 'day' ? '天'
    : leaseInfo.leaseUnit === 'month' ? '个月' : '年';

  return {
    '租赁状态': LEASE_STATUS_LABELS[leaseInfo.leaseStatus],
    '租期': `${leaseInfo.leasePeriod}${unit}`,
    '租赁开始日期': leaseInfo.startDate,
    '租赁结束日期': leaseInfo.endDate,
    '月租金(元)': leaseInfo.monthlyRent.toFixed(2),
    '押金(元)': leaseInfo.deposit.toFixed(2),
    '物损押金(元)': leaseInfo.damageDeposit.toFixed(2)
  };
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('zh-CN');
}

export function buildOrderInfoRows(order: Order): Array<{ 项目: string; 内容: string }> {
  const rows: Array<{ 项目: string; 内容: string }> = [
    { 项目: '订单编号', 内容: order.orderNo },
    { 项目: '订单类型', 内容: ORDER_TYPE_LABELS[order.type] },
    { 项目: '订单状态', 内容: ORDER_STATUS_LABELS[order.status] },
    { 项目: '所属城市', 内容: order.city || '-' },
    { 项目: '指派阶段', 内容: order.assignStage ? ASSIGN_STAGE_LABELS[order.assignStage] : '待指派' },
    { 项目: '跨城市指派', 内容: order.isCrossCityAssign ? '是' : '否' },
    { 项目: '来源平台', 内容: PLATFORM_LABELS[order.platform] },
    { 项目: '来源渠道', 内容: order.sourceChannel || '-' },
    { 项目: '客户姓名', 内容: order.customer.name },
    { 项目: '联系电话', 内容: order.customer.phone },
    { 项目: '电子邮箱', 内容: order.customer.email || '-' },
    { 项目: '收货地址', 内容: order.customer.address },
    { 项目: '订单总额(元)', 内容: order.totalAmount.toFixed(2) },
    { 项目: '优惠金额(元)', 内容: order.discountAmount.toFixed(2) },
    { 项目: '实付金额(元)', 内容: order.paidAmount.toFixed(2) },
    { 项目: '指派金额(元)', 内容: order.assignAmount?.toFixed(2) || '-' },
    { 项目: '支付方式', 内容: PAYMENT_METHOD_LABELS[order.paymentMethod] },
    { 项目: '支付时间', 内容: order.paymentTime ? formatDateTime(order.paymentTime) : '-' },
    { 项目: '下单时间', 内容: formatDateTime(order.createTime) },
    { 项目: '更新时间', 内容: formatDateTime(order.updateTime) },
    { 项目: '指派人员', 内容: order.assignee || '未指派' },
    { 项目: '备注', 内容: order.remark || '-' }
  ];

  if (order.type === 'lease' && order.leaseInfo) {
    const li = order.leaseInfo;
    const unit = li.leaseUnit === 'day' ? '天' : li.leaseUnit === 'month' ? '个月' : '年';
    rows.push(
      { 项目: '租赁状态', 内容: LEASE_STATUS_LABELS[li.leaseStatus] },
      { 项目: '租期', 内容: `${li.leasePeriod}${unit}` },
      { 项目: '租赁开始日期', 内容: li.startDate },
      { 项目: '租赁结束日期', 内容: li.endDate },
      { 项目: '月租金(元)', 内容: li.monthlyRent.toFixed(2) },
      { 项目: '押金(元)', 内容: li.deposit.toFixed(2) },
      { 项目: '物损押金(元)', 内容: li.damageDeposit.toFixed(2) }
    );
  }

  return rows;
}

export function buildProductRows(products: Order['products']): Array<{
  序号: number;
  商品名称: string;
  'SKU编码': string;
  '单价(元)': string;
  数量: number;
  '小计(元)': string;
}> {
  return products.map((p, idx) => ({
    序号: idx + 1,
    商品名称: p.name,
    'SKU编码': p.sku,
    '单价(元)': p.unitPrice.toFixed(2),
    数量: p.quantity,
    '小计(元)': p.totalPrice.toFixed(2)
  }));
}

export function buildLogRows(logs: OperationLog[]): Array<{
  序号: number;
  操作类型: string;
  操作人: string;
  操作角色: string;
  操作时间: string;
  变更前: string;
  变更后: string;
  备注: string;
}> {
  return logs.map((l, idx) => ({
    序号: idx + 1,
    操作类型: l.operationName,
    操作人: l.operator,
    操作角色: l.operatorRole,
    操作时间: formatDateTime(l.operateTime),
    变更前: l.beforeValue || '-',
    变更后: l.afterValue || '-',
    备注: l.remark || '-'
  }));
}

export function createWorksheetFromData<T extends object>(
  data: T[],
  headers?: string[],
  colWidths?: number[]
): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(data, headers ? { header: headers } : undefined);
  if (colWidths) {
    ws['!cols'] = colWidths.map(wch => ({ wch }));
  }
  return ws;
}

export function exportListToExcel(orders: Order[]): Buffer {
  const rows = buildExportRows(orders);
  const colWidths = EXPORT_HEADERS.map(() => 15);
  const ws = createWorksheetFromData(rows, EXPORT_HEADERS, colWidths);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '订单列表');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function exportDetailToExcel(
  order: Order,
  logs: OperationLog[]
): Buffer {
  const wb = XLSX.utils.book_new();

  const infoRows = buildOrderInfoRows(order);
  const infoWs = createWorksheetFromData(infoRows, INFO_SECTION_HEADERS, [18, 40]);
  XLSX.utils.book_append_sheet(wb, infoWs, '订单信息');

  const productRows = buildProductRows(order.products);
  const productWs = createWorksheetFromData(productRows, undefined, [6, 24, 18, 14, 10, 14]);
  XLSX.utils.book_append_sheet(wb, productWs, '商品明细');

  const logRows = buildLogRows(logs);
  const logWs = createWorksheetFromData(logRows, undefined, [6, 14, 12, 10, 22, 16, 16, 36]);
  XLSX.utils.book_append_sheet(wb, logWs, '操作日志');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
