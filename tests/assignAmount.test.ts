import {
  validateAssignAmount,
  MIN_ASSIGN_AMOUNT_RATIO,
  MAX_ASSIGN_AMOUNT_RATIO
} from '../api/validators/orderValidator';
import { OrderService, ValidationError, resetOrderState } from '../api/services/OrderService';
import { ASSIGNEE_HQ_TAKEOVER } from '../api/types/order';
import { buildOrder } from './fixtures';

const TOTAL = 1000;

describe('指派金额校验 - validateAssignAmount', () => {
  it('未传入金额（undefined / null）校验失败', () => {
    expect(validateAssignAmount(undefined, TOTAL)).toEqual({ valid: false, message: '请输入指派金额' });
    expect(validateAssignAmount(null, TOTAL)).toEqual({ valid: false, message: '请输入指派金额' });
  });

  it('非有效数字（NaN / Infinity / 字符串）校验失败', () => {
    expect(validateAssignAmount(NaN, TOTAL)).toEqual({ valid: false, message: '请输入有效的数字金额' });
    expect(validateAssignAmount(Infinity, TOTAL)).toEqual({ valid: false, message: '请输入有效的数字金额' });
    expect(validateAssignAmount(Number('abc'), TOTAL)).toEqual({ valid: false, message: '请输入有效的数字金额' });
  });

  it('金额 <= 0 校验失败', () => {
    expect(validateAssignAmount(0, TOTAL)).toEqual({ valid: false, message: '指派金额必须大于0' });
    expect(validateAssignAmount(-100, TOTAL)).toEqual({ valid: false, message: '指派金额必须大于0' });
  });

  it('低于订单总额 30% 校验失败', () => {
    const min = TOTAL * MIN_ASSIGN_AMOUNT_RATIO;
    const result = validateAssignAmount(299, TOTAL);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('不能低于');
    expect(result.message).toContain(min.toFixed(2));
  });

  it('等于最低比例边界（30%）校验通过', () => {
    const result = validateAssignAmount(TOTAL * MIN_ASSIGN_AMOUNT_RATIO, TOTAL);
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(300);
  });

  it('高于客户下单金额（100%）校验失败', () => {
    const result = validateAssignAmount(1001, TOTAL);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('不能大于客户下单金额');
  });

  it('等于最高比例边界（100%）校验通过', () => {
    const result = validateAssignAmount(TOTAL * MAX_ASSIGN_AMOUNT_RATIO, TOTAL);
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(1000);
  });

  it('金额四舍五入到两位小数', () => {
    const result = validateAssignAmount(750.456, TOTAL);
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(750.46);
  });

  it('支持自定义 minRatio / maxRatio', () => {
    expect(validateAssignAmount(400, TOTAL, { minRatio: 0.5 }).valid).toBe(false);
    expect(validateAssignAmount(500, TOTAL, { minRatio: 0.5 }).valid).toBe(true);
    expect(validateAssignAmount(950, TOTAL, { maxRatio: 0.9 }).valid).toBe(false);
    expect(validateAssignAmount(900, TOTAL, { maxRatio: 0.9 }).valid).toBe(true);
  });
});

describe('指派金额 - OrderService.assign', () => {
  beforeEach(() => {
    resetOrderState([
      buildOrder({ id: 'ORD-A', orderNo: 'XS-A', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' }),
      buildOrder({ id: 'ORD-B', orderNo: 'XS-B', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'assigned', assignee: '王五', assignAmount: 800 })
    ]);
  });

  it('正常指派：写入指派人/指派金额/阶段，并记录操作日志', () => {
    const order = OrderService.assign({ orderId: 'ORD-A', assignee: '张三', assignAmount: 800 });
    expect(order).not.toBeNull();
    expect(order!.assignee).toBe('张三');
    expect(order!.assignAmount).toBe(800);
    expect(order!.assignStage).toBe('assigned');
    expect(order!.isHqTakeover).toBeFalsy();

    const logs = OrderService.getOperationLogs('ORD-A');
    const last = logs[logs.length - 1];
    expect(last.operationType).toBe('assign');
    expect(last.afterValue?.startsWith('张三')).toBe(true);
    expect(last.remark).toContain('指派金额 ¥800.00');
  });

  it('指派给「总部兜底」时 isHqTakeover 标记为 true', () => {
    const order = OrderService.assign({ orderId: 'ORD-A', assignee: ASSIGNEE_HQ_TAKEOVER, assignAmount: 800 });
    expect(order!.assignee).toBe(ASSIGNEE_HQ_TAKEOVER);
    expect(order!.isHqTakeover).toBe(true);
  });

  it('未传指派金额时抛出 ValidationError', () => {
    expect(() => OrderService.assign({ orderId: 'ORD-A', assignee: '张三' } as any)).toThrow(ValidationError);
    expect(() => OrderService.assign({ orderId: 'ORD-A', assignee: '张三' } as any)).toThrow('请输入指派金额');
  });

  it('指派金额低于下限抛出 ValidationError', () => {
    expect(() => OrderService.assign({ orderId: 'ORD-A', assignee: '张三', assignAmount: 100 })).toThrow(ValidationError);
    expect(() => OrderService.assign({ orderId: 'ORD-A', assignee: '张三', assignAmount: 100 })).toThrow('不能低于');
  });

  it('指派金额超过上限抛出 ValidationError', () => {
    expect(() => OrderService.assign({ orderId: 'ORD-A', assignee: '张三', assignAmount: 2000 })).toThrow(ValidationError);
  });

  it('订单不存在时返回 null', () => {
    expect(OrderService.assign({ orderId: 'NOT-EXIST', assignee: '张三', assignAmount: 800 })).toBeNull();
  });

  it('改派：已指派订单再次指派记录为 reassign', () => {
    const order = OrderService.assign({ orderId: 'ORD-B', assignee: '李四', assignAmount: 900 });
    expect(order!.assignee).toBe('李四');
    expect(order!.assignAmount).toBe(900);
    const logs = OrderService.getOperationLogs('ORD-B');
    const last = logs[logs.length - 1];
    expect(last.operationType).toBe('reassign');
    expect(last.beforeValue).toBe('王五');
    expect(last.remark).toContain('改派');
  });
});

describe('指派金额 - OrderService.batchAssign', () => {
  beforeEach(() => {
    resetOrderState([
      buildOrder({ id: 'ORD-1', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' }),
      buildOrder({ id: 'ORD-2', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' }),
      buildOrder({ id: 'ORD-3', totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'store_rejected' })
    ]);
  });

  it('未传金额时默认按订单总额 80% 指派，全部成功', () => {
    const result = OrderService.batchAssign(['ORD-1', 'ORD-2'], '张三');
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);

    const o1 = OrderService.findById('ORD-1');
    expect(o1!.assignee).toBe('张三');
    expect(o1!.assignAmount).toBe(800);
    expect(o1!.assignStage).toBe('assigned');
  });

  it('显式传入有效金额时按该金额指派', () => {
    const result = OrderService.batchAssign(['ORD-1'], '李四', 700);
    expect(result.success).toBe(1);
    expect(OrderService.findById('ORD-1')!.assignAmount).toBe(700);
  });

  it('显式传入无效金额时记为失败并返回错误信息', () => {
    const result = OrderService.batchAssign(['ORD-1', 'ORD-2'], '张三', 100);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.errors[0].orderId).toBe('ORD-1');
    expect(result.errors[0].message).toContain('不能低于');
  });

  it('门店拒单阶段订单不允许再次指派，记为失败', () => {
    const result = OrderService.batchAssign(['ORD-3'], '张三', 800);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].orderId).toBe('ORD-3');
    expect(result.errors[0].message).toContain('不允许执行此操作');
  });

  it('不存在的订单记为失败', () => {
    const result = OrderService.batchAssign(['ORD-1', 'NOT-EXIST'], '张三', 800);
    expect(result.success).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0].orderId).toBe('NOT-EXIST');
    expect(result.errors[0].message).toBe('订单不存在');
  });
});
