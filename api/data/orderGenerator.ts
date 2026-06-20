import { 
  Order, 
  OrderType, 
  OrderStatus, 
  LeaseStatus, 
  PaymentMethod, 
  Platform,
  Customer,
  Product,
  LeaseInfo
} from '../types/order';

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
const LAST_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞'];

const CITIES = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '西安市', '南京市', '重庆市', '苏州市', '天津市', '长沙市', '郑州市', '东莞市', '青岛市', '沈阳市', '宁波市', '昆明市', '大连市'];
const DISTRICTS = ['朝阳区', '海淀区', '浦东新区', '南山区', '福田区', '西湖区', '天河区', '越秀区', '武侯区', '锦江区', '洪山区', '江岸区', '鼓楼区', '建邺区', '渝中区', '江北区', '未央区', '雁塔区', '岳麓区', '开福区'];
const STREETS = ['中关村大街', '南京路', '步行街', '长安街', '解放路', '人民路', '建设路', '和平路', '青年路', '友谊路', '团结路', '创新路', '科技路', '文化路', '体育路', '工业路', '农业路', '商业路', '交通路', '幸福路'];

const PRODUCT_CATEGORIES = [
  { prefix: '电子设备', names: ['iPhone 15 Pro', 'MacBook Pro 14寸', 'iPad Air', 'Apple Watch S9', 'Sony WH-1000XM5', 'Dell XPS 15', 'ThinkPad X1 Carbon', 'Samsung Galaxy S24', '华为Mate 60 Pro', '小米14 Ultra'], skuPrefix: 'ELEC' },
  { prefix: '摄影器材', names: ['Canon EOS R5', 'Sony A7M4', 'Nikon Z8', 'DJI Mavic 3', 'GoPro Hero 12', 'Fujifilm X-T5', 'Leica Q3', '哈苏X2D', '大疆 Ronin-S', 'Zhiyun Weebill 3'], skuPrefix: 'CAM' },
  { prefix: '办公设备', names: ['惠普激光打印机', '佳能复印机', '兄弟标签机', '科密碎纸机', '得力装订机', '爱普生扫描仪', '松下传真机', '三星显示器', 'LG曲面屏', '明基投影仪'], skuPrefix: 'OFFICE' },
  { prefix: '工程机械', names: ['卡特挖掘机', '小松推土机', '三一压路机', '徐工起重机', '中联混凝土泵车', '柳工装载机', '山推平地机', '沃尔沃挖掘机', '日立挖掘机', '神钢挖掘机'], skuPrefix: 'MACH' },
  { prefix: '家居家电', names: ['戴森吸尘器V15', '博世冰箱', '西门子洗衣机', '美的空调', '格力中央空调', '海尔热水器', '方太油烟机', '老板燃气灶', '小米电视75寸', '索尼电视85寸'], skuPrefix: 'HOME' }
];

const PLATFORMS: Platform[] = ['official_website', 'wechat_mini', 'taobao', 'jd', 'pinduoduo', 'douyin', 'offline_store'];
const PAYMENT_METHODS: PaymentMethod[] = ['alipay', 'wechat', 'bank_transfer', 'credit_card', 'cash'];
const ORDER_STATUSES: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'];
const LEASE_STATUSES: LeaseStatus[] = ['pending_shipment', 'shipped', 'in_use', 'returning', 'returned', 'completed', 'overdue'];
const ASSIGNEES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '未指派'];
const SOURCE_CHANNELS = ['搜索引擎', '社交媒体', '朋友推荐', '线下展会', '广告投放', '老客户', '自然流量', '合作伙伴'];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generatePhone(): string {
  const prefixes = ['138', '139', '158', '159', '188', '189', '136', '137', '150', '151', '186', '187'];
  return random(prefixes) + Array.from({ length: 8 }, () => randomInt(0, 9)).join('');
}

function generateName(): string {
  return random(FIRST_NAMES) + random(LAST_NAMES);
}

function generateAddress(): string {
  return random(CITIES) + random(DISTRICTS) + random(STREETS) + randomInt(1, 999) + '号';
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'qq.com', '163.com', '126.com', 'outlook.com', 'hotmail.com', 'sina.com'];
  const pinyin = name.split('').map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 8);
  return `${pinyin}${randomInt(100, 999)}@${random(domains)}`;
}

function generateCustomer(): Customer {
  const name = generateName();
  return {
    id: 'CUS' + Date.now() + randomInt(1000, 9999),
    name,
    phone: generatePhone(),
    email: Math.random() > 0.3 ? generateEmail(name) : undefined,
    address: generateAddress()
  };
}

function generateProducts(count: number): Product[] {
  const products: Product[] = [];
  const usedSkus = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    const category = random(PRODUCT_CATEGORIES);
    let productName = random(category.names);
    let sku = `${category.skuPrefix}-${randomInt(10000, 99999)}`;
    
    while (usedSkus.has(sku)) {
      sku = `${category.skuPrefix}-${randomInt(10000, 99999)}`;
    }
    usedSkus.add(sku);
    
    const quantity = randomInt(1, 5);
    const unitPrice = randomFloat(100, 50000);
    const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));
    
    products.push({
      id: 'PROD' + Date.now() + randomInt(1000, 9999),
      name: productName,
      sku,
      quantity,
      unitPrice,
      totalPrice,
      imageUrl: `https://picsum.photos/seed/${sku}/200/200`
    });
  }
  
  return products;
}

function generateLeaseInfo(startDate: string): LeaseInfo {
  const leasePeriod = randomInt(1, 24);
  const leaseUnits: Array<'day' | 'month' | 'year'> = ['day', 'month', 'year'];
  const leaseUnit = random(leaseUnits);
  const monthlyRent = randomFloat(500, 5000);
  const deposit = parseFloat((monthlyRent * 2).toFixed(2));
  const damageDeposit = randomFloat(500, 2000);
  
  const start = new Date(startDate);
  const end = new Date(start);
  
  if (leaseUnit === 'day') {
    end.setDate(end.getDate() + leasePeriod);
  } else if (leaseUnit === 'month') {
    end.setMonth(end.getMonth() + leasePeriod);
  } else {
    end.setFullYear(end.getFullYear() + leasePeriod);
  }
  
  return {
    leasePeriod,
    leaseUnit,
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    deposit,
    monthlyRent,
    leaseStatus: random(LEASE_STATUSES),
    damageDeposit
  };
}

function generateDate(daysBack: number = 365): string {
  const now = new Date();
  const past = new Date(now.getTime() - randomInt(0, daysBack) * 24 * 60 * 60 * 1000);
  past.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return past.toISOString();
}

function generateOrderNo(type: OrderType): string {
  const prefix = type === 'lease' ? 'ZL' : 'XS';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = randomInt(100000, 999999);
  return `${prefix}${date}${random}`;
}

function generateOrder(): Order {
  const type: OrderType = Math.random() > 0.5 ? 'lease' : 'sale';
  const status = random(ORDER_STATUSES);
  const products = generateProducts(randomInt(1, 4));
  const customer = generateCustomer();
  const createTime = generateDate(365);
  const updateTime = generateDate(30);
  
  const totalAmount = parseFloat(products.reduce((sum, p) => sum + p.totalPrice, 0).toFixed(2));
  const discountAmount = Math.random() > 0.5 ? parseFloat((totalAmount * randomFloat(0.05, 0.3)).toFixed(2)) : 0;
  const paidAmount = parseFloat((totalAmount - discountAmount).toFixed(2));
  
  const order: Order = {
    id: 'ORD' + Date.now() + randomInt(1000, 9999),
    orderNo: generateOrderNo(type),
    type,
    status,
    platform: random(PLATFORMS),
    customer,
    products,
    totalAmount,
    discountAmount,
    paidAmount,
    paymentMethod: random(PAYMENT_METHODS),
    paymentTime: status !== 'pending_payment' && status !== 'cancelled' ? generateDate(30) : undefined,
    createTime,
    updateTime,
    remark: Math.random() > 0.7 ? `客户备注：${random(['尽快发货', '需要发票', '周末配送', '联系前电话', '开箱验货'])}` : undefined,
    assignee: random(ASSIGNEES),
    sourceChannel: random(SOURCE_CHANNELS)
  };
  
  if (type === 'lease') {
    order.leaseInfo = generateLeaseInfo(createTime.split('T')[0]);
  }
  
  return order;
}

export function generateOrders(count: number): Order[] {
  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    orders.push(generateOrder());
  }
  return orders;
}

export const mockOrders = generateOrders(200);
