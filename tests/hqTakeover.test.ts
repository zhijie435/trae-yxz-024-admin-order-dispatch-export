import { OrderService, ValidationError, resetOrderState } from '../api/services/OrderService';
import { ASSIGNEE_HQ_TAKEOVER } from '../api/types/order';
import { buildOrder } from './fixtures';

const TOTAL = 1000;

describe('总部兜底 - OrderService.hqTakeover', () => {
  beforeEach(() => {
    resetOrderState([
      buildOrder({ id: 'ORD-PENDING', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' }),
      buildOrder({ id: 'ORD-ASSIGNED', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'assigned', assignee: '张三', assignAmount: 800 }),
      buildOrder({ id: 'ORD-REJECTED', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'store_rejected', assignee: '未指派', rejectReason: '库存不足' })
    ]);
  });

  it('门店拒单阶段执行总部兜底：写入兜底指派人/金额/阶段，并标记 isHqTakeover', () => {
    const order = OrderService.hqTakeover('ORD-REJECTED', 800);
    expect(order).not.toBeNull();
    expect(order!.assignee).toBe(ASSIGNEE_HQ_TAKEOVER);
    expect(order!.assignAmount).toBe(800);
    expect(order!.assignStage).toBe('hq_handled');
    expect(order!.isHqTakeover).toBe(true);
    expect(order!.rejectReason).toBeUndefined();
  });

  it('总部兜底记录 hq_takeover 操作日志', () => {
    OrderService.hqTakeover('ORD-REJECTED', 800);
    const logs = OrderService.getOperationLogs('ORD-REJECTED');
    const last = logs[logs.length - 1];
    expect(last.operationType).toBe('hq_takeover');
    expect(last.afterValue).toBe(ASSIGNEE_HQ_TAKEOVER);
    expect(last.operatorRole).toBe('总部管理员');
    expect(last.remark).toContain('总部兜底接单');
    expect(last.remark).toContain('指派金额 ¥800.00');
  });

  it('待指派阶段不允许直接总部兜底接单', () => {
    expect(() => OrderService.hqTakeover('ORD-PENDING', 800)).toThrow(ValidationError);
    expect(() => OrderService.hqTakeover('ORD-PENDING', 800)).toThrow('不允许执行总部兜底接单');
  });

  it('已指派阶段允许总部兜底（assigned -> hq_handled）', () => {
    const order = OrderService.hqTakeover('ORD-ASSIGNED', 900);
    expect(order!.assignStage).toBe('hq_handled');
    expect(order!.assignee).toBe(ASSIGNEE_HQ_TAKEOVER);
    expect(order!.isHqTakeover).toBe(true);
  });

  it('兜底金额无效时抛出 ValidationError', () => {
    expect(() => OrderService.hqTakeover('ORD-REJECTED', 100)).toThrow(ValidationError);
    expect(() => OrderService.hqTakeover('ORD-REJECTED', 100)).toThrow('不能低于');
  });

  it('兜底金额超过上限抛出 ValidationError', () => {
    expect(() => OrderService.hqTakeover('ORD-REJECTED', 2000)).toThrow(ValidationError);
  });

  it('未传入兜底金额抛出 ValidationError', () => {
    expect(() => OrderService.hqTakeover('ORD-REJECTED', undefined as any)).toThrow('请输入指派金额');
  });

  it('订单不存在时返回 null', () => {
    expect(OrderService.hqTakeover('NOT-EXIST', 800)).toBeNull();
  });
});

describe('门店拒单 - OrderService.rejectByStore（兜底前置流程）', () => {
  beforeEach(() => {
    resetOrderState([
      buildOrder({ id: 'ORD-ASSIGNED-2', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'assigned', assignee: '张三', assignAmount: 800 }),
      buildOrder({ id: 'ORD-PENDING-2', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' })
    ]);
  });

  it('已指派订单门店拒单：清空指派人/金额并记录拒单原因', () => {
    const order = OrderService.rejectByStore('ORD-ASSIGNED-2', '距离太远无法配送');
    expect(order).not.toBeNull();
    expect(order!.assignStage).toBe('store_rejected');
    expect(order!.assignee).toBe('未指派');
    expect(order!.assignAmount).toBeUndefined();
    expect(order!.rejectReason).toBe('距离太远无法配送');
  });

  it('拒单时必须填写原因', () => {
    expect(() => OrderService.rejectByStore('ORD-ASSIGNED-2', '')).toThrow(ValidationError);
    expect(() => OrderService.rejectByStore('ORD-ASSIGNED-2', '   ')).toThrow('请填写拒单原因');
  });

  it('拒单记录 store_reject 操作日志', () => {
    OrderService.rejectByStore('ORD-ASSIGNED-2', '人手不足');
    const logs = OrderService.getOperationLogs('ORD-ASSIGNED-2');
    const last = logs[logs.length - 1];
    expect(last.operationType).toBe('store_reject');
    expect(last.operatorRole).toBe('门店');
    expect(last.remark).toContain('人手不足');
  });

  it('待指派阶段不允许门店拒单', () => {
    expect(() => OrderService.rejectByStore('ORD-PENDING-2', '测试')).toThrow(ValidationError);
    expect(() => OrderService.rejectByStore('ORD-PENDING-2', '测试')).toThrow('不允许执行门店拒单');
  });
});

describe('总部兜底完整流程：指派 -> 门店拒单 -> 总部兜底接单', () => {
  beforeEach(() => {
    resetOrderState([
      buildOrder({ id: 'ORD-FLOW', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' })
    ]);
  });

  it('完整流转后订单由总部兜底接单', () => {
    const assigned = OrderService.assign({ orderId: 'ORD-FLOW', assignee: '张三', assignAmount: 800 });
    expect(assigned!.assignStage).toBe('assigned');
    expect(assigned!.assignee).toBe('张三');

    const rejected = OrderService.rejectByStore('ORD-FLOW', '库存不足');
    expect(rejected!.assignStage).toBe('store_rejected');
    expect(rejected!.assignee).toBe('未指派');
    expect(rejected!.rejectReason).toBe('库存不足');

    const takenOver = OrderService.hqTakeover('ORD-FLOW', 800);
    expect(takenOver!.assignStage).toBe('hq_handled');
    expect(takenOver!.assignee).toBe(ASSIGNEE_HQ_TAKEOVER);
    expect(takenOver!.isHqTakeover).toBe(true);
    expect(takenOver!.rejectReason).toBeUndefined();

    const types = OrderService.getOperationLogs('ORD-FLOW').map(l => l.operationType);
    expect(types).toContain('assign');
    expect(types).toContain('store_reject');
    expect(types).toContain('hq_takeover');
    expect(types[types.length - 1]).toBe('hq_takeover');
  });
});
