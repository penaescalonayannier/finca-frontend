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
          placeholder="Ej: PROD001 (solo letras y números)"
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
        <div class="form-group form-group-third">
          <label for="unidadMedida">Unidad de Medida *</label>
          <select id="unidadMedida" v-model="form.unidadMedida" required>
            <option value="">Seleccione...</option>
            <optgroup label="Peso">
              <option value="KG">Kilogramo (KG)</option>
              <option value="G">Gramo (G)</option>
              <option value="LB">Libra (LB)</option>
              <option value="QQ">Quintal (QQ)</option>
            </optgroup>
            <optgroup label="Volumen">
              <option value="L">Litro (L)</option>
              <option value="ML">Mililitro (ML)</option>
              <option value="GAL">Galón (GAL)</option>
            </optgroup>
            <optgroup label="Cantidad">
              <option value="UND">Unidad (UND)</option>
              <option value="DOC">Docena (DOC)</option>
              <option value="SACO">Saco</option>
              <option value="CAJA">Caja</option>
            </optgroup>
            <optgroup label="Longitud">
              <option value="M">Metro (M)</option>
              <option value="CM">Centímetro (CM)</option>
            </optgroup>
          </select>
        </div>

        <div class="form-group form-group-third">
          <label for="tipoProducto">Tipo de Producto *</label>
          <select id="tipoProducto" v-model="form.tipoProducto" required>
            <option value="">Seleccione...</option>
            <option value="INSUMO">Insumo</option>
            <option value="VENTA">Venta</option>
            <option value="OTROS">Otros</option>
          </select>
        </div>

        <div class="form-group form-group-third">
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

      <div class="form-row form-row-precios">
        <div class="form-group form-group-third">
          <label for="price">Precio (Otros) *</label>
          <input
            id="price"
            v-model.number="form.price"
            type="number"
            required
            step="0.01"
            min="0.01"
            placeholder="0.01"
          />
        </div>

        <div class="form-group form-group-third">
          <label for="priceTrabajador">Precio Trabajador *</label>
          <input
            id="priceTrabajador"
            v-model.number="form.priceTrabajador"
            type="number"
            required
            step="0.01"
            min="0.01"
            placeholder="0.01"
          />
        </div>

        <div class="form-group form-group-third">
          <label for="priceComedor">Precio Comedor *</label>
          <input
            id="priceComedor"
            v-model.number="form.priceComedor"
            type="number"
            required
            step="0.01"
            min="0.01"
            placeholder="0.01"
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
import type { Producto, ProductoRequest, UnidadMedida } from '@/types/Producto'

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
  price: 0.01,
  priceTrabajador: 0.01,
  priceComedor: 0.01,
  unidadMedida: 'UND' as UnidadMedida,
  stock: 0,
  active: true,
  tipoProducto: 'OTROS'
})

const cargarDatos = () => {
  if (props.producto) {
    form.value = {
      code: props.producto.code || '',
      name: props.producto.name || '',
      description: props.producto.description || '',
      price: props.producto.price || 0.01,
      priceTrabajador: props.producto.priceTrabajador || 0.01,
      priceComedor: props.producto.priceComedor || 0.01,
      unidadMedida: props.producto.unidadMedida || 'UND' as UnidadMedida,
      stock: props.producto.stock || 0,
      active: props.producto.active !== undefined ? props.producto.active : true,
      tipoProducto: props.producto.tipoProducto || 'OTROS'
    }
  }
}

// Patrón para validar código alfanumérico (solo letras y números)
const CODE_PATTERN = /^[a-zA-Z0-9]+$/

const guardar = async () => {
  // Validaciones según la especificación

  // RN-04: Código alfanumérico
  if (!form.value.code.trim()) {
    alert('El código es obligatorio')
    return
  }
  if (!CODE_PATTERN.test(form.value.code)) {
    alert('El código solo puede contener letras y números (sin espacios ni caracteres especiales)')
    return
  }

  if (!form.value.name.trim()) {
    alert('El nombre es obligatorio')
    return
  }

  if (!form.value.unidadMedida) {
    alert('La unidad de medida es obligatoria')
    return
  }

  // RN-01: Precios > 0
  if (form.value.price <= 0) {
    alert('El precio (Otros) debe ser mayor a 0')
    return
  }
  if (form.value.priceTrabajador <= 0) {
    alert('El precio Trabajador debe ser mayor a 0')
    return
  }
  if (form.value.priceComedor <= 0) {
    alert('El precio Comedor debe ser mayor a 0')
    return
  }

  // RN-03: Stock >= 0
  if (form.value.stock < 0) {
    alert('El stock no puede ser negativo')
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

.form-group-third {
  flex: 1;
}

.form-row-precios {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea,
.form-group select {
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
.form-group textarea:focus,
.form-group select:focus {
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