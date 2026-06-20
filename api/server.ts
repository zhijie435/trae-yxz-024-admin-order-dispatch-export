import express from 'express';
import cors from 'cors';
import path from 'path';
import { OrderService } from './services/OrderService';
import {
  OrderFilterParams,
  AssignOrderParams,
  ORDER_STATUS_LABELS,
  LEASE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PLATFORM_LABELS,
  PAYMENT_METHOD_LABELS,
  ASSIGNEES,
  SOURCE_CHANNELS,
  OrderType,
  OrderStatus,
  LeaseStatus,
  Platform,
  PaymentMethod
} from './types/order';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

interface BatchAssignParams {
  orderIds: string[];
  assignee: string;
}

app.get('/api/orders', (req, res) => {
  try {
    const query = req.query;
    const params: OrderFilterParams = {
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
      page: query.page ? parseInt(query.page as string) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize as string) : 20,
      sortField: (query.sortField as string) || 'createTime',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc'
    };

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

app.get('/api/orders/export/excel', (req, res) => {
  try {
    const query = req.query;
    const params: OrderFilterParams = {
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
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount as string) : undefined
    };

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
    const { orderId, assignee } = req.body as AssignOrderParams;
    if (!orderId || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    const order = OrderService.assign({ orderId, assignee });
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

app.post('/api/orders/batch-assign', (req, res) => {
  try {
    const { orderIds, assignee } = req.body as BatchAssignParams;
    if (!orderIds || orderIds.length === 0 || !assignee) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    const result = OrderService.batchAssign(orderIds, assignee);
    res.json({ code: 0, message: `批量指派完成：成功 ${result.success} 条，失败 ${result.failed} 条`, data: result });
  } catch (error) {
    console.error('批量指派失败:', error);
    res.status(500).json({ code: 500, message: '批量指派失败' });
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

app.get('/api/constants', (_req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      orderTypes: ORDER_TYPE_LABELS,
      orderStatuses: ORDER_STATUS_LABELS,
      leaseStatuses: LEASE_STATUS_LABELS,
      platforms: PLATFORM_LABELS,
      paymentMethods: PAYMENT_METHOD_LABELS,
      assignees: ASSIGNEES,
      sourceChannels: SOURCE_CHANNELS
    }
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
