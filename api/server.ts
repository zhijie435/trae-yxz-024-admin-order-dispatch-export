import express from 'express';
import cors from 'cors';
import path from 'path';
import { OrderService, ValidationError } from './services/OrderService';
import {
  OrderFilterParams,
  AssignOrderParams,
  CrossCityAssignParams,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PLATFORM_LABELS,
  PAYMENT_METHOD_LABELS,
  ASSIGNEES,
  SOURCE_CHANNELS,
  ASSIGN_STAGE_LABELS,
  CITIES,
  OrderType,
  OrderStatus,
  LeaseStatus,
  Platform,
  PaymentMethod,
  AssignStage
} from './types/order';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

interface BatchAssignParams {
  orderIds: string[];
  assignee: string;
}

function parseFilterParams(query: any): OrderFilterParams {
  return {
    keyword: query.keyword as string | undefined,
    type: (query.type as OrderType | 'all') || 'all',
    status: (query.status as OrderStatus | 'all') || 'all',
    leaseStatus: (query.leaseStatus as LeaseStatus | 'all') || 'all',
    platform: (query.platform as Platform | 'all') || 'all',
    paymentMethod: (query.paymentMethod as PaymentMethod | 'all') || 'all',
    assignee: query.assignee as string | undefined,
    sourceChannel: query.sourceChannel as string | undefined,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
    minAmount: query.minAmount ? parseFloat(query.minAmount as string) : undefined,
    maxAmount: query.maxAmount ? parseFloat(query.maxAmount as string) : undefined,
    assignStage: (query.assignStage as AssignStage | 'all') || 'all',
    city: query.city as string | undefined,
    isCrossCityAssign: query.isCrossCityAssign === 'true' ? true : query.isCrossCityAssign === 'false' ? false : undefined,
    page: query.page ? parseInt(query.page as string) : 1,
    pageSize: query.pageSize ? parseInt(query.pageSize as string) : 20,
    sortField: (query.sortField as string) || 'createTime',
    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc'
  };
}

app.get('/api/orders', (req, res) => {
  try {
    const params = parseFilterParams(req.query);
    const result = OrderService.findAll(params);
    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ code: 500, message: '获取订单列表失败' });
  }
});

app.get('/api/orders/statistics', (_req, res) => {
  try {
    const stats = OrderService.getStatistics();
    res.json({ code: 0, message: 'success', data: stats });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ code: 500, message: '获取统计数据失败' });
  }
});

app.get('/api/orders/stats', (_req, res) => {
  try {
    const stats = OrderService.getStatistics();
    res.json({ code: 0, message: 'success', data: stats });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ code: 500, message: '获取统计数据失败' });
  }
});

app.get('/api/orders/export/excel', (req, res) => {
  try {
    const params = parseFilterParams(req.query);
    const buffer = OrderService.exportToExcel(params);
    const filename = `订单列表_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出Excel失败:', error);
    res.status(500).json({ code: 500, message: '导出Excel失败' });
  }
});

app.post('/api/orders/assign', (req, res) => {
  try {
    const { orderId, assignee, assignAmount } = req.body as AssignOrderParams;
    if (!orderId || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.assign({ orderId, assignee, assignAmount });
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '指派成功', data: order });
  } catch (error) {
    console.error('指派订单失败:', error);
    res.status(500).json({ code: 500, message: '指派订单失败' });
  }
});

app.put('/api/orders/:id/assign', (req, res) => {
  try {
    const { assignee, assignAmount } = req.body as { assignee: string; assignAmount?: number };
    const orderId = req.params.id;
    if (!orderId || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.assign({ orderId, assignee, assignAmount });
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '指派成功', data: order });
  } catch (error) {
    console.error('指派订单失败:', error);
    res.status(500).json({ code: 500, message: '指派订单失败' });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body as { status: OrderStatus };
    const orderId = req.params.id;
    if (!orderId || !status) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    const order = OrderService.updateStatus(orderId, status);
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '状态更新成功', data: order });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ code: 500, message: '更新订单状态失败' });
  }
});

app.put('/api/orders/:id/reject', (req, res) => {
  try {
    const { reason } = req.body as { reason: string };
    const orderId = req.params.id;
    if (!orderId) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.rejectByStore(orderId, reason);
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '拒单成功', data: order });
  } catch (error) {
    console.error('门店拒单失败:', error);
    res.status(500).json({ code: 500, message: '门店拒单失败' });
  }
});

app.put('/api/orders/:id/hq-takeover', (req, res) => {
  try {
    const { assignAmount } = req.body as { assignAmount: number };
    const orderId = req.params.id;
    if (!orderId) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.hqTakeover(orderId, assignAmount);
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '总部兜底接单成功', data: order });
  } catch (error) {
    console.error('总部兜底接单失败:', error);
    res.status(500).json({ code: 500, message: '总部兜底接单失败' });
  }
});

app.put('/api/orders/:id/hq-transfer', (req, res) => {
  try {
    const { assignee, assignAmount } = req.body as { assignee: string; assignAmount: number };
    const orderId = req.params.id;
    if (!orderId || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.hqTransfer(orderId, assignee, assignAmount);
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '总部转派成功', data: order });
  } catch (error) {
    console.error('总部转派失败:', error);
    res.status(500).json({ code: 500, message: '总部转派失败' });
  }
});

app.put('/api/orders/:id/hq-cancel', (req, res) => {
  try {
    const { reason } = req.body as { reason: string };
    const orderId = req.params.id;
    if (!orderId) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.hqCancel(orderId, reason);
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '沟通取消成功', data: order });
  } catch (error) {
    console.error('沟通取消失败:', error);
    res.status(500).json({ code: 500, message: '沟通取消失败' });
  }
});

app.post('/api/orders/cross-city-assign', (req, res) => {
  try {
    const params = req.body as CrossCityAssignParams;
    if (!params.orderId || !params.assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.crossCityAssign(params);
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '跨城市指派成功', data: order });
  } catch (error) {
    console.error('跨城市指派失败:', error);
    res.status(500).json({ code: 500, message: '跨城市指派失败' });
  }
});

app.put('/api/orders/:id/cross-city-assign', (req, res) => {
  try {
    const { assignee, assignAmount, allowCrossCity, crossCitySurchargeRate } = req.body as Omit<CrossCityAssignParams, 'orderId'>;
    const orderId = req.params.id;
    if (!orderId || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    let order;
    try {
      order = OrderService.crossCityAssign({
        orderId,
        assignee,
        assignAmount,
        allowCrossCity,
        crossCitySurchargeRate
      });
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({ code: 400, message: e.message });
        return;
      }
      throw e;
    }
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: '跨城市指派成功', data: order });
  } catch (error) {
    console.error('跨城市指派失败:', error);
    res.status(500).json({ code: 500, message: '跨城市指派失败' });
  }
});

interface BatchAssignParamsV2 extends BatchAssignParams {
  assignAmount?: number;
}

app.post('/api/orders/batch-assign', (req, res) => {
  try {
    const { orderIds, assignee, assignAmount } = req.body as BatchAssignParamsV2;
    if (!orderIds || orderIds.length === 0 || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    const result = OrderService.batchAssign(orderIds, assignee, assignAmount);
    res.json({
      code: 0,
      message: `批量指派完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
      data: result
    });
  } catch (error) {
    console.error('批量指派失败:', error);
    res.status(500).json({ code: 500, message: '批量指派失败' });
  }
});

app.post('/api/orders/batch/assign', (req, res) => {
  try {
    const { ids, assignee, assignAmount } = req.body as { ids: string[]; assignee: string; assignAmount?: number };
    if (!ids || ids.length === 0 || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    const result = OrderService.batchAssign(ids, assignee, assignAmount);
    res.json({
      code: 0,
      message: `批量指派完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
      data: result
    });
  } catch (error) {
    console.error('批量指派失败:', error);
    res.status(500).json({ code: 500, message: '批量指派失败' });
  }
});

app.get('/api/assignees', (req, res) => {
  try {
    const { city } = req.query;
    const assignees = OrderService.getAssigneesByCity(city as string | undefined);
    res.json({ code: 0, message: 'success', data: assignees });
  } catch (error) {
    console.error('获取指派人列表失败:', error);
    res.status(500).json({ code: 500, message: '获取指派人列表失败' });
  }
});

app.get('/api/orders/:id/detail', (req, res) => {
  try {
    const detail = OrderService.getOrderDetail(req.params.id);
    if (!detail) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: 'success', data: detail });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ code: 500, message: '获取订单详情失败' });
  }
});

app.get('/api/orders/:id/logs', (req, res) => {
  try {
    const order = OrderService.findById(req.params.id);
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    const logs = OrderService.getOperationLogs(req.params.id);
    res.json({ code: 0, message: 'success', data: logs });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ code: 500, message: '获取操作日志失败' });
  }
});

app.get('/api/orders/:id/export', (req, res) => {
  try {
    const buffer = OrderService.exportOrderDetail(req.params.id);
    if (!buffer) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    const order = OrderService.findById(req.params.id);
    const orderNo = order ? order.orderNo : req.params.id;
    const filename = `订单详情_${orderNo}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出订单详情失败:', error);
    res.status(500).json({ code: 500, message: '导出订单详情失败' });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = OrderService.findById(req.params.id);
    if (!order) {
      res.status(404).json({ code: 404, message: '订单不存在' });
      return;
    }
    res.json({ code: 0, message: 'success', data: order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ code: 500, message: '获取订单详情失败' });
  }
});

function transformOptions(record: Record<string, string>): Array<{ value: string; label: string }> {
  return Object.entries(record).map(([value, label]) => ({ value, label }));
}

function transformList(list: string[]): Array<{ value: string; label: string }> {
  return list.map(item => ({ value: item, label: item }));
}

app.get('/api/constants', (_req, res) => {
  const options = {
    orderTypes: transformOptions(ORDER_TYPE_LABELS),
    orderStatuses: transformOptions(ORDER_STATUS_LABELS),
    leaseStatuses: transformOptions(LEASE_STATUS_LABELS),
    platforms: transformOptions(PLATFORM_LABELS),
    paymentMethods: transformOptions(PAYMENT_METHOD_LABELS),
    assignees: transformList(ASSIGNEES),
    sourceChannels: transformList(SOURCE_CHANNELS),
    cities: transformList(CITIES),
    assignStages: transformOptions(ASSIGN_STAGE_LABELS)
  };

  res.json({
    code: 0,
    message: 'success',
    data: options
  });
});

app.get('/api/orders/options/enums', (_req, res) => {
  const options = {
    orderTypes: transformOptions(ORDER_TYPE_LABELS),
    orderStatuses: transformOptions(ORDER_STATUS_LABELS),
    leaseStatuses: transformOptions(LEASE_STATUS_LABELS),
    platforms: transformOptions(PLATFORM_LABELS),
    paymentMethods: transformOptions(PAYMENT_METHOD_LABELS),
    assignees: transformList(ASSIGNEES),
    sourceChannels: transformList(SOURCE_CHANNELS),
    assignStages: transformOptions(ASSIGN_STAGE_LABELS),
    cities: transformList(CITIES)
  };

  res.json({
    code: 0,
    message: 'success',
    data: options
  });
});

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

const clientIndex = path.join(__dirname, '..', 'client', 'dist', 'index.html');
app.get('*', (_req, res) => {
  res.sendFile(clientIndex, (err) => {
    if (err) {
      res.status(404).json({ code: 404, message: '资源不存在，前端未构建或接口路径错误' });
    }
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         订单管理后台服务已启动                              ║
╠════════════════════════════════════════════════════════════╣
║  后端服务地址:  http://localhost:${PORT}                     ║
║  API文档:       http://localhost:${PORT}/api/constants      ║
║  订单列表:       http://localhost:${PORT}/api/orders         ║
║  统计数据:       http://localhost:${PORT}/api/orders/statistics ║
╚════════════════════════════════════════════════════════════╝
  `);
});
