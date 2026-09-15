export enum Rol {
  ADMIN = 'ADMIN',
  USER = 'USER',
  RESPONSABLE = 'RESPONSABLE'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  usuarioId: string;
  username: string;
  rol: Rol;
  trabajadorId: string;
  trabajadorNombre: string;
  fincaId: string | null;
  fincaName: string | null;
  expiresIn: number;
}

export interface Usuario {
  id: string;
  username: string;
  rol: Rol;
  activo: boolean;
  trabajadorId: string;
  trabajadorNombre?: string;
  fincaId?: string;
  fincaName?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthState {
  token: string | null;
  user: LoginResponse | null;
  isAuthenticated: boolean;
}
