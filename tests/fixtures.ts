import {
  Order,
  Product,
  LeaseInfo,
  AssignStage
} from '../api/types/order';

let idCounter = 0;

export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: nextId('PROD'),
    name: '测试商品A',
    sku: 'TEST-SKU-001',
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    ...overrides
  };
}

export function buildLeaseInfo(overrides: Partial<LeaseInfo> = {}): LeaseInfo {
  return {
    leasePeriod: 6,
    leaseUnit: 'month',
    startDate: '2024-01-01',
    endDate: '2024-07-01',
    deposit: 2000,
    monthlyRent: 1000,
    leaseStatus: 'in_use',
    damageDeposit: 500,
    ...overrides
  };
}

export interface BuildOrderOverrides extends Partial<Order> {
  products?: Product[];
  customer?: Order['customer'];
}

export function buildOrder(overrides: BuildOrderOverrides = {}): Order {
  const products = overrides.products ?? [buildProduct()];
  const totalAmount = products.reduce((sum, p) => sum + p.totalPrice, 0);

  const base: Order = {
    id: nextId('ORD'),
    orderNo: `XS-TEST-${idCounter}`,
    type: 'sale',
    status: 'paid',
    platform: 'official_website',
    customer: {
      id: nextId('CUS'),
      name: '测试客户',
      phone: '13800000000',
      email: 'test@example.com',
      address: '北京市朝阳区测试路1号',
      city: '北京市'
    },
    products,
    totalAmount,
    discountAmount: 0,
    paidAmount: totalAmount,
    paymentMethod: 'alipay',
    paymentTime: '2024-01-01T10:00:00.000Z',
    createTime: '2024-01-01T10:00:00.000Z',
    updateTime: '2024-01-01T10:00:00.000Z',
    city: '北京市',
    sourceChannel: '搜索引擎',
    assignStage: 'pending_assign' as AssignStage
  };

  const merged: Order = { ...base, ...overrides };

  if (merged.type === 'lease' && overrides.leaseInfo !== null) {
    merged.leaseInfo = overrides.leaseInfo ?? buildLeaseInfo();
  }

  return merged;
}

export function buildOrders(count: number, overrides?: BuildOrderOverrides): Order[] {
  return Array.from({ length: count }, () => buildOrder(overrides ?? {}));
}
