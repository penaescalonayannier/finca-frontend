<template>
  <div class="consecutivos-page">
    <header class="page-header">
      <div>
        <h2>Registro de formas numeradas</h2>
        <p>Consulta de las series e integridad de los documentos oficiales emitidos.</p>
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
      <strong>Solo lectura.</strong> Cada tipo de documento conserva su propia forma y serie. Los números se asignan en el servidor al emitirlo; no se editan, reutilizan ni corrigen desde esta pantalla.
    </section>

    <section class="card">
      <div v-if="!fincaId" class="empty">Seleccione una finca y un año para consultar.</div>
      <div v-else-if="cargando" class="empty">Consultando consecutivos…</div>
      <div v-else-if="error" class="empty error">{{ error }}</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Documento</th><th>Forma</th><th>Serie</th><th>Alcance</th><th>Último emitido</th><th>Próximo número</th><th>Estado</th><th>Integridad / detalle</th></tr>
          </thead>
          <tbody>
            <tr v-for="tipo in tiposVisibles" :key="tipo">
              <td>
                <strong>{{ etiqueta(tipo) }}</strong>
                <small v-if="modelo(tipo)">{{ modelo(tipo) }}</small>
              </td>
              <td>{{ forma(tipo) }}</td>
              <td>{{ serie(tipo) }}</td>
              <td>{{ alcance(tipo) }}</td>
              <td>{{ ultimoEmitido(tipo) }}</td>
              <td>{{ registroPorTipo(tipo)?.proximoNumero ?? 'Pendiente de emisión' }}</td>
              <td><span :class="['estado', claseEstado(registroPorTipo(tipo))]">{{ textoEstado(registroPorTipo(tipo)) }}</span></td>
              <td>{{ detalle(registroPorTipo(tipo), tipo) }}</td>
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
import ConsecutivoDocumentalService, {
  type AlcanceFormaNumerada,
  type ConsecutivoDocumental,
  type FormaNumeradaDocumental,
  type TipoConsecutivoDocumental,
  type TipoConsecutivoDocumentalConocido
} from '@/services/ConsecutivoDocumentalService'

const fincaId = ref('')
const anio = ref(new Date().getFullYear())
const fincas = ref<Array<{ id: string; code: string; name: string }>>([])
const registros = ref<ConsecutivoDocumental[]>([])
const cargando = ref(false)
const error = ref('')
const tiposBase: TipoConsecutivoDocumentalConocido[] = [
  'FACTURA', 'VALE', 'PRODUCCION', 'RECEPCION', 'TRANSFERENCIA_ALMACEN',
  'RECIBO', 'CONTEO_FISICO', 'AJUSTE_INVENTARIO'
]

const definiciones: Partial<Record<TipoConsecutivoDocumentalConocido, { etiqueta: string; modelo?: string }>> = {
  FACTURA: { etiqueta: 'Factura comercial' },
  VALE: { etiqueta: 'Vale de salida' },
  PRODUCCION: { etiqueta: 'Producción terminada' },
  RECEPCION: { etiqueta: 'Informe de recepción', modelo: 'SC-2-04' },
  TRANSFERENCIA_ALMACEN: { etiqueta: 'Transferencia entre almacenes', modelo: 'SC-2-09' },
  RECIBO: { etiqueta: 'Recibo de cobro' },
  CONTEO_FISICO: { etiqueta: 'Conteo físico de inventario', modelo: 'SC-2-15' },
  AJUSTE_INVENTARIO: { etiqueta: 'Ajuste de inventario', modelo: 'SC-2-16' }
}

const indice = computed(() => new Map(registros.value.map(registro => [registro.tipo, registro])))
const registroPorTipo = (tipo: TipoConsecutivoDocumental) => indice.value.get(tipo)
const tiposVisibles = computed<TipoConsecutivoDocumental[]>(() => [
  ...tiposBase,
  ...registros.value.map(registro => registro.tipo).filter(tipo => !tiposBase.includes(tipo as TipoConsecutivoDocumentalConocido))
])
const etiqueta = (tipo: TipoConsecutivoDocumental) => definiciones[tipo as TipoConsecutivoDocumentalConocido]?.etiqueta || tipo.replaceAll('_', ' ')
const modelo = (tipo: TipoConsecutivoDocumental) => registroPorTipo(tipo)?.modeloOficial || definiciones[tipo as TipoConsecutivoDocumentalConocido]?.modelo
const forma = (tipo: TipoConsecutivoDocumental) => {
  const registro = registroPorTipo(tipo)
  const valor = registro?.forma
  if (typeof valor === 'string') return valor
  const formaDocumental = valor as FormaNumeradaDocumental | undefined
  return registro?.formaNombre || formaDocumental?.nombre || registro?.formaCodigo || formaDocumental?.codigo || tipo
}
const serie = (tipo: TipoConsecutivoDocumental) => {
  const registro = registroPorTipo(tipo)
  if (!registro) return 'Pendiente de habilitación'
  return registro.serie || (registro.prefijo ? `${registro.prefijo}-${registro.anio ?? anio.value}` : 'Pendiente de emisión')
}
const alcance = (tipo: TipoConsecutivoDocumental) => {
  const registro = registroPorTipo(tipo)
  const valor = registro?.alcance
  if (typeof valor === 'string') return valor
  const alcanceForma = valor as AlcanceFormaNumerada | undefined
  return registro?.alcanceDescripcion || alcanceForma?.descripcion || alcanceForma?.almacen || alcanceForma?.caja || alcanceForma?.finca || alcanceForma?.tipo || 'Finca'
}
const ultimoEmitido = (tipo: TipoConsecutivoDocumental) => {
  const registro = registroPorTipo(tipo)
  return registro?.cantidadDocumentos ? registro.ultimoNumero : 'Sin emisiones'
}
const textoEstado = (registro?: ConsecutivoDocumental) => {
  if (!registro) return 'PENDIENTE'
  if (registro.estado) return registro.estado.replaceAll('_', ' ')
  return registro.integridad === false ? 'ADVERTENCIA' : 'ACTIVA'
}
const claseEstado = (registro?: ConsecutivoDocumental) => {
  const estado = textoEstado(registro).toUpperCase()
  if (registro?.integridad === false || estado.includes('ALERTA') || estado.includes('ANUL')) return 'warning'
  if (estado.includes('ACTIVA') || estado === 'OK') return 'ok'
  return 'neutral'
}
const detalle = (registro: ConsecutivoDocumental | undefined, tipo: TipoConsecutivoDocumental) => {
  if (!registro) return `La forma ${etiqueta(tipo)} está identificada, pero aún no hay datos de su serie para esta finca y año.`
  const cantidad = registro.cantidadDocumentos ?? 0
  const periodo = registro.anio ?? anio.value
  if (registro.integridad === false) return `${cantidad} documento(s) emitido(s) en ${periodo}. Revise la continuidad de la serie.`
  return `${cantidad} documento(s) emitido(s) en ${periodo}. Secuencia íntegra.`
}

const consultar = async () => {
  registros.value = []
  error.value = ''
  if (!fincaId.value) return
  cargando.value = true
  try {
    const respuesta = await ConsecutivoDocumentalService.consultarRegistro(fincaId.value, anio.value)
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
