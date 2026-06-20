import { Router, Request, Response } from 'express';
import { OrderFilter, PaginationParams, OrderStatus } from '../types/order';
import { getOrders, getOrderById, getOrderStats, exportOrdersToExcel, assignOrder, updateOrderStatus } from '../services/orderService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const filter: OrderFilter = {
      type: req.query.type as OrderFilter['type'],
      status: req.query.status as OrderFilter['status'],
      platform: req.query.platform as OrderFilter['platform'],
      paymentMethod: req.query.paymentMethod as OrderFilter['paymentMethod'],
      orderNo: req.query.orderNo as string,
      customerName: req.query.customerName as string,
      customerPhone: req.query.customerPhone as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      assignee: req.query.assignee as string,
      leaseStatus: req.query.leaseStatus as OrderFilter['leaseStatus']
    };

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      sortField: req.query.sortField as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = getOrders(filter, pagination);
    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = getOrderStats();
    res.json({
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        code: 404,
        message: 'Order not found'
      });
    }
    res.json({
      code: 200,
      message: 'success',
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

router.get('/export/excel', (req: Request, res: Response) => {
  try {
    const filter: OrderFilter = {
      type: req.query.type as OrderFilter['type'],
      status: req.query.status as OrderFilter['status'],
      platform: req.query.platform as OrderFilter['platform'],
      paymentMethod: req.query.paymentMethod as OrderFilter['paymentMethod'],
      orderNo: req.query.orderNo as string,
      customerName: req.query.customerName as string,
      customerPhone: req.query.customerPhone as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      assignee: req.query.assignee as string,
      leaseStatus: req.query.leaseStatus as OrderFilter['leaseStatus']
    };

    const buffer = exportOrdersToExcel(filter);
    const filename = `订单列表_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export excel error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

router.put('/:id/assign', (req: Request, res: Response) => {
  try {
    const { assignee } = req.body;
    if (!assignee) {
      return res.status(400).json({
        code: 400,
        message: 'Assignee is required'
      });
    }

    const order = assignOrder(req.params.id, assignee);
    if (!order) {
      return res.status(404).json({
        code: 404,
        message: 'Order not found'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: order
    });
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

router.put('/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        code: 400,
        message: 'Status is required'
      });
    }

    const order = updateOrderStatus(req.params.id, status as OrderStatus);
    if (!order) {
      return res.status(404).json({
        code: 404,
        message: 'Order not found'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error'
    });
  }
});

router.get('/options/enums', (req: Request, res: Response) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      orderTypes: [
        { value: 'lease', label: '租赁单' },
        { value: 'sale', label: '销售单' }
      ],
      orderStatuses: [
        { value: 'pending_payment', label: '待付款' },
        { value: 'paid', label: '已付款' },
        { value: 'processing', label: '处理中' },
        { value: 'shipped', label: '已发货' },
        { value: 'delivered', label: '已送达' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
        { value: 'refunded', label: '已退款' }
      ],
      leaseStatuses: [
        { value: 'pending_shipment', label: '待发货' },
        { value: 'shipped', label: '已发货' },
        { value: 'in_use', label: '使用中' },
        { value: 'returning', label: '归还中' },
        { value: 'returned', label: '已归还' },
        { value: 'completed', label: '已完成' },
        { value: 'overdue', label: '已逾期' }
      ],
      platforms: [
        { value: 'official_website', label: '官网' },
        { value: 'wechat_mini', label: '微信小程序' },
        { value: 'taobao', label: '淘宝' },
        { value: 'jd', label: '京东' },
        { value: 'pinduoduo', label: '拼多多' },
        { value: 'douyin', label: '抖音' },
        { value: 'offline_store', label: '线下门店' }
      ],
      paymentMethods: [
        { value: 'alipay', label: '支付宝' },
        { value: 'wechat', label: '微信支付' },
        { value: 'bank_transfer', label: '银行转账' },
        { value: 'credit_card', label: '信用卡' },
        { value: 'cash', label: '现金' }
      ],
      assignees: [
        { value: '张三', label: '张三' },
        { value: '李四', label: '李四' },
        { value: '王五', label: '王五' },
        { value: '赵六', label: '赵六' },
        { value: '钱七', label: '钱七' },
        { value: '孙八', label: '孙八' },
        { value: '周九', label: '周九' },
        { value: '吴十', label: '吴十' },
        { value: '郑十一', label: '郑十一' },
        { value: '王十二', label: '王十二' },
        { value: '未指派', label: '未指派' }
      ],
      sourceChannels: [
        { value: '搜索引擎', label: '搜索引擎' },
        { value: '社交媒体', label: '社交媒体' },
        { value: '朋友推荐', label: '朋友推荐' },
        { value: '线下展会', label: '线下展会' },
        { value: '广告投放', label: '广告投放' },
        { value: '老客户', label: '老客户' },
        { value: '自然流量', label: '自然流量' },
        { value: '合作伙伴', label: '合作伙伴' }
      ]
    }
  });
});

export default router;
