export enum TipoAccion {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  PAYMENT = 'PAYMENT',
  REACTIVATE = 'REACTIVATE',
  TRANSFER = 'TRANSFER'
}

export interface Auditoria {
  id: string;
  usuarioId: string | null;
  username: string;
  accion: TipoAccion;
  entidad: string;
  entidadId: string | null;
  descripcion: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditoriaSearchFilter {
  key: string;
  operator: string;
  value: string;
}

export interface AuditoriaSearchRequest {
  filter: AuditoriaSearchFilter[];
  page: number;
  pageSize: number;
  sortBy: string;
  sortType: 'ASC' | 'DES';
}
