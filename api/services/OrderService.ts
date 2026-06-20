import {
  Order,
  OperationLog,
  OperationType,
  OrderFilterParams,
  PaginatedResponse,
  AssignOrderParams,
  OrderStatus,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PLATFORM_LABELS,
  PAYMENT_METHOD_LABELS,
  OPERATION_TYPE_LABELS,
  ASSIGNEE_HQ_TAKEOVER,
  CrossCityAssignParams,
  AssignStage
} from '../types/order';
import { mockOrders } from '../data/orderGenerator';
import { generateOperationLogs } from '../data/operationLogGenerator';
import { getAssigneeCity, getAssigneeByName } from '../data/assigneeData';
import { filterOrders, sortOrders, paginateOrders } from '../filters/orderFilter';
import { validateAssignAmount, validateCrossCityAssign, ASSIGN_STAGE_TRANSITIONS, validateStageTransition } from '../validators/orderValidator';
import { exportListToExcel, exportDetailToExcel } from '../exporters/orderExporter';

let orders: Order[] = [...mockOrders];
let operationLogMap: Map<string, OperationLog[]> = generateOperationLogs(orders);
let logSeq = 0;

export function resetOrderState(seed?: Order[]): void {
  orders = seed ? seed.map(o => ({ ...o })) : [...mockOrders];
  operationLogMap = generateOperationLogs(orders);
  logSeq = 0;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class OrderService {
  static findAll(params: OrderFilterParams = {}): PaginatedResponse<Order> {
    const {
      page = 1,
      pageSize = 20,
      sortField = 'createTime',
      sortOrder = 'desc'
    } = params;

    const filtered = filterOrders(orders, params);
    const sorted = sortOrders(filtered, sortField, sortOrder);
    const paginated = paginateOrders(sorted, page, pageSize);

    return paginated;
  }

  static findById(id: string): Order | undefined {
    return orders.find(o => o.id === id);
  }

  static updateStatus(orderId: string, status: OrderStatus): Order | null {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const beforeStatus = order.status;
    if (beforeStatus === status) return order;

    order.status = status;
    order.updateTime = new Date().toISOString();

    const opType = this.getOperationTypeForStatus(status);
    this.appendLog(order, opType, {
      beforeValue: beforeStatus,
      afterValue: status,
      operator: '管理员',
      operatorRole: '管理员',
      remark: `订单状态由「${beforeStatus}」变更为「${status}」`
    });

    return order;
  }

  private static getOperationTypeForStatus(status: OrderStatus): OperationType {
    const statusToOp: Record<OrderStatus, OperationType> = {
      pending_payment: 'remark',
      paid: 'pay',
      processing: 'process',
      shipped: 'ship',
      delivered: 'deliver',
      completed: 'complete',
      cancelled: 'cancel',
      refunded: 'refund'
    };
    return statusToOp[status] || 'remark';
  }

  static assign(params: AssignOrderParams): Order | null {
    const { orderId, assignee, assignAmount } = params;
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const validation = validateAssignAmount(assignAmount, order.totalAmount);
    if (!validation.valid) {
      throw new ValidationError(validation.message!);
    }

    return this.doAssign(order, assignee, validation.amount!);
  }

  static crossCityAssign(params: CrossCityAssignParams): Order | null {
    const { orderId, assignee, assignAmount, allowCrossCity, crossCitySurchargeRate } = params;
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const assigneeCity = getAssigneeCity(assignee) || assignee;
    const validation = validateCrossCityAssign(
      { orderId, assignee, assignAmount, allowCrossCity, crossCitySurchargeRate },
      order.city,
      assigneeCity,
      order.totalAmount
    );

    if (!validation.valid) {
      throw new ValidationError(validation.message!);
    }

    const finalAmount = validation.adjustedAmount ?? validation.amount!;
    const assignedOrder = this.doAssign(order, assignee, finalAmount);

    if (assignedOrder) {
      assignedOrder.isCrossCityAssign = validation.isCrossCity ?? false;
    }

    return assignedOrder;
  }

  private static doAssign(order: Order, assignee: string, amount: number): Order {
    const beforeAssignee = order.assignee || '未指派';
    const currentStage = order.assignStage ?? 'pending_assign';
    const targetStage: AssignStage = 'assigned';

    if (!validateStageTransition(currentStage, targetStage, ASSIGN_STAGE_TRANSITIONS)) {
      throw new ValidationError(
        `当前指派阶段「${currentStage}」不允许执行此操作`
      );
    }

    const isHq = assignee === ASSIGNEE_HQ_TAKEOVER;
    order.assignee = assignee;
    order.assignAmount = amount;
    order.assignStage = targetStage;
    order.isHqTakeover = isHq || order.isHqTakeover;
    order.updateTime = new Date().toISOString();

    const opType: OperationType =
      beforeAssignee !== '未指派' ? 'reassign' : 'assign';

    const assigneeInfo = getAssigneeByName(assignee);
    const assigneeCity = assigneeInfo?.city ? `（${assigneeInfo.city}）` : '';
    const crossCityTag = order.isCrossCityAssign ? ' [跨城市]' : '';

    this.appendLog(order, opType, {
      beforeValue: beforeAssignee,
      afterValue: `${assignee}${assigneeCity}${crossCityTag}`,
      operator: '管理员',
      operatorRole: '管理员',
      remark:
        beforeAssignee !== '未指派'
          ? `由 ${beforeAssignee} 改派为 ${assignee}${isHq ? '（总部兜底）' : ''}，指派金额 ¥${order.assignAmount.toFixed(2)}${crossCityTag}`
          : `订单指派给 ${assignee}${isHq ? '（总部兜底）' : ''}，指派金额 ¥${order.assignAmount.toFixed(2)}${crossCityTag}`
    });

    return order;
  }

  static rejectByStore(orderId: string, reason: string): Order | null {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const currentStage = order.assignStage;
    const targetStage: AssignStage = 'store_rejected';
    if (!validateStageTransition(currentStage, targetStage, ASSIGN_STAGE_TRANSITIONS)) {
      throw new ValidationError(
        `当前指派阶段「${currentStage || 'pending_assign'}」不允许执行门店拒单`
      );
    }

    if (!reason || !reason.trim()) {
      throw new ValidationError('请填写拒单原因');
    }

    const beforeStage = order.assignStage || 'pending_assign';
    const beforeAssignee = order.assignee || '未指派';
    order.assignStage = targetStage;
    order.rejectReason = reason.trim();
    order.assignee = '未指派';
    order.assignAmount = undefined;
    order.updateTime = new Date().toISOString();

    this.appendLog(order, 'store_reject', {
      beforeValue: `${beforeAssignee} (${beforeStage})`,
      afterValue: '门店拒单',
      operator: beforeAssignee !== '未指派' ? beforeAssignee : '门店',
      operatorRole: '门店',
      remark: `门店拒单，原因：${reason.trim()}`
    });

    return order;
  }

  static hqTakeover(orderId: string, assignAmount: number): Order | null {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const currentStage = order.assignStage;
    const targetStage: AssignStage = 'hq_handled';
    if (!validateStageTransition(currentStage, targetStage, ASSIGN_STAGE_TRANSITIONS)) {
      throw new ValidationError(
        `当前指派阶段「${currentStage || 'pending_assign'}」不允许执行总部兜底接单`
      );
    }

    const validation = validateAssignAmount(assignAmount, order.totalAmount);
    if (!validation.valid) {
      throw new ValidationError(validation.message!);
    }

    order.assignee = ASSIGNEE_HQ_TAKEOVER;
    order.assignAmount = validation.amount!;
    order.assignStage = targetStage;
    order.isHqTakeover = true;
    order.rejectReason = undefined;
    order.updateTime = new Date().toISOString();

    this.appendLog(order, 'hq_takeover', {
      beforeValue: '门店拒单',
      afterValue: ASSIGNEE_HQ_TAKEOVER,
      operator: '管理员',
      operatorRole: '总部管理员',
      remark: `总部兜底接单，指派金额 ¥${order.assignAmount.toFixed(2)}`
    });

    return order;
  }

  static hqTransfer(orderId: string, assignee: string, assignAmount: number): Order | null {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const currentStage = order.assignStage;
    const targetStage: AssignStage = 'hq_handled';
    if (!validateStageTransition(currentStage, targetStage, ASSIGN_STAGE_TRANSITIONS)) {
      throw new ValidationError(
        `当前指派阶段「${currentStage || 'pending_assign'}」不允许执行总部转派`
      );
    }

    if (!assignee) {
      throw new ValidationError('请选择转派对象');
    }

    if (assignee === ASSIGNEE_HQ_TAKEOVER) {
      throw new ValidationError('请使用「总部兜底接单」功能指派给总部');
    }

    const validation = validateAssignAmount(assignAmount, order.totalAmount);
    if (!validation.valid) {
      throw new ValidationError(validation.message!);
    }

    order.assignee = assignee;
    order.assignAmount = validation.amount!;
    order.assignStage = targetStage;
    order.isHqTakeover = false;
    order.rejectReason = undefined;
    order.updateTime = new Date().toISOString();

    const assigneeInfo = getAssigneeByName(assignee);
    const assigneeCity = assigneeInfo?.city ? `（${assigneeInfo.city}）` : '';

    this.appendLog(order, 'hq_transfer', {
      beforeValue: '门店拒单',
      afterValue: `${assignee}${assigneeCity}`,
      operator: '管理员',
      operatorRole: '总部管理员',
      remark: `总部转派给 ${assignee}，指派金额 ¥${order.assignAmount.toFixed(2)}`
    });

    return order;
  }

  static hqCancel(orderId: string, reason: string): Order | null {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const currentStage = order.assignStage;
    const targetStage: AssignStage = 'hq_handled';
    if (!validateStageTransition(currentStage, targetStage, ASSIGN_STAGE_TRANSITIONS)) {
      throw new ValidationError(
        `当前指派阶段「${currentStage || 'pending_assign'}」不允许执行沟通取消`
      );
    }

    if (!reason || !reason.trim()) {
      throw new ValidationError('请填写沟通取消原因');
    }

    const beforeStatus = order.status;
    order.status = 'cancelled';
    order.assignStage = targetStage;
    order.rejectReason = undefined;
    order.updateTime = new Date().toISOString();

    this.appendLog(order, 'hq_cancel', {
      beforeValue: '门店拒单',
      afterValue: '已取消',
      operator: '管理员',
      operatorRole: '总部管理员',
      remark: `总部沟通取消订单，原因：${reason.trim()}`
    });
    this.appendLog(order, 'cancel', {
      beforeValue: beforeStatus,
      afterValue: 'cancelled',
      operator: '管理员',
      operatorRole: '总部管理员',
      remark: `沟通取消，原因为：${reason.trim()}`
    });

    return order;
  }

  static batchAssign(orderIds: string[], assignee: string, assignAmount?: number): {
    success: number;
    failed: number;
    errors: Array<{ orderId: string; message: string }>;
  } {
    const success = 0;
    const failed = 0;
    const errors: Array<{ orderId: string; message: string }> = [];

    const results = orderIds.map(id => {
      try {
        const order = orders.find(o => o.id === id);
        if (!order) {
          return { success: false, id, error: '订单不存在' };
        }

        let amount = assignAmount;
        if (amount === undefined) {
          amount = order.totalAmount * 0.8;
        }

        const validation = validateAssignAmount(amount, order.totalAmount);
        if (!validation.valid) {
          return { success: false, id, error: validation.message! };
        }

        this.doAssign(order, assignee, validation.amount!);
        return { success: true, id };
      } catch (e) {
        const message = e instanceof ValidationError ? e.message : '未知错误';
        return { success: false, id, error: message };
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const errorList = results
      .filter(r => !r.success)
      .map(r => ({ orderId: r.id, message: r.error || '未知错误' }));

    return { success: successCount, failed: failedCount, errors: errorList };
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
    return exportListToExcel(result.list);
  }

  static exportOrderDetail(orderId: string): Buffer | null {
    const detail = this.getOrderDetail(orderId);
    if (!detail) return null;
    const { order, logs } = detail;
    return exportDetailToExcel(order, logs);
  }

  static getStatistics() {
    const total = orders.length;
    const leaseCount = orders.filter(o => o.type === 'lease').length;
    const saleCount = orders.filter(o => o.type === 'sale').length;
    const totalAmount = orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const unassigned = orders.filter(o => !o.assignee || o.assignee === '未指派').length;
    const crossCityCount = orders.filter(o => o.isCrossCityAssign).length;

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

    const cityStats: Record<string, number> = {};
    orders.forEach(o => {
      cityStats[o.city] = (cityStats[o.city] || 0) + 1;
    });

    return {
      total,
      leaseCount,
      saleCount,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      unassigned,
      crossCityCount,
      statusStats,
      platformStats,
      cityStats
    };
  }

  static getAssigneesByCity(city?: string) {
    const { getAssigneesByCity: getByCity, assignees } = require('../data/assigneeData');
    if (city) {
      return getByCity(city);
    }
    return assignees;
  }
}
