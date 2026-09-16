<template>
  <div class="modal-overlay" @click.self="emit('cancelar')">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="conteo-denominaciones-titulo">
      <header>
        <div>
          <h3 id="conteo-denominaciones-titulo">{{ titulo }}</h3>
          <p>{{ descripcion }}</p>
        </div>
        <button class="cerrar" type="button" aria-label="Cerrar" @click="emit('cancelar')">×</button>
      </header>

      <div class="total">
        <span>Total contado</span>
        <strong>{{ moneda(total) }}</strong>
        <small v-if="importeEsperado != null" :class="{ error: !coincide }">
          {{ coincide ? 'El conteo coincide con el importe.' : `Diferencia: ${moneda(diferencia)}` }}
        </small>
      </div>

      <div class="denominaciones">
        <label v-for="denominacion in DENOMINACIONES" :key="denominacion" class="fila">
          <span>{{ moneda(denominacion) }}</span>
          <input v-model.number="cantidades[denominacion]" type="number" min="0" step="1" inputmode="numeric" />
          <b>{{ moneda((cantidades[denominacion] || 0) * denominacion) }}</b>
        </label>
      </div>

      <footer>
        <button type="button" class="secundario" @click="limpiar">Limpiar</button>
        <span class="spacer"></span>
        <button type="button" class="secundario" @click="emit('cancelar')">Cancelar</button>
        <button type="button" class="primario" :disabled="importeEsperado != null && !coincide" @click="confirmar">Confirmar conteo</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { DenominacionCantidad } from '@/services/LiquidacionCajaService'

const DENOMINACIONES = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000] as const

const props = withDefaults(defineProps<{
  titulo?: string
  descripcion?: string
  importeEsperado?: number | null
  inicial?: DenominacionCantidad[]
}>(), {
  titulo: 'Conteo de efectivo por denominación',
  descripcion: 'Indique la cantidad física de cada billete.',
  importeEsperado: null,
  inicial: () => []
})

const emit = defineEmits<{
  confirmar: [denominaciones: DenominacionCantidad[]]
  cancelar: []
}>()

const cantidades = reactive<Record<number, number>>(Object.fromEntries(DENOMINACIONES.map(valor => [valor, 0])))

function cargarInicial() {
  for (const valor of DENOMINACIONES) cantidades[valor] = 0
  for (const item of props.inicial || []) {
    if (DENOMINACIONES.includes(item.denominacion as typeof DENOMINACIONES[number])) cantidades[item.denominacion] = Math.max(0, Number(item.cantidad) || 0)
  }
}

watch(() => props.inicial, cargarInicial, { immediate: true, deep: true })

const cantidadEntera = (cantidad: number) => Math.max(0, Math.trunc(Number(cantidad) || 0))
const total = computed(() => DENOMINACIONES.reduce((suma, valor) => suma + valor * cantidadEntera(cantidades[valor]), 0))
const diferencia = computed(() => Math.round((total.value - (props.importeEsperado || 0)) * 100) / 100)
const coincide = computed(() => props.importeEsperado == null || Math.abs(diferencia.value) < 0.005)
const moneda = (importe: number) => `$${(importe || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function limpiar() {
  for (const valor of DENOMINACIONES) cantidades[valor] = 0
}

function confirmar() {
  if (!coincide.value) return
  emit('confirmar', DENOMINACIONES.map(denominacion => ({ denominacion, cantidad: cantidadEntera(cantidades[denominacion]) })).filter(item => item.cantidad > 0))
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 1rem; background: #0f172a99; }
.modal { width: min(690px, 100%); max-height: calc(100vh - 2rem); overflow: auto; background: white; border-radius: 12px; box-shadow: 0 20px 45px #0005; padding: 1.25rem; }
header { display: flex; justify-content: space-between; gap: 1rem; } h3 { color: #1e3a5f; margin: 0; } p { color: #64748b; margin: .35rem 0 0; }.cerrar { background: none; border: 0; color: #475569; cursor: pointer; font-size: 1.8rem; line-height: 1; }
.total { align-items: baseline; background: #eff6ff; border-left: 4px solid #2563eb; display: flex; flex-wrap: wrap; gap: .55rem; margin: 1rem 0; padding: .8rem 1rem; }.total strong { color: #0f3e74; font-size: 1.35rem; }.total small { color: #15803d; }.total small.error, .mensaje-error { color: #b91c1c; }
.denominaciones { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem .9rem; }.fila { align-items: center; border-bottom: 1px solid #e2e8f0; display: grid; gap: .5rem; grid-template-columns: 1fr 90px 1fr; padding: .4rem 0; }.fila span { font-weight: 700; }.fila b { font-size: .85rem; text-align: right; }.fila input { border: 1px solid #cbd5e1; border-radius: 5px; min-width: 0; padding: .45rem; text-align: right; }
footer { align-items: center; display: flex; gap: .65rem; margin-top: 1.25rem; }.spacer { flex: 1; } button { border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; padding: .6rem 1rem; }.primario { background: #2563eb; color: white; }.primario:disabled { cursor: not-allowed; opacity: .5; }.secundario { background: #e2e8f0; color: #334155; }@media (max-width: 580px) { .denominaciones { grid-template-columns: 1fr; }.fila { grid-template-columns: 1fr 80px 1fr; } }
</style>
