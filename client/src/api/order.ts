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
  const params = {
    ...filter,
    ...pagination
  };
  return request.get('/orders', { params });
}

export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  return request.get(`/orders/${id}`);
}

export async function getOrderStats(): Promise<any> {
  const res: ApiResponse<any> = await request.get('/orders/stats');
  return res.code === 0 ? res.data : null;
}

export async function getEnumOptions(): Promise<ApiResponse<EnumOptions>> {
  return request.get('/orders/options/enums');
}

export async function exportOrdersToExcel(filter: OrderFilter): Promise<void> {
  const params = { ...filter };
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

export async function assignOrder(orderId: string, assignee: string): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/assign`, { assignee });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
  return request.put(`/orders/${orderId}/status`, { status });
}
