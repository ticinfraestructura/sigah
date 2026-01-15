import axios from 'axios';

// Obtener base path de Vite (import.meta.env.BASE_URL se define automáticamente)
const BASE_URL = import.meta.env.BASE_URL || '/';
// Asegurar que BASE_URL termine con / antes de agregar 'api'
const normalizedBase = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
const API_URL = `${normalizedBase}api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Categories
export const categoryApi = {
  getAll: (includeInactive = false) => 
    api.get('/categories', { params: { includeInactive } }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string }) => 
    api.post('/categories', data),
  update: (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Products
export const productApi = {
  getAll: (params?: { 
    categoryId?: string; 
    isPerishable?: boolean; 
    search?: string;
    includeInactive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getLots: (id: string) => api.get(`/products/${id}/lots`),
  getMovements: (id: string, params?: { startDate?: string; endDate?: string; type?: string }) =>
    api.get(`/products/${id}/movements`, { params }),
  create: (data: {
    code: string;
    name: string;
    description?: string;
    categoryId: string;
    unit?: string;
    isPerishable?: boolean;
    minStock?: number;
  }) => api.post('/products', data),
  update: (id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    categoryId: string;
    unit: string;
    isPerishable: boolean;
    minStock: number;
    isActive: boolean;
  }>) => api.put(`/products/${id}`, data),
  addLot: (id: string, data: { lotNumber?: string; quantity: number; expiryDate?: string; reason?: string }) =>
    api.post(`/products/${id}/lots`, data),
  updateLot: (productId: string, lotId: string, data: { lotNumber?: string; quantity?: number; expiryDate?: string }) =>
    api.put(`/products/${productId}/lots/${lotId}`, data),
  deleteLot: (productId: string, lotId: string, reason?: string) =>
    api.delete(`/products/${productId}/lots/${lotId}`, { data: { reason } }),
  delete: (id: string) => api.delete(`/products/${id}`),
  // Auditoría y trazabilidad
  getAuditHistory: (id: string) => api.get(`/products/${id}/audit`),
  getLotAuditHistory: (productId: string, lotId: string) => 
    api.get(`/products/${productId}/lots/${lotId}/audit`),
};

// Kits
export const kitApi = {
  getAll: (includeInactive = false) => api.get('/kits', { params: { includeInactive } }),
  getById: (id: string) => api.get(`/kits/${id}`),
  getAvailability: (id: string, quantity = 1) => 
    api.get(`/kits/${id}/availability`, { params: { quantity } }),
  getHistory: (id: string, params?: { startDate?: string; endDate?: string; status?: string }) =>
    api.get(`/kits/${id}/history`, { params }),
  create: (data: {
    code: string;
    name: string;
    description?: string;
    products: Array<{ productId: string; quantity: number }>;
  }) => api.post('/kits', data),
  update: (id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    products: Array<{ productId: string; quantity: number }>;
    isActive: boolean;
  }>) => api.put(`/kits/${id}`, data),
  delete: (id: string) => api.delete(`/kits/${id}`),
};

// Beneficiaries
export const beneficiaryApi = {
  getAll: (params?: { search?: string; populationType?: string; page?: number; limit?: number }) =>
    api.get('/beneficiaries', { params }),
  getById: (id: string) => api.get(`/beneficiaries/${id}`),
  searchByDocument: (documentType: string, documentNumber: string) =>
    api.get('/beneficiaries/search/document', { params: { documentType, documentNumber } }),
  create: (data: {
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    populationType?: string;
    familySize?: number;
    notes?: string;
  }) => api.post('/beneficiaries', data),
  update: (id: string, data: Partial<{
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    populationType: string;
    familySize: number;
    notes: string;
    isActive: boolean;
  }>) => api.put(`/beneficiaries/${id}`, data),
};

// Requests
export const requestApi = {
  getAll: (params?: {
    status?: string;
    beneficiaryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/requests', { params }),
  getById: (id: string) => api.get(`/requests/${id}`),
  getHistory: (id: string) => api.get(`/requests/${id}/history`),
  getStatsByStatus: () => api.get('/requests/stats/by-status'),
  create: (data: {
    beneficiaryId: string;
    products?: Array<{ productId: string; quantity: number }>;
    kits?: Array<{ kitId: string; quantity: number }>;
    priority?: number;
    notes?: string;
  }) => api.post('/requests', data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/requests/${id}/status`, { status, notes }),
  update: (id: string, data: {
    products?: Array<{ productId: string; quantity: number }>;
    kits?: Array<{ kitId: string; quantity: number }>;
    priority?: number;
    notes?: string;
  }) => api.put(`/requests/${id}`, data),
};

// Deliveries - Flujo con segregación de funciones
export const deliveryApi = {
  getAll: (params?: {
    requestId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    warehouseUserId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/deliveries', { params }),
  getById: (id: string) => api.get(`/deliveries/${id}`),
  getStats: () => api.get('/deliveries/stats/summary'),
  getWarehouseUsers: () => api.get('/deliveries/users/warehouse'),
  
  // Paso 1: Crear solicitud de entrega (pendiente de autorización)
  create: (data: {
    requestId: string;
    products?: Array<{ productId: string; quantity: number }>;
    kits?: Array<{ kitId: string; quantity: number }>;
    notes?: string;
    isPartial?: boolean;
  }) => api.post('/deliveries', data),
  
  // Paso 2: Autorizar entrega (AUTHORIZER o ADMIN)
  authorize: (id: string, data?: { notes?: string; isPartialAuth?: boolean; authorizedQuantities?: any }) => 
    api.post(`/deliveries/${id}/authorize`, data || {}),
  
  // Paso 3: Recibir en bodega (WAREHOUSE)
  receiveInWarehouse: (id: string, notes?: string) => 
    api.post(`/deliveries/${id}/receive-warehouse`, { notes }),
  
  // Paso 4: Iniciar preparación en bodega (WAREHOUSE)
  startPreparation: (id: string, notes?: string) => 
    api.post(`/deliveries/${id}/prepare`, { notes }),
  
  // Paso 5: Marcar como lista (descuenta inventario)
  markReady: (id: string, notes?: string) => 
    api.post(`/deliveries/${id}/ready`, { notes }),
  
  // Paso 6: Confirmar entrega al beneficiario (DISPATCHER)
  confirmDelivery: (id: string, data: {
    receivedBy: string;
    receiverDocument: string;
    receiverSignature?: string;
    notes?: string;
  }) => api.post(`/deliveries/${id}/deliver`, data),
  
  // Cancelar entrega (solo ADMIN)
  cancel: (id: string, reason: string) => 
    api.post(`/deliveries/${id}/cancel`, { reason }),
};

// Notifications
export const notificationApi = {
  getAll: (params?: { unreadOnly?: boolean; limit?: number }) => 
    api.get('/notifications', { params }),
  markAsRead: (id: string) => 
    api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => 
    api.patch('/notifications/read-all'),
};

// Returns
export const returnApi = {
  getAll: (params?: {
    deliveryId?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/returns', { params }),
  getById: (id: string) => api.get(`/returns/${id}`),
  getStatsByReason: () => api.get('/returns/stats/by-reason'),
  create: (data: {
    deliveryId: string;
    reason: string;
    items: Array<{ productId: string; quantity: number; condition: string; lotId?: string }>;
    notes?: string;
  }) => api.post('/returns', data),
};

// Inventory
export const inventoryApi = {
  getStock: (params?: { categoryId?: string; isPerishable?: boolean; lowStock?: boolean }) =>
    api.get('/inventory/stock', { params }),
  getMovements: (params?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/inventory/movements', { params }),
  getExpiring: (days = 30) => api.get('/inventory/expiring', { params: { days } }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getByCategory: () => api.get('/inventory/by-category'),
  getStats: () => api.get('/inventory/stats'),
  createAdjustment: (data: { productId: string; lotId: string; quantity: number; reason: string }) =>
    api.post('/inventory/adjustment', data),
  createEntry: (data: { productId: string; quantity: number; lotNumber?: string; expiryDate?: string; reason?: string }) =>
    api.post('/inventory/entry', data),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getCharts: (months = 6) => api.get('/dashboard/charts', { params: { months } }),
  getActivity: (limit = 10) => api.get('/dashboard/activity', { params: { limit } }),
};

// Reports - Sistema de reportes parametrizables
export const reportApi = {
  // Configuración
  getTypes: () => api.get('/reports/types'),
  getFields: (reportType: string, subtype?: string) => 
    api.get(`/reports/fields/${reportType}`, { params: subtype ? { subtype } : undefined }),
  getQuickStats: (reportType: string) => api.get(`/reports/quick/${reportType}`),
  
  // Generación
  generate: (data: {
    reportType: string;
    subtype?: string;
    startDate?: string;
    endDate?: string;
    fields?: string[];
    filters?: Record<string, any>;
    groupBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.post('/reports/generate', data),
  
  // Exportación
  export: (format: 'excel' | 'pdf', data: {
    reportType: string;
    subtype?: string;
    startDate?: string;
    endDate?: string;
    filters?: Record<string, any>;
    data?: any[];
    title?: string;
  }) => api.post(`/reports/export/${format}`, data, { responseType: 'blob' }),
  
  // Legacy endpoints (compatibilidad)
  getRequests: (params?: { startDate?: string; endDate?: string; status?: string; beneficiaryId?: string }) =>
    api.get('/reports/requests', { params }),
  getDeliveries: (params?: { startDate?: string; endDate?: string; deliveredById?: string }) =>
    api.get('/reports/deliveries', { params }),
  getInventory: (params?: { startDate?: string; endDate?: string; type?: string; categoryId?: string }) =>
    api.get('/reports/inventory', { params }),
  exportExcel: (reportType: string, params?: Record<string, string>) =>
    api.get(`/reports/export/excel/${reportType}`, { params, responseType: 'blob' }),
  exportPdf: (reportType: string, params?: Record<string, string>) =>
    api.get(`/reports/export/pdf/${reportType}`, { params, responseType: 'blob' }),
};

// Auditoría - Sistema de trazabilidad
export const auditApi = {
  // Buscar logs de auditoría
  search: (params?: {
    entity?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/audit/search', { params }),
  
  // Obtener historial de una entidad
  getEntityHistory: (entity: string, entityId: string) => 
    api.get(`/audit/entity/${entity}/${entityId}`),
  
  // Obtener estadísticas de auditoría
  getStats: (params?: { startDate?: string; endDate?: string }) => 
    api.get('/audit/stats', { params }),
  
  // Comparar versiones
  compare: (id1: string, id2: string) => 
    api.get('/audit/compare', { params: { id1, id2 } }),
  
  // Exportar a CSV
  export: (params?: {
    entity?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/audit/export', { params, responseType: 'blob' }),
};

export default api;
