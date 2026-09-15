<!-- src/views/DetalleAlmacenView.vue -->

<template>
  <div class="detalle-almacen-view">
    <div class="view-header">
      <button @click="volverALista" class="btn-volver">
        ← Volver a Almacenes
      </button>
    </div>

    <div class="view-content">
      <DetalleAlmacen
        v-if="almacenId"
        :almacen-id="almacenId"
        @close="volverALista"
        @edit="editarAlmacen"
        @updated="handleUpdated"
      />
      <div v-else class="error-state">
        <p>Almacen no encontrado</p>
        <button @click="volverALista" class="btn-volver">Volver a la lista</button>
      </div>
    </div>

    <!-- Modal Editar -->
    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearAlmacen
          :key="'editar-' + almacenEditando?.id"
          :almacen="almacenEditando"
          @updated="handleAlmacenActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetalleAlmacen from '@/components/DetalleAlmacen.vue'
import CrearAlmacen from '@/components/CrearAlmacen.vue'
import { notify } from '@/composables/useNotification'
import type { Almacen } from '@/types/Almacen'

const route = useRoute()
const router = useRouter()

const almacenId = computed(() => route.params.id as string)
const mostrarModalEditar = ref(false)
const almacenEditando = ref<Almacen | null>(null)
const componentKey = ref(0)

const volverALista = () => {
  router.push('/almacenes')
}

const editarAlmacen = (almacen: Almacen) => {
  almacenEditando.value = { ...almacen }
  mostrarModalEditar.value = true
}

const handleAlmacenActualizado = () => {
  mostrarModalEditar.value = false
  notify.success('Almacen actualizado', 'Los datos fueron guardados correctamente')
  componentKey.value++
}

const handleUpdated = () => {
  componentKey.value++
}

watch(() => route.params.id, () => {
  componentKey.value++
})
</script>

<style scoped>
.detalle-almacen-view {
  min-height: 100vh;
  background: #f5f6fa;
}

.view-header {
  padding: 20px 25px;
  background: #fff;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-volver {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-volver:hover {
  background: #7f8c8d;
  transform: translateX(-3px);
}

.view-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

.view-content :deep(.detalle-almacen) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.view-content :deep(.detalle-header) {
  padding: 25px 30px;
}

.view-content :deep(.detalle-content) {
  padding: 30px;
}

.view-content :deep(.btn-cerrar) {
  display: none;
}

.error-state {
  text-align: center;
  padding: 60px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.error-state p {
  color: #888;
  font-size: 1.2em;
  margin-bottom: 20px;
}

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
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-width: 500px;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  line-height: 1;
}

.close:hover {
  color: #333;
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .view-header {
    padding: 15px;
  }

  .view-content {
    margin: 15px auto;
    padding: 0 10px;
  }

  .btn-volver {
    padding: 8px 16px;
    font-size: 0.9em;
  }
}
</style>
