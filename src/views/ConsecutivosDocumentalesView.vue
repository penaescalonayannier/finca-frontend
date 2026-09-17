<template>
  <div class="consecutivos-page">
    <header class="page-header">
      <div>
        <h2>Consecutivos documentales</h2>
        <p>Consulta de integridad para los documentos oficiales emitidos.</p>
      </div>
      <div class="filters">
        <label>Finca
          <select v-model="fincaId" @change="consultar">
            <option value="">Seleccione una finca</option>
            <option v-for="finca in fincas" :key="finca.id" :value="finca.id">{{ finca.code }} - {{ finca.name }}</option>
          </select>
        </label>
        <label>Año
          <input v-model.number="anio" type="number" min="2000" max="9999" @change="consultar">
        </label>
      </div>
    </header>

    <section class="notice">
      <strong>Solo lectura.</strong> Los consecutivos se asignan en el servidor al emitir el documento; no se editan, reutilizan ni corrigen desde esta pantalla.
    </section>

    <section class="card">
      <div v-if="!fincaId" class="empty">Seleccione una finca y un año para consultar.</div>
      <div v-else-if="cargando" class="empty">Consultando consecutivos…</div>
      <div v-else-if="error" class="empty error">{{ error }}</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Documento</th><th>Prefijo</th><th>Último emitido</th><th>Próximo número</th><th>Estado</th><th>Integridad / detalle</th></tr>
          </thead>
          <tbody>
            <tr v-for="tipo in tipos" :key="tipo">
              <template v-if="registroPorTipo(tipo)">
                <td><strong>{{ etiqueta(tipo) }}</strong></td>
                <td>{{ registroPorTipo(tipo)?.prefijo || '—' }}</td>
                <td>{{ registroPorTipo(tipo)?.cantidadDocumentos ? registroPorTipo(tipo)?.ultimoNumero : 'Sin emisiones' }}</td>
                <td>{{ registroPorTipo(tipo)?.proximoNumero ?? 'Pendiente de emisión' }}</td>
                <td><span :class="['estado', claseEstado(registroPorTipo(tipo)?.integridad)]">{{ registroPorTipo(tipo)?.integridad ? 'OK' : 'ADVERTENCIA' }}</span></td>
                <td>{{ detalle(registroPorTipo(tipo)!) }}</td>
              </template>
              <template v-else>
                <td><strong>{{ etiqueta(tipo) }}</strong></td><td>—</td><td>Sin emisiones</td><td>Pendiente de emisión</td><td><span class="estado neutral">SIN DATOS</span></td><td>El servidor no devolvió información para este documento.</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FincaService from '@/services/FincaService'
import ConsecutivoDocumentalService, { type ConsecutivoDocumental, type TipoConsecutivoDocumental } from '@/services/ConsecutivoDocumentalService'

const fincaId = ref('')
const anio = ref(new Date().getFullYear())
const fincas = ref<Array<{ id: string; code: string; name: string }>>([])
const registros = ref<ConsecutivoDocumental[]>([])
const cargando = ref(false)
const error = ref('')
const tipos: TipoConsecutivoDocumental[] = ['FACTURA', 'VALE', 'PRODUCCION', 'RECEPCION', 'TRANSFERENCIA_ALMACEN']

const indice = computed(() => new Map(registros.value.map(registro => [registro.tipo, registro])))
const registroPorTipo = (tipo: TipoConsecutivoDocumental) => indice.value.get(tipo)
const etiqueta = (tipo: TipoConsecutivoDocumental) => ({ FACTURA: 'Factura', VALE: 'Vale de salida', PRODUCCION: 'Producción terminada', RECEPCION: 'Informe de recepción SC-2-04', TRANSFERENCIA_ALMACEN: 'Transferencia SC-2-09' })[tipo]
const claseEstado = (integridad?: boolean) => integridad === true ? 'ok' : integridad === false ? 'warning' : 'neutral'
const detalle = (registro: ConsecutivoDocumental) => `${registro.cantidadDocumentos} documento(s) emitido(s) en ${registro.anio}. ${registro.integridad ? 'Secuencia íntegra.' : 'Revise la secuencia documental.'}`

const consultar = async () => {
  registros.value = []
  error.value = ''
  if (!fincaId.value) return
  cargando.value = true
  try {
    const respuesta = await ConsecutivoDocumentalService.consultar(fincaId.value, anio.value)
    registros.value = respuesta.data || []
  } catch (cause) {
    console.error('Error consultando consecutivos documentales:', cause)
    error.value = 'No se pudo consultar la integridad de consecutivos.'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  try {
    fincas.value = (await FincaService.buscarFincas({ size: 999 })).data.data || []
  } catch (cause) {
    console.error('Error cargando fincas:', cause)
    error.value = 'No se pudieron cargar las fincas.'
  }
})
</script>

<style scoped>
.consecutivos-page { color: #263238; margin: 0 auto; max-width: 1300px; padding: 1.5rem; }
.page-header, .filters { align-items: end; display: flex; gap: 1rem; justify-content: space-between; }
h2 { color: #1e3a5f; margin: 0; } p { color: #64748b; margin-bottom: 0; }
.filters label { display: grid; font-size: .8rem; font-weight: 700; gap: .25rem; } select, input { border: 1px solid #cbd5e1; border-radius: 6px; min-width: 180px; padding: .55rem; }
.notice { background: #eff6ff; border-left: 4px solid #2563eb; color: #1e3a5f; margin: 1.25rem 0; padding: .85rem 1rem; }
.card { background: white; border: 1px solid #dbe4ea; border-radius: 10px; padding: 1rem; }.table-wrap { overflow: auto; } table { border-collapse: collapse; min-width: 900px; width: 100%; } th, td { border-bottom: 1px solid #e2e8f0; padding: .7rem; text-align: left; } th { background: #f1f5f9; font-size: .75rem; text-transform: uppercase; }.empty { color: #64748b; padding: 2rem; text-align: center; }.error { color: #b91c1c; }
.estado { border-radius: 99px; display: inline-block; font-size: .72rem; font-weight: 800; padding: .25rem .55rem; }.ok { background: #dcfce7; color: #166534; }.warning { background: #fef3c7; color: #92400e; }.error { background: #fee2e2; color: #991b1b; }.neutral { background: #e2e8f0; color: #475569; }
@media (max-width: 700px) { .page-header, .filters { align-items: stretch; flex-direction: column; } select, input { width: 100%; } }
</style>
