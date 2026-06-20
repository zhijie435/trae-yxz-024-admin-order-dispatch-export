import { filterOrders, sortOrders, paginateOrders } from '../api/filters/orderFilter';
import { buildOrder, buildProduct, buildLeaseInfo } from './fixtures';
import { Order } from '../api/types/order';

describe('订单筛选 - filterOrders', () => {
  let orders: Order[];

  beforeEach(() => {
    orders = [
      buildOrder({
        orderNo: 'XS-001',
        type: 'sale',
        status: 'paid',
        platform: 'official_website',
        paymentMethod: 'alipay',
        assignee: '张三',
        sourceChannel: '搜索引擎',
        city: '北京市',
        totalAmount: 1000,
        paidAmount: 1000,
        createTime: '2024-01-01T10:00:00.000Z',
        assignStage: 'assigned',
        isCrossCityAssign: false,
        customer: {
          id: 'CUS-1', name: '张伟', phone: '13800000001',
          email: 'a@x.com', address: '北京市朝阳区路1号', city: '北京市'
        },
        products: [buildProduct({ name: 'iPhone 15', sku: 'ELEC-001', totalPrice: 1000 })]
      }),
      buildOrder({
        orderNo: 'ZL-002',
        type: 'lease',
        status: 'processing',
        platform: 'taobao',
        paymentMethod: 'wechat',
        assignee: '李四',
        sourceChannel: '社交媒体',
        city: '上海市',
        totalAmount: 2000,
        paidAmount: 2000,
        createTime: '2024-02-15T10:00:00.000Z',
        assignStage: 'assigned',
        isCrossCityAssign: true,
        leaseInfo: buildLeaseInfo({ leaseStatus: 'in_use' }),
        customer: {
          id: 'CUS-2', name: '李娜', phone: '13800000002',
          email: 'b@x.com', address: '上海市浦东新区路2号', city: '上海市'
        },
        products: [buildProduct({ name: 'MacBook Pro', sku: 'ELEC-002', totalPrice: 2000 })]
      }),
      buildOrder({
        orderNo: 'XS-003',
        type: 'sale',
        status: 'cancelled',
        platform: 'jd',
        paymentMethod: 'cash',
        sourceChannel: '朋友推荐',
        city: '广州市',
        totalAmount: 500,
        paidAmount: 500,
        createTime: '2024-03-20T10:00:00.000Z',
        assignStage: undefined,
        isCrossCityAssign: false,
        customer: {
          id: 'CUS-3', name: '王芳', phone: '13800000003',
          email: 'c@x.com', address: '广州市天河区路3号', city: '广州市'
        },
        products: [buildProduct({ name: 'iPad Air', sku: 'ELEC-003', totalPrice: 500 })]
      })
    ];
  });

  it('空参数（全部默认 all）返回全部订单', () => {
    expect(filterOrders(orders, {})).toHaveLength(3);
  });

  it('按订单类型筛选 lease / sale', () => {
    expect(filterOrders(orders, { type: 'lease' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    expect(filterOrders(orders, { type: 'sale' }).map(o => o.orderNo)).toEqual(['XS-001', 'XS-003']);
    expect(filterOrders(orders, { type: 'all' })).toHaveLength(3);
  });

  it('按订单状态筛选', () => {
    expect(filterOrders(orders, { status: 'cancelled' }).map(o => o.orderNo)).toEqual(['XS-003']);
    expect(filterOrders(orders, { status: 'paid' }).map(o => o.orderNo)).toEqual(['XS-001']);
  });

  it('按租赁状态筛选：无 leaseInfo 的订单在指定状态时被排除', () => {
    expect(filterOrders(orders, { leaseStatus: 'in_use' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    expect(filterOrders(orders, { leaseStatus: 'returned' })).toHaveLength(0);
    expect(filterOrders(orders, { leaseStatus: 'all' })).toHaveLength(3);
  });

  it('按来源平台筛选', () => {
    expect(filterOrders(orders, { platform: 'taobao' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    expect(filterOrders(orders, { platform: 'jd' }).map(o => o.orderNo)).toEqual(['XS-003']);
  });

  it('按支付方式筛选', () => {
    expect(filterOrders(orders, { paymentMethod: 'alipay' }).map(o => o.orderNo)).toEqual(['XS-001']);
    expect(filterOrders(orders, { paymentMethod: 'cash' }).map(o => o.orderNo)).toEqual(['XS-003']);
  });

  it('按指派人员筛选', () => {
    expect(filterOrders(orders, { assignee: '李四' }).map(o => o.orderNo)).toEqual(['ZL-002']);
  });

  it('按来源渠道筛选', () => {
    expect(filterOrders(orders, { sourceChannel: '社交媒体' }).map(o => o.orderNo)).toEqual(['ZL-002']);
  });

  it('按城市筛选', () => {
    expect(filterOrders(orders, { city: '上海市' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    expect(filterOrders(orders, { city: '北京市' }).map(o => o.orderNo)).toEqual(['XS-001']);
  });

  it('按跨城市指派筛选 true / false', () => {
    expect(filterOrders(orders, { isCrossCityAssign: true }).map(o => o.orderNo)).toEqual(['ZL-002']);
    expect(filterOrders(orders, { isCrossCityAssign: false }).map(o => o.orderNo)).toEqual(['XS-001', 'XS-003']);
  });

  it('按指派阶段筛选，未设置阶段默认按 pending_assign 处理', () => {
    expect(filterOrders(orders, { assignStage: 'assigned' }).map(o => o.orderNo)).toEqual(['XS-001', 'ZL-002']);
    expect(filterOrders(orders, { assignStage: 'pending_assign' }).map(o => o.orderNo)).toEqual(['XS-003']);
    expect(filterOrders(orders, { assignStage: 'all' })).toHaveLength(3);
  });

  it('按日期范围筛选：startDate 含边界，endDate 含当天到 23:59:59.999', () => {
    expect(filterOrders(orders, { startDate: '2024-02-01' }).map(o => o.orderNo)).toEqual(['ZL-002', 'XS-003']);
    expect(filterOrders(orders, { endDate: '2024-01-01' }).map(o => o.orderNo)).toEqual(['XS-001']);
    expect(filterOrders(orders, { startDate: '2024-01-01', endDate: '2024-02-15' }).map(o => o.orderNo)).toEqual(['XS-001', 'ZL-002']);
  });

  it('按实付金额范围筛选（基于 paidAmount）', () => {
    expect(filterOrders(orders, { minAmount: 1000 }).map(o => o.orderNo)).toEqual(['XS-001', 'ZL-002']);
    expect(filterOrders(orders, { maxAmount: 500 }).map(o => o.orderNo)).toEqual(['XS-003']);
    expect(filterOrders(orders, { minAmount: 600, maxAmount: 1500 }).map(o => o.orderNo)).toEqual(['XS-001']);
  });

  describe('关键词搜索（不区分大小写）', () => {
    it('匹配订单编号', () => {
      expect(filterOrders(orders, { keyword: 'zl-002' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    });

    it('匹配客户姓名', () => {
      expect(filterOrders(orders, { keyword: '张' }).map(o => o.orderNo)).toEqual(['XS-001']);
    });

    it('匹配客户电话', () => {
      expect(filterOrders(orders, { keyword: '13800000002' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    });

    it('匹配商品名称', () => {
      expect(filterOrders(orders, { keyword: 'macbook' }).map(o => o.orderNo)).toEqual(['ZL-002']);
    });

    it('匹配商品 SKU', () => {
      expect(filterOrders(orders, { keyword: 'elec-003' }).map(o => o.orderNo)).toEqual(['XS-003']);
    });
  });

  it('多条件组合筛选', () => {
    const result = filterOrders(orders, {
      type: 'lease',
      platform: 'taobao',
      city: '上海市',
      isCrossCityAssign: true
    });
    expect(result.map(o => o.orderNo)).toEqual(['ZL-002']);
  });

  it('多条件组合无匹配时返回空数组', () => {
    expect(filterOrders(orders, { type: 'sale', city: '上海市' })).toHaveLength(0);
  });
});

describe('订单排序 - sortOrders', () => {
  let orders: Order[];

  beforeEach(() => {
    orders = [
      buildOrder({ orderNo: 'B', paidAmount: 500, createTime: '2024-02-01T00:00:00.000Z',
        customer: { id: 'c1', name: '李', phone: '1', address: 'a', city: '北京市' } }),
      buildOrder({ orderNo: 'A', paidAmount: 1500, createTime: '2024-01-01T00:00:00.000Z',
        customer: { id: 'c2', name: '张', phone: '2', address: 'b', city: '北京市' } }),
      buildOrder({ orderNo: 'C', paidAmount: 1000, createTime: '2024-03-01T00:00:00.000Z',
        customer: { id: 'c3', name: '王', phone: '3', address: 'c', city: '北京市' } })
    ];
  });

  it('按实付金额降序', () => {
    const sorted = sortOrders(orders, 'paidAmount', 'desc');
    expect(sorted.map(o => o.paidAmount)).toEqual([1500, 1000, 500]);
  });

  it('按实付金额升序', () => {
    const sorted = sortOrders(orders, 'paidAmount', 'asc');
    expect(sorted.map(o => o.paidAmount)).toEqual([500, 1000, 1500]);
  });

  it('按下单时间升序', () => {
    const sorted = sortOrders(orders, 'createTime', 'asc');
    expect(sorted.map(o => o.orderNo)).toEqual(['A', 'B', 'C']);
  });

  it('按订单编号升序', () => {
    const sorted = sortOrders(orders, 'orderNo', 'asc');
    expect(sorted.map(o => o.orderNo)).toEqual(['A', 'B', 'C']);
  });

  it('默认按 createTime 降序', () => {
    const sorted = sortOrders(orders);
    expect(sorted.map(o => o.orderNo)).toEqual(['C', 'B', 'A']);
  });

  it('不修改原数组', () => {
    const before = orders.map(o => o.orderNo);
    sortOrders(orders, 'paidAmount', 'asc');
    expect(orders.map(o => o.orderNo)).toEqual(before);
  });
});

describe('分页 - paginateOrders', () => {
  const items = Array.from({ length: 5 }, (_, i) => i + 1);

  it('首页取前 pageSize 条，total 为总数', () => {
    const result = paginateOrders(items, 1, 2);
    expect(result.list).toEqual([1, 2]);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
  });

  it('第二页取后续条目', () => {
    expect(paginateOrders(items, 2, 2).list).toEqual([3, 4]);
  });

  it('最后一页不足 pageSize 时返回剩余', () => {
    expect(paginateOrders(items, 3, 2).list).toEqual([5]);
  });

  it('超出范围的页返回空列表，total 不变', () => {
    const result = paginateOrders(items, 10, 2);
    expect(result.list).toEqual([]);
    expect(result.total).toBe(5);
  });

  it('默认 page=1, pageSize=20', () => {
    const result = paginateOrders(items);
    expect(result.list).toEqual([1, 2, 3, 4, 5]);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
