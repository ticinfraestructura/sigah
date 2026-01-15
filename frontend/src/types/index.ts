// Permission types
export interface Permission {
  module: string;
  action: string;
}

// Role types
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount?: number;
  permissions: Permission[];
  createdAt?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string | null;
  roleName: string;
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// Product types
export type Unit = 'UNIT' | 'KG' | 'LB' | 'LITER' | 'ML' | 'PACK' | 'BOX';

export interface ProductLot {
  id: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  expiryDate: string | null;
  entryDate: string;
  isActive?: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string;
  category: Category;
  unit: Unit;
  isPerishable: boolean;
  minStock: number;
  isActive: boolean;
  totalStock?: number;
  lots?: ProductLot[];
}

// Kit types
export interface KitProduct {
  id: string;
  kitId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Kit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  kitProducts: KitProduct[];
}

// Beneficiary types
export type DocumentType = 'CC' | 'TI' | 'CE' | 'PASSPORT' | 'OTHER';
export type PopulationType = 'DISPLACED' | 'REFUGEE' | 'VULNERABLE' | 'ELDERLY' | 'DISABLED' | 'INDIGENOUS' | 'AFRO' | 'OTHER';

export interface Beneficiary {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  populationType: PopulationType | null;
  familySize: number;
  notes: string | null;
  isActive: boolean;
}

// Request types
export type RequestStatus = 'REGISTERED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'CANCELLED';

export interface RequestProduct {
  id: string;
  requestId: string;
  productId: string;
  quantityRequested: number;
  quantityDelivered: number;
  product: Product;
}

export interface RequestKit {
  id: string;
  requestId: string;
  kitId: string;
  quantityRequested: number;
  quantityDelivered: number;
  kit: Kit;
}

export interface RequestHistory {
  id: string;
  requestId: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  notes: string | null;
  userId: string;
  user: { firstName: string; lastName: string };
  createdAt: string;
}

export interface Request {
  id: string;
  code: string;
  beneficiaryId: string;
  beneficiary: Beneficiary;
  requestDate: string;
  status: RequestStatus;
  priority: number;
  notes: string | null;
  createdById: string;
  createdBy: { firstName: string; lastName: string };
  requestProducts: RequestProduct[];
  requestKits: RequestKit[];
  deliveries?: Delivery[];
  histories?: RequestHistory[];
}

// Delivery types - Nuevo flujo con segregación de funciones
// Flujo: PENDING_AUTHORIZATION -> AUTHORIZED -> RECEIVED_WAREHOUSE -> IN_PREPARATION -> READY -> DELIVERED
export type DeliveryStatus = 'PENDING_AUTHORIZATION' | 'AUTHORIZED' | 'RECEIVED_WAREHOUSE' | 'IN_PREPARATION' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryDetail {
  id: string;
  deliveryId: string;
  productId: string | null;
  kitId: string | null;
  lotId: string | null;
  quantity: number;
  product?: Product;
  kit?: Kit;
  lot?: ProductLot;
}

export interface DeliveryHistory {
  id: string;
  deliveryId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  notes: string | null;
  userId: string;
  user: { firstName: string; lastName: string; role?: string };
  createdAt: string;
}

export interface DeliveryUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  receiverId: string;
  senderId: string | null;
  sender?: DeliveryUser;
  deliveryId: string | null;
  isRead: boolean;
  readAt: string | null;
  actionRequired: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface Delivery {
  id: string;
  code: string;
  requestId: string;
  request: Request;
  status: DeliveryStatus;
  
  // Quien crea la solicitud de entrega
  createdById: string | null;
  createdBy: DeliveryUser | null;
  
  // PASO 1: Autorización (AUTHORIZER o ADMIN)
  authorizedById: string | null;
  authorizedBy: DeliveryUser | null;
  authorizationDate: string | null;
  authorizationNotes: string | null;
  isPartialAuth: boolean;
  authorizedQuantity: string | null;
  
  // PASO 2: Recepción en Bodega (WAREHOUSE)
  warehouseUserId: string | null;
  warehouseUser: DeliveryUser | null;
  warehouseReceivedDate: string | null;
  warehouseNotes: string | null;
  
  // PASO 3: Preparación (WAREHOUSE)
  preparedById: string | null;
  preparedBy: DeliveryUser | null;
  preparationDate: string | null;
  preparationNotes: string | null;
  
  // PASO 4: Entrega al beneficiario (DISPATCHER)
  deliveredById: string | null;
  deliveredBy: DeliveryUser | null;
  deliveryDate: string | null;
  deliveryNotes: string | null;
  
  // Recepción del beneficiario
  receivedBy: string | null;
  receiverDocument: string | null;
  receiverSignature: string | null;
  receptionDate: string | null;
  receptionNotes: string | null;
  
  notes: string | null;
  isPartial: boolean;
  deliveryDetails: DeliveryDetail[];
  history?: DeliveryHistory[];
  notifications?: Notification[];
  createdAt: string;
}

// Return types
export type ReturnReason = 'DAMAGED' | 'WRONG_DELIVERY' | 'NOT_CLAIMED' | 'EXPIRED' | 'DUPLICATE' | 'OTHER';
export type ProductCondition = 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'PARTIAL';

export interface ReturnDetail {
  id: string;
  returnId: string;
  productId: string;
  lotId: string | null;
  quantity: number;
  condition: ProductCondition;
  product?: Product;
}

export interface Return {
  id: string;
  deliveryId: string;
  delivery: Delivery;
  returnDate: string;
  reason: ReturnReason;
  processedById: string;
  processedBy: { firstName: string; lastName: string };
  notes: string | null;
  returnDetails: ReturnDetail[];
}

// Stock Movement types
export type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';

export interface StockMovement {
  id: string;
  productId: string;
  product: Product;
  lotId: string | null;
  lot: ProductLot | null;
  type: MovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  userId: string;
  user: { firstName: string; lastName: string };
  createdAt: string;
}

// Dashboard types
export interface DashboardSummary {
  kpis: {
    totalProducts: number;
    totalStock: number;
    totalBeneficiaries: number;
    totalRequests: number;
    pendingRequests: number;
    deliveriesThisMonth: number;
    expiringProducts: number;
    lowStockProducts: number;
    deliveriesReady?: number;
    deliveriesPendingAuth?: number;
    deliveriesInProgress?: number;
  };
  requestsByStatus: Record<RequestStatus, number>;
  deliveriesByStatus?: Record<string, number>;
  stockByCategory: Array<{
    id: string;
    name: string;
    totalProducts: number;
    totalStock: number;
  }>;
  alerts: {
    expiring: ProductLot[];
    lowStock: Product[];
  };
  pendingTasks?: {
    forAuthorizer: number;
    forWarehouse: number;
    forDispatcher: number;
    details?: {
      authorizer: any[];
      warehouse: any[];
      dispatcher: any[];
    };
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
