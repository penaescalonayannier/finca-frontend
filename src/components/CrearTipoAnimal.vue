<!-- src/components/CrearTipoAnimal.vue -->
<template>
  <div class="crear-tipo-animal">
    <div class="formulario-contenedor">
      <h2>Crear Nuevo Tipo de Animal</h2>

      <form @submit.prevent="guardarTipo" class="formulario">
        <div class="grupo-formulario">
          <label for="codigo">Código *</label>
          <input
            id="codigo"
            v-model="formulario.codigo"
            type="text"
            placeholder="Ej: VACA, CERDO, OVEJA"
            required
          />
          <small class="help-text">Código único que identifica el tipo de animal</small>
        </div>

        <div class="grupo-formulario">
          <label for="nombre">Nombre *</label>
          <input
            id="nombre"
            v-model="formulario.nombre"
            type="text"
            placeholder="Ej: Vacas, Cerdos, Ovejas"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model="formulario.descripcion"
            placeholder="Descripción del tipo de animal"
            rows="3"
          ></textarea>
        </div>

        <div class="grupo-formulario">
          <label for="orden">Orden</label>
          <input
            id="orden"
            v-model.number="formulario.orden"
            type="number"
            min="0"
            placeholder="Ej: 1"
          />
          <small class="help-text">Posición en la lista (menor = primero)</small>
        </div>

        <div class="grupo-formulario checkbox-grupo">
          <label>
            <input
              type="checkbox"
              v-model="formulario.activo"
            />
            Activo
          </label>
        </div>

        <div class="acciones">
          <button type="submit" :disabled="isLoading" class="btn-guardar">
            {{ isLoading ? 'Guardando...' : 'Guardar Tipo de Animal' }}
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TipoAnimalService from '@/services/TipoAnimalService'
import type { TipoAnimalRequest } from '@/types/TipoAnimal'

const router = useRouter()

const formulario = ref<TipoAnimalRequest>({
  codigo: '',
  nombre: '',
  descripcion: '',
  activo: true,
  orden: 0
})

const isLoading = ref(false)
const mensaje = ref({ texto: '', tipo: 'exito' })

const guardarTipo = async () => {
  if (!formulario.value.codigo || !formulario.value.nombre) {
    mensaje.value = { texto: 'Por favor completa los campos requeridos', tipo: 'error' }
    return
  }

  isLoading.value = true
  try {
    await TipoAnimalService.create(formulario.value)
    mensaje.value = { texto: 'Tipo de animal creado exitosamente', tipo: 'exito' }
    setTimeout(() => {
      router.push('/lista-tipo-animales')
    }, 1500)
  } catch (error) {
    console.error('Error al crear tipo de animal:', error)
    mensaje.value = { texto: 'Error al crear el tipo de animal', tipo: 'error' }
  } finally {
    isLoading.value = false
  }
}

const irALista = () => {
  router.push('/lista-tipo-animales')
}
</script>

<style scoped>
.crear-tipo-animal {
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
  color: #e67e22;
  margin-top: 0;
  margin-bottom: 30px;
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
  border-color: #e67e22;
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.2);
}

.checkbox-grupo {
  flex-direction: row;
  align-items: center;
}

.checkbox-grupo label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  cursor: pointer;
}

.checkbox-grupo input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.help-text {
  color: #7f8c8d;
  font-size: 0.85em;
  margin-top: 5px;
}

.acciones {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn-guardar {
  flex: 1;
  padding: 12px;
  background-color: #e67e22;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #d35400;
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
