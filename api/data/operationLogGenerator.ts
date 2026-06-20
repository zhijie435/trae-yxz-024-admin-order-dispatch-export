import {
  Order,
  OperationLog,
  OperationType,
  OPERATION_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS
} from '../types/order';

let logIdCounter = 0;

function nextLogId(): string {
  logIdCounter += 1;
  return 'LOG' + Date.now() + String(logIdCounter).padStart(4, '0');
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function offsetTime(baseTime: string, offsetMinutes: number): string {
  const d = new Date(baseTime);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString();
}

function buildLog(
  order: Order,
  type: OperationType,
  operateTime: string,
  operator: string,
  operatorRole: string,
  beforeValue: string | undefined,
  afterValue: string,
  remark: string | undefined
): OperationLog {
  return {
    id: nextLogId(),
    orderId: order.id,
    orderNo: order.orderNo,
    operationType: type,
    operationName: OPERATION_TYPE_LABELS[type],
    operator,
    operatorRole,
    operateTime,
    beforeValue,
    afterValue,
    remark
  };
}

const STATUS_FLOW: { status: Order['status']; type: OperationType; role: string }[] = [
  { status: 'pending_payment', type: 'create', role: '系统' },
  { status: 'paid', type: 'pay', role: '财务' },
  { status: 'processing', type: 'process', role: '运营' },
  { status: 'shipped', type: 'ship', role: '仓管' },
  { status: 'delivered', type: 'deliver', role: '仓管' },
  { status: 'completed', type: 'complete', role: '系统' }
];

const STATUS_INDEX: Record<Order['status'], number> = {
  pending_payment: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  completed: 5,
  cancelled: 5,
  refunded: 5
};

export function generateOperationLogs(orders: Order[]): Map<string, OperationLog[]> {
  const logMap = new Map<string, OperationLog[]>();

  orders.forEach(order => {
    const logs: OperationLog[] = [];
    const create = order.createTime;
    const assignee = order.assignee && order.assignee !== '未指派' ? order.assignee : pick(['张三', '李四', '王五']);

    logs.push(
      buildLog(
        order,
        'create',
        create,
        '系统',
        '系统',
        undefined,
        `订单 ${order.orderNo} 已创建`,
        `订单类型：${order.type === 'lease' ? '租赁单' : '销售单'}，来源平台：${order.platform}，商品 ${order.products.length} 件`
      )
    );

    const reachedIndex = STATUS_INDEX[order.status];

    if (reachedIndex >= 1 && order.paymentTime) {
      const payTime = order.paymentTime;
      logs.push(
        buildLog(
          order,
          'pay',
          payTime,
          '系统',
          '财务',
          ORDER_STATUS_LABELS.pending_payment,
          ORDER_STATUS_LABELS.paid,
          `支付方式：${order.paymentMethod}，实付金额 ¥${order.paidAmount.toFixed(2)}`
        )
      );

      logs.push(
        buildLog(
          order,
          'assign',
          offsetTime(payTime, 30 + Math.floor(Math.random() * 120)),
          assignee,
          '运营',
          '未指派',
          assignee,
          `订单指派给 ${assignee} 负责跟进`
        )
      );
    }

    if (reachedIndex >= 2) {
      const t = offsetTime(order.paymentTime || create, 180 + Math.floor(Math.random() * 480));
      logs.push(
        buildLog(
          order,
          'process',
          t,
          assignee,
          '运营',
          ORDER_STATUS_LABELS.paid,
          ORDER_STATUS_LABELS.processing,
          '开始备货处理'
        )
      );
    }

    if (reachedIndex >= 3) {
      const t = offsetTime(order.paymentTime || create, 600 + Math.floor(Math.random() * 720));
      logs.push(
        buildLog(
          order,
          'ship',
          t,
          assignee,
          '仓管',
          ORDER_STATUS_LABELS.processing,
          ORDER_STATUS_LABELS.shipped,
          `已发货，物流单号 SF${Math.floor(Math.random() * 9000000000) + 1000000000}`
        )
      );
    }

    if (reachedIndex >= 4) {
      const t = offsetTime(order.paymentTime || create, 1440 + Math.floor(Math.random() * 1440));
      logs.push(
        buildLog(
          order,
          'deliver',
          t,
          pick(['张三', '李四', '王五']),
          '仓管',
          ORDER_STATUS_LABELS.shipped,
          ORDER_STATUS_LABELS.delivered,
          '客户已签收'
        )
      );
    }

    if (reachedIndex >= 5 && order.status === 'completed') {
      const t = offsetTime(order.paymentTime || create, 2880 + Math.floor(Math.random() * 1440));
      logs.push(
        buildLog(
          order,
          'complete',
          t,
          '系统',
          '系统',
          ORDER_STATUS_LABELS.delivered,
          ORDER_STATUS_LABELS.completed,
          '订单交易完成'
        )
      );
    }

    if (order.status === 'cancelled') {
      const t = offsetTime(create, 60 + Math.floor(Math.random() * 600));
      logs.push(
        buildLog(
          order,
          'cancel',
          t,
          pick(['赵六', '钱七']),
          '客服',
          ORDER_STATUS_LABELS.paid,
          ORDER_STATUS_LABELS.cancelled,
          '客户主动取消订单'
        )
      );
    }

    if (order.status === 'refunded') {
      const t = offsetTime(create, 120 + Math.floor(Math.random() * 720));
      logs.push(
        buildLog(
          order,
          'refund',
          t,
          '孙八',
          '财务',
          ORDER_STATUS_LABELS.paid,
          ORDER_STATUS_LABELS.refunded,
          `退款金额 ¥${order.paidAmount.toFixed(2)}，退款至原支付账户`
        )
      );
    }

    if (order.type === 'lease' && order.leaseInfo) {
      const leaseStart = order.leaseInfo.startDate;
      logs.push(
        buildLog(
          order,
          'lease_start',
          new Date(leaseStart).toISOString(),
          assignee,
          '运营',
          undefined,
          LEASE_STATUS_LABELS.in_use,
          `租赁期 ${order.leaseInfo.leasePeriod} ${
            order.leaseInfo.leaseUnit === 'day' ? '天' : order.leaseInfo.leaseUnit === 'month' ? '个月' : '年'
          }，月租金 ¥${order.leaseInfo.monthlyRent.toFixed(2)}`
        )
      );

      if (order.leaseInfo.leaseStatus === 'returned' || order.leaseInfo.leaseStatus === 'completed') {
        const t = new Date(order.leaseInfo.endDate).toISOString();
        logs.push(
          buildLog(
            order,
            'lease_return',
            t,
            assignee,
            '仓管',
            LEASE_STATUS_LABELS.in_use,
            LEASE_STATUS_LABELS.returned,
            '租赁物已归还，押金待核算'
          )
        );
      }

      if (order.leaseInfo.leaseStatus === 'overdue') {
        const overdueDate = new Date(order.leaseInfo.endDate);
        overdueDate.setDate(overdueDate.getDate() + 1);
        logs.push(
          buildLog(
            order,
            'lease_overdue',
            overdueDate.toISOString(),
            '系统',
            '系统',
            LEASE_STATUS_LABELS.in_use,
            LEASE_STATUS_LABELS.overdue,
            '租赁已逾期，请联系客户归还'
          )
        );
      }
    }

    if (order.remark) {
      logs.push(
        buildLog(
          order,
          'remark',
          offsetTime(create, 10 + Math.floor(Math.random() * 100)),
          '周九',
          '客服',
          undefined,
          order.remark,
          '客户备注信息已记录'
        )
      );
    }

    if (order.updateTime && order.updateTime !== create) {
      const upd = new Date(order.updateTime).getTime();
      const last = logs[logs.length - 1];
      if (!last || new Date(last.operateTime).getTime() < upd) {
        logs.push(
          buildLog(
            order,
            'remark',
            order.updateTime,
            '系统',
            '系统',
            undefined,
            '订单信息更新',
            '订单数据同步更新'
          )
        );
      }
    }

    logs.sort((a, b) => new Date(a.operateTime).getTime() - new Date(b.operateTime).getTime());
    logMap.set(order.id, logs);
  });

  return logMap;
}
