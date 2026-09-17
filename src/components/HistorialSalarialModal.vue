<template>
  <div class="salario-modal">
    <header><div><h3>Historial salarial</h3><p>{{ trabajador.nombre }} · Solo registra vigencias; no calcula nómina.</p></div><button @click="$emit('close')">×</button></header>
    <form @submit.prevent="guardar">
      <label>Fecha de vigencia<input v-model="form.fechaVigencia" type="date" required></label>
      <label>Salario de escala<input v-model.number="form.salarioEscala" type="number" min="0" step="0.0001" required></label>
      <label>Anticipo diario<input v-model.number="form.anticipoDiario" type="number" min="0" step="0.0001"></label>
      <label>Tasa<input v-model.number="form.tasa" type="number" min="0" step="0.0001"></label>
      <label class="motivo">Motivo<input v-model.trim="form.motivo" maxlength="500" required placeholder="Promoción, ajuste autorizado…"></label>
      <button class="primary" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Registrar vigencia' }}</button>
    </form>
    <p v-if="mensaje" class="mensaje">{{ mensaje }}</p>
    <div class="tabla"><table><thead><tr><th>Vigencia</th><th>Escala</th><th>Anticipo</th><th>Tasa</th><th>Motivo</th><th>Estado</th><th></th></tr></thead>
      <tbody><tr v-for="item in historial" :key="item.id"><td>{{ item.fechaVigencia }}</td><td>{{ dinero(item.salarioEscala) }}</td><td>{{ dinero(item.anticipoDiario) }}</td><td>{{ dinero(item.tasa) }}</td><td>{{ item.motivo }}</td><td>{{ item.estado }}</td><td><button v-if="item.estado === 'ACTIVO'" class="anular" @click="anular(item)">Anular</button></td></tr>
      <tr v-if="!historial.length"><td colspan="7">No hay vigencias registradas.</td></tr></tbody></table></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import HistorialSalarioService from '@/services/HistorialSalarioService'
import type { HistorialSalario } from '@/types/HistorialSalario'
import type { Trabajador } from '@/types/Trabajador'

const props = defineProps<{ trabajador: Trabajador }>()
defineEmits<{ close: [] }>()
const historial = ref<HistorialSalario[]>([])
const guardando = ref(false)
const mensaje = ref('')
const hoy = new Date().toISOString().slice(0, 10)
const form = reactive({ fechaVigencia: hoy, salarioEscala: 0, anticipoDiario: 0, tasa: 0, motivo: '' })
const dinero = (valor?: number) => Number(valor || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const cargar = async () => { historial.value = (await HistorialSalarioService.listar(props.trabajador.id!)).data }
const guardar = async () => {
  if (!form.motivo || form.salarioEscala < 0 || form.anticipoDiario < 0 || form.tasa < 0) { mensaje.value = 'Revise los importes y el motivo.'; return }
  guardando.value = true; mensaje.value = ''
  try { await HistorialSalarioService.registrar({ trabajadorId: props.trabajador.id!, ...form }); form.motivo = ''; await cargar() }
  catch (error: any) { mensaje.value = error.response?.data?.message || 'No se pudo registrar la vigencia.' }
  finally { guardando.value = false }
}
const anular = async (item: HistorialSalario) => {
  const motivo = window.prompt('Indique el motivo de anulación:')
  if (!motivo || !item.id) return
  try { await HistorialSalarioService.anular(item.id, motivo); await cargar() }
  catch (error: any) { mensaje.value = error.response?.data?.message || 'No se pudo anular la vigencia.' }
}
onMounted(cargar)
</script>

<style scoped>
.salario-modal{max-width:900px;color:#243447}.salario-modal header{display:flex;justify-content:space-between;gap:1rem}.salario-modal h3,.salario-modal p{margin:.1rem 0}.salario-modal header button{border:0;background:none;font-size:1.8rem;cursor:pointer}.salario-modal form{display:grid;grid-template-columns:repeat(4,1fr);gap:.7rem;margin:1rem 0}.salario-modal label{display:grid;gap:.25rem;font-size:.82rem;font-weight:600}.salario-modal input{border:1px solid #cbd5e1;border-radius:5px;padding:.5rem}.motivo{grid-column:span 3}.primary{background:#0f766e;border:0;border-radius:5px;color:white;font-weight:700;cursor:pointer;padding:.5rem}.tabla{overflow:auto}.tabla table{border-collapse:collapse;min-width:760px;width:100%}.tabla th,.tabla td{border-bottom:1px solid #dbe3ea;padding:.55rem;text-align:left}.tabla th{background:#f1f5f9;font-size:.76rem}.anular{background:#fee2e2;border:0;border-radius:4px;color:#b91c1c;cursor:pointer;padding:.35rem .55rem}.mensaje{color:#b91c1c}@media(max-width:700px){.salario-modal form{grid-template-columns:1fr 1fr}.motivo{grid-column:span 2}}
</style>
