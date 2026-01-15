/**
 * Utilidades de Paginación
 * 
 * Proporciona funciones helper para paginación consistente en todos los endpoints
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parsear parámetros de paginación de query string
 */
export const parsePaginationParams = (
  query: { page?: string; limit?: string },
  defaults: { page?: number; limit?: number } = {}
): PaginationParams => {
  const page = Math.max(1, parseInt(query.page || '') || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '') || defaults.limit || 50));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Crear respuesta paginada
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    }
  };
};

/**
 * Generar links de paginación para HATEOAS
 */
export const generatePaginationLinks = (
  baseUrl: string,
  params: PaginationParams,
  total: number
): Record<string, string | null> => {
  const totalPages = Math.ceil(total / params.limit);
  
  const buildUrl = (page: number) => 
    `${baseUrl}?page=${page}&limit=${params.limit}`;
  
  return {
    self: buildUrl(params.page),
    first: buildUrl(1),
    last: buildUrl(totalPages),
    next: params.page < totalPages ? buildUrl(params.page + 1) : null,
    prev: params.page > 1 ? buildUrl(params.page - 1) : null
  };
};

/**
 * Middleware para agregar paginación a req
 */
export const paginationMiddleware = (defaults?: { page?: number; limit?: number }) => {
  return (req: any, res: any, next: any) => {
    req.pagination = parsePaginationParams(req.query, defaults);
    next();
  };
};
