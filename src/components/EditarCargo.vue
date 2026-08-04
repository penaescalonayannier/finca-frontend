<!-- src/components/EditarCargo.vue -->
<template>
  <div class="editar-cargo">
    <div class="formulario-contenedor">
      <h2>Editar Cargo</h2>

      <div v-if="isLoadingInicial" class="loading">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>

      <form v-else @submit.prevent="guardarCargo" class="formulario">
        <div class="grupo-formulario">
          <label for="name">Nombre *</label>
          <input
            id="name"
            v-model="formulario.name"
            type="text"
            placeholder="Ej: Jefe de Brigada"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            v-model="formulario.description"
            placeholder="Descripción del cargo"
            rows="4"
          ></textarea>
        </div>

        <div class="grupo-formulario">
          <label for="salarioEscala">Salario Escala *</label>
          <input
            id="salarioEscala"
            v-model.number="formulario.salarioEscala"
            type="number"
            step="0.01"
            placeholder="Ej: 5000.00"
            required
          />
        </div>

        <div class="acciones">
          <button type="submit" :disabled="isLoading" class="btn-guardar">
            {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button type="button" @click="irALista" class="btn-cancelar">Cancelar</button>
        </div>
      </form>

      <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CargoService from '@/services/CargoService'
import type { UpdateCargoRequest } from '@/types/Cargo'

const router = useRouter()
const route = useRoute()

const formulario = ref<UpdateCargoRequest>({
  id: '',
  name: '',
  description: '',
  salarioEscala: undefined
})

const isLoading = ref(false)
const isLoadingInicial = ref(false)
const mensaje = ref({ texto: '', tipo: 'exito' })

const cargarCargo = async () => {
  isLoadingInicial.value = true
  try {
    const id = route.params.id as string
    const response = await CargoService.getById(id)
    const cargo = response.data

    formulario.value = {
      id: cargo.id,
      name: cargo.name,
      description: cargo.description,
      salarioEscala: cargo.salarioEscala
    }
  } catch (error) {
    console.error('Error al cargar cargo:', error)
    mensaje.value = { texto: 'Error al cargar el cargo', tipo: 'error' }
  } finally {
    isLoadingInicial.value = false
  }
}

const guardarCargo = async () => {
  if (!formulario.value.name || !formulario.value.salarioEscala) {
    mensaje.value = { texto: 'Por favor completa los campos requeridos', tipo: 'error' }
    return
  }

  isLoading.value = true
  try {
    await CargoService.update(formulario.value.id, formulario.value)
    mensaje.value = { texto: 'Cargo actualizado exitosamente', tipo: 'exito' }
    setTimeout(() => {
      router.push('/lista-cargos')
    }, 1500)
  } catch (error) {
    console.error('Error al actualizar cargo:', error)
    mensaje.value = { texto: 'Error al actualizar el cargo', tipo: 'error' }
  } finally {
    isLoading.value = false
  }
}

const irALista = () => {
  router.push('/lista-cargos')
}

onMounted(() => {
  cargarCargo()
})
</script>

<style scoped>
.editar-cargo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.formulario-contenedor {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.formulario-contenedor h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 30px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.grupo-formulario {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.grupo-formulario label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.grupo-formulario input,
.grupo-formulario select,
.grupo-formulario textarea {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 1em;
  font-family: inherit;
}

.grupo-formulario input:focus,
.grupo-formulario select:focus,
.grupo-formulario textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.acciones {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn-guardar {
  flex: 1;
  padding: 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  flex: 1;
  padding: 12px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

.mensaje {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.mensaje.exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensaje.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
