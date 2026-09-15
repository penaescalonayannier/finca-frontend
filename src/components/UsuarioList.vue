<template>
  <div class="usuario-list">
    <h2>Gestión de Usuarios</h2>
    <p class="subtitulo">Administración de accesos al sistema</p>

    <div class="toolbar">
      <button @click="abrirModalCrear" class="btn-crear">+ Nuevo Usuario</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando usuarios...</div>

    <table v-else class="tabla-usuarios">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Trabajador</th>
          <th>RUC</th>
          <th>Finca</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Último Acceso</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="usuarios.length === 0">
          <td colspan="8" class="no-data">No hay usuarios registrados</td>
        </tr>
        <tr v-for="usuario in usuarios" :key="usuario.id" :class="{ inactivo: !usuario.activo }">
          <td><strong>{{ usuario.username }}</strong></td>
          <td>{{ usuario.trabajadorNombre || '-' }}</td>
          <td>{{ usuario.trabajadorRuc || '-' }}</td>
          <td>{{ usuario.fincaName || '-' }}</td>
          <td>
            <span :class="['badge', 'badge-' + usuario.rol.toLowerCase()]">
              {{ formatRol(usuario.rol) }}
            </span>
          </td>
          <td>
            <span :class="['estado', usuario.activo ? 'activo' : 'inactivo']">
              {{ usuario.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td>{{ formatFecha(usuario.lastLogin) }}</td>
          <td class="acciones">
            <button @click="abrirModalEditar(usuario)" class="btn-editar">Editar</button>
            <button @click="abrirModalPassword(usuario)" class="btn-password">Contraseña</button>
            <button
              v-if="usuario.activo"
              @click="desactivarUsuario(usuario)"
              class="btn-desactivar"
            >
              Desactivar
            </button>
            <button
              v-else
              @click="activarUsuario(usuario)"
              class="btn-activar"
            >
              Activar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Crear Usuario -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content">
        <span class="close" @click="cerrarModales">&times;</span>
        <h3>Nuevo Usuario</h3>

        <form @submit.prevent="crearUsuario">
          <div class="form-group">
            <label>Trabajador *</label>
            <select v-model="formCrear.trabajadorId" required class="form-select">
              <option value="">Seleccione un trabajador</option>
              <option v-for="t in trabajadoresDisponibles" :key="t.id" :value="t.id">
                {{ t.nombre }} ({{ t.ruc }})
              </option>
            </select>
            <small v-if="trabajadoresDisponibles.length === 0" class="hint">
              No hay trabajadores sin usuario asignado
            </small>
          </div>

          <div class="form-group">
            <label>Nombre de Usuario *</label>
            <input
              v-model="formCrear.username"
              type="text"
              required
              minlength="3"
              maxlength="50"
              class="form-input"
              placeholder="ej: jperez"
            />
          </div>

          <div class="form-group">
            <label>Contraseña *</label>
            <input
              v-model="formCrear.password"
              type="password"
              required
              minlength="4"
              class="form-input"
              placeholder="Mínimo 4 caracteres"
            />
          </div>

          <div class="form-group">
            <label>Rol *</label>
            <select v-model="formCrear.rol" required class="form-select">
              <option value="USER">Usuario</option>
              <option value="RESPONSABLE">Responsable</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div v-if="errorCrear" class="mensaje error">{{ errorCrear }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-guardar" :disabled="isGuardando">
              {{ isGuardando ? 'Creando...' : 'Crear Usuario' }}
            </button>
            <button type="button" class="btn-cancelar" @click="cerrarModales">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Editar Usuario -->
    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="cerrarModales">&times;</span>
        <h3>Editar Usuario</h3>

        <form @submit.prevent="actualizarUsuario">
          <div class="form-group">
            <label>Trabajador</label>
            <input type="text" :value="usuarioEditar?.trabajadorNombre" disabled class="form-input disabled" />
          </div>

          <div class="form-group">
            <label>Nombre de Usuario *</label>
            <input
              v-model="formEditar.username"
              type="text"
              required
              minlength="3"
              maxlength="50"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Rol *</label>
            <select v-model="formEditar.rol" required class="form-select">
              <option value="USER">Usuario</option>
              <option value="RESPONSABLE">Responsable</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div v-if="errorEditar" class="mensaje error">{{ errorEditar }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-guardar" :disabled="isGuardando">
              {{ isGuardando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button type="button" class="btn-cancelar" @click="cerrarModales">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Cambiar Contraseña -->
    <div v-if="mostrarModalPassword" class="modal">
      <div class="modal-content modal-small">
        <span class="close" @click="cerrarModales">&times;</span>
        <h3>Cambiar Contraseña</h3>
        <p class="modal-subtitle">Usuario: <strong>{{ usuarioPassword?.username }}</strong></p>

        <form @submit.prevent="cambiarPassword">
          <div class="form-group">
            <label>Nueva Contraseña *</label>
            <input
              v-model="nuevaPassword"
              type="password"
              required
              minlength="4"
              class="form-input"
              placeholder="Mínimo 4 caracteres"
            />
          </div>

          <div class="form-group">
            <label>Confirmar Contraseña *</label>
            <input
              v-model="confirmarPassword"
              type="password"
              required
              minlength="4"
              class="form-input"
              placeholder="Repita la contraseña"
            />
          </div>

          <div v-if="errorPassword" class="mensaje error">{{ errorPassword }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-guardar" :disabled="isGuardando">
              {{ isGuardando ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </button>
            <button type="button" class="btn-cancelar" @click="cerrarModales">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UsuarioService from '@/services/UsuarioService'
import type { Usuario, UsuarioRequest, TrabajadorDisponible, Rol } from '@/types/Usuario'
import { notify } from '@/composables/useNotification'

const usuarios = ref<Usuario[]>([])
const trabajadoresDisponibles = ref<TrabajadorDisponible[]>([])
const isLoading = ref(false)
const isGuardando = ref(false)

// Modales
const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalPassword = ref(false)

// Forms
const formCrear = ref<UsuarioRequest>({
  username: '',
  password: '',
  rol: 'USER',
  trabajadorId: ''
})

const formEditar = ref({
  username: '',
  rol: 'USER' as Rol
})

const usuarioEditar = ref<Usuario | null>(null)
const usuarioPassword = ref<Usuario | null>(null)
const nuevaPassword = ref('')
const confirmarPassword = ref('')

// Errores
const errorCrear = ref('')
const errorEditar = ref('')
const errorPassword = ref('')

const formatRol = (rol: string): string => {
  const roles: Record<string, string> = {
    ADMIN: 'Administrador',
    RESPONSABLE: 'Responsable',
    USER: 'Usuario'
  }
  return roles[rol] || rol
}

const formatFecha = (fecha: string | undefined): string => {
  if (!fecha) return 'Nunca'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const cargarUsuarios = async () => {
  isLoading.value = true
  try {
    const response = await UsuarioService.getAll()
    usuarios.value = response.data
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    notify.error('Error', 'No se pudieron cargar los usuarios')
  } finally {
    isLoading.value = false
  }
}

const cargarTrabajadoresDisponibles = async () => {
  try {
    const response = await UsuarioService.getTrabajadoresDisponibles()
    trabajadoresDisponibles.value = response.data
    console.log('Trabajadores disponibles:', response.data)
  } catch (error: unknown) {
    console.error('Error al cargar trabajadores:', error)
    const err = error as { response?: { status?: number; data?: unknown } }
    if (err.response?.status === 403) {
      notify.error('Sin permisos', 'No tiene permisos para ver los trabajadores')
    } else {
      notify.error('Error', 'No se pudieron cargar los trabajadores disponibles')
    }
  }
}

const abrirModalCrear = () => {
  formCrear.value = {
    username: '',
    password: '',
    rol: 'USER',
    trabajadorId: ''
  }
  errorCrear.value = ''
  cargarTrabajadoresDisponibles()
  mostrarModalCrear.value = true
}

const abrirModalEditar = (usuario: Usuario) => {
  usuarioEditar.value = usuario
  formEditar.value = {
    username: usuario.username,
    rol: usuario.rol
  }
  errorEditar.value = ''
  mostrarModalEditar.value = true
}

const abrirModalPassword = (usuario: Usuario) => {
  usuarioPassword.value = usuario
  nuevaPassword.value = ''
  confirmarPassword.value = ''
  errorPassword.value = ''
  mostrarModalPassword.value = true
}

const cerrarModales = () => {
  mostrarModalCrear.value = false
  mostrarModalEditar.value = false
  mostrarModalPassword.value = false
}

const crearUsuario = async () => {
  if (!formCrear.value.trabajadorId) {
    errorCrear.value = 'Seleccione un trabajador'
    return
  }

  isGuardando.value = true
  errorCrear.value = ''

  try {
    await UsuarioService.create(formCrear.value)
    notify.success('Usuario creado', 'El usuario fue creado correctamente')
    cerrarModales()
    cargarUsuarios()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } }
    errorCrear.value = err.response?.data?.error || 'Error al crear usuario'
  } finally {
    isGuardando.value = false
  }
}

const actualizarUsuario = async () => {
  if (!usuarioEditar.value) return

  isGuardando.value = true
  errorEditar.value = ''

  try {
    await UsuarioService.update(usuarioEditar.value.id, formEditar.value)
    notify.success('Usuario actualizado', 'Los cambios fueron guardados')
    cerrarModales()
    cargarUsuarios()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } }
    errorEditar.value = err.response?.data?.error || 'Error al actualizar usuario'
  } finally {
    isGuardando.value = false
  }
}

const cambiarPassword = async () => {
  if (!usuarioPassword.value) return

  if (nuevaPassword.value !== confirmarPassword.value) {
    errorPassword.value = 'Las contraseñas no coinciden'
    return
  }

  if (nuevaPassword.value.length < 4) {
    errorPassword.value = 'La contraseña debe tener al menos 4 caracteres'
    return
  }

  isGuardando.value = true
  errorPassword.value = ''

  try {
    await UsuarioService.changePassword(usuarioPassword.value.id, nuevaPassword.value)
    notify.success('Contraseña cambiada', 'La contraseña fue actualizada correctamente')
    cerrarModales()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } }
    errorPassword.value = err.response?.data?.error || 'Error al cambiar contraseña'
  } finally {
    isGuardando.value = false
  }
}

const desactivarUsuario = async (usuario: Usuario) => {
  if (!confirm(`¿Desactivar al usuario ${usuario.username}?`)) return

  try {
    await UsuarioService.delete(usuario.id)
    notify.success('Usuario desactivado', `${usuario.username} fue desactivado`)
    cargarUsuarios()
  } catch (error) {
    notify.error('Error', 'No se pudo desactivar el usuario')
  }
}

const activarUsuario = async (usuario: Usuario) => {
  try {
    await UsuarioService.update(usuario.id, { activo: true })
    notify.success('Usuario activado', `${usuario.username} fue activado`)
    cargarUsuarios()
  } catch (error) {
    notify.error('Error', 'No se pudo activar el usuario')
  }
}

onMounted(() => {
  cargarUsuarios()
})
</script>

<style scoped>
.usuario-list {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 5px;
}

.subtitulo {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 25px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.btn-crear {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1em;
}

.btn-crear:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.tabla-usuarios {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tabla-usuarios th,
.tabla-usuarios td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.tabla-usuarios th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
}

.tabla-usuarios tr:nth-child(even) {
  background-color: #fafafa;
}

.tabla-usuarios tr:hover {
  background-color: #f0f7ff;
}

.tabla-usuarios tr.inactivo {
  opacity: 0.6;
  background-color: #f5f5f5;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
}

.badge-admin {
  background-color: #e74c3c;
  color: white;
}

.badge-responsable {
  background-color: #3498db;
  color: white;
}

.badge-user {
  background-color: #95a5a6;
  color: white;
}

.estado {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
}

.estado.activo {
  background-color: #d4edda;
  color: #155724;
}

.estado.inactivo {
  background-color: #f8d7da;
  color: #721c24;
}

.acciones {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.acciones button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8em;
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-password {
  background-color: #9b59b6;
  color: white;
}

.btn-desactivar {
  background-color: #e74c3c;
  color: white;
}

.btn-activar {
  background-color: #27ae60;
  color: white;
}

/* Modal */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-input.disabled {
  background-color: #f5f5f5;
  color: #888;
}

.hint {
  color: #e67e22;
  font-size: 0.85em;
  margin-top: 5px;
  display: block;
}

.mensaje.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .tabla-usuarios {
    font-size: 0.85em;
  }

  .acciones {
    flex-direction: column;
  }
}
</style>
