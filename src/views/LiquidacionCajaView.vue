<template>
  <div class="liquidacion-caja">
    <header class="page-header">
      <div>
        <h2>Liquidación / Entrega a caja</h2>
        <p>Registre el cobro de cada renglón pendiente. Los pagos mixtos permiten distribuir un mismo importe entre efectivo y transferencia.</p>
      </div>
      <div class="header-actions">
        <label>Finca
          <select v-model="fincaId" @change="cargarDatos">
            <option value="">Seleccione una finca</option>
            <option v-for="finca in fincas" :key="finca.id" :value="finca.id">{{ finca.code }} - {{ finca.name }}</option>
          </select>
        </label>
        <label>Desde<input v-model="fechaInicio" type="date" @change="cargarDatos" /></label>
        <label>Hasta<input v-model="fechaFin" type="date" @change="cargarDatos" /></label>
        <button class="btn-secondary" :disabled="cargando || guardando || !fincaId" @click="cargarDatos">Actualizar</button>
      </div>
    </header>

    <div class="aviso card">
      <strong>Control de caja:</strong> solo los importes asignados a <em>efectivo</em> aumentan la caja disponible. Las transferencias requieren referencia bancaria y no se muestran como efectivo.
    </div>

    <section class="resumen-grid">
      <article class="card saldo-card">
        <span>Saldo disponible en caja</span>
        <strong>{{ moneda(saldoCaja) }}</strong>
        <small>Resultado de los cobros en efectivo menos entregas al banco.</small>
      </article>
      <article class="card seleccion-card">
        <span>Liquidación seleccionada</span>
        <strong>{{ moneda(totalSeleccionado) }}</strong>
        <small>Efectivo: {{ moneda(totalEfectivo) }} · Transferencia: {{ moneda(totalTransferencia) }}</small>
      </article>
    </section>

    <section class="card control-billetes">
      <div class="section-title">
        <div><h3>Arqueo físico por denominaciones</h3><p>Existencia actual de billetes en caja. Cada cobro y entrega debe cuadrar con este conteo.</p></div>
        <div class="apertura-actions">
          <label>Fecha de apertura<input v-model="apertura.fecha" type="date" /></label>
          <label>Observaciones<input v-model.trim="apertura.observaciones" maxlength="300" placeholder="Opcional" /></label>
          <button class="btn-secondary" :disabled="!fincaId || registrandoApertura" @click="abrirConteoApertura">{{ registrandoApertura ? 'Registrando...' : 'Registrar apertura física' }}</button>
        </div>
      </div>
      <p v-if="pendienteSinDesglose > 0" class="advertencia">Hay {{ moneda(pendienteSinDesglose) }} de efectivo histórico sin denominaciones. Registre una apertura física para iniciar el arqueo por billetes.</p>
      <div v-if="!fincaId" class="empty">Seleccione una finca para consultar el arqueo de caja.</div>
      <div v-else class="denominaciones-saldo">
        <div v-for="item in saldoDenominaciones" :key="item.denominacion" class="billete-saldo">
          <span>{{ moneda(item.denominacion) }}</span><strong>{{ item.cantidad }}</strong><small>{{ moneda(item.denominacion * item.cantidad) }}</small>
        </div>
      </div>
    </section>

    <section class="card entrega-banco">
      <div class="section-title"><div><h3>Entrega de efectivo al banco</h3><p>Registre la salida de caja respaldada por el depósito o transferencia bancaria.</p></div></div>
      <form class="entrega-form" @submit.prevent="registrarEntregaBanco">
        <label>Importe<input v-model.number="entrega.importe" type="number" min="0.01" step="0.01" :max="saldoCaja" required @input="entrega.denominaciones = []" /></label>
        <label>Fecha<input v-model="entrega.fecha" type="date" required /></label>
        <label>Referencia bancaria<input v-model.trim="entrega.referenciaBancaria" maxlength="100" required placeholder="No. de depósito o transferencia" /></label>
        <label class="observaciones">Observaciones<input v-model.trim="entrega.observaciones" maxlength="300" placeholder="Opcional" /></label>
        <button type="button" class="btn-count" :disabled="!entrega.importe || entrega.importe > saldoCaja" @click="abrirConteoEntrega">Billetes{{ entrega.denominaciones?.length ? ' ✓' : '' }}</button>
        <button class="btn-bank" :disabled="registrandoEntrega || !fincaId || entrega.importe <= 0 || entrega.importe > saldoCaja || !entrega.referenciaBancaria || !conteoEntregaValido">{{ registrandoEntrega ? 'Registrando...' : 'Entregar al banco' }}</button>
      </form>
    </section>

    <section class="card historial-banco">
      <div class="section-title">
        <div><h3>Historial de entregas al banco</h3><p>Salidas de efectivo registradas desde caja para la finca seleccionada.</p></div>
        <span class="pending-count">{{ entregasBanco.length }} depósito{{ entregasBanco.length === 1 ? '' : 's' }}</span>
      </div>
      <div v-if="!fincaId" class="empty">Seleccione una finca para consultar sus depósitos.</div>
      <div v-else-if="!entregasBanco.length" class="empty">No hay entregas al banco registradas para esta finca.</div>
      <div v-else class="table-wrap">
        <table class="tabla-depositos">
          <thead><tr><th>Fecha</th><th>Referencia bancaria</th><th>Importe</th><th>Denominaciones</th><th>Entregado por</th><th>Recibido por</th><th>Observaciones</th></tr></thead>
          <tbody>
            <tr v-for="deposito in entregasBanco" :key="deposito.id">
              <td>{{ fecha(deposito.fecha) }}</td>
              <td class="numero-documento">{{ deposito.referenciaBancaria || '—' }}</td>
              <td class="money">{{ moneda(deposito.importe) }}</td>
              <td>{{ resumenDenominaciones(deposito.denominaciones) || '—' }}</td>
              <td>{{ deposito.entregadoPor || '—' }}</td>
              <td>{{ deposito.recibidoPor || '—' }}</td>
              <td>{{ deposito.observaciones || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="section-title">
        <div><h3>Renglones pendientes de liquidación</h3><p>Seleccione únicamente los productos o cargos que se cobraron. Los renglones saldados desaparecen después de registrar la liquidación.</p></div>
        <span class="pending-count">{{ pendientes.length }} pendiente{{ pendientes.length === 1 ? '' : 's' }}</span>
      </div>
      <div v-if="cargando" class="empty">Cargando pendientes...</div>
      <div v-else-if="!pendientes.length" class="empty success">No hay renglones pendientes de liquidación.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th><input :checked="todosSeleccionados" type="checkbox" aria-label="Seleccionar todos los renglones pendientes" @change="alternarTodos" /></th><th>Documento</th><th>Fecha</th><th>Trabajador / finca</th><th>Producto</th><th>Saldo</th><th>Efectivo</th><th>Transferencia</th><th>Referencia bancaria</th><th>Por liquidar</th></tr></thead>
          <tbody>
            <tr v-for="item in pendientes" :key="item.itemSalidaId" :class="{ seleccionado: estaSeleccionado(item.itemSalidaId) }">
              <td><input :checked="estaSeleccionado(item.itemSalidaId)" type="checkbox" :aria-label="`Seleccionar ${item.numeroDocumento}`" @change="alternar(item)" /></td>
              <td><span class="tipo">{{ item.tipoDocumento }}</span><strong>{{ item.numeroDocumento }}</strong><small>{{ item.destino || '—' }}</small></td>
              <td>{{ fecha(item.fecha) }}</td>
              <td>{{ item.trabajadorNombre || '—' }}<small>{{ item.fincaNombre || '—' }}</small></td>
              <td>{{ item.productoNombre || '—' }}<small v-if="item.cantidad != null">Cant.: {{ item.cantidad }}</small></td>
              <td class="money">{{ moneda(item.saldoPendiente) }}</td>
              <td><div v-if="estaSeleccionado(item.itemSalidaId)" class="efectivo-control"><input v-model.number="seleccionados[item.itemSalidaId].efectivo" type="number" min="0" :max="item.saldoPendiente" step="0.01" @input="normalizar(item.itemSalidaId)" /><button type="button" class="btn-count mini" :disabled="seleccionados[item.itemSalidaId].efectivo <= 0" @click="abrirConteoLiquidacion(item.itemSalidaId)">Billetes{{ seleccionados[item.itemSalidaId].denominaciones.length ? ' ✓' : '' }}</button></div></td>
              <td><input v-if="estaSeleccionado(item.itemSalidaId)" v-model.number="seleccionados[item.itemSalidaId].transferencia" type="number" min="0" :max="item.saldoPendiente" step="0.01" @input="normalizar(item.itemSalidaId)" /></td>
              <td><input v-if="estaSeleccionado(item.itemSalidaId)" v-model.trim="seleccionados[item.itemSalidaId].referenciaBancaria" :disabled="seleccionados[item.itemSalidaId].transferencia <= 0" maxlength="100" placeholder="Obligatoria si transfiere" /></td>
              <td :class="{ error: restante(item) !== 0 }" class="money">{{ moneda(restante(item)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pendientes.length" class="acciones">
        <p v-if="errorValidacion" class="validation-error">{{ errorValidacion }}</p>
        <button class="btn-primary" :disabled="guardando || !fincaId || !lineasSeleccionadas.length || !!errorValidacion" @click="registrarLiquidacion">{{ guardando ? 'Registrando liquidación...' : `Liquidar ${lineasSeleccionadas.length} renglón(es)` }}</button>
      </div>
    </section>

    <ConteoDenominacionesModal
      v-if="mostrarConteo"
      :titulo="tituloConteo"
      :descripcion="descripcionConteo"
      :importe-esperado="importeConteo"
      :inicial="denominacionesConteo"
      @cancelar="cerrarConteo"
      @confirmar="confirmarConteo"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { notify } from '@/composables/useNotification'
import ConteoDenominacionesModal from '@/components/ConteoDenominacionesModal.vue'
import LiquidacionCajaService, { type AperturaCajaRequest, type DenominacionCantidad, type EntregaBancoHistorial, type EntregaBancoRequest, type ItemSalidaPendiente, type LiquidarSalidaRequest } from '@/services/LiquidacionCajaService'
import FincaService from '@/services/FincaService'

const DENOMINACIONES = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]

interface Distribucion { efectivo: number; transferencia: number; referenciaBancaria: string; denominaciones: DenominacionCantidad[] }
interface ItemPendienteLiquidacion extends ItemSalidaPendiente {
  salidaId: string
  tipoDocumento: string
  numeroDocumento: string
  fecha: string
  fincaNombre?: string
  destino?: string
}
interface LineaSeleccionada {
  salidaId: string
  itemSalidaId: string
  efectivo: number
  transferencia: number
  referenciaBancaria?: string
  denominaciones: DenominacionCantidad[]
}

const pendientes = ref<ItemPendienteLiquidacion[]>([])
const entregasBanco = ref<EntregaBancoHistorial[]>([])
const saldoCaja = ref(0)
const fincaId = ref('')
const hoy = new Date()
const fechaInicio = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10))
const fechaFin = ref(hoy.toISOString().slice(0, 10))
const fincas = ref<Array<{ id: string; code: string; name: string }>>([])
const cargando = ref(false)
const guardando = ref(false)
const registrandoEntrega = ref(false)
const registrandoApertura = ref(false)
const seleccionados = reactive<Record<string, Distribucion>>({})
const entrega = reactive<EntregaBancoRequest>({ fincaId: '', importe: 0, fecha: new Date().toISOString().slice(0, 10), referenciaBancaria: '', observaciones: '', denominaciones: [] })
const apertura = reactive<AperturaCajaRequest>({ fincaId: '', fecha: new Date().toISOString().slice(0, 10), observaciones: '', denominaciones: [] })
const saldoDenominacionesRaw = ref<DenominacionCantidad[]>([])
const pendienteSinDesglose = ref(0)
const mostrarConteo = ref(false)
const contextoConteo = ref<'LIQUIDACION' | 'ENTREGA' | 'APERTURA'>('LIQUIDACION')
const itemConteoId = ref<string | null>(null)

const estaSeleccionado = (id: string) => !!seleccionados[id]
const todosSeleccionados = computed(() => pendientes.value.length > 0 && pendientes.value.every(item => estaSeleccionado(item.itemSalidaId)))
const redondear = (valor: number) => Math.round((Number(valor) || 0) * 100) / 100
const restante = (item: ItemPendienteLiquidacion) => {
  const pago = seleccionados[item.itemSalidaId]
  return pago ? redondear(item.saldoPendiente - pago.efectivo - pago.transferencia) : item.saldoPendiente
}
const lineasSeleccionadas = computed<LineaSeleccionada[]>(() => pendientes.value.filter(item => estaSeleccionado(item.itemSalidaId)).map(item => ({
  salidaId: item.salidaId,
  itemSalidaId: item.itemSalidaId,
  efectivo: redondear(seleccionados[item.itemSalidaId].efectivo),
  transferencia: redondear(seleccionados[item.itemSalidaId].transferencia),
  referenciaBancaria: seleccionados[item.itemSalidaId].referenciaBancaria || undefined,
  denominaciones: seleccionados[item.itemSalidaId].denominaciones
})))
const solicitudesLiquidacion = computed<LiquidarSalidaRequest[]>(() => {
  const porSalida = new Map<string, LiquidarSalidaRequest>()
  for (const linea of lineasSeleccionadas.value) {
    const solicitud = porSalida.get(linea.salidaId) || { salidaId: linea.salidaId, aplicaciones: [] }
    if (linea.efectivo > 0) solicitud.aplicaciones.push({ itemSalidaId: linea.itemSalidaId, importe: linea.efectivo, formaPago: 'EFECTIVO', denominaciones: linea.denominaciones })
    if (linea.transferencia > 0) solicitud.aplicaciones.push({ itemSalidaId: linea.itemSalidaId, importe: linea.transferencia, formaPago: 'TRANSFERENCIA', referenciaBancaria: linea.referenciaBancaria })
    porSalida.set(linea.salidaId, solicitud)
  }
  return [...porSalida.values()]
})
const totalEfectivo = computed(() => lineasSeleccionadas.value.reduce((total, linea) => total + linea.efectivo, 0))
const totalTransferencia = computed(() => lineasSeleccionadas.value.reduce((total, linea) => total + linea.transferencia, 0))
const totalSeleccionado = computed(() => totalEfectivo.value + totalTransferencia.value)
const totalDenominaciones = (denominaciones?: DenominacionCantidad[]) => (denominaciones || []).reduce((total, item) => total + Number(item.denominacion || 0) * Number(item.cantidad || 0), 0)
const coincideDenominaciones = (importe: number, denominaciones?: DenominacionCantidad[]) => Math.abs(totalDenominaciones(denominaciones) - importe) < 0.005
const conteoEntregaValido = computed(() => entrega.importe > 0 && coincideDenominaciones(entrega.importe, entrega.denominaciones))
const saldoDenominaciones = computed(() => DENOMINACIONES.map(denominacion => ({ denominacion, cantidad: saldoDenominacionesRaw.value.find(item => item.denominacion === denominacion)?.cantidad || 0 })))
const importeConteo = computed<number | null>(() => {
  if (contextoConteo.value === 'LIQUIDACION' && itemConteoId.value) return seleccionados[itemConteoId.value]?.efectivo || 0
  if (contextoConteo.value === 'ENTREGA') return entrega.importe
  return null
})
const denominacionesConteo = computed<DenominacionCantidad[]>(() => {
  if (contextoConteo.value === 'LIQUIDACION' && itemConteoId.value) return seleccionados[itemConteoId.value]?.denominaciones || []
  if (contextoConteo.value === 'ENTREGA') return entrega.denominaciones || []
  return apertura.denominaciones || []
})
const tituloConteo = computed(() => contextoConteo.value === 'APERTURA' ? 'Apertura física de caja' : contextoConteo.value === 'ENTREGA' ? 'Billetes para entregar al banco' : 'Billetes recibidos en efectivo')
const descripcionConteo = computed(() => contextoConteo.value === 'APERTURA' ? 'Registre el efectivo físico con el que inicia el control por denominaciones.' : 'La suma de los billetes debe coincidir exactamente con el efectivo indicado.')
const errorValidacion = computed(() => {
  for (const item of pendientes.value.filter(item => estaSeleccionado(item.itemSalidaId))) {
    const linea = seleccionados[item.itemSalidaId]
    const aplicado = linea.efectivo + linea.transferencia
    if (linea.efectivo < 0 || linea.transferencia < 0 || aplicado <= 0 || aplicado > item.saldoPendiente) return `El renglón ${item.numeroDocumento} debe liquidarse con un importe positivo que no exceda ${moneda(item.saldoPendiente)}.`
    if (linea.transferencia > 0 && !linea.referenciaBancaria.trim()) return `Indique la referencia bancaria para ${item.numeroDocumento}.`
    if (linea.efectivo > 0 && !coincideDenominaciones(linea.efectivo, linea.denominaciones)) return `Cuadre los billetes recibidos en efectivo para ${item.numeroDocumento}.`
  }
  return ''
})

function alternar(item: ItemPendienteLiquidacion) {
  if (estaSeleccionado(item.itemSalidaId)) delete seleccionados[item.itemSalidaId]
  else seleccionados[item.itemSalidaId] = { efectivo: item.saldoPendiente, transferencia: 0, referenciaBancaria: '', denominaciones: [] }
}

function alternarTodos() {
  if (todosSeleccionados.value) {
    Object.keys(seleccionados).forEach(id => delete seleccionados[id])
    return
  }
  for (const item of pendientes.value) {
    seleccionados[item.itemSalidaId] = {
      efectivo: item.saldoPendiente,
      transferencia: 0,
      referenciaBancaria: '', denominaciones: []
    }
  }
}

function normalizar(id: string) {
  const linea = seleccionados[id]
  linea.efectivo = redondear(Math.max(0, linea.efectivo || 0))
  linea.transferencia = redondear(Math.max(0, linea.transferencia || 0))
  linea.denominaciones = []
}

const moneda = (importe: number) => `$${(importe || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fecha = (valor: string) => valor ? new Date(valor).toLocaleDateString('es-CU') : '—'

async function cargarDatos() {
  if (!fincaId.value) {
    pendientes.value = []
    entregasBanco.value = []
    saldoCaja.value = 0
    saldoDenominacionesRaw.value = []
    pendienteSinDesglose.value = 0
    return
  }
  cargando.value = true
  try {
    const [pendientesResponse, saldoResponse, entregasResponse] = await Promise.all([
      LiquidacionCajaService.pendientes(fincaId.value, fechaInicio.value, fechaFin.value),
      LiquidacionCajaService.obtenerSaldoCaja(fincaId.value),
      LiquidacionCajaService.listarEntregasBanco(fincaId.value)
    ])
    pendientes.value = (pendientesResponse.data || []).flatMap(salida => (salida.items || []).map(item => ({
      ...item, salidaId: salida.salidaId, tipoDocumento: salida.tipo, numeroDocumento: salida.numero,
      fecha: salida.fecha, fincaNombre: salida.fincaNombre, destino: salida.destino
    })))
    saldoCaja.value = saldoResponse.data?.saldoDisponible || 0
    saldoDenominacionesRaw.value = saldoResponse.data?.denominaciones || []
    pendienteSinDesglose.value = saldoResponse.data?.pendienteSinDesglose || 0
    entregasBanco.value = entregasResponse.data || []
    Object.keys(seleccionados).forEach(id => delete seleccionados[id])
  } catch (error) {
    console.error('Error al cargar liquidación de caja', error)
    notify.error('Error', 'No se pudieron cargar los pendientes o el saldo de caja.')
  } finally { cargando.value = false }
}

async function registrarLiquidacion() {
  if (!fincaId.value || errorValidacion.value || !lineasSeleccionadas.value.length) return
  guardando.value = true
  try {
    await Promise.all(solicitudesLiquidacion.value.map(solicitud => LiquidacionCajaService.liquidar(solicitud)))
    notify.success('Liquidación registrada', 'Los cobros fueron aplicados y la caja fue actualizada.')
    await cargarDatos()
  } catch (error) {
    console.error('Error registrando liquidación', error)
    notify.error('Error', 'No fue posible registrar la liquidación.')
  } finally { guardando.value = false }
}

async function registrarEntregaBanco() {
  if (!fincaId.value || entrega.importe <= 0 || entrega.importe > saldoCaja.value || !entrega.referenciaBancaria) return
  registrandoEntrega.value = true
  try {
    await LiquidacionCajaService.entregarAlBanco({ ...entrega, fincaId: fincaId.value, fecha: entrega.fecha ? `${entrega.fecha}T00:00:00` : undefined })
    notify.success('Entrega registrada', 'La entrega al banco fue descontada de caja.')
    entrega.importe = 0; entrega.referenciaBancaria = ''; entrega.observaciones = ''; entrega.denominaciones = []
    await cargarDatos()
  } catch (error) {
    console.error('Error registrando entrega al banco', error)
    notify.error('Error', 'No fue posible registrar la entrega al banco.')
  } finally { registrandoEntrega.value = false }
}

function abrirConteoLiquidacion(itemSalidaId: string) {
  itemConteoId.value = itemSalidaId
  contextoConteo.value = 'LIQUIDACION'
  mostrarConteo.value = true
}
function abrirConteoEntrega() {
  contextoConteo.value = 'ENTREGA'
  itemConteoId.value = null
  mostrarConteo.value = true
}
function abrirConteoApertura() {
  contextoConteo.value = 'APERTURA'
  itemConteoId.value = null
  mostrarConteo.value = true
}
function cerrarConteo() { mostrarConteo.value = false; itemConteoId.value = null }
function confirmarConteo(denominaciones: DenominacionCantidad[]) {
  if (contextoConteo.value === 'LIQUIDACION' && itemConteoId.value) seleccionados[itemConteoId.value].denominaciones = denominaciones
  else if (contextoConteo.value === 'ENTREGA') entrega.denominaciones = denominaciones
  else apertura.denominaciones = denominaciones
  cerrarConteo()
}
function resumenDenominaciones(denominaciones?: DenominacionCantidad[]) {
  return (denominaciones || []).filter(item => item.cantidad > 0).map(item => `${item.cantidad}×${item.denominacion}`).join(', ')
}
async function registrarApertura() {
  if (!fincaId.value || !apertura.denominaciones.length) {
    notify.error('Conteo requerido', 'Abra el conteo e indique los billetes físicos de la caja.')
    return
  }
  registrandoApertura.value = true
  try {
    await LiquidacionCajaService.registrarApertura({ ...apertura, fincaId: fincaId.value, fecha: apertura.fecha ? `${apertura.fecha}T00:00:00` : undefined })
    notify.success('Apertura registrada', 'El saldo físico por denominaciones fue actualizado.')
    apertura.denominaciones = []; apertura.observaciones = ''
    await cargarDatos()
  } catch (error) {
    console.error('Error registrando apertura física', error)
    notify.error('Error', 'No fue posible registrar la apertura física de caja.')
  } finally { registrandoApertura.value = false }
}

onMounted(async () => {
  try {
    const response = await FincaService.buscarFincas({ size: 999 })
    fincas.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar fincas', error)
    notify.error('Error', 'No se pudieron cargar las fincas.')
  }
})
</script>

<style scoped>
.liquidacion-caja { max-width: 1500px; margin: 0 auto; padding: 1.5rem; color: #263238; }
.page-header, .section-title, .resumen-grid { display: flex; gap: 1rem; justify-content: space-between; align-items: flex-start; }
.header-actions { display: flex; align-items: end; gap: .75rem; }.header-actions label { display: grid; color: #475569; font-size: .78rem; font-weight: 600; gap: .25rem; }.header-actions select { border: 1px solid #cbd5e1; border-radius: 6px; min-width: 220px; padding: .55rem; }
.page-header { margin-bottom: 1.25rem; }.page-header h2, .section-title h3 { margin: 0; color: #1e3a5f; }.page-header p, .section-title p, small { color: #64748b; }.card { background: #fff; border: 1px solid #dbe4ea; border-radius: 10px; box-shadow: 0 1px 3px #0f172a0d; padding: 1.25rem; margin-bottom: 1.25rem; }
.aviso { border-left: 4px solid #2563eb; background: #eff6ff; }.resumen-grid { align-items: stretch; }.resumen-grid .card { flex: 1; display: grid; gap: .35rem; }.saldo-card { border-left: 4px solid #16a34a; }.seleccion-card { border-left: 4px solid #7c3aed; }.resumen-grid strong { color: #0f3e74; font-size: 1.5rem; }
.entrega-banco { background: #fffbeb; border-color: #fcd34d; }.entrega-form { display: grid; grid-template-columns: 1fr 1fr 1.5fr 1.5fr auto auto; gap: .75rem; align-items: end; }.entrega-form label { display: grid; gap: .25rem; font-size: .8rem; font-weight: 600; }.entrega-form input, table input { border: 1px solid #cbd5e1; border-radius: 5px; padding: .5rem; min-width: 0; }.btn-primary, .btn-secondary, .btn-bank, .btn-count { border: 0; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 600; padding: .6rem 1rem; }.btn-primary { background: #2563eb; }.btn-secondary { background: #475569; }.btn-bank { background: #b45309; white-space: nowrap; }.btn-count { background: #0f766e; white-space: nowrap; }.btn-count.mini { font-size: .7rem; padding: .35rem .45rem; }.btn-primary:disabled, .btn-secondary:disabled, .btn-bank:disabled, .btn-count:disabled { cursor: not-allowed; opacity: .55; }
.control-billetes { border-left: 4px solid #0f766e; }.apertura-actions { align-items: end; display: flex; flex-wrap: wrap; gap: .55rem; }.apertura-actions label { display: grid; font-size: .76rem; font-weight: 600; gap: .2rem; }.apertura-actions input { border: 1px solid #cbd5e1; border-radius: 5px; padding: .45rem; }.denominaciones-saldo { display: grid; gap: .55rem; grid-template-columns: repeat(6, minmax(105px, 1fr)); }.billete-saldo { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; display: grid; gap: .15rem; padding: .55rem; }.billete-saldo span { color: #115e59; font-size: .75rem; font-weight: 700; }.billete-saldo strong { font-size: 1.1rem; }.billete-saldo small { font-size: .72rem; }.advertencia { background: #fff7ed; border-left: 4px solid #ea580c; color: #9a3412; margin: .75rem 0; padding: .65rem .8rem; }.efectivo-control { align-items: center; display: flex; gap: .35rem; }.efectivo-control input { max-width: 105px; }
.pending-count { background: #e0e7ff; border-radius: 99px; color: #3730a3; font-size: .8rem; font-weight: 700; padding: .35rem .65rem; }.table-wrap { overflow-x: auto; }table { border-collapse: collapse; width: 100%; min-width: 1120px; font-size: .84rem; }th, td { border-bottom: 1px solid #e2e8f0; padding: .6rem; text-align: left; vertical-align: middle; }th { background: #f1f5f9; color: #334155; font-size: .72rem; text-transform: uppercase; }td small { display: block; font-size: .72rem; margin-top: .15rem; }.seleccionado { background: #eff6ff; }.tipo { background: #e0e7ff; border-radius: 3px; color: #3730a3; display: inline-block; font-size: .65rem; font-weight: 700; margin-right: .3rem; padding: .15rem .3rem; }.money { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }.error { color: #b91c1c; }.acciones { align-items: center; display: flex; justify-content: flex-end; margin-top: 1rem; }.validation-error { color: #b91c1c; margin-right: auto; }.empty { color: #64748b; padding: 2rem; text-align: center; }.empty.success { color: #15803d; }@media (max-width: 1100px) { .denominaciones-saldo { grid-template-columns: repeat(4, minmax(105px, 1fr)); } }@media (max-width: 950px) { .resumen-grid, .entrega-form { display: grid; grid-template-columns: 1fr; }.page-header, .section-title, .header-actions { flex-direction: column; }.btn-secondary { align-self: stretch; } }@media (max-width: 600px) { .denominaciones-saldo { grid-template-columns: repeat(2, minmax(105px, 1fr)); } }
</style>
