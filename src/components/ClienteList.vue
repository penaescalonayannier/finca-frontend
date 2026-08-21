<template>
  <div class="cliente-list">
    <h2>Gestión de Clientes</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por Nombre, Cuenta o RUC..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      
      <button @click="mostrarModalCrear = true" class="btn-crear">Crear Nuevo Cliente</button>
    </div>

    <table class="cliente-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cuenta</th>
          <th>Nombre</th>
          <th>RUC</th>
          <th>Dirección</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cliente in clientes" :key="cliente.id">
          <td>{{ cliente.id }}</td>
          <td>{{ cliente.cuenta }}</td>
          <td>{{ cliente.nombre }}</td>
          <td>{{ cliente.ruc }}</td>
          <td>{{ cliente.direccion }}</td>
        </tr>
      </tbody>
    </table>
    
    <div v-if="clientes.length === 0 && !isLoading" class="no-data">No hay clientes registrados</div>
    <div v-if="isLoading" class="loading">Cargando clientes...</div>

    <div v-if="!isLoading && clientes.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button
          class="btn-pag"
          :disabled="paginaActual === 0"
          @click="cambiarPagina(paginaActual - 1)"
        >
          Anterior
        </button>
        <span class="page-indicator">Pagina {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button
          class="btn-pag"
          :disabled="paginaActual >= totalPaginas - 1 || totalPaginas === 0"
          @click="cambiarPagina(paginaActual + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
    
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearCliente
          @cliente-creado="handleClienteCreado"
          @cancelar="mostrarModalCrear = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
// Importar el servicio
import ClienteService from '@/services/ClienteService'; 
// Importar el componente de creación (ajustar la ruta si es necesario)
import CrearCliente from '@/components/CrearCliente.vue'; 
// Importar los tipos
import type { Cliente } from '@/types/Cliente';
// Asumo que tiene un PagedResponse y SearchFilter en types/EstadoCuenta o un archivo compartido
import type { SearchFilter } from '@/types/EstadoCuenta';

// Estado de la Vista
const clientes = ref<Cliente[]>([]);
const searchQuery = ref('');
const paginaActual = ref(0);
const tamanoPagina = ref(50);
const totalElementos = ref(0);
const mostrarModalCrear = ref(false);
const isLoading = ref(false);

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value));


// Lógica principal de carga/búsqueda
const cargarClientes = async () => {
  isLoading.value = true;
  clientes.value = [];
  try {
    console.log('Buscando clientes...');

    // 1. Definir filtros con CONTAINS para búsqueda de texto
    const filters: SearchFilter[] = [];
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'nombre',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'ruc',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    // 2. Llamada al servicio con parámetros de búsqueda
    const response = await ClienteService.buscarClientes({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
    });

    const data = response.data as Record<string, unknown>;
    console.log('Respuesta clientes:', data); // Debug

    // Formato PaginatedResponse: { data, totalElements, totalPages, size, page }
    if (data.data && Array.isArray(data.data)) {
      clientes.value = (data.data as Cliente[]) || [];
      totalElementos.value = Number(data.totalElements) || 0;
    } else if (data.content && Array.isArray(data.content)) {
      clientes.value = (data.content as Cliente[]) || [];
      totalElementos.value = Number(data.totalElements) || 0;
    } else if (Array.isArray(data)) {
      clientes.value = data as Cliente[];
      totalElementos.value = data.length;
    } else {
      clientes.value = [];
      totalElementos.value = 0;
    }

    console.log('totalElementos:', totalElementos.value, 'totalPaginas:', Math.ceil(totalElementos.value / tamanoPagina.value));

    console.log(`Cargados ${clientes.value.length} clientes de ${totalElementos.value} totales`);

  } catch (error) {
    console.error('Error al buscar clientes:', error);
    alert('Error al cargar la lista de clientes. Revise la consola para detalles.');
    clientes.value = [];
    totalElementos.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina;
    cargarClientes();
  }
};

// Buscar con reset de página
const buscarConReset = () => {
  paginaActual.value = 0;
  cargarClientes();
};

// Cambiar tamaño de página
const cambiarTamanoPagina = () => {
  paginaActual.value = 0;
  cargarClientes();
};

const handleClienteCreado = () => {
  mostrarModalCrear.value = false;
  // Volver a cargar la página 1 para ver el nuevo cliente
  paginaActual.value = 0;
  cargarClientes(); 
};

onMounted(() => {
  cargarClientes();
});
</script>

<style scoped>
/* Estilos simplificados para el cliente listado */
.cliente-list { padding: 20px; }
.search-bar { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }

.search-input {
  flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;
}
.btn-buscar {
  background-color: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;
}
.btn-buscar:hover { background-color: #0056b3; }

.btn-crear {
  background-color: #42b983; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;
}
.btn-crear:hover { background-color: #3aa876; }

.cliente-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
.cliente-table th, .cliente-table td { border: 1px solid #eee; padding: 12px; text-align: left; }
.cliente-table th { background-color: #f5f5f5; }
.cliente-table tr:nth-child(even) { background-color: #f9f9f9; }

/* Paginación */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.9em;
}

.pagination-info .separator {
  color: #ccc;
}

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-left: 5px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
  color: #333;
}

.btn-pag {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.btn-pag:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.btn-pag:disabled {
  background-color: #e9ecef;
  color: #aaa;
  cursor: not-allowed;
}

/* Mensajes */
.no-data, .loading { text-align: center; padding: 20px; color: #888; font-style: italic; }

/* Modal Styles */
.modal { position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0, 0, 0, 0.4); display: flex; justify-content: center; align-items: center; }
.modal-content { background-color: #fefefe; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px; position: relative; }
.close { position: absolute; top: 10px; right: 15px; font-size: 24px; font-weight: bold; cursor: pointer; }
.close:hover { color: #000; }
</style>