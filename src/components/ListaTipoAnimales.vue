<!-- src/components/ListaTipoAnimales.vue -->
<template>
  <div class="lista-tipo-animales">
    <!-- Header -->
    <div class="header">
      <h2>Gestión de Tipos de Animal</h2>
      <button @click="irACrear" class="btn-crear">+ Nuevo Tipo de Animal</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <!-- Table -->
    <div v-else-if="tipoAnimales.length > 0" class="tabla-contenedor">
      <table class="tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Orden</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tipo in tipoAnimales" :key="tipo.id">
            <td>
              <span class="codigo">{{ tipo.codigo }}</span>
            </td>
            <td>{{ tipo.nombre }}</td>
            <td>{{ tipo.descripcion || '-' }}</td>
            <td>{{ tipo.orden ?? '-' }}</td>
            <td>
              <span :class="['estado', tipo.activo ? 'activo' : 'inactivo']">
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="acciones">
              <button @click="irAEditar(tipo.id)" class="btn-editar" title="Editar">✏️</button>
              <button @click="confirmarEliminar(tipo)" class="btn-eliminar" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin datos -->
    <div v-else class="sin-datos">
      <p>No hay tipos de animal registrados</p>
      <p class="ayuda">Los tipos de animal se usan en reportes de Vaquería</p>
    </div>

    <!-- Modal confirmación eliminar -->
    <div v-if="tipoAEliminar" class="modal-overlay" @click="tipoAEliminar = null">
      <div class="modal" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar el tipo de animal "{{ tipoAEliminar.nombre }}"?</p>
        <div class="modal-acciones">
          <button @click="eliminarTipo" class="btn-confirmar">Eliminar</button>
          <button @click="tipoAEliminar = null" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TipoAnimalService from '@/services/TipoAnimalService'
import type { TipoAnimal } from '@/types/TipoAnimal'

const router = useRouter()

const tipoAnimales = ref<TipoAnimal[]>([])
const isLoading = ref(false)
const tipoAEliminar = ref<TipoAnimal | null>(null)

const cargarTipos = async () => {
  isLoading.value = true
  try {
    tipoAnimales.value = await TipoAnimalService.getAll()
  } catch (error) {
    console.error('Error al cargar tipos de animal:', error)
  } finally {
    isLoading.value = false
  }
}

const irACrear = () => {
  router.push('/crear-tipo-animal')
}

const irAEditar = (id: string) => {
  router.push(`/editar-tipo-animal/${id}`)
}

const confirmarEliminar = (tipo: TipoAnimal) => {
  tipoAEliminar.value = tipo
}

const eliminarTipo = async () => {
  if (!tipoAEliminar.value) return

  try {
    await TipoAnimalService.delete(tipoAEliminar.value.id)
    tipoAEliminar.value = null
    cargarTipos()
  } catch (error) {
    console.error('Error al eliminar tipo de animal:', error)
  }
}

onMounted(() => {
  cargarTipos()
})
</script>

<style scoped>
.lista-tipo-animales {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-crear {
  padding: 10px 20px;
  background-color: #e67e22;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-crear:hover {
  background-color: #d35400;
}

.tabla-contenedor {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
}

.tabla thead {
  background-color: #e67e22;
  color: white;
}

.tabla th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.tabla td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla tbody tr:hover {
  background-color: #fef9e7;
}

.codigo {
  font-family: monospace;
  background-color: #fdebd0;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #e67e22;
}

.estado {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
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
  gap: 10px;
}

.btn-editar,
.btn-eliminar {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-editar:hover {
  background-color: #3498db;
}

.btn-eliminar:hover {
  background-color: #e74c3c;
}

.loading,
.sin-datos {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
}

.sin-datos .ayuda {
  font-size: 0.9em;
  color: #bdc3c7;
  margin-top: 5px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #e67e22;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.modal h3 {
  margin-top: 0;
  color: #2c3e50;
}

.modal-acciones {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.btn-confirmar {
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar:hover {
  background-color: #c0392b;
}

.btn-cancelar {
  padding: 10px 20px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}
</style>
