<template>
  <h3>Crear Nuevo Cliente</h3>
  <form @submit.prevent="submitForm" class="cliente-form">
    <div class="form-group">
      <label for="cuenta">Cuenta:</label>
      <input type="text" id="cuenta" v-model="cliente.cuenta" required />
    </div>
    <div class="form-group">
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" v-model="cliente.nombre" required />
    </div>
    <div class="form-group">
      <label for="ruc">RUC:</label>
      <input type="text" id="ruc" v-model="cliente.ruc" required />
    </div>
    <div class="form-group">
      <label for="direccion">Dirección:</label>
      <input type="text" id="direccion" v-model="cliente.direccion" required />
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-guardar">Guardar</button>
      <button type="button" @click="$emit('cancelar')" class="btn-cancelar">Cancelar</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ClienteService from '@/services/ClienteService';

// Asumo que tiene un tipo ClienteRequest que coincide con CreateClienteRequest.java
interface ClienteRequest {
  cuenta: string;
  nombre: string;
  ruc: string;
  direccion: string;
}

const emit = defineEmits(['clienteCreado', 'cancelar']);

const cliente = ref<ClienteRequest>({
  cuenta: '',
  nombre: '',
  ruc: '',
  direccion: ''
});

const submitForm = async () => {
  try {
    const response = await ClienteService.crearCliente(cliente.value);
    console.log('Cliente creado:', response.data);
    alert('Cliente creado exitosamente con ID: ' + response.data.id);
    emit('clienteCreado');
  } catch (error) {
    console.error('Error al crear el cliente:', error);
    alert('Error al crear el cliente. Verifique los datos.');
  }
};
</script>

<style scoped>
/* Estilos simplificados para el formulario */
.cliente-form {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.btn-guardar { background-color: #4CAF50; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; margin-right: 10px;}
.btn-cancelar { background-color: #f44336; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer;}
</style>