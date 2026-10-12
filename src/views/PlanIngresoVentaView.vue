<template>
  <div class="plan-page">
    <header class="page-header">
      <div>
        <h2>Plan Mensual de Finca</h2>
        <p>Planificación mensual de ingresos, actividades agrícolas y egresos de la finca.</p>
      </div>
      <button class="primary" @click="abrirNuevo"><i class="fa-solid fa-plus"></i> Nuevo plan</button>
    </header>

    <section class="notice">
      <i class="fa-solid fa-shield-halved"></i>
      Los productos, precios y metas agrícolas se guardan como una fotografía del momento de planificar. Esta vista no modifica existencias, ventas, caja ni contabilidad.
    </section>

    <section class="card filters">
      <label>Finca
        <select v-model="filtroFinca"><option value="">Todas las fincas permitidas</option><option v-for="finca in fincas" :key="finca.id" :value="finca.id">{{ finca.code }} - {{ finca.name }}</option></select>
      </label>
      <label>Mes
        <input v-model="filtroMes" type="month">
      </label>
      <button class="secondary" @click="limpiarFiltros">Limpiar filtros</button>
    </section>

    <section class="card table-card">
      <div v-if="cargando" class="empty">Cargando planes…</div>
      <div v-else-if="planesFiltrados.length === 0" class="empty">No hay planes para los filtros indicados.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>Mes</th><th>Finca</th><th>Estado</th><th>Ingresos planificados</th><th>Total egresos</th><th>Disponible</th><th>Acciones</th></tr></thead>
          <tbody>
            <tr v-for="plan in planesFiltrados" :key="plan.id">
              <td>{{ mes(plan.periodo) }}</td><td>{{ fincaNombre(plan.fincaId) }}</td>
              <td><span :class="['estado', plan.estado.toLowerCase()]">{{ plan.estado }}</span></td>
              <td class="amount">{{ moneda(plan.totalIngresosPlanificados) }}</td><td class="amount">{{ moneda(plan.totalEgresos) }}</td>
              <td :class="['amount', plan.disponible < 0 ? 'negative' : 'positive']">{{ moneda(plan.disponible) }}</td>
              <td class="actions"><button title="Ver o editar" @click="abrirEdicion(plan)"><i class="fa-solid fa-pen"></i></button><button title="Comparar plan con ejecución" @click="verEjecucion(plan)"><i class="fa-solid fa-chart-line"></i></button><button title="Descargar PDF" @click="descargarPdf(plan)"><i class="fa-solid fa-file-pdf"></i></button><button v-if="plan.estado === 'BORRADOR'" title="Generar plan del mes siguiente" @click="generarSiguiente(plan)"><i class="fa-solid fa-forward"></i></button><button v-if="plan.estado === 'BORRADOR'" title="Enviar a revisión" @click="cambiarEstado(plan, 'EN_REVISION')"><i class="fa-solid fa-paper-plane"></i></button><button v-if="plan.estado === 'EN_REVISION'" title="Aprobar" @click="cambiarEstado(plan, 'APROBADO')"><i class="fa-solid fa-check"></i></button><button v-if="plan.estado === 'APROBADO'" title="Cerrar mes" @click="cambiarEstado(plan, 'CERRADO')"><i class="fa-solid fa-lock"></i></button><button v-if="plan.estado === 'BORRADOR'" title="Eliminar borrador" class="danger" @click="eliminar(plan)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modal" class="overlay" @click.self="cerrarModal">
      <section class="modal" aria-modal="true" role="dialog">
        <header class="modal-header"><div><h3>{{ editando ? 'Editar plan de ingresos' : 'Nuevo plan de ingresos' }}</h3><p>Los cálculos se validan nuevamente en el servidor.</p></div><button class="close" @click="cerrarModal">×</button></header>
        <div class="wizard-steps" aria-label="Pasos del plan">
          <button v-for="(paso, index) in pasos" :key="paso" :class="{ active: pasoActual === index + 1, done: pasoActual > index + 1 }" @click="irAPaso(index + 1)"><span>{{ index + 1 }}</span>{{ paso }}</button>
        </div>
        <div class="modal-body">
          <section v-show="pasoActual === 1">
            <h4>Período y parámetros</h4><p class="step-help">Defina el período y la finca que se van a planificar.</p>
            <div class="form-grid"><label title="Finca para la que se prepara este plan mensual.">Finca <select v-model="form.fincaId" :disabled="Boolean(editando) || cargandoFincas"><option value="">{{ cargandoFincas ? 'Cargando fincas…' : fincas.length ? 'Seleccione' : 'No hay fincas disponibles' }}</option><option v-for="finca in fincas" :key="finca.id" :value="finca.id">{{ finca.code }} - {{ finca.name }}</option></select></label><label title="Mes al que pertenecen las metas, trabajadores e ingresos del plan.">Mes <input v-model="form.periodo" type="month" :disabled="Boolean(editando)"></label><label title="Porcentaje aplicado automáticamente al salario planificado como aporte al presupuesto.">Aporte presupuesto (%) <input v-model.number="form.porcentajeAportePresupuesto" min="0" max="100" step="0.01" type="number"></label><div class="informative-total" title="Compras se calcula con los gastos detallados de cada actividad y centro de costo."><span>Compras calculadas</span><strong>{{ moneda(totalCompras) }}</strong></div><div class="informative-total" title="Servicios se calcula con los gastos detallados de cada actividad y centro de costo."><span>Servicios calculados</span><strong>{{ moneda(totalServicios) }}</strong></div></div>
            <label class="observaciones">Observaciones <textarea v-model="form.observaciones" maxlength="1000" rows="3" placeholder="Fundamento o notas del plan"></textarea></label>
          </section>
          <section v-show="pasoActual === 2"><div class="detail-header"><div><h4>Programación agrícola</h4><small>Seleccione una labor: se precargan la unidad, centro de costo y dotación técnica.</small></div><div class="detail-actions"><router-link class="secondary" to="/labores-agricolas" target="_blank"><i class="fa-solid fa-screwdriver-wrench"></i> Administrar labores</router-link><button class="secondary" @click="agregarActividad"><i class="fa-solid fa-plus"></i> Agregar actividad</button></div></div><div class="lines-wrap"><table class="lines agricultural"><thead><tr><th>Centro de costo</th><th>Labor agrícola</th><th>Cultivo</th><th>Bloque / campo</th><th>U/M</th><th>Área</th><th>Meta</th><th></th></tr></thead><tbody><tr v-for="(actividad, index) in form.actividades" :key="index"><td><select v-model="actividad.codigoCentroCosto"><option value="">Seleccione</option><option v-for="centro in centrosCosto" :key="centro.id" :value="centro.codigo">{{ centro.codigo }} - {{ centro.nombre }}</option></select></td><td><select v-model="actividad.laborAgricolaId" @change="seleccionarLabor(actividad)"><option value="">Seleccione</option><option v-for="labor in labores" :key="labor.id" :value="labor.id">{{ labor.codigo }} - {{ labor.nombre }}</option></select></td><td><select v-model="actividad.tipoCultivoId" @change="seleccionarCultivo(actividad)"><option value="">Seleccione</option><option v-for="cultivo in tiposCultivo" :key="cultivo.id" :value="cultivo.id">{{ cultivo.nombre }}</option></select></td><td><div class="campo-inputs"><input v-model.trim="actividad.bloqueSnapshot" placeholder="Bloque"><input v-model.trim="actividad.campoSnapshot" placeholder="Campo"></div></td><td><input v-model.trim="actividad.unidadMedidaSnapshot" placeholder="ha, qq, t"></td><td><input v-model.number="actividad.areaPlanificada" min="0" step="0.0001" type="number"></td><td><input v-model.number="actividad.cantidadMeta" min="0" step="0.0001" type="number"></td><td><button class="danger" title="Eliminar actividad" @click="quitarActividad(index)"><i class="fa-solid fa-trash"></i></button></td></tr><tr v-if="!form.actividades.length"><td colspan="8" class="empty">Agregue las áreas y labores a planificar.</td></tr></tbody></table></div></section>
          <section v-show="pasoActual === 3"><div class="detail-header"><div><h4>Dotación y salarios</h4><small>El salario se calcula: trabajadores × días × horas × salario escala / 24 / 8.</small></div></div><div v-if="!form.actividades.length" class="empty">Primero agregue al menos una actividad agrícola.</div><article v-for="(actividad, actividadIndex) in form.actividades" :key="actividadIndex" class="staffing-card"><header><strong>{{ actividad.tipoCultivoNombreSnapshot || 'Cultivo pendiente' }}</strong><span>{{ actividad.actividad || 'Actividad pendiente' }}</span><b>{{ moneda(salarioActividad(actividad)) }}</b></header><div class="lines-wrap"><table class="lines staffing"><thead><tr><th>Cargo</th><th>Salario escala</th><th>Trabajadores</th><th>Días</th><th>Horas/día</th><th>Salario planificado</th><th></th></tr></thead><tbody><tr v-for="(dotacion, index) in actividad.dotaciones" :key="index"><td><select v-model="dotacion.cargoId" @change="seleccionarCargo(dotacion)"><option value="">Seleccione</option><option v-for="cargo in cargos" :key="cargo.id" :value="cargo.id">{{ cargo.name }}</option></select></td><td class="amount">{{ moneda(dotacion.salarioEscalaSnapshot) }}</td><td><input v-model.number="dotacion.cantidadTrabajadores" min="0" step="1" type="number"></td><td><input v-model.number="dotacion.diasPlanificados" min="0" step="0.5" type="number"></td><td><input v-model.number="dotacion.horasPorDia" min="0" max="24" step="0.5" type="number"></td><td class="amount">{{ moneda(salarioDotacion(dotacion)) }}</td><td><button class="danger" @click="quitarDotacion(actividad, index)"><i class="fa-solid fa-trash"></i></button></td></tr><tr v-if="!actividad.dotaciones?.length"><td colspan="7" class="empty">No hay cargos asignados a esta actividad.</td></tr></tbody></table></div><button class="secondary add-staff" @click="agregarDotacion(actividad)"><i class="fa-solid fa-plus"></i> Agregar cargo</button></article></section>
          <section v-show="pasoActual === 4"><div class="detail-header"><div><h4>Ingresos planificados</h4><small>Cada renglón conserva la unidad y el precio de este plan.</small></div><button class="secondary" @click="agregarLinea"><i class="fa-solid fa-plus"></i> Agregar producto</button></div><div class="lines-wrap"><table class="lines"><thead><tr><th>Producto</th><th>Tipo de precio</th><th>U/M</th><th>Cantidad</th><th>Precio</th><th>Importe</th><th></th></tr></thead><tbody><tr v-for="(linea, index) in form.elementos" :key="index"><td><select v-model="linea.productoId" @change="seleccionarProducto(linea)"><option value="">Seleccione un producto</option><option v-for="producto in productos" :key="producto.id" :value="producto.id">{{ producto.code }} - {{ producto.name }}</option></select></td><td><select v-model="linea.tipoPrecioSnapshot" @change="aplicarPrecio(linea)"><option value="PRECIO_GENERAL">General</option><option value="PRECIO_TRABAJADOR">Trabajador</option><option value="PRECIO_COMEDOR">Comedor</option></select></td><td>{{ linea.unidadMedidaSnapshot || '—' }}</td><td><input v-model.number="linea.cantidadPlanificada" min="0" step="0.0001" type="number"></td><td><input v-model.number="linea.precioUnitarioSnapshot" min="0" step="0.0001" type="number"></td><td class="amount">{{ moneda(importeLinea(linea)) }}</td><td><button class="danger" title="Eliminar renglón" @click="quitarLinea(index)"><i class="fa-solid fa-trash"></i></button></td></tr></tbody></table></div><div class="detail-header expenses-header"><div><h4>Gastos planificados por centro de costo</h4><small>Compras y servicios son consolidados; cada gasto queda almacenado con cantidad y precio.</small></div></div><article v-for="(actividad, actividadIndex) in form.actividades" :key="`gastos-${actividadIndex}`" class="staffing-card"><header><strong>{{ actividad.codigoCentroCosto || 'Centro pendiente' }}</strong><span>{{ actividad.actividad || 'Labor pendiente' }}</span><b>{{ moneda(totalGastosActividad(actividad)) }}</b></header><div class="lines-wrap"><table class="lines expenses"><thead><tr><th>Categoría</th><th>Subcategoría</th><th>Descripción</th><th>U/M</th><th>Cantidad</th><th>Precio U.</th><th>Importe</th><th></th></tr></thead><tbody><tr v-for="(gasto, index) in actividad.gastos" :key="index"><td><select v-model="gasto.categoria"><option value="COMBUSTIBLE">Combustible</option><option value="LUBRICANTE">Lubricante</option><option value="ENERGIA">Energía</option><option value="MATERIAL">Material</option><option value="INSUMO">Insumo</option><option value="SERVICIO">Servicio</option><option value="OTRO">Otro</option></select></td><td><select v-model="gasto.subcategoria"><option value="">—</option><option v-if="gasto.categoria === 'INSUMO'" value="HERBICIDA">Herbicida</option><option v-if="gasto.categoria === 'INSUMO'" value="FERTILIZANTE">Fertilizante</option><option v-if="gasto.categoria === 'INSUMO'" value="PLAGUICIDA">Plaguicida</option><option v-if="gasto.categoria === 'INSUMO'" value="SEMILLA">Semilla</option><option value="OTRO">Otro</option></select></td><td><input v-model.trim="gasto.descripcion" placeholder="Uso o detalle"></td><td><input v-model.trim="gasto.unidadMedidaSnapshot" placeholder="L, kg, u"></td><td><input v-model.number="gasto.cantidad" min="0" step="0.0001" type="number"></td><td><input v-model.number="gasto.precioUnitarioSnapshot" min="0" step="0.0001" type="number"></td><td class="amount">{{ moneda(importeGasto(gasto)) }}</td><td><button class="danger" @click="quitarGasto(actividad, index)"><i class="fa-solid fa-trash"></i></button></td></tr><tr v-if="!actividad.gastos.length"><td colspan="8" class="empty">No hay gastos directos programados.</td></tr></tbody></table></div><button class="secondary add-staff" @click="agregarGasto(actividad)"><i class="fa-solid fa-plus"></i> Agregar gasto</button></article></section>
          <section v-show="pasoActual === 5"><h4>Resumen y confirmación</h4><p class="step-help">Revise los importes calculados antes de guardar el borrador.</p><div class="summary"><div><span>Ingresos</span><strong>{{ moneda(totalIngresos) }}</strong></div><div><span>Salarios planificados</span><strong>{{ moneda(totalSalarios) }}</strong></div><div><span>Compras (informativo)</span><strong>{{ moneda(totalCompras) }}</strong></div><div><span>Servicios (informativo)</span><strong>{{ moneda(totalServicios) }}</strong></div><div><span>Aporte presupuesto</span><strong>{{ moneda(aportePresupuesto) }}</strong></div><div><span>Total egresos</span><strong>{{ moneda(totalEgresos) }}</strong></div><div :class="disponible < 0 ? 'negative' : 'positive'"><span>Disponible</span><strong>{{ moneda(disponible) }}</strong></div></div></section>
        </div>
        <footer><button class="secondary" @click="cerrarModal">Cancelar</button><div class="wizard-actions"><button v-if="pasoActual > 1" class="secondary" @click="pasoActual--">Anterior</button><button v-if="pasoActual < pasos.length" class="primary" @click="siguientePaso">Siguiente</button><button v-else class="primary" :disabled="guardando" @click="guardar">{{ guardando ? 'Guardando…' : 'Guardar borrador' }}</button></div></footer>
      </section>
    </div>

    <div v-if="modalEjecucion" class="overlay" @click.self="modalEjecucion = false"><section class="modal comparison" aria-modal="true" role="dialog"><header class="modal-header"><div><h3>Seguimiento: plan vs. real</h3><p>{{ planEjecucion ? `${fincaNombre(planEjecucion.fincaId)} · ${mes(planEjecucion.periodo)}` : '' }}</p></div><button class="close" @click="modalEjecucion = false">×</button></header><div class="modal-body"><div v-if="cargandoEjecucion" class="empty">Calculando ejecución…</div><template v-else-if="ejecucion"><div class="summary comparison-summary"><div><span>Ingreso plan / real</span><strong>{{ moneda(ejecucion.totalIngresosPlanificados) }} / {{ moneda(ejecucion.totalIngresosReales) }}</strong></div><div><span>Egreso plan / real</span><strong>{{ moneda(ejecucion.totalEgresosPlanificados) }} / {{ moneda(ejecucion.totalEgresosReales) }}</strong></div><div><span>Disponible plan / real</span><strong>{{ moneda(ejecucion.disponiblePlanificado) }} / {{ moneda(ejecucion.disponibleReal) }}</strong></div></div><div class="lines-wrap"><table class="lines"><thead><tr><th>Actividad</th><th>Meta</th><th>Real</th><th>Desviación</th><th>Salario plan / real</th><th>Gastos plan / real</th></tr></thead><tbody><tr v-for="(fila, index) in ejecucion.actividades" :key="index"><td>{{ fila.tipoCultivoNombre || '—' }}<small v-if="fila.actividad"> · {{ fila.actividad }}</small></td><td class="amount">{{ fila.cantidadPlanificada }}</td><td class="amount">{{ fila.cantidadReal }}</td><td :class="['amount', fila.cantidadReal - fila.cantidadPlanificada < 0 ? 'negative' : 'positive']">{{ fila.cantidadReal - fila.cantidadPlanificada }}</td><td class="amount">{{ moneda(fila.salarioPlanificado) }} / {{ moneda(fila.salarioReal) }}</td><td class="amount">{{ moneda(fila.comprasPlanificadas + fila.serviciosPlanificados) }} / {{ moneda(fila.comprasReales + fila.serviciosReales) }}</td></tr></tbody></table></div></template></div><footer><button class="secondary" @click="modalEjecucion = false">Cerrar</button></footer></section></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { notify } from '@/composables/useNotification'
import FincaService from '@/services/FincaService'
import CargoService from '@/services/CargoService'
import PlanIngresoVentaService from '@/services/PlanIngresoVentaService'
import ProductoService from '@/services/ProductoService'
import TipoCultivoService from '@/services/TipoCultivoService'
import LaborAgricolaService from '@/services/LaborAgricolaService'
import { CuentaContableService } from '@/services/ContabilidadService'
import type { Producto } from '@/types/Producto'
import type { ActividadPlanMensual, DotacionPlanMensual, EjecucionPlanMensual, EstadoPlanIngresoVenta, GastoPlanMensual, PlanIngresoVenta, PlanIngresoVentaRequest } from '@/types/PlanIngresoVenta'
import type { CargoEntity } from '@/types/Cargo'
import type { TipoCultivo } from '@/types/TipoCultivo'
import type { CuentaContable } from '@/types/Contabilidad'
import type { LaborAgricola } from '@/types/LaborAgricola'

interface FincaOpcion { id: string; code: string; name: string }
interface LineaEditor { productoId: string; productoCodigoSnapshot?: string; productoNombreSnapshot: string; unidadMedidaSnapshot: string; tipoPrecioSnapshot: string; cantidadPlanificada: number; precioUnitarioSnapshot: number }
type DotacionEditor = Omit<DotacionPlanMensual, 'id' | 'orden' | 'salarioPlanificado'>
type GastoEditor = Omit<GastoPlanMensual, 'id' | 'orden' | 'importe'>
type ActividadEditor = Omit<ActividadPlanMensual, 'id' | 'orden' | 'totalPlanificado' | 'gastos'> & { dotaciones: DotacionEditor[]; gastos: GastoEditor[] }
const hoy = new Date()
const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
const planes = ref<PlanIngresoVenta[]>([]), fincas = ref<FincaOpcion[]>([]), productos = ref<Producto[]>([]), tiposCultivo = ref<TipoCultivo[]>([]), cargos = ref<CargoEntity[]>([]), centrosCosto = ref<CuentaContable[]>([]), labores = ref<LaborAgricola[]>([])
const cargando = ref(false), cargandoFincas = ref(false), guardando = ref(false), modal = ref(false), editando = ref<PlanIngresoVenta | null>(null)
const modalEjecucion = ref(false), cargandoEjecucion = ref(false), planEjecucion = ref<PlanIngresoVenta | null>(null), ejecucion = ref<EjecucionPlanMensual | null>(null)
const filtroFinca = ref(''), filtroMes = ref('')
const pasos = ['Período', 'Actividades', 'Dotación y salarios', 'Ingresos y gastos', 'Resumen']
const pasoActual = ref(1)
const form = reactive<{ fincaId: string; periodo: string; pagosSalario: number; porcentajeAportePresupuesto: number; pagosCompras: number; comprasServicios: number; observaciones: string; elementos: LineaEditor[]; actividades: ActividadEditor[] }>({ fincaId: '', periodo: mesActual, pagosSalario: 0, porcentajeAportePresupuesto: 10, pagosCompras: 0, comprasServicios: 0, observaciones: '', elementos: [], actividades: [] })

const numero = (valor: unknown) => Number(valor || 0)
const importeLinea = (linea: LineaEditor) => numero(linea.cantidadPlanificada) * numero(linea.precioUnitarioSnapshot)
const importeGasto = (gasto: GastoEditor) => numero(gasto.cantidad) * numero(gasto.precioUnitarioSnapshot)
const salarioDotacion = (dotacion: DotacionEditor) => numero(dotacion.cantidadTrabajadores) * numero(dotacion.diasPlanificados) * numero(dotacion.horasPorDia) * numero(dotacion.salarioEscalaSnapshot) / 24 / 8
const salarioActividad = (actividad: ActividadEditor) => (actividad.dotaciones || []).reduce((total, dotacion) => total + salarioDotacion(dotacion), 0)
const totalGastosActividad = (actividad: ActividadEditor) => (actividad.gastos || []).reduce((total, gasto) => total + importeGasto(gasto), 0)
const totalActividad = (actividad: ActividadEditor) => salarioActividad(actividad) + totalGastosActividad(actividad)
const totalIngresos = computed(() => form.elementos.reduce((total, linea) => total + importeLinea(linea), 0))
const totalActividades = computed(() => form.actividades.reduce((total, actividad) => total + totalActividad(actividad), 0))
const totalSalarios = computed(() => form.actividades.reduce((total, actividad) => total + salarioActividad(actividad), 0))
const totalCompras = computed(() => form.actividades.reduce((total, actividad) => total + (actividad.gastos || []).filter(gasto => gasto.categoria !== 'SERVICIO').reduce((subtotal, gasto) => subtotal + importeGasto(gasto), 0), 0))
const totalServicios = computed(() => form.actividades.reduce((total, actividad) => total + (actividad.gastos || []).filter(gasto => gasto.categoria === 'SERVICIO').reduce((subtotal, gasto) => subtotal + importeGasto(gasto), 0), 0))
const aportePresupuesto = computed(() => totalSalarios.value * numero(form.porcentajeAportePresupuesto) / 100)
const totalEgresos = computed(() => aportePresupuesto.value + totalActividades.value)
const disponible = computed(() => totalIngresos.value - totalEgresos.value)
const planesFiltrados = computed(() => planes.value.filter(plan => (!filtroFinca.value || plan.fincaId === filtroFinca.value) && (!filtroMes.value || plan.periodo.startsWith(filtroMes.value))))
const moneda = (valor: unknown) => `$${numero(valor).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const mes = (periodo: string) => new Date(`${periodo}T12:00:00`).toLocaleDateString('es-CU', { month: 'long', year: 'numeric' })
const fincaNombre = (id: string) => { const finca = fincas.value.find(item => item.id === id); return finca ? `${finca.code} - ${finca.name}` : id }
const etiquetaEstado = (estado: EstadoPlanIngresoVenta) => estado === 'EN_REVISION' ? 'EN REVISIÓN' : estado

function reiniciarFormulario () { Object.assign(form, { fincaId: filtroFinca.value, periodo: filtroMes.value || mesActual, pagosSalario: 0, porcentajeAportePresupuesto: 10, pagosCompras: 0, comprasServicios: 0, observaciones: '', elementos: [], actividades: [] }) }
function agregarLinea () { form.elementos.push({ productoId: '', productoNombreSnapshot: '', unidadMedidaSnapshot: '', tipoPrecioSnapshot: 'PRECIO_GENERAL', cantidadPlanificada: 0, precioUnitarioSnapshot: 0 }) }
function agregarActividad () { form.actividades.push({ codigoCentroCosto: '', centroCostoNombreSnapshot: '', laborAgricolaId: '', laborAgricolaCodigoSnapshot: '', tipoCultivoId: '', tipoCultivoNombreSnapshot: '', actividad: '', bloqueSnapshot: '', campoSnapshot: '', unidadMedidaSnapshot: 'ha', areaPlanificada: 0, cantidadMeta: 0, pagoSalario: 0, compras: 0, servicios: 0, dotaciones: [], gastos: [] }) }
function quitarLinea (index: number) { form.elementos.splice(index, 1) }
function quitarActividad (index: number) { form.actividades.splice(index, 1) }
function agregarDotacion (actividad: ActividadEditor) { actividad.dotaciones.push({ cargoId: '', cargoNombreSnapshot: '', salarioEscalaSnapshot: 0, cantidadTrabajadores: 1, diasPlanificados: 1, horasPorDia: 8 }) }
function quitarDotacion (actividad: ActividadEditor, index: number) { actividad.dotaciones.splice(index, 1) }
function agregarGasto (actividad: ActividadEditor) { actividad.gastos.push({ codigoCentroCosto: actividad.codigoCentroCosto, categoria: 'INSUMO', subcategoria: '', descripcion: '', unidadMedidaSnapshot: '', cantidad: 0, precioUnitarioSnapshot: 0 }) }
function quitarGasto (actividad: ActividadEditor, index: number) { actividad.gastos.splice(index, 1) }
function seleccionarCargo (dotacion: DotacionEditor) { const cargo = cargos.value.find(item => item.id === dotacion.cargoId); dotacion.cargoNombreSnapshot = cargo?.name || ''; dotacion.salarioEscalaSnapshot = numero(cargo?.salarioEscala) }
function seleccionarLabor (actividad: ActividadEditor) { const labor = labores.value.find(item => item.id === actividad.laborAgricolaId); if (!labor) return; actividad.laborAgricolaCodigoSnapshot = labor.codigo; actividad.actividad = labor.nombre; actividad.codigoCentroCosto = labor.codigoCentroCosto || actividad.codigoCentroCosto; actividad.centroCostoNombreSnapshot = labor.centroCostoNombreSnapshot || centrosCosto.value.find(centro => centro.codigo === actividad.codigoCentroCosto)?.nombre || ''; actividad.tipoCultivoId = labor.tipoCultivoId || actividad.tipoCultivoId; actividad.tipoCultivoNombreSnapshot = labor.tipoCultivoNombreSnapshot || tiposCultivo.value.find(cultivo => cultivo.id === actividad.tipoCultivoId)?.nombre || ''; actividad.unidadMedidaSnapshot = labor.unidadMedida || actividad.unidadMedidaSnapshot; actividad.dotaciones = (labor.dotaciones || []).map(dotacion => { const cargo = cargos.value.find(item => item.id === dotacion.cargoId); return { cargoId: dotacion.cargoId || '', cargoNombreSnapshot: dotacion.cargoNombreSnapshot || cargo?.name || '', salarioEscalaSnapshot: numero(cargo?.salarioEscala), cantidadTrabajadores: numero(dotacion.hombresPorUnidad) * numero(actividad.areaPlanificada || 1), diasPlanificados: numero(dotacion.diasPlanificados), horasPorDia: numero(dotacion.horasPorDia) } }) }
function irAPaso (paso: number) { if (paso <= pasoActual.value || validarPasoActual()) pasoActual.value = paso }
function siguientePaso () { if (validarPasoActual()) pasoActual.value++ }
function validarPasoActual (): boolean {
  if (pasoActual.value === 1 && (!form.fincaId || !form.periodo)) { notify.warning('Datos incompletos', 'Seleccione finca y mes.'); return false }
  if (pasoActual.value === 2 && form.actividades.some(actividad => !actividad.codigoCentroCosto || !actividad.laborAgricolaId || !actividad.tipoCultivoNombreSnapshot || !actividad.unidadMedidaSnapshot)) { notify.warning('Programación incompleta', 'Seleccione centro de costo, labor, cultivo y unidad de medida.'); return false }
  if (pasoActual.value === 3 && form.actividades.some(actividad => (actividad.dotaciones || []).some(dotacion => !dotacion.cargoNombreSnapshot))) { notify.warning('Dotación incompleta', 'Seleccione un cargo en cada dotación agregada.'); return false }
  const hayGastoIncompleto = form.actividades.some(actividad => actividad.gastos.some(gasto => !gasto.descripcion || !gasto.unidadMedidaSnapshot || numero(gasto.cantidad) <= 0 || numero(gasto.precioUnitarioSnapshot) < 0))
  if (pasoActual.value === 4 && (!form.elementos.length || form.elementos.some(linea => !linea.productoNombreSnapshot || !linea.unidadMedidaSnapshot) || hayGastoIncompleto)) { notify.warning('Datos incompletos', 'Seleccione los productos y complete los gastos agregados.'); return false }
  return true
}
async function cargarFincas () {
  cargandoFincas.value = true
  try {
    const respuesta = await FincaService.buscarFincas({ size: 999, sortBy: 'name', sortType: 'ASC' })
    fincas.value = respuesta.data.data || []
  } catch (error) {
    console.error('No se pudieron cargar las fincas:', error)
    notify.error('Fincas', 'No se pudieron cargar las fincas disponibles.')
  } finally {
    cargandoFincas.value = false
  }
}
async function abrirNuevo () {
  if (!fincas.value.length) await cargarFincas()
  editando.value = null; reiniciarFormulario(); agregarLinea(); pasoActual.value = 1; modal.value = true
}
function abrirEdicion (plan: PlanIngresoVenta) {
  if (plan.estado !== 'BORRADOR') { notify.warning('Plan no editable', 'Solo se pueden modificar planes en borrador.'); return }
  editando.value = plan
  Object.assign(form, { fincaId: plan.fincaId, periodo: plan.periodo.slice(0, 7), pagosSalario: numero(plan.pagosSalario), porcentajeAportePresupuesto: numero(plan.porcentajeAportePresupuesto), pagosCompras: numero(plan.pagosCompras), comprasServicios: numero(plan.comprasServicios), observaciones: plan.observaciones || '', elementos: (plan.elementos || []).map(item => ({ productoId: productos.value.find(producto => producto.code === item.productoCodigoSnapshot)?.id || '', productoCodigoSnapshot: item.productoCodigoSnapshot, productoNombreSnapshot: item.productoNombreSnapshot, unidadMedidaSnapshot: item.unidadMedidaSnapshot, tipoPrecioSnapshot: item.tipoPrecioSnapshot || 'PRECIO_GENERAL', cantidadPlanificada: numero(item.cantidadPlanificada), precioUnitarioSnapshot: numero(item.precioUnitarioSnapshot) })), actividades: (plan.actividades || []).map(item => ({ codigoCentroCosto: item.codigoCentroCosto || '', centroCostoNombreSnapshot: item.centroCostoNombreSnapshot || '', laborAgricolaId: item.laborAgricolaId || '', laborAgricolaCodigoSnapshot: item.laborAgricolaCodigoSnapshot || '', tipoCultivoId: item.tipoCultivoId || tiposCultivo.value.find(cultivo => cultivo.nombre === item.tipoCultivoNombreSnapshot)?.id || '', tipoCultivoNombreSnapshot: item.tipoCultivoNombreSnapshot, actividad: item.actividad, bloqueSnapshot: item.bloqueSnapshot || '', campoSnapshot: item.campoSnapshot || '', unidadMedidaSnapshot: item.unidadMedidaSnapshot, areaPlanificada: numero(item.areaPlanificada), cantidadMeta: numero(item.cantidadMeta), pagoSalario: numero(item.pagoSalario), compras: numero(item.compras), servicios: numero(item.servicios), dotaciones: (item.dotaciones || []).map(dotacion => ({ cargoId: dotacion.cargoId || cargos.value.find(cargo => cargo.name === dotacion.cargoNombreSnapshot)?.id || '', cargoNombreSnapshot: dotacion.cargoNombreSnapshot, salarioEscalaSnapshot: numero(dotacion.salarioEscalaSnapshot), cantidadTrabajadores: numero(dotacion.cantidadTrabajadores), diasPlanificados: numero(dotacion.diasPlanificados), horasPorDia: numero(dotacion.horasPorDia) })), gastos: (item.gastos || []).map(gasto => ({ codigoCentroCosto: gasto.codigoCentroCosto || item.codigoCentroCosto || '', categoria: gasto.categoria, subcategoria: gasto.subcategoria || '', descripcion: gasto.descripcion, unidadMedidaSnapshot: gasto.unidadMedidaSnapshot || '', cantidad: numero(gasto.cantidad), precioUnitarioSnapshot: numero(gasto.precioUnitarioSnapshot) })) })) })
  pasoActual.value = 1
  modal.value = true
}
function cerrarModal () { modal.value = false }
function seleccionarProducto (linea: LineaEditor) { const producto = productos.value.find(item => item.id === linea.productoId); if (!producto) return; linea.productoCodigoSnapshot = producto.code; linea.productoNombreSnapshot = producto.name; linea.unidadMedidaSnapshot = producto.unidadMedida; aplicarPrecio(linea) }
function seleccionarCultivo (actividad: ActividadEditor) { const cultivo = tiposCultivo.value.find(item => item.id === actividad.tipoCultivoId); actividad.tipoCultivoNombreSnapshot = cultivo?.nombre || '' }
function aplicarPrecio (linea: LineaEditor) { const producto = productos.value.find(item => item.id === linea.productoId); if (!producto) return; linea.precioUnitarioSnapshot = linea.tipoPrecioSnapshot === 'PRECIO_TRABAJADOR' ? numero(producto.priceTrabajador) : linea.tipoPrecioSnapshot === 'PRECIO_COMEDOR' ? numero(producto.priceComedor) : numero(producto.price) }
function solicitud (): PlanIngresoVentaRequest { return { fincaId: form.fincaId, periodo: `${form.periodo}-01`, pagosSalario: totalSalarios.value, porcentajeAportePresupuesto: numero(form.porcentajeAportePresupuesto), pagosCompras: totalCompras.value, comprasServicios: totalServicios.value, observaciones: form.observaciones || undefined, elementos: form.elementos.map(({ productoId, ...linea }) => { void productoId; return linea }), actividades: form.actividades.map(actividad => ({ ...actividad, pagoSalario: salarioActividad(actividad), compras: (actividad.gastos || []).filter(gasto => gasto.categoria !== 'SERVICIO').reduce((total, gasto) => total + importeGasto(gasto), 0), servicios: (actividad.gastos || []).filter(gasto => gasto.categoria === 'SERVICIO').reduce((total, gasto) => total + importeGasto(gasto), 0), gastos: (actividad.gastos || []).map(gasto => ({ ...gasto, codigoCentroCosto: actividad.codigoCentroCosto })), bloqueSnapshot: actividad.bloqueSnapshot || undefined, campoSnapshot: actividad.campoSnapshot || undefined })) } }
async function cargar () { cargando.value = true; try { const response = await PlanIngresoVentaService.buscar(); planes.value = response.data.data || [] } catch (error) { console.error(error); notify.error('Error', 'No se pudieron cargar los planes de ingresos.') } finally { cargando.value = false } }
async function guardar () { if (!validarPasoActual()) return; guardando.value = true; try { if (editando.value) await PlanIngresoVentaService.actualizar(editando.value.id, solicitud()); else await PlanIngresoVentaService.crear(solicitud()); cerrarModal(); await cargar(); notify.success('Plan guardado', 'El plan mensual quedó guardado como borrador.') } catch (error) { console.error(error); notify.error('No se pudo guardar', 'Verifique la finca, mes e importes. Puede existir otro plan para el mismo período.') } finally { guardando.value = false } }
async function eliminar (plan: PlanIngresoVenta) { if (plan.estado !== 'BORRADOR') { notify.warning('Plan no eliminable', 'Solo se pueden eliminar planes en borrador.'); return } if (!window.confirm(`¿Eliminar el plan de ${mes(plan.periodo)}?`)) return; try { await PlanIngresoVentaService.eliminar(plan.id); await cargar(); notify.success('Plan eliminado', 'El borrador fue eliminado.') } catch (error) { console.error(error); notify.error('No se pudo eliminar', 'El plan puede haber cambiado de estado.') } }
function siguientePeriodo (periodo: string) { const fecha = new Date(`${periodo.slice(0, 7)}-01T12:00:00`); fecha.setMonth(fecha.getMonth() + 1); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01` }
async function generarSiguiente (plan: PlanIngresoVenta) { try { await PlanIngresoVentaService.generarSiguiente(siguientePeriodo(plan.periodo)); await cargar(); notify.success('Plan generado', 'Se creó un borrador para el mes siguiente.') } catch (error) { console.error(error); notify.error('No se pudo generar', 'Puede existir un plan para el mes siguiente o faltar el cierre correspondiente.') } }
async function cambiarEstado (plan: PlanIngresoVenta, estado: EstadoPlanIngresoVenta) { try { await PlanIngresoVentaService.cambiarEstado(plan.id, estado); await cargar(); notify.success('Estado actualizado', `El plan quedó ${etiquetaEstado(estado).toLowerCase()}.`) } catch (error) { console.error(error); notify.error('No se pudo actualizar', 'El estado no permite esta transición.') } }
async function verEjecucion (plan: PlanIngresoVenta) { planEjecucion.value = plan; ejecucion.value = null; modalEjecucion.value = true; cargandoEjecucion.value = true; try { ejecucion.value = (await PlanIngresoVentaService.ejecucion(plan.id)).data } catch (error) { console.error(error); notify.error('Seguimiento no disponible', 'No se pudo calcular la ejecución de este plan.') } finally { cargandoEjecucion.value = false } }
function descargarPdf (plan: PlanIngresoVenta) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const actividades = plan.actividades || []
  const elementos = [...new Map((plan.elementos || []).map(item => [
    `${item.productoCodigoSnapshot}|${item.productoNombreSnapshot}|${item.unidadMedidaSnapshot}|${item.tipoPrecioSnapshot}|${item.cantidadPlanificada}|${item.precioUnitarioSnapshot}|${item.importePlanificado}`,
    item
  ])).values()]
  const titulo = (texto: string, subtitulo?: string) => {
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(texto, 148.5, 12, { align: 'center' })
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(subtitulo || `${fincaNombre(plan.fincaId)} · ${mes(plan.periodo)}`, 148.5, 17, { align: 'center' })
  }
  const totalActividad = (actividad: ActividadEditor | typeof actividades[number]) => numero(actividad.totalPlanificado ?? numero(actividad.pagoSalario) + numero(actividad.compras) + numero(actividad.servicios))

  titulo('RELACIÓN DE LOS INGRESOS POR VENTAS, VALORACIÓN DE LOS EGRESOS')
  const filasRelacion = elementos.map(item => [item.productoNombreSnapshot, item.unidadMedidaSnapshot, String(item.cantidadPlanificada), moneda(item.precioUnitarioSnapshot), moneda(item.importePlanificado ?? numero(item.cantidadPlanificada) * numero(item.precioUnitarioSnapshot)), '', '', '', '', ''])
  filasRelacion.push(['TOTALES', '', '', '', moneda(plan.totalIngresosPlanificados), moneda(plan.totalEgresos), moneda(plan.disponible), moneda(plan.pagosSalario), moneda(plan.aportePresupuesto), moneda(numero(plan.pagosCompras) + numero(plan.comprasServicios))])
  autoTable(doc, { startY: 22, head: [[{ content: 'Concepto', rowSpan: 2 }, { content: 'Ingresos planificados', colSpan: 4 }, { content: 'Total\negreso', rowSpan: 2 }, { content: 'Disp.', rowSpan: 2 }, { content: 'Pagos\nsalario', rowSpan: 2 }, { content: 'Aporte\npresupuesto\n10 %', rowSpan: 2 }, { content: 'Pagos\ncompras', rowSpan: 2 }, { content: 'Compras\nservicios', rowSpan: 2 }], ['U/M', 'Cant.', 'Precio', 'Imp.']], body: filasRelacion.map(fila => [...fila.slice(0, 5), fila[5], fila[6], fila[7], fila[8], fila[9]]), theme: 'grid', styles: { fontSize: 7, cellPadding: 1.4, valign: 'middle' }, headStyles: { fillColor: [255, 255, 255], textColor: 20, fontStyle: 'bold', halign: 'center' }, columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 15 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } } })

  doc.addPage('landscape')
  titulo('PROGRAMACIÓN AGRÍCOLA, FINANCIERA', `${fincaNombre(plan.fincaId)} · CORRESPONDIENTE AL MES DE ${mes(plan.periodo)}`)
  const importeCategoria = (actividad: typeof actividades[number], categoria: string) => (actividad.gastos || []).filter(gasto => gasto.categoria === categoria).reduce((total, gasto) => total + numero(gasto.importe ?? numero(gasto.cantidad) * numero(gasto.precioUnitarioSnapshot)), 0)
  autoTable(doc, { startY: 22, head: [['Área', 'U/M', 'Total\nprogramado', 'Programación\ndel mes', 'Aporte\npresupuesto 10 %', 'Costos\nsalarios', 'Materiales', 'Comb.', 'Energía', 'Total']], body: actividades.map(a => {
    const materiales = importeCategoria(a, 'MATERIAL') + importeCategoria(a, 'INSUMO') + importeCategoria(a, 'LUBRICANTE') + importeCategoria(a, 'OTRO')
    const combustible = importeCategoria(a, 'COMBUSTIBLE')
    const energia = importeCategoria(a, 'ENERGIA') + importeCategoria(a, 'SERVICIO')
    const aporte = numero(a.pagoSalario) * numero(plan.porcentajeAportePresupuesto) / 100
    return [`${a.tipoCultivoNombreSnapshot || '—'}\n${a.actividad || a.laborAgricolaSnapshot || ''}`, a.unidadMedidaSnapshot || '—', String(a.areaPlanificada || 0), String(a.cantidadMeta || 0), moneda(aporte), moneda(a.pagoSalario), moneda(materiales), moneda(combustible), moneda(energia), moneda(numero(a.pagoSalario) + aporte + materiales + combustible + energia)]
  }), theme: 'grid', styles: { fontSize: 6.6, cellPadding: 1.2, valign: 'middle' }, headStyles: { fillColor: [255, 255, 255], textColor: 20, fontStyle: 'bold' }, columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 13 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } } })
  const finProgramacion = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('INDICADORES DE GASTOS PLANIFICADOS', 14, finProgramacion + 8)
  const gastos = actividades.flatMap(a => (a.gastos || []).map(g => [g.descripcion, g.unidadMedidaSnapshot || '—', String(g.cantidad || 0), moneda(g.precioUnitarioSnapshot), moneda(g.importe ?? numero(g.cantidad) * numero(g.precioUnitarioSnapshot))]))
  autoTable(doc, { startY: finProgramacion + 11, head: [['Indicadores', 'U/M', 'Programado', 'Precio', 'Importe']], body: gastos.length ? gastos : [['Sin gastos planificados', '—', '—', '—', '—']], theme: 'grid', styles: { fontSize: 7, cellPadding: 1.3 }, headStyles: { fillColor: [255, 255, 255], textColor: 20, fontStyle: 'bold' }, columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 30 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } })

  doc.addPage('landscape')
  titulo('DETALLE DEL PLAN MENSUAL', `${fincaNombre(plan.fincaId)} · ${mes(plan.periodo)} · ${etiquetaEstado(plan.estado)}`)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Detalle de ingresos', 14, 23)
  autoTable(doc, { startY: 26, head: [['Producto', 'U/M', 'Tipo de precio', 'Cantidad', 'Precio unitario', 'Importe']], body: elementos.map(item => [item.productoNombreSnapshot, item.unidadMedidaSnapshot, item.tipoPrecioSnapshot || 'PRECIO_GENERAL', String(item.cantidadPlanificada), moneda(item.precioUnitarioSnapshot), moneda(item.importePlanificado ?? numero(item.cantidadPlanificada) * numero(item.precioUnitarioSnapshot))]), theme: 'grid', styles: { fontSize: 7, cellPadding: 1.3 }, headStyles: { fillColor: [240, 240, 240], textColor: 20 } })
  const finIngresos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFontSize(9); doc.text('Dotación y salarios por actividad', 14, finIngresos + 8)
  const dotaciones = actividades.flatMap(a => (a.dotaciones || []).map(d => [a.actividad || a.tipoCultivoNombreSnapshot || '—', a.codigoCentroCosto || '—', d.cargoNombreSnapshot || '—', String(d.cantidadTrabajadores || 0), String(d.diasPlanificados || 0), String(d.horasPorDia || 0), moneda(d.salarioEscalaSnapshot), moneda(d.salarioPlanificado ?? numero(d.cantidadTrabajadores) * numero(d.diasPlanificados) * numero(d.horasPorDia) * numero(d.salarioEscalaSnapshot) / 24 / 8)]))
  autoTable(doc, { startY: finIngresos + 11, head: [['Actividad', 'Centro costo', 'Cargo', 'Trabajadores', 'Días', 'Horas/día', 'Salario escala', 'Salario planificado']], body: dotaciones.length ? dotaciones : [['—', '—', 'Sin dotación planificada', '—', '—', '—', '—', '—']], theme: 'grid', styles: { fontSize: 7, cellPadding: 1.3 }, headStyles: { fillColor: [240, 240, 240], textColor: 20 } })
  doc.save(`Plan_mensual_${plan.periodo.slice(0, 7)}.pdf`)
}
function limpiarFiltros () { filtroFinca.value = ''; filtroMes.value = '' }
onMounted(async () => {
  const resultados = await Promise.allSettled([
    cargarFincas(),
    ProductoService.buscarProductos({ size: 999, sortBy: 'name', sortType: 'ASC' }),
    TipoCultivoService.getAll(),
    CargoService.getAll(),
    CuentaContableService.getCentrosCosto(),
    LaborAgricolaService.listar()
  ])

  const [respuestaFincas, respuestaProductos, respuestaCultivos, respuestaCargos, respuestaCentros, respuestaLabores] = resultados
  if (respuestaFincas.status === 'rejected') console.error('No se pudieron cargar las fincas:', respuestaFincas.reason)
  if (respuestaProductos.status === 'fulfilled') productos.value = (respuestaProductos.value.data.data || []).filter(producto => producto.active)
  if (respuestaCultivos.status === 'fulfilled') tiposCultivo.value = respuestaCultivos.value.filter(cultivo => cultivo.activo)
  if (respuestaCargos.status === 'fulfilled') cargos.value = respuestaCargos.value.data.data || []
  if (respuestaCentros.status === 'fulfilled') centrosCosto.value = respuestaCentros.value.filter(centro => centro.activo)
  if (respuestaLabores.status === 'fulfilled') labores.value = respuestaLabores.value.filter(labor => labor.activo)

  const catalogosFallidos = resultados.slice(1).some(resultado => resultado.status === 'rejected')
  if (catalogosFallidos) notify.warning('Catálogos incompletos', 'Algunos catálogos no pudieron cargarse; las fincas disponibles continúan operativas.')
  await cargar()
})
</script>

<style scoped>
.compras-servicios{border:1px solid #cbd5e1;border-radius:6px;display:grid;gap:.5rem;grid-column:span 2;padding:.55rem}.compras-servicios legend{color:#475569;font-size:.8rem;font-weight:700;padding:0 .3rem}.compras-servicios label{display:grid;font-size:.75rem;font-weight:700;gap:.25rem}.compras-servicios input{border:1px solid #cbd5e1;border-radius:6px;padding:.45rem}
.informative-total{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;display:grid;padding:.55rem}.informative-total span{color:#166534;font-size:.75rem;font-weight:700}.informative-total strong{color:#14532d;margin-top:.2rem}.expenses-header{border-top:1px solid #e2e8f0;margin-top:1.5rem;padding-top:1.25rem}.expenses{min-width:1100px}
.plan-page{color:#263238;margin:0 auto;max-width:1400px;padding:1.5rem}.page-header,.detail-header,footer{align-items:center;display:flex;gap:1rem;justify-content:space-between}.page-header h2{color:#1e3a5f;margin:0}.page-header p,.step-help{color:#64748b;margin:.35rem 0 0}.notice{background:#eff6ff;border-left:4px solid #2563eb;color:#1e3a5f;margin:1.25rem 0;padding:.85rem 1rem}.card{background:#fff;border:1px solid #dbe4ea;border-radius:10px;padding:1rem}.filters{align-items:end;display:flex;gap:1rem}.filters label,.form-grid label,.observaciones{display:grid;font-size:.8rem;font-weight:700;gap:.3rem}.filters select,.filters input{min-width:220px}.table-card{margin-top:1rem}.table-wrap,.lines-wrap{overflow:auto}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e2e8f0;padding:.7rem;text-align:left}th{background:#f1f5f9;font-size:.75rem;text-transform:uppercase}.amount{text-align:right;font-variant-numeric:tabular-nums}.positive{color:#166534}.negative{color:#b91c1c}.actions{white-space:nowrap}.actions button,.lines button{margin-right:.35rem}.estado{border-radius:99px;font-size:.72rem;font-weight:800;padding:.25rem .55rem}.borrador{background:#e0f2fe;color:#075985}.en-revision{background:#fef3c7;color:#92400e}.aprobado{background:#dcfce7;color:#166534}.cerrado{background:#e2e8f0;color:#334155}.anulado{background:#fee2e2;color:#991b1b}button{border:0;border-radius:6px;cursor:pointer;padding:.55rem .8rem}button:disabled{cursor:not-allowed;opacity:.65}.primary{background:#1d4ed8;color:#fff;font-weight:700}.secondary{background:#e2e8f0;color:#334155}.detail-actions{display:flex;gap:.65rem}.detail-actions a{text-decoration:none}.danger{background:#fee2e2;color:#b91c1c}.empty{color:#64748b;padding:2rem;text-align:center}.overlay{align-items:center;background:rgba(15,23,42,.55);display:flex;inset:0;justify-content:center;padding:1rem;position:fixed;z-index:1000}.modal{background:#fff;border-radius:12px;box-shadow:0 20px 50px #0f172a66;display:flex;flex-direction:column;max-height:94vh;max-width:1320px;width:100%}.modal-header{align-items:start;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;padding:1rem 1.25rem}.modal-header h3{margin:0}.modal-header p{color:#64748b;margin:.25rem 0 0}.close{background:transparent;font-size:2rem;line-height:1;padding:0}.wizard-steps{border-bottom:1px solid #e2e8f0;display:flex;gap:.25rem;overflow:auto;padding:.7rem 1.25rem}.wizard-steps button{background:transparent;color:#64748b;font-size:.78rem;white-space:nowrap}.wizard-steps button span{background:#e2e8f0;border-radius:50%;display:inline-grid;height:1.5rem;margin-right:.35rem;place-items:center;width:1.5rem}.wizard-steps button.active{color:#1d4ed8;font-weight:700}.wizard-steps button.active span,.wizard-steps button.done span{background:#1d4ed8;color:#fff}.modal-body{overflow:auto;padding:1.25rem}.form-grid{display:grid;gap:1rem;grid-template-columns:repeat(3,minmax(0,1fr))}.form-grid input,.form-grid select,.observaciones textarea,.lines input,.lines select{border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;padding:.55rem;width:100%}.observaciones{margin:1rem 0}.detail-header{margin-top:1.25rem}.detail-header h4{margin:0}.detail-header small,.lines small{color:#64748b}.lines{min-width:950px}.agricultural{min-width:1300px}.staffing{min-width:850px}.lines th,.lines td{padding:.5rem}.campo-inputs{display:flex;gap:.3rem;min-width:180px}.staffing-card{border:1px solid #dbe4ea;border-radius:9px;margin:1rem 0;padding:1rem}.staffing-card header{align-items:center;display:flex;gap:.6rem;justify-content:space-between;margin-bottom:.75rem}.staffing-card header span{color:#64748b;font-size:.85rem}.add-staff{margin-top:.75rem}.summary{display:grid;gap:1rem;grid-template-columns:repeat(3,1fr);margin-top:1rem}.summary div{background:#f8fafc;border-radius:8px;padding:.75rem}.summary span{color:#64748b;display:block;font-size:.75rem}.summary strong{display:block;font-size:1.05rem;margin-top:.2rem}footer{border-top:1px solid #e2e8f0;padding:1rem 1.25rem}.wizard-actions{display:flex;gap:.65rem}.comparison{max-width:1180px}.comparison-summary{grid-template-columns:repeat(3,1fr)}@media(max-width:800px){.page-header,.filters{align-items:stretch;flex-direction:column}.form-grid,.summary,.comparison-summary{grid-template-columns:1fr}.filters select,.filters input{width:100%}.detail-header{align-items:start;flex-direction:column}.staffing-card header{align-items:start;flex-direction:column}}
.modal{max-width:min(1450px,97vw)}
</style>
