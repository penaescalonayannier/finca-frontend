export interface EstadoCuenta {
  id?: string;
  fecha: string;
  refOrigen: string;
  refCorriente: string;
  observaciones: string;
  importe: number;
  tipo?: 'Cr' | 'Db';
  clienteId?: string;
}

export interface SearchFilter {
  key: string;
  operator: string;
  value: string;
  logicalOperation: string;
}

export interface SearchRequest {
  filter: SearchFilter[];
  query: string;
  pageSize: number;
  page: number;
  sortBy: string;
  sortType: 'ASC' | 'DESC';
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
}

export interface ApiResponse<T> {
  data?: T[];
  total?: number;
  count?: number;
  items?: T[];
  results?: T[];
}
