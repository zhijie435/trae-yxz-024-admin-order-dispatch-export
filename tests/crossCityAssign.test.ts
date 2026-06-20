import {
  validateCrossCityAssign,
  DEFAULT_CROSS_CITY_SURCHARGE_RATE
} from '../api/validators/orderValidator';
import { OrderService, ValidationError, resetOrderState } from '../api/services/OrderService';
import { assignees, getAssigneeCity } from '../api/data/assigneeData';
import { CITIES, ASSIGNEE_HQ_TAKEOVER, CrossCityAssignParams } from '../api/types/order';
import { buildOrder } from './fixtures';

const TOTAL = 1000;

const sampleAssignee = assignees.find(a => a.name !== ASSIGNEE_HQ_TAKEOVER)!;
const assigneeCity = getAssigneeCity(sampleAssignee.name)!;
const otherCity = CITIES.find(c => c !== assigneeCity)!;

describe('跨城市派单校验 - validateCrossCityAssign', () => {
  const baseParams = (over: Partial<CrossCityAssignParams> = {}): CrossCityAssignParams => ({
    orderId: 'ORD-X',
    assignee: sampleAssignee.name,
    assignAmount: 800,
    ...over
  });

  it('同城指派：不附加跨城费用', () => {
    const result = validateCrossCityAssign(baseParams(), assigneeCity, assigneeCity, TOTAL);
    expect(result.valid).toBe(true);
    expect(result.isCrossCity).toBe(false);
    expect(result.adjustedAmount).toBe(800);
    expect(result.amount).toBe(800);
  });

  it('跨城但未开启跨城市指派：校验失败并提示开启', () => {
    const result = validateCrossCityAssign(
      baseParams({ allowCrossCity: false }),
      assigneeCity,
      otherCity,
      TOTAL
    );
    expect(result.valid).toBe(false);
    expect(result.isCrossCity).toBe(true);
    expect(result.message).toContain('请开启跨城市指派');
    expect(result.message).toContain(assigneeCity);
    expect(result.message).toContain(otherCity);
  });

  it('跨城开启：按默认 15% 附加费率计算附加费', () => {
    const result = validateCrossCityAssign(
      baseParams({ allowCrossCity: true }),
      assigneeCity,
      otherCity,
      TOTAL
    );
    expect(result.valid).toBe(true);
    expect(result.isCrossCity).toBe(true);
    expect(result.amount).toBe(800);
    expect(result.adjustedAmount).toBe(Math.round((800 + 800 * DEFAULT_CROSS_CITY_SURCHARGE_RATE) * 100) / 100);
    expect(result.adjustedAmount).toBe(920);
  });

  it('跨城开启：支持自定义附加费率', () => {
    const result = validateCrossCityAssign(
      baseParams({ allowCrossCity: true, crossCitySurchargeRate: 0.1 }),
      assigneeCity,
      otherCity,
      TOTAL
    );
    expect(result.valid).toBe(true);
    expect(result.adjustedAmount).toBe(880);
  });

  it('跨城附加费后金额超过订单总额：校验失败', () => {
    const result = validateCrossCityAssign(
      baseParams({ allowCrossCity: true, assignAmount: 950 }),
      assigneeCity,
      otherCity,
      TOTAL
    );
    expect(result.valid).toBe(false);
    expect(result.message).toContain('附加费后金额');
    expect(result.message).toContain('不能大于客户下单金额');
  });

  it('跨城校验先于金额校验：未开启跨城时即使金额无效也返回跨城提示', () => {
    const result = validateCrossCityAssign(
      baseParams({ allowCrossCity: false, assignAmount: 100 }),
      assigneeCity,
      otherCity,
      TOTAL
    );
    expect(result.valid).toBe(false);
    expect(result.message).toContain('请开启跨城市指派');
  });

  it('跨城开启但基础金额无效：返回金额校验错误', () => {
    const result = validateCrossCityAssign(
      baseParams({ allowCrossCity: true, assignAmount: undefined }),
      assigneeCity,
      otherCity,
      TOTAL
    );
    expect(result.valid).toBe(false);
    expect(result.message).toBe('请输入指派金额');
  });
});

describe('跨城市派单 - OrderService.crossCityAssign', () => {
  beforeEach(() => {
    resetOrderState([
      buildOrder({ id: 'ORD-CROSS-1', city: assigneeCity, totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' }),
      buildOrder({ id: 'ORD-CROSS-2', city: otherCity, totalAmount: TOTAL, paidAmount: TOTAL, assignStage: 'pending_assign' })
    ]);
  });

  it('同城指派：成功且 isCrossCityAssign 为 false，金额无附加费', () => {
    const order = OrderService.crossCityAssign({
      orderId: 'ORD-CROSS-1',
      assignee: sampleAssignee.name,
      assignAmount: 800,
      allowCrossCity: true
    });
    expect(order).not.toBeNull();
    expect(order!.assignee).toBe(sampleAssignee.name);
    expect(order!.assignAmount).toBe(800);
    expect(order!.isCrossCityAssign).toBe(false);
    expect(order!.assignStage).toBe('assigned');
  });

  it('跨城指派：成功且 isCrossCityAssign 为 true，金额含 15% 附加费', () => {
    const order = OrderService.crossCityAssign({
      orderId: 'ORD-CROSS-2',
      assignee: sampleAssignee.name,
      assignAmount: 800,
      allowCrossCity: true
    });
    expect(order).not.toBeNull();
    expect(order!.isCrossCityAssign).toBe(true);
    expect(order!.assignAmount).toBe(920);
  });

  it('跨城指派：自定义附加费率生效', () => {
    const order = OrderService.crossCityAssign({
      orderId: 'ORD-CROSS-2',
      assignee: sampleAssignee.name,
      assignAmount: 800,
      allowCrossCity: true,
      crossCitySurchargeRate: 0.1
    });
    expect(order!.assignAmount).toBe(880);
  });

  it('跨城未开启时抛出 ValidationError', () => {
    expect(() =>
      OrderService.crossCityAssign({
        orderId: 'ORD-CROSS-2',
        assignee: sampleAssignee.name,
        assignAmount: 800,
        allowCrossCity: false
      })
    ).toThrow(ValidationError);
    expect(() =>
      OrderService.crossCityAssign({
        orderId: 'ORD-CROSS-2',
        assignee: sampleAssignee.name,
        assignAmount: 800,
        allowCrossCity: false
      })
    ).toThrow('请开启跨城市指派');
  });

  it('跨城附加费后超出订单总额抛出 ValidationError', () => {
    expect(() =>
      OrderService.crossCityAssign({
        orderId: 'ORD-CROSS-2',
        assignee: sampleAssignee.name,
        assignAmount: 950,
        allowCrossCity: true
      })
    ).toThrow('附加费后金额');
  });

  it('订单不存在时返回 null', () => {
    expect(
      OrderService.crossCityAssign({
        orderId: 'NOT-EXIST',
        assignee: sampleAssignee.name,
        assignAmount: 800,
        allowCrossCity: true
      })
    ).toBeNull();
  });

  it('跨城指派成功后记录操作日志', () => {
    OrderService.crossCityAssign({
      orderId: 'ORD-CROSS-2',
      assignee: sampleAssignee.name,
      assignAmount: 800,
      allowCrossCity: true
    });
    const logs = OrderService.getOperationLogs('ORD-CROSS-2');
    const last = logs[logs.length - 1];
    expect(last.operationType).toBe('assign');
    expect(last.afterValue?.startsWith(sampleAssignee.name)).toBe(true);
    expect(last.remark).toContain('指派金额 ¥920.00');
  });
});
