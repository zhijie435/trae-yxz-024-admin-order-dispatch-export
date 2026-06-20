import * as XLSX from 'xlsx';
import {
  buildExportRows,
  buildOrderInfoRows,
  buildProductRows,
  buildLogRows,
  createWorksheetFromData,
  exportListToExcel,
  exportDetailToExcel
} from '../api/exporters/orderExporter';
import { buildOrder, buildProduct, buildLeaseInfo } from './fixtures';
import { OperationLog } from '../api/types/order';

describe('导出Excel - buildExportRows', () => {
  it('销售单行：填充基础字段，租赁相关字段为占位符', () => {
    const order = buildOrder({
      orderNo: 'XS-EXP-1',
      type: 'sale',
      totalAmount: 1000,
      paidAmount: 1000,
      city: '北京市',
      sourceChannel: '搜索引擎',
      assignee: '张三',
      assignAmount: 800,
      assignStage: 'assigned',
      customer: {
        id: 'CUS-1', name: '张伟', phone: '13800000001',
        email: 'a@x.com', address: '北京市朝阳区路1号', city: '北京市'
      }
    });
    const rows = buildExportRows([order]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row['订单编号']).toBe('XS-EXP-1');
    expect(row['订单类型']).toBe('销售单');
    expect(row['所属城市']).toBe('北京市');
    expect(row['指派阶段']).toBe('已指派');
    expect(row['跨城市指派']).toBe('否');
    expect(row['指派人员']).toBe('张三');
    expect(row['指派金额(元)']).toBe('800.00');
    expect(row['来源渠道']).toBe('搜索引擎');
    expect(row['租赁状态']).toBe('-');
    expect(row['租期']).toBe('-');
    expect(row['月租金(元)']).toBe('-');
  });

  it('租赁单行：填充租赁相关字段', () => {
    const order = buildOrder({
      orderNo: 'ZL-EXP-1',
      type: 'lease',
      leaseInfo: buildLeaseInfo({ leasePeriod: 6, leaseUnit: 'month', leaseStatus: 'in_use', monthlyRent: 1000 })
    });
    const row = buildExportRows([order])[0];
    expect(row['订单类型']).toBe('租赁单');
    expect(row['租赁状态']).toBe('使用中');
    expect(row['租期']).toBe('6个月');
    expect(row['月租金(元)']).toBe('1000.00');
    expect(row['押金(元)']).toBe('2000.00');
    expect(row['物损押金(元)']).toBe('500.00');
  });

  it('未指派订单：指派人员为「未指派」、指派金额为「-」', () => {
    const order = buildOrder({ assignee: undefined, assignAmount: undefined, assignStage: 'pending_assign' });
    const row = buildExportRows([order])[0];
    expect(row['指派人员']).toBe('未指派');
    expect(row['指派金额(元)']).toBe('-');
    expect(row['指派阶段']).toBe('待指派');
  });

  it('跨城市指派订单：跨城市指派标记为「是」', () => {
    const order = buildOrder({ isCrossCityAssign: true });
    expect(buildExportRows([order])[0]['跨城市指派']).toBe('是');
  });

  it('商品明细按「名称×数量」拼接', () => {
    const order = buildOrder({
      products: [
        buildProduct({ name: '商品A', sku: 'SKU-A', quantity: 2, totalPrice: 200 }),
        buildProduct({ name: '商品B', sku: 'SKU-B', quantity: 1, totalPrice: 150 })
      ]
    });
    const row = buildExportRows([order])[0];
    expect(row['商品名称']).toBe('商品A、商品B');
    expect(row['商品SKU']).toBe('SKU-A、SKU-B');
    expect(row['商品明细']).toBe('商品A×2、商品B×1');
  });

  it('多订单生成对应行数', () => {
    const orders = [buildOrder(), buildOrder(), buildOrder()];
    expect(buildExportRows(orders)).toHaveLength(3);
  });
});

describe('导出Excel - buildOrderInfoRows / buildProductRows / buildLogRows', () => {
  it('buildOrderInfoRows：销售单包含基础信息且无租赁段', () => {
    const order = buildOrder({ type: 'sale', assignee: '张三', assignAmount: 800 });
    const rows = buildOrderInfoRows(order);
    const map = Object.fromEntries(rows.map(r => [r.项目, r.内容]));
    expect(map['订单编号']).toBe(order.orderNo);
    expect(map['指派人员']).toBe('张三');
    expect(map['指派金额(元)']).toBe('800.00');
    expect(rows.some(r => r.项目 === '租赁状态')).toBe(false);
  });

  it('buildOrderInfoRows：租赁单追加租赁信息', () => {
    const order = buildOrder({ type: 'lease', leaseInfo: buildLeaseInfo({ leaseStatus: 'in_use' }) });
    const map = Object.fromEntries(buildOrderInfoRows(order).map(r => [r.项目, r.内容]));
    expect(map['租赁状态']).toBe('使用中');
    expect(map['月租金(元)']).toBe('1000.00');
  });

  it('buildProductRows：商品行包含序号/名称/SKU/单价/数量/小计', () => {
    const product = buildProduct({ name: '商品X', sku: 'SKU-X', quantity: 3, unitPrice: 100, totalPrice: 300 });
    const rows = buildProductRows([product]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ 序号: 1, 商品名称: '商品X', 'SKU编码': 'SKU-X', '单价(元)': '100.00', 数量: 3, '小计(元)': '300.00' });
  });

  it('buildLogRows：操作日志行字段映射正确', () => {
    const log: OperationLog = {
      id: 'LOG-1', orderId: 'ORD-1', orderNo: 'XS-1',
      operationType: 'assign', operationName: '指派订单',
      operator: '张三', operatorRole: '运营',
      operateTime: '2024-01-01T10:00:00.000Z',
      beforeValue: '未指派', afterValue: '张三', remark: '订单指派'
    };
    const rows = buildLogRows([log]);
    expect(rows[0]).toMatchObject({
      序号: 1, 操作类型: '指派订单', 操作人: '张三', 操作角色: '运营',
      变更前: '未指派', 变更后: '张三', 备注: '订单指派'
    });
  });
});

describe('导出Excel - createWorksheetFromData', () => {
  it('按指定表头顺序生成工作表并设置列宽', () => {
    const ws = createWorksheetFromData(
      [{ a: 1, b: 2 }],
      ['b', 'a'],
      [10, 20]
    );
    expect(ws['!cols']).toEqual([{ wch: 10 }, { wch: 20 }]);
    expect(ws['!ref']).toBeTruthy();
  });

  it('未传入列宽时不设置 !cols', () => {
    const ws = createWorksheetFromData([{ a: 1 }], ['a']);
    expect(ws['!cols']).toBeUndefined();
  });
});

describe('导出Excel - exportListToExcel', () => {
  it('生成合法 xlsx Buffer，包含「订单列表」工作表与正确表头', () => {
    const orders = [
      buildOrder({ orderNo: 'XS-LIST-1', type: 'sale', assignee: '张三', assignAmount: 800 }),
      buildOrder({ orderNo: 'ZL-LIST-2', type: 'lease', leaseInfo: buildLeaseInfo() })
    ];
    const buffer = exportListToExcel(orders);
    expect(Buffer.isBuffer(buffer)).toBe(true);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames).toContain('订单列表');

    const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['订单列表'], { header: 1 });
    expect(rows[0]).toContain('订单编号');
    expect(rows[0]).toContain('指派金额(元)');
    expect(rows[0]).toContain('租赁状态');
    expect(rows.length).toBe(orders.length + 1);
    expect(rows[1][0]).toBe('XS-LIST-1');
    expect(rows[2][0]).toBe('ZL-LIST-2');
  });

  it('空订单列表仅含表头行', () => {
    const buffer = exportListToExcel([]);
    const rows = XLSX.utils.sheet_to_json<any[]>(XLSX.read(buffer, { type: 'buffer' }).Sheets['订单列表'], { header: 1 });
    expect(rows).toHaveLength(1);
  });
});

describe('导出Excel - exportDetailToExcel', () => {
  it('生成包含订单信息/商品明细/操作日志三个工作表的 xlsx', () => {
    const order = buildOrder({
      type: 'lease',
      leaseInfo: buildLeaseInfo(),
      products: [buildProduct({ name: '商品A', sku: 'SKU-A', quantity: 1, unitPrice: 1000, totalPrice: 1000 })]
    });
    const logs: OperationLog[] = [
      {
        id: 'LOG-1', orderId: order.id, orderNo: order.orderNo,
        operationType: 'assign', operationName: '指派订单',
        operator: '张三', operatorRole: '运营', operateTime: '2024-01-01T10:00:00.000Z',
        beforeValue: '未指派', afterValue: '张三', remark: '订单指派'
      }
    ];

    const buffer = exportDetailToExcel(order, logs);
    expect(Buffer.isBuffer(buffer)).toBe(true);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames).toEqual(['订单信息', '商品明细', '操作日志']);

    const productRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['商品明细'], { header: 1 });
    expect(productRows[1][1]).toBe('商品A');

    const logRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['操作日志'], { header: 1 });
    expect(logRows[1][1]).toBe('指派订单');
  });
});
