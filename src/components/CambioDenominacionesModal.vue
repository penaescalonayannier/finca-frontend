<template>
  <div class="modal-overlay" @click.self="emit('cancelar')">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="cambio-denominaciones-titulo">
      <header>
        <div><h3 id="cambio-denominaciones-titulo">Cambio de billetes</h3><p>Registre los billetes que salen de caja y los que entran. Ambos importes deben ser iguales.</p></div>
        <button type="button" class="cerrar" aria-label="Cerrar" @click="emit('cancelar')">×</button>
      </header>
      <div class="totales" :class="{ error: !cuadra }">
        <span>Salen: <b>{{ moneda(totalEntregados) }}</b></span>
        <span>Entran: <b>{{ moneda(totalRecibidos) }}</b></span>
        <small>{{ cuadra ? 'El cambio cuadra.' : `Diferencia: ${moneda(Math.abs(totalEntregados - totalRecibidos))}` }}</small>
      </div>
      <div class="datos">
        <label>Fecha<input v-model="fecha" type="date" /></label>
        <label>Observaciones<input v-model.trim="observaciones" maxlength="300" placeholder="Opcional" /></label>
      </div>
      <div class="tabla-wrap">
        <table>
          <thead><tr><th>Denominación</th><th>Salen de caja</th><th>Entran a caja</th></tr></thead>
          <tbody>
            <tr v-for="denominacion in DENOMINACIONES" :key="denominacion">
              <td>{{ moneda(denominacion) }} <small v-if="existencia(denominacion) != null">Disponibles: {{ existencia(denominacion) }}</small></td>
              <td><input v-model.number="entregados[denominacion]" type="number" min="0" :max="existencia(denominacion) ?? undefined" step="1" inputmode="numeric" /></td>
              <td><input v-model.number="recibidos[denominacion]" type="number" min="0" step="1" inputmode="numeric" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer>
        <button type="button" class="secundario" @click="limpiar">Limpiar</button><span></span>
        <button type="button" class="secundario" @click="emit('cancelar')">Cancelar</button>
        <button type="button" class="primario" :disabled="!cuadra || totalEntregados <= 0" @click="confirmar">Registrar cambio</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { DenominacionCantidad } from '@/services/LiquidacionCajaService'

const DENOMINACIONES = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000] as const
const props = withDefaults(defineProps<{ existencias?: DenominacionCantidad[]; fechaInicial?: string }>(), { existencias: () => [], fechaInicial: '' })
const emit = defineEmits<{ confirmar: [resultado: { fecha?: string; observaciones?: string; denominacionesEntregadas: DenominacionCantidad[]; denominacionesRecibidas: DenominacionCantidad[] }]; cancelar: [] }>()
const entregados = reactive<Record<number, number>>(Object.fromEntries(DENOMINACIONES.map(valor => [valor, 0])))
const recibidos = reactive<Record<number, number>>(Object.fromEntries(DENOMINACIONES.map(valor => [valor, 0])))
const fecha = ref(props.fechaInicial)
const observaciones = ref('')
const total = (conteo: Record<number, number>) => DENOMINACIONES.reduce((suma, denominacion) => suma + denominacion * Math.max(0, Math.trunc(Number(conteo[denominacion]) || 0)), 0)
const totalEntregados = computed(() => total(entregados))
const totalRecibidos = computed(() => total(recibidos))
const cuadra = computed(() => totalEntregados.value > 0 && totalEntregados.value === totalRecibidos.value)
const existencia = (denominacion: number) => props.existencias.find(item => item.denominacion === denominacion)?.cantidad
const moneda = (importe: number) => `$${importe.toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const aLista = (conteo: Record<number, number>) => DENOMINACIONES.map(denominacion => ({ denominacion, cantidad: Math.max(0, Math.trunc(Number(conteo[denominacion]) || 0)) })).filter(item => item.cantidad > 0)
function limpiar() { for (const denominacion of DENOMINACIONES) { entregados[denominacion] = 0; recibidos[denominacion] = 0 } }
function confirmar() { if (cuadra.value) emit('confirmar', { fecha: fecha.value || undefined, observaciones: observaciones.value || undefined, denominacionesEntregadas: aLista(entregados), denominacionesRecibidas: aLista(recibidos) }) }
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 1rem; background: #0f172a99; }.modal { width: min(640px, 100%); max-height: calc(100vh - 2rem); overflow: auto; background: white; border-radius: 12px; box-shadow: 0 20px 45px #0005; padding: 1.25rem; }header { display: flex; justify-content: space-between; gap: 1rem; }h3 { color: #1e3a5f; margin: 0; }p { color: #64748b; margin: .35rem 0 0; }.cerrar { background: none; border: 0; color: #475569; cursor: pointer; font-size: 1.8rem; line-height: 1; }.totales { display: flex; flex-wrap: wrap; gap: 1rem; background: #ecfdf5; border-left: 4px solid #059669; margin: 1rem 0; padding: .75rem; }.totales.error { background: #fef2f2; border-color: #dc2626; color: #991b1b; }.totales small { width: 100%; }.datos { display: grid; gap: .6rem; grid-template-columns: 1fr 2fr; margin-bottom: .8rem; }.datos label { display: grid; font-size: .78rem; font-weight: 600; gap: .2rem; }.tabla-wrap { overflow: auto; max-height: 49vh; }table { border-collapse: collapse; width: 100%; }th, td { border-bottom: 1px solid #e2e8f0; padding: .45rem; text-align: left; }th { background: #f1f5f9; color: #334155; font-size: .74rem; }td small { color: #64748b; display: block; font-size: .7rem; }input { border: 1px solid #cbd5e1; border-radius: 5px; max-width: 120px; padding: .42rem; text-align: right; }.datos input { max-width: none; text-align: left; }footer { display: flex; gap: .65rem; margin-top: 1rem; }footer span { flex: 1; }button { border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; padding: .6rem 1rem; }.primario { background: #0f766e; color: white; }.primario:disabled { cursor: not-allowed; opacity: .5; }.secundario { background: #e2e8f0; color: #334155; }
</style>
