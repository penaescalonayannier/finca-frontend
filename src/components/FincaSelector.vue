<!-- src/components/FincaSelector.vue -->
<template>
  <div class="finca-selector" v-if="isAdmin">
    <label class="finca-selector-label">
      <span class="finca-icon">🏡</span>
      <select
        v-model="selectedFincaId"
        @change="onFincaChange"
        class="finca-select"
        :disabled="loading"
      >
        <option value="">Todas las fincas</option>
        <option
          v-for="finca in fincas"
          :key="finca.id"
          :value="finca.id"
        >
          {{ finca.name }} ({{ finca.code }})
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FincaService from '@/services/FincaService'
import AuthService from '@/services/AuthService'
import type { Finca } from '@/types/Finca'

const fincas = ref<Finca[]>([])
const selectedFincaId = ref<string>('')
const loading = ref(false)

const isAdmin = computed(() => AuthService.isAdmin())

onMounted(async () => {
  if (!isAdmin.value) return

  // Load current selection
  const storedFincaId = AuthService.getSelectedFincaId()
  if (storedFincaId) {
    selectedFincaId.value = storedFincaId
  }

  // Fetch all fincas
  await loadFincas()
})

async function loadFincas() {
  loading.value = true
  try {
    const response = await FincaService.obtenerTodasLasFincas()
    fincas.value = response.data.data || []
  } catch (error) {
    console.error('Error loading fincas:', error)
    fincas.value = []
  } finally {
    loading.value = false
  }
}

function onFincaChange() {
  const fincaId = selectedFincaId.value || null
  AuthService.setSelectedFincaId(fincaId)

  // Reload current page to apply new filter
  window.location.reload()
}
</script>

<style scoped>
.finca-selector {
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.finca-selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.finca-icon {
  font-size: 1.1em;
}

.finca-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  padding: 6px 28px 6px 12px;
  font-size: 0.9em;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 180px;
}

.finca-select:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.finca-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
}

.finca-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.finca-select option {
  background: #1a1a2e;
  color: #fff;
  padding: 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .finca-selector {
    width: 100%;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .finca-selector-label {
    width: 100%;
  }

  .finca-select {
    flex: 1;
    min-width: unset;
  }
}
</style>
