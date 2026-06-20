import { Order, AssignValidationResult, CrossCityAssignParams } from '../types/order';

export const DEFAULT_CROSS_CITY_SURCHARGE_RATE = 0.15;
export const MIN_ASSIGN_AMOUNT_RATIO = 0.3;
export const MAX_ASSIGN_AMOUNT_RATIO = 1.0;

export function validateAssignAmount(
  assignAmount: number | undefined | null,
  orderTotalAmount: number,
  options: {
    minRatio?: number;
    maxRatio?: number;
  } = {}
): AssignValidationResult {
  const { minRatio = MIN_ASSIGN_AMOUNT_RATIO, maxRatio = MAX_ASSIGN_AMOUNT_RATIO } = options;

  if (assignAmount === undefined || assignAmount === null) {
    return { valid: false, message: '请输入指派金额' };
  }

  const amount = Number(assignAmount);
  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    return { valid: false, message: '请输入有效的数字金额' };
  }

  if (amount <= 0) {
    return { valid: false, message: '指派金额必须大于0' };
  }

  const minAmount = orderTotalAmount * minRatio;
  const maxAmount = orderTotalAmount * maxRatio;

  if (amount < minAmount) {
    return {
      valid: false,
      message: `指派金额不能低于订单总额的 ${(minRatio * 100).toFixed(0)}%（¥${minAmount.toFixed(2)}）`
    };
  }

  if (amount > maxAmount) {
    return {
      valid: false,
      message: `指派金额不能大于客户下单金额（¥${orderTotalAmount.toFixed(2)}）`
    };
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  return { valid: true, amount: roundedAmount };
}

export function validateCrossCityAssign(
  params: CrossCityAssignParams,
  orderCity: string,
  assigneeCity: string,
  orderTotalAmount: number
): AssignValidationResult & { adjustedAmount?: number; isCrossCity?: boolean } {
  const isCrossCity = orderCity !== assigneeCity;

  if (isCrossCity && !params.allowCrossCity) {
    return {
      valid: false,
      message: `订单所在城市（${orderCity}）与指派人所在城市（${assigneeCity}）不一致，请开启跨城市指派`,
      isCrossCity: true
    };
  }

  const baseValidation = validateAssignAmount(params.assignAmount, orderTotalAmount);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  let adjustedAmount = baseValidation.amount!;

  if (isCrossCity && params.allowCrossCity) {
    const surchargeRate = params.crossCitySurchargeRate ?? DEFAULT_CROSS_CITY_SURCHARGE_RATE;
    const surcharge = adjustedAmount * surchargeRate;
    adjustedAmount = Math.round((adjustedAmount + surcharge) * 100) / 100;

    if (adjustedAmount > orderTotalAmount) {
      return {
        valid: false,
        message: `跨城市附加费后金额（¥${adjustedAmount.toFixed(2)}）不能大于客户下单金额（¥${orderTotalAmount.toFixed(2)}），请降低指派金额或附加费率`
      };
    }
  }

  return {
    valid: true,
    amount: baseValidation.amount,
    adjustedAmount,
    isCrossCity
  };
}

export function validateStageTransition(
  currentStage: string | undefined,
  targetStage: string,
  allowedTransitions: Record<string, string[]>
): boolean {
  if (!currentStage) {
    return allowedTransitions['pending_assign']?.includes(targetStage) ?? false;
  }
  return allowedTransitions[currentStage]?.includes(targetStage) ?? false;
}

export const ASSIGN_STAGE_TRANSITIONS: Record<string, string[]> = {
  pending_assign: ['assigned'],
  assigned: ['assigned', 'store_rejected', 'hq_handled'],
  store_rejected: ['hq_handled'],
  hq_handled: ['assigned', 'hq_handled']
};
