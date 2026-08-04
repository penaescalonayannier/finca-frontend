<!-- src/components/CrearProducto.vue -->

<template>
  <div class="crear-producto">
    <h3>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-group">
        <label for="code">Código *</label>
        <input
          id="code"
          v-model="form.code"
          type="text"
          required
          placeholder="Ej: PROD-001"
        />
      </div>

      <div class="form-group">
        <label for="name">Nombre *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          placeholder="Nombre del producto"
        />
      </div>

      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Descripción del producto"
          rows="3"
        />
      </div>

      <div class="form-row">
        <div class="form-group form-group-half">
          <label for="price">Precio *</label>
          <input
            id="price"
            v-model.number="form.price"
            type="number"
            required
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>

        <div class="form-group form-group-half">
          <label for="stock">Stock *</label>
          <input
            id="stock"
            v-model.number="form.stock"
            type="number"
            required
            min="0"
            step="1"
            placeholder="0"
          />
        </div>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="form.active" type="checkbox" />
          Activo
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-guardar" :disabled="isGuardando">
          {{ isGuardando ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
        </button>
        <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProductoService from '@/services/ProductoService'
import type { Producto, ProductoRequest } from '@/types/Producto'

const props = defineProps<{
  producto?: Producto | null
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.producto?.id)
const isGuardando = ref(false)

const form = ref<ProductoRequest>({
  code: '',
  name: '',
  description: '',
  price: 0,
  stock: 0,
  active: true
})

const cargarDatos = () => {
  if (props.producto) {
    form.value = {
      code: props.producto.code || '',
      name: props.producto.name || '',
      description: props.producto.description || '',
      price: props.producto.price || 0,
      stock: props.producto.stock || 0,
      active: props.producto.active !== undefined ? props.producto.active : true
    }
  }
}

const guardar = async () => {
  // Validaciones
  if (!form.value.code.trim()) {
    alert('El código es obligatorio')
    return
  }
  if (!form.value.name.trim()) {
    alert('El nombre es obligatorio')
    return
  }
  if (form.value.price < 0) {
    alert('El precio debe ser mayor o igual a 0')
    return
  }
  if (form.value.stock < 0) {
    alert('El stock debe ser mayor o igual a 0')
    return
  }

  isGuardando.value = true
  try {
    if (isEditing.value && props.producto?.id) {
      await ProductoService.actualizarProducto(props.producto.id, form.value)
      emit('updated')
    } else {
      await ProductoService.crearProducto(form.value)
      emit('created')
    }
  } catch (error: any) {
    console.error('Error al guardar:', error)
    const message = error.response?.data?.message || 'Error al guardar el producto'
    alert(message)
  } finally {
    isGuardando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

// Limpiar formulario cuando se cierra el modal
watch(() => props.producto, () => {
  if (props.producto) {
    cargarDatos()
  }
}, { immediate: true })

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.crear-producto {
  padding: 10px;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group-half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #27ae60;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
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
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}
</style>