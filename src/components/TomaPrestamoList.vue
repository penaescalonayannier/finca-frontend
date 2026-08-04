<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TomaPrestamoService from '@/services/TomaPrestamoService';
import { TomaPrestamo, TipoTomaPrestamo } from '@/types/TomaPrestamo';
import CrearTomaPrestamo from './CrearTomaPrestamo.vue'; 

// =========================================================================
// ESTADO Y FILTROS
// =========================================================================

const tomaPrestamos = ref<TomaPrestamo[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const filterTipo = ref<string>('');
const page = ref(0);
const size = ref(10);
const totalPages = ref(0);
const totalElements = ref(0);

// Estado para el modal de Crear/Editar
const mostrarModalCrear = ref(false);
const isEditing = ref(false);
const editingTomaId = ref<string | undefined>(undefined);

// Estado para el modal de eliminación
const mostrarModalEliminar = ref(false);
const tomaAEliminar = ref<TomaPrestamo | null>(null);

// AÑADIDO: Placeholder para el ID del crédito seleccionado
const selectedCreditoId = ref('a1b2c3d4-e5f6-7890-1234-567890abcdef'); 

// =========================================================================
// MÉTODOS DE BÚSQUEDA Y PAGINACIÓN
// =========================================================================

const buscarTomaPrestamos = async () => {
    isLoading.value = true;
    try {
        // Construir filtros según el formato que espera el backend
        const filters: any[] = [];
        
        // Si hay búsqueda por texto, buscar en cuentaDestino u observaciones
        if (searchQuery.value.trim()) {
            // IMPORTANTE: Usar el formato correcto que espera kynsof-share
            filters.push({ 
                key: 'cuentaDestino', 
                value: searchQuery.value, 
                operator: 'CONTAINS', // Cambiado de 'LIKE' a 'CONTAINS'
                logicalOperation: 'OR'
            });
            filters.push({ 
                key: 'observaciones', 
                value: searchQuery.value, 
                operator: 'CONTAINS', // Cambiado de 'LIKE' a 'CONTAINS'
                logicalOperation: 'OR'
            });
        }
        
        // Filtrar por tipo si está seleccionado
        if (filterTipo.value) {
            filters.push({ 
                key: 'tipo', 
                value: filterTipo.value, 
                operator: 'EQUALS',
                logicalOperation: 'AND'
            });
        }

        // Llamar al servicio con los parámetros correctos
        const response = await TomaPrestamoService.search(page.value, size.value, filters);
        
        // Ajustar según la estructura de respuesta de tu backend
        // El backend kynsof-share devuelve: { data, totalPages, totalElements, page, size }
        tomaPrestamos.value = response.data || [];
        totalPages.value = response.totalPages || 0;
        totalElements.value = response.totalElements || 0;

        // Si no hay paginación explícita, calcular totalPages
        if (totalPages.value === 0 && totalElements.value > 0) {
            totalPages.value = Math.ceil(totalElements.value / size.value);
        }

    } catch (error: any) {
        console.error('Error al buscar tomas de prestamo:', error);
        tomaPrestamos.value = [];
        totalPages.value = 0;
        totalElements.value = 0;
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al cargar las tomas de préstamo.';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        alert(errorMessage);
    } finally {
        isLoading.value = false;
    }
};

const buscarConReset = () => {
    page.value = 0;
    buscarTomaPrestamos();
};

const cambiarPagina = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages.value) {
        page.value = newPage;
        buscarTomaPrestamos();
    }
};

const refrescarListaYCerrarModal = () => {
    mostrarModalCrear.value = false;
    isEditing.value = false;
    editingTomaId.value = undefined;
    buscarTomaPrestamos();
};

const editarToma = (id: string) => {
    isEditing.value = true;
    editingTomaId.value = id;
    mostrarModalCrear.value = true;
};

// =========================================================================
// MÉTODOS DE ELIMINACIÓN
// =========================================================================

const confirmarEliminar = (toma: TomaPrestamo) => {
    tomaAEliminar.value = toma;
    mostrarModalEliminar.value = true;
};

const eliminarToma = async () => {
    if (!tomaAEliminar.value?.id) return;
    
    isLoading.value = true;
    try {
        await TomaPrestamoService.delete(tomaAEliminar.value.id);
        mostrarModalEliminar.value = false;
        tomaAEliminar.value = null;
        // Recargar la lista después de eliminar
        buscarTomaPrestamos();
        alert('Toma de préstamo eliminada correctamente.');
    } catch (error: any) {
        console.error('Error al eliminar la toma de préstamo:', error);
        let errorMessage = 'Error al eliminar la toma de préstamo';
        if (error.response?.data?.message) {
            errorMessage += `: ${error.response.data.message}`;
        }
        alert(errorMessage);
    } finally {
        isLoading.value = false;
    }
};

// =========================================================================
// FORMATO DE DATOS
// =========================================================================

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
    }).format(value);
};

const formatDate = (fecha: string) => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
};

const getTipoLabel = (tipo: TipoTomaPrestamo) => {
    const labels: Record<TipoTomaPrestamo, string> = {
        EFECTIVO: 'Efectivo',
        SUMINISTROS: 'Suministros',
        SEGURO: 'Seguro'
    };
    return labels[tipo] || tipo;
};

const getTipoBadgeClass = (tipo: TipoTomaPrestamo) => {
    const classes: Record<TipoTomaPrestamo, string> = {
        EFECTIVO: 'tipo-efectivo',
        SUMINISTROS: 'tipo-suministro',
        SEGURO: 'tipo-seguro'
    };
    return classes[tipo] || '';
};

// =========================================================================
// MÉTODOS DE EXPORTACIÓN
// =========================================================================

const exportarRespaldoCultural = async (id: string) => {
    try {
        const blob = await TomaPrestamoService.exportRespaldoCultural(id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Formato_Apertura_Creditos.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Error al exportar respaldo cultural:', error);
        alert('Error al exportar el respaldo cultural');
    }
};

const exportarSolicitudDisposicion = async (id: string) => {
    try {
        const blob = await TomaPrestamoService.exportSolicitudDisposicion(id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Solicitud_Disposicion_Prestamo.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Error al exportar solicitud de disposición:', error);
        alert('Error al exportar la solicitud de disposición');
    }
};

// =========================================================================
// HOOKS
// =========================================================================

onMounted(() => {
    buscarTomaPrestamos();
});
</script>

<template>
  <div class="toma-prestamo-list">
    <h2>Gestión de Toma de Préstamos</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por cuenta destino u observaciones..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <select v-model="filterTipo" class="search-select">
        <option value="">Todos los tipos</option>
        <option value="EFECTIVO">Efectivo</option>
        <option value="SUMINISTROS">Suministros</option>
        <option value="SEGURO">Seguro</option>
      </select>
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      
      <button @click="mostrarModalCrear = true" class="btn-crear">Nueva Toma</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando tomas de préstamo...</div>

    <table v-else class="toma-prestamo-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th class="col-cuenta">Cuenta Destino</th>
          <th>Importe</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="tomaPrestamos.length === 0">
          <td colspan="5" class="no-data">No se encontraron registros</td>
        </tr>
        <tr v-for="toma in tomaPrestamos" :key="toma.id">
          <td>{{ formatDate(toma.fecha) }}</td>
          <td>
            <span :class="['tipo-badge', getTipoBadgeClass(toma.tipo)]">
              {{ getTipoLabel(toma.tipo) }}
            </span>
          </td>
          <td>{{ toma.cuentaDestino }}</td>
          <td class="importe">{{ formatCurrency(toma.importe) }}</td>
          <td class="acciones-cell">
            <button @click="editarToma(toma.id!)" class="btn-accion btn-editar">Editar</button>
            <button @click="confirmarEliminar(toma)" class="btn-accion btn-eliminar">Eliminar</button>
            <button @click="exportarRespaldoCultural(toma.id!)" class="btn-accion btn-export-excel" title="Exportar Respaldo Cultural">
              Excel
            </button>
            <button @click="exportarSolicitudDisposicion(toma.id!)" class="btn-accion btn-export-word" title="Exportar Solicitud Disposición">
              Word
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="totalPages > 0" class="pagination-container">
      <div class="pagination-info">
        <span>Página {{ page + 1 }} de {{ totalPages }}</span>
        <span class="separator">|</span>
        <span>Total: {{ totalElements }} registros</span>
      </div>
      <div class="pagination-controls">
        <button 
          @click="cambiarPagina(page - 1)" 
          :disabled="page === 0" 
          class="btn-pag"
        >
          Anterior
        </button>
        <span class="page-indicator">{{ page + 1 }}</span>
        <button 
          @click="cambiarPagina(page + 1)" 
          :disabled="page === totalPages - 1" 
          class="btn-pag"
        >
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="mostrarModalCrear" class="modal">
        <div class="modal-content">
            <CrearTomaPrestamo
                :is-editing="isEditing"
                :toma-prestamo-id="editingTomaId"
                :credito-id="selectedCreditoId"
                @saved="refrescarListaYCerrarModal"
                @cancel="mostrarModalCrear = false"
            />
        </div>
    </div>

    <!-- Modal de Confirmación para Eliminar -->
    <div v-if="mostrarModalEliminar" class="modal">
      <div class="modal-content modal-small">
        <h3>Confirmar Eliminación</h3>
        <p>¿Está seguro de eliminar esta toma de préstamo?</p>
        <p><strong>{{ tomaAEliminar?.cuentaDestino }}</strong> - {{ formatCurrency(tomaAEliminar?.importe || 0) }}</p>
        <div class="modal-buttons">
          <button @click="eliminarToma" class="btn-eliminar">Eliminar</button>
          <button @click="mostrarModalEliminar = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos generales */
.toma-prestamo-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #3498db;
}

/* Barra de Búsqueda y Botones */
.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-buscar, .btn-crear {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-buscar {
  background-color: #3498db;
  color: white;
}
.btn-buscar:hover {
  background-color: #2980b9;
}

.btn-crear {
  background-color: #2ecc71;
  color: white;
}
.btn-crear:hover {
  background-color: #27ae60;
}

/* Tabla */
.toma-prestamo-table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
}

.toma-prestamo-table th,
.toma-prestamo-table td {
  border: 1px solid #f1f1f1;
  padding: 12px 15px;
  text-align: left;
}

.toma-prestamo-table thead th {
  background-color: #34495e;
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.9em;
}

.toma-prestamo-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.toma-prestamo-table tbody tr:hover {
  background-color: #f0f8ff;
}

.no-data {
  text-align: center;
  font-style: italic;
  color: #7f8c8d;
}

/* Botones de Acción de Tabla */
.btn-accion {
  padding: 6px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-editar {
  background-color: #f39c12;
  color: white;
}
.btn-editar:hover {
  background-color: #e67e22;
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}
.btn-eliminar:hover {
  background-color: #c0392b;
}

.btn-export-excel {
  background-color: #217346;
  color: white;
}
.btn-export-excel:hover {
  background-color: #1e5f3a;
}

.btn-export-word {
  background-color: #2b579a;
  color: white;
}
.btn-export-word:hover {
  background-color: #1e3f6f;
}

.acciones-cell {
  white-space: nowrap;
}

/* Paginación */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px;
  background-color: #ecf0f1;
  border-radius: 4px;
}

.pagination-info { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    color: #666; 
}
.pagination-info .separator { 
    color: #ccc; 
}
.pagination-controls { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
}
.page-indicator { 
    padding: 0 15px; 
    font-weight: 500; 
}

.btn-pag {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
.btn-pag:hover:not(:disabled) { 
    background-color: #e9ecef; 
}
.btn-pag:disabled { 
    background-color: #e9ecef; 
    color: #aaa; 
    cursor: not-allowed; 
}

/* Modal */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  position: relative;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* Modal pequeño para eliminación */
.modal-small { 
  max-width: 350px; 
  text-align: center; 
}
.modal-small h3 { 
  margin-top: 0; 
  color: #e74c3c; 
}

.modal-buttons { 
  display: flex; 
  gap: 10px; 
  justify-content: center; 
  margin-top: 20px; 
}
.modal-buttons .btn-eliminar { 
  background-color: #e74c3c; 
  color: white; 
  padding: 10px 20px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
}
.modal-buttons .btn-eliminar:hover { 
  background-color: #c0392b; 
}
.modal-buttons .btn-cancelar { 
  background-color: #95a5a6; 
  color: white; 
  padding: 10px 20px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
}
.modal-buttons .btn-cancelar:hover { 
  background-color: #7f8c8d; 
}

/* Badges para tipos */
.tipo-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.85em;
}

.tipo-efectivo { 
  background-color: #e8f5e9; 
  color: #2e7d32; 
}
.tipo-suministro { 
  background-color: #fff3e0; 
  color: #e65100; 
}
.tipo-seguro { 
  background-color: #e3f2fd; 
  color: #1565c0; 
}

/* Estilos para columnas específicas */
.importe {
  text-align: right;
  font-weight: 500;
}
.col-cuenta {
  min-width: 250px;
}
</style>