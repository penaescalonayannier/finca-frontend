<template>
  <div class="arqueos-caja">
    <header class="page-header">
      <div><h2>Arqueos sorpresivos de caja</h2><p>Compruebe físicamente una muestra de billetes sin modificar el saldo de caja ni sus movimientos.</p></div>
      <label>Finca
        <select v-model="fincaId" @change="cambiarFinca"><option value="">Seleccione una finca</option><option v-for="finca in fincas" :key="finca.id" :value="finca.id">{{ finca.code }} - {{ finca.name }}</option></select>
      </label>
    </header>

    <section class="card nuevo-arqueo">
      <div class="section-title"><div><h3>Nuevo arqueo</h3><p>Seleccione una muestra de denominaciones. El sistema congelará el saldo esperado al iniciar el arqueo.</p></div></div>
      <div class="form-grid">
        <label>Responsable del conteo<input v-model.trim="nuevo.contadorResponsable" maxlength="150" placeholder="Nombre del contador" /></label>
        <label>Custodio de caja<input v-model.trim="nuevo.custodio" maxlength="150" required placeholder="Cajero/a responsable" /></label>
        <label>Recibido por / testigo<input v-model.trim="nuevo.recibidoPor" maxlength="150" placeholder="Opcional" /></label>
        <label class="obs">Observaciones<input v-model.trim="nuevo.observaciones" maxlength="500" placeholder="Opcional" /></label>
      </div>
      <div class="muestra">
        <strong>Muestra de denominaciones</strong><small>Seleccione al menos una denominación a comprobar.</small>
        <div class="denominaciones">
          <label v-for="denominacion in DENOMINACIONES" :key="denominacion" :class="{ activa: muestra.has(denominacion) }"><input :checked="muestra.has(denominacion)" type="checkbox" @change="alternarMuestra(denominacion)" /><span>{{ moneda(denominacion) }}<small>Disp.: {{ existencia(denominacion).cantidad }} · {{ moneda(existencia(denominacion).importe) }}</small></span></label>
        </div>
      </div>
      <div class="acciones"><button class="btn-primary" :disabled="creando || !fincaId || !muestra.size || !nuevo.contadorResponsable || !nuevo.custodio" @click="crearArqueo">{{ creando ? 'Iniciando...' : 'Iniciar arqueo sorpresa' }}</button></div>
    </section>

    <section v-if="arqueoActivo" class="card detalle" :class="{ cerrado: arqueoActivo.estado === 'CERRADO' }">
      <div class="section-title">
        <div><h3>Arqueo {{ arqueoActivo.numero ? `#${arqueoActivo.numero} ` : '' }}{{ arqueoActivo.estado === 'CERRADO' ? 'cerrado' : 'en curso' }}</h3><p>{{ arqueoActivo.tipo || 'PARCIAL' }} · {{ fecha(arqueoActivo.fechaApertura) }} · {{ arqueoActivo.contadorResponsable || 'Responsable no indicado' }}</p></div>
        <div class="detalle-actions"><span class="estado" :class="arqueoActivo.estado.toLowerCase()">{{ arqueoActivo.estado }}</span><button class="btn-pdf" @click="descargarPdf(arqueoActivo)">Descargar PDF</button></div>
      </div>
      <div class="totales">
        <div><span>Esperado</span><strong>{{ moneda(arqueoActivo.totalEsperado) }}</strong></div>
        <div v-if="arqueoActivo.estado === 'CERRADO'"><span>Físico</span><strong>{{ moneda(arqueoActivo.totalFisico || 0) }}</strong></div>
        <div v-if="arqueoActivo.estado === 'CERRADO'" :class="{ diferencia: (arqueoActivo.diferencia || 0) !== 0 }"><span>Diferencia</span><strong>{{ moneda(arqueoActivo.diferencia || 0) }}</strong></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Denominación</th><th>Unidades esperadas</th><th>Importe esperado</th><th>Conteo físico</th><th>Importe físico</th><th>Diferencia</th></tr></thead>
        <tbody><tr v-for="detalle in arqueoActivo.denominaciones" :key="detalle.denominacion" :class="{ diferencia: arqueoActivo.estado === 'CERRADO' && (detalle.diferenciaImporte || 0) !== 0 }">
          <td class="denom">{{ moneda(detalle.denominacion) }}</td><td>{{ detalle.cantidadEsperada }}</td><td class="money">{{ moneda(detalle.importeEsperado) }}</td>
          <td><input v-if="arqueoActivo.estado !== 'CERRADO'" v-model.number="conteoFisico[detalle.denominacion]" type="number" min="0" step="1" inputmode="numeric" /><span v-else>{{ detalle.cantidadFisica ?? 0 }}</span></td>
          <td class="money">{{ arqueoActivo.estado === 'CERRADO' ? moneda(detalle.importeFisico || 0) : moneda(detalle.denominacion * (conteoFisico[detalle.denominacion] || 0)) }}</td>
          <td class="money">{{ arqueoActivo.estado === 'CERRADO' ? moneda(detalle.diferenciaImporte || 0) : moneda(detalle.denominacion * (conteoFisico[detalle.denominacion] || 0) - detalle.importeEsperado) }}</td>
        </tr></tbody>
      </table></div>
      <div v-if="arqueoActivo.estado !== 'CERRADO'" class="cierre">
        <label>Observaciones de cierre<textarea v-model.trim="observacionesCierre" maxlength="1000" placeholder="Explique cualquier diferencia o circunstancia del conteo." /></label>
        <button class="btn-close" :disabled="cerrando" @click="cerrarArqueo">{{ cerrando ? 'Cerrando...' : 'Cerrar arqueo con conteo físico' }}</button>
      </div>
      <p v-else-if="arqueoActivo.observaciones" class="observacion"><strong>Observaciones registradas:</strong> {{ arqueoActivo.observaciones }}</p>
      <p class="nota">Este proceso es de control: no genera entrada, salida ni ajuste de caja.</p>
    </section>

    <section class="card historial">
      <div class="section-title"><div><h3>Historial de arqueos</h3><p>Seleccione un arqueo para revisar su detalle o descargar su acta.</p></div><button class="btn-secondary" :disabled="cargando || !fincaId" @click="cargarHistorial">Actualizar</button></div>
      <div v-if="!fincaId" class="empty">Seleccione una finca para consultar sus arqueos.</div>
      <div v-else-if="cargando" class="empty">Cargando arqueos...</div>
      <div v-else-if="!historial.length" class="empty">No hay arqueos registrados para esta finca.</div>
      <div v-else class="table-wrap"><table><thead><tr><th>No.</th><th>Tipo</th><th>Fecha apertura</th><th>Fecha cierre</th><th>Responsable</th><th>Estado</th><th>Esperado</th><th>Físico</th><th>Diferencia</th><th></th></tr></thead><tbody>
        <tr v-for="arqueo in historial" :key="arqueo.id"><td>{{ arqueo.numero || '—' }}</td><td>{{ arqueo.tipo || 'PARCIAL' }}</td><td>{{ fecha(arqueo.fechaApertura) }}</td><td>{{ fecha(arqueo.fechaCierre) }}</td><td>{{ arqueo.contadorResponsable || '—' }}</td><td><span class="estado" :class="arqueo.estado.toLowerCase()">{{ arqueo.estado }}</span></td><td class="money">{{ moneda(arqueo.totalEsperado) }}</td><td class="money">{{ arqueo.estado === 'CERRADO' ? moneda(arqueo.totalFisico || 0) : '—' }}</td><td class="money" :class="{ diferencia: (arqueo.diferencia || 0) !== 0 }">{{ arqueo.estado === 'CERRADO' ? moneda(arqueo.diferencia || 0) : '—' }}</td><td class="row-actions"><button class="link" @click="verDetalle(arqueo.id)">Ver</button><button class="link" @click="descargarPdf(arqueo)">PDF</button></td></tr>
      </tbody></table></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { notify } from '@/composables/useNotification'
import FincaService from '@/services/FincaService'
import ArqueoCajaService, { type ArqueoCaja, type CrearArqueoCajaRequest } from '@/services/ArqueoCajaService'
import LiquidacionCajaService, { type DenominacionCantidad } from '@/services/LiquidacionCajaService'

const DENOMINACIONES = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
const fincaId = ref('')
const fincas = ref<Array<{ id: string; code: string; name: string }>>([])
const historial = ref<ArqueoCaja[]>([])
const arqueoActivo = ref<ArqueoCaja | null>(null)
const muestra = reactive(new Set<number>())
const conteoFisico = reactive<Record<number, number>>({})
const nuevo = reactive({ contadorResponsable: '', custodio: '', recibidoPor: '', observaciones: '' })
const existencias = ref<DenominacionCantidad[]>([])
const observacionesCierre = ref('')
const cargando = ref(false)
const creando = ref(false)
const cerrando = ref(false)

const moneda = (importe: number) => `$${(importe || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fecha = (valor?: string) => valor ? new Date(valor).toLocaleString('es-CU') : '—'
function existencia(denominacion: number) {
  const cantidad = existencias.value.find(item => item.denominacion === denominacion)?.cantidad || 0
  return { cantidad, importe: cantidad * denominacion }
}
function alternarMuestra(denominacion: number) { muestra.has(denominacion) ? muestra.delete(denominacion) : muestra.add(denominacion) }
function prepararConteo(arqueo: ArqueoCaja) {
  for (const clave of Object.keys(conteoFisico)) delete conteoFisico[Number(clave)]
  for (const detalle of arqueo.denominaciones || []) conteoFisico[detalle.denominacion] = detalle.cantidadFisica ?? 0
  // Las observaciones de apertura forman parte del acta, pero nunca se reutilizan como cierre.
  observacionesCierre.value = ''
}

async function cargarHistorial() {
  arqueoActivo.value = null
  if (!fincaId.value) { historial.value = []; return }
  cargando.value = true
  try { historial.value = (await ArqueoCajaService.listar(fincaId.value)).data || [] }
  catch (error) { console.error('Error cargando arqueos', error); notify.error('Error', 'No se pudo cargar el historial de arqueos.') }
  finally { cargando.value = false }
}
async function cambiarFinca() {
  if (!fincaId.value) { existencias.value = []; await cargarHistorial(); return }
  try {
    const [, saldo] = await Promise.all([cargarHistorial(), LiquidacionCajaService.obtenerSaldoCaja(fincaId.value)])
    existencias.value = saldo.data?.denominaciones || []
  } catch (error) {
    console.error('Error cargando saldo físico para arqueo', error)
    existencias.value = []
    notify.error('Error', 'No se pudo consultar el saldo físico de caja.')
  }
}

async function crearArqueo() {
  if (!fincaId.value || !muestra.size) return
  creando.value = true
  try {
    const solicitud: CrearArqueoCajaRequest = { fincaId: fincaId.value, contadorResponsable: nuevo.contadorResponsable || undefined, custodio: nuevo.custodio, recibidoPor: nuevo.recibidoPor || undefined, observaciones: nuevo.observaciones || undefined, muestraDenominaciones: [...muestra] }
    const respuesta = await ArqueoCajaService.crear(solicitud)
    const creado = (await ArqueoCajaService.obtener(respuesta.data.id)).data
    arqueoActivo.value = creado
    prepararConteo(creado)
    muestra.clear(); nuevo.contadorResponsable = ''; nuevo.custodio = ''; nuevo.recibidoPor = ''; nuevo.observaciones = ''
    await cargarHistorialSinCerrarDetalle()
    notify.success('Arqueo iniciado', 'El saldo esperado quedó registrado. Ahora realice el conteo físico.')
  } catch (error) { console.error('Error iniciando arqueo', error); notify.error('Error', 'No fue posible iniciar el arqueo.') }
  finally { creando.value = false }
}

async function cargarHistorialSinCerrarDetalle() {
  if (!fincaId.value) return
  historial.value = (await ArqueoCajaService.listar(fincaId.value)).data || []
}
async function verDetalle(id: string) {
  try { const respuesta = await ArqueoCajaService.obtener(id); arqueoActivo.value = respuesta.data; prepararConteo(respuesta.data) }
  catch (error) { console.error('Error obteniendo arqueo', error); notify.error('Error', 'No se pudo obtener el detalle del arqueo.') }
}
async function cerrarArqueo() {
  if (!arqueoActivo.value) return
  cerrando.value = true
  try {
    const detalle = arqueoActivo.value
    await ArqueoCajaService.cerrar(detalle.id, { conteoFisico: detalle.denominaciones.map(item => ({ denominacion: item.denominacion, cantidad: Math.max(0, Math.trunc(Number(conteoFisico[item.denominacion]) || 0)) })), observaciones: observacionesCierre.value || undefined })
    const cerrado = (await ArqueoCajaService.obtener(detalle.id)).data
    arqueoActivo.value = cerrado
    prepararConteo(cerrado)
    await cargarHistorialSinCerrarDetalle()
    notify.success('Arqueo cerrado', 'El acta quedó registrada sin modificar el saldo de caja.')
  } catch (error) { console.error('Error cerrando arqueo', error); notify.error('Error', 'No fue posible cerrar el arqueo.') }
  finally { cerrando.value = false }
}
async function descargarPdf(arqueo: ArqueoCaja) {
  try {
    const respuesta = await ArqueoCajaService.descargarPdf(arqueo.id)
    const url = URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }))
    const enlace = document.createElement('a'); enlace.href = url; enlace.download = `arqueo-caja-${arqueo.fechaApertura.slice(0, 10)}.pdf`; enlace.click(); URL.revokeObjectURL(url)
  } catch (error) { console.error('Error descargando PDF de arqueo', error); notify.error('Error', 'No fue posible descargar el acta de arqueo.') }
}

onMounted(async () => {
  try { fincas.value = (await FincaService.buscarFincas({ size: 999 })).data.data || [] }
  catch (error) { console.error('Error cargando fincas', error); notify.error('Error', 'No se pudieron cargar las fincas.') }
})
</script>

<style scoped>
.arqueos-caja { color: #263238; margin: 0 auto; max-width: 1420px; padding: 1.5rem; }.page-header, .section-title, .detalle-actions { align-items: flex-start; display: flex; gap: 1rem; justify-content: space-between; }.page-header { margin-bottom: 1.2rem; }.page-header h2, h3 { color: #1e3a5f; margin: 0; }.page-header p, p, small { color: #64748b; }.page-header label, .form-grid label, .cierre label { color: #475569; display: grid; font-size: .8rem; font-weight: 600; gap: .25rem; }.page-header select, input, textarea { border: 1px solid #cbd5e1; border-radius: 6px; padding: .55rem; }.card { background: #fff; border: 1px solid #dbe4ea; border-radius: 10px; box-shadow: 0 1px 3px #0f172a0d; margin-bottom: 1.25rem; padding: 1.25rem; }.nuevo-arqueo { border-left: 4px solid #7c3aed; }.form-grid { display: grid; gap: .8rem; grid-template-columns: 1fr 1fr 2fr; margin: 1rem 0; }.muestra strong, .muestra small { display: block; }.muestra small { margin: .25rem 0 .6rem; }.denominaciones { display: grid; gap: .55rem; grid-template-columns: repeat(6, minmax(105px, 1fr)); }.denominaciones label { align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; display: flex; gap: .45rem; padding: .55rem; }.denominaciones label.activa { background: #ede9fe; border-color: #7c3aed; color: #5b21b6; font-weight: 700; }.acciones { display: flex; justify-content: flex-end; margin-top: 1rem; }.btn-primary, .btn-secondary, .btn-close, .btn-pdf, .link { border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; padding: .6rem 1rem; }.btn-primary { background: #6d28d9; color: white; }.btn-secondary { background: #475569; color: white; }.btn-close { background: #b45309; color: white; }.btn-pdf { background: #dc2626; color: white; }.link { background: none; color: #2563eb; padding: .25rem .4rem; }.btn-primary:disabled, .btn-secondary:disabled, .btn-close:disabled { cursor: not-allowed; opacity: .55; }.estado { border-radius: 99px; font-size: .72rem; font-weight: 700; padding: .35rem .6rem; }.estado.abierto { background: #fef3c7; color: #92400e; }.estado.cerrado { background: #dcfce7; color: #166534; }.totales { display: flex; gap: 1rem; margin: 1rem 0; }.totales div { background: #eff6ff; border-left: 4px solid #2563eb; display: grid; gap: .2rem; min-width: 160px; padding: .65rem .85rem; }.totales strong { color: #0f3e74; font-size: 1.2rem; }.totales .diferencia, tr.diferencia td { background: #fff1f2; color: #b91c1c; }.table-wrap { overflow-x: auto; }table { border-collapse: collapse; min-width: 860px; width: 100%; }th, td { border-bottom: 1px solid #e2e8f0; padding: .6rem; text-align: left; }th { background: #f1f5f9; color: #334155; font-size: .72rem; text-transform: uppercase; }.denom { font-weight: 700; }.money { font-variant-numeric: tabular-nums; text-align: right; }.detalle input { max-width: 110px; text-align: right; }.cierre { align-items: end; display: flex; gap: 1rem; margin-top: 1rem; }.cierre label { flex: 1; }.cierre textarea { min-height: 65px; resize: vertical; }.nota { background: #eff6ff; border-left: 4px solid #2563eb; margin: 1rem 0 0; padding: .65rem .8rem; }.observacion { background: #f8fafc; border-radius: 5px; padding: .7rem; }.row-actions { white-space: nowrap; }.empty { color: #64748b; padding: 2rem; text-align: center; }@media (max-width: 900px) { .page-header, .section-title, .cierre { flex-direction: column; }.form-grid { grid-template-columns: 1fr; }.denominaciones { grid-template-columns: repeat(3, minmax(95px, 1fr)); } }.@media (max-width: 550px) { .denominaciones { grid-template-columns: repeat(2, minmax(95px, 1fr)); }.totales { flex-direction: column; } }
</style>
