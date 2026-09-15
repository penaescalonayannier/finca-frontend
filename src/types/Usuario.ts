export type Rol = 'ADMIN' | 'USER' | 'RESPONSABLE'

export interface Usuario {
  id: string
  username: string
  rol: Rol
  activo: boolean
  trabajadorId: string
  trabajadorNombre?: string
  trabajadorRuc?: string
  fincaId?: string
  fincaName?: string
  createdAt?: string
  lastLogin?: string
}

export interface UsuarioRequest {
  username: string
  password: string
  rol: Rol
  trabajadorId: string
}

export interface TrabajadorDisponible {
  id: string
  nombre: string
  ruc: string
  fincaName?: string
}
