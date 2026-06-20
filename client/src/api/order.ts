import axios from 'axios';
import type { 
  Order, 
  OrderFilter, 
  PaginationParams, 
  PaginatedResponse, 
  ApiResponse,
  EnumOptions,
  OrderStatus 
} from '@/types/order';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

export async function getOrders(
  filter: OrderFilter,
  pagination: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Order>>> {
  const keywordParts: string[] = [];
  if (filter.orderNo) keywordParts.push(filter.orderNo);
  if (filter.customerName) keywordParts.push(filter.customerName);
  if (filter.customerPhone) keywordParts.push(filter.customerPhone);
  
  const params = {
    type: filter.type || 'all',
    status: filter.status || 'all',
    leaseStatus: filter.leaseStatus || 'all',
    platform: filter.platform || 'all',
    paymentMethod: filter.paymentMethod || 'all',
    assignee: filter.assignee,
    startDate: filter.startDate,
    endDate: filter.endDate,
    minAmount: filter.minAmount,
    maxAmount: filter.maxAmount,
    keyword: keywordParts.length > 0 ? keywordParts.join(' ') : undefined,
    ...pagination
  };
  return request.get('/orders', { params });
}

export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  return request.get(`/orders/${id}`);
}

export async function getOrderStats(): Promise<any> {
  const res: ApiResponse<any> = await request.get('/orders/statistics');
  return res.data;
}

export async function getEnumOptions(): Promise<ApiResponse<EnumOptions>> {
  return request.get('/orders/options/enums');
}

export async function exportOrdersToExcel(filter: OrderFilter): Promise<void> {
  const keywordParts: string[] = [];
  if (filter.orderNo) keywordParts.push(filter.orderNo);
  if (filter.customerName) keywordParts.push(filter.customerName);
  if (filter.customerPhone) keywordParts.push(filter.customerPhone);
  
  const params = {
    type: filter.type || 'all',
    status: filter.status || 'all',
    leaseStatus: filter.leaseStatus || 'all',
    platform: filter.platform || 'all',
    paymentMethod: filter.paymentMethod || 'all',
    assignee: filter.assignee,
    startDate: filter.startDate,
    endDate: filter.endDate,
    minAmount: filter.minAmount,
    maxAmount: filter.maxAmount,
    keyword: keywordParts.length > 0 ? keywordParts.join(' ') : undefined
  };
  
  const response = await axios.get('/api/orders/export/excel', {
    params,
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let filename = '订单列表.xlsx';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (match) {
      filename = decodeURIComponent(match[1]);
    }
  }
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function assignOrder(orderId: string, assignee: string, assignAmount?: number): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/assign`, { assignee, assignAmount });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/status`, { status });
}

export async function rejectOrder(orderId: string, reason: string): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/reject`, { reason });
}

export async function hqTakeoverOrder(orderId: string, assignAmount: number): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/hq-takeover`, { assignAmount });
}

export async function hqTransferOrder(orderId: string, assignee: string, assignAmount: number): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/hq-transfer`, { assignee, assignAmount });
}

export async function hqCancelOrder(orderId: string, reason: string): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/hq-cancel`, { reason });
}
