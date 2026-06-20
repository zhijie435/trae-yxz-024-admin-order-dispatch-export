import axios from 'axios';
import type {
  Order,
  OrderFilterParams,
  PaginatedResponse,
  ApiResponse,
  OrderStatistics,
  ConstantsData,
  OperationLog,
  OrderDetail
} from '../types/order';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export const orderApi = {
  getList(params: OrderFilterParams): Promise<ApiResponse<PaginatedResponse<Order>>> {
    return request.get('/orders', { params });
  },

  getDetail(id: string): Promise<ApiResponse<Order>> {
    return request.get(`/orders/${id}`);
  },

  getDetailWithLogs(id: string): Promise<ApiResponse<OrderDetail>> {
    return request.get(`/orders/${id}/detail`);
  },

  getOperationLogs(id: string): Promise<ApiResponse<OperationLog[]>> {
    return request.get(`/orders/${id}/logs`);
  },

  exportOrderDetail(id: string): Promise<Blob> {
    return request.get(`/orders/${id}/export`, {
      responseType: 'blob'
    });
  },

  assign(orderId: string, assignee: string): Promise<ApiResponse<Order>> {
    return request.post('/orders/assign', { orderId, assignee });
  },

  batchAssign(orderIds: string[], assignee: string): Promise<ApiResponse<{ success: number; failed: number }>> {
    return request.post('/orders/batch-assign', { orderIds, assignee });
  },

  exportExcel(params: OrderFilterParams): Promise<Blob> {
    return request.get('/orders/export/excel', {
      params,
      responseType: 'blob'
    });
  },

  getStatistics(): Promise<ApiResponse<OrderStatistics>> {
    return request.get('/orders/statistics');
  },

  getConstants(): Promise<ApiResponse<ConstantsData>> {
    return request.get('/constants');
  }
};
