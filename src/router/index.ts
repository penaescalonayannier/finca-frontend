// src/router/index.ts

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AuthService from '@/services/AuthService'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import EstadoCuentaList from '@/components/EstadoCuentaList.vue'
import UploadXmlView from '@/components/UploadXmlView.vue'
import ProcesarXmlView from '@/components/ProcesarXmlView.vue'
import ClienteList from '@/components/ClienteList.vue'
import TrabajadorList from '@/components/TrabajadorList.vue'
import ProductoList from '@/components/ProductoList.vue'
import FincaList from '@/components/FincaList.vue'
import FincaProductoList from '@/components/FincaProductoList.vue'
import PrestamoList from '@/components/PrestamoList.vue'
import TomaPrestamoList from '@/components/TomaPrestamoList.vue'
import CamposList from '@/components/CamposList.vue'
import TipoCultivoList from '@/components/TipoCultivoList.vue'
import ReporteList from '@/components/ReporteList.vue'
import TrabajadorReporteList from '@/components/TrabajadorReporteList.vue'
import ReporteConsolidado from '@/components/ReporteConsolidado.vue'
import ReporteConsolidadoPorResponsable from '@/components/ReporteConsolidadoPorResponsable.vue'
import GerencialDashboard from '@/views/GerencialDashboard.vue'
import ReportesView from '@/views/ReportesView.vue'
import ListaCargos from '@/components/ListaCargos.vue'
import CrearCargo from '@/components/CrearCargo.vue'
import EditarCargo from '@/components/EditarCargo.vue'
import ListaGrupos from '@/components/ListaGrupos.vue'
import CrearGrupo from '@/components/CrearGrupo.vue'
import EditarGrupo from '@/components/EditarGrupo.vue'
import EvaluacionTrabajadores from '@/components/EvaluacionTrabajadores.vue'
import ListarEvaluacionesView from '@/views/ListarEvaluacionesView.vue'
import ProduccionTerminadaList from '@/components/ProduccionTerminadaList.vue'
import SalidaList from '@/components/SalidaList.vue'
import DeudaTrabajadorList from '@/components/DeudaTrabajadorList.vue'
import HistorialMovimientos from '@/components/HistorialMovimientos.vue'
import HistorialStock from '@/components/HistorialStock.vue'
import AlmacenList from '@/components/AlmacenList.vue'
import DetalleAlmacenView from '@/views/DetalleAlmacenView.vue'
import ReportesConsolidadosView from '@/components/ReportesView.vue'
import ReporteDeudasPendientes from '@/components/ReporteDeudasPendientes.vue'
import ReporteFacturacion from '@/components/ReporteFacturacion.vue'
import AlertasStockView from '@/components/AlertasStockView.vue'
import ReporteKardex from '@/components/ReporteKardex.vue'
import ReporteMovimientosGrafico from '@/components/ReporteMovimientosGrafico.vue'
import ResumenVentasPagosView from '@/views/ResumenVentasPagosView.vue'
import UsuarioList from '@/components/UsuarioList.vue'
import AuditoriaList from '@/components/AuditoriaList.vue'
import ConfiguracionEmpresaForm from '@/components/ConfiguracionEmpresaForm.vue'
import ActivoFijoList from '@/components/ActivoFijoList.vue'
import ActivoAnimalList from '@/components/ActivoAnimalList.vue'
import PlantacionList from '@/components/PlantacionList.vue'
import DepreciacionView from '@/components/DepreciacionView.vue'
import GrupoActivoFijoList from '@/components/GrupoActivoFijoList.vue'
import ReporteConsolidadoMovimientos from '@/views/ReporteConsolidadoMovimientos.vue'
import LiquidacionCajaView from '@/views/LiquidacionCajaView.vue'
import ArqueosCajaView from '@/views/ArqueosCajaView.vue'
import CajaOficialView from '@/views/CajaOficialView.vue'
import DocumentosCajaView from '@/views/DocumentosCajaView.vue'
import BancoView from '@/views/BancoView.vue'
import ConsecutivosDocumentalesView from '@/views/ConsecutivosDocumentalesView.vue'
import ConteosFisicosAlmacenView from '@/views/ConteosFisicosAlmacenView.vue'
import ListaTipoReportes from '@/components/ListaTipoReportes.vue'
import CrearTipoReporte from '@/components/CrearTipoReporte.vue'
import EditarTipoReporte from '@/components/EditarTipoReporte.vue'
import ListaTipoAnimales from '@/components/ListaTipoAnimales.vue'
import CrearTipoAnimal from '@/components/CrearTipoAnimal.vue'
import EditarTipoAnimal from '@/components/EditarTipoAnimal.vue'
import CentroCostoList from '@/components/CentroCostoList.vue'
import CrearCentroCosto from '@/components/CrearCentroCosto.vue'
import EditarCentroCosto from '@/components/EditarCentroCosto.vue'

// Contabilidad views
import LibroDiario from '@/views/contabilidad/LibroDiario.vue'
import MayorPorCuenta from '@/views/contabilidad/MayorPorCuenta.vue'
import BalanceComprobacion from '@/views/contabilidad/BalanceComprobacion.vue'
import ReglasContabilizacion from '@/views/contabilidad/ReglasContabilizacion.vue'
import PlanCuentas from '@/views/contabilidad/PlanCuentas.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/estado-cuenta',
    name: 'EstadoCuenta',
    component: EstadoCuentaList
  },
  {
    path: '/estado-cuenta/upload',
    name: 'UploadXml',
    component: UploadXmlView
  },
  {
    path: '/estado-cuenta/procesar',
    name: 'ProcesarXml',
    component: ProcesarXmlView
  },
  {
    path: '/clientes',
    name: 'Clientes',
    component: ClienteList
  },
  {
    path: '/trabajadores',
    name: 'Trabajadores',
    component: TrabajadorList
  },
  {
    path: '/productos',
    name: 'Productos',
    component: ProductoList
  },
  {
    path: '/fincas',
    name: 'Fincas',
    component: FincaList
  },
  {
    path: '/finca-productos',
    name: 'FincaProductos',
    component: FincaProductoList
  },
  {
    path: '/entrada-produccion',
    name: 'EntradaProduccion',
    redirect: '/almacenes'
  },
  {
    path: '/prestamos',
    name: 'Prestamos',
    component: PrestamoList
  },
  {
    path: '/toma-prestamos',
    name: 'TomaPrestamos',
    component: TomaPrestamoList
  },
  {
    path: '/campos',
    name: 'Campos',
    component: CamposList
  },
  {
    path: '/tipos-cultivo',
    name: 'TiposCultivo',
    component: TipoCultivoList
  },
  {
    path: '/reportes',
    name: 'Reportes',
    component: ReporteList
  },
  {
    path: '/trabajador-reportes',
    name: 'TrabajadorReportes',
    component: TrabajadorReporteList
  },
  {
    path: '/reporte-consolidado',
    name: 'ReporteConsolidado',
    component: ReporteConsolidado
  },
  {
    path: '/reporte-consolidado-por-responsable',
    name: 'ReporteConsolidadoPorResponsable',
    component: ReporteConsolidadoPorResponsable
  },
  {
    path: '/gerencial-dashboard',
    name: 'GerencialDashboard',
    component: GerencialDashboard
  },
  {
    path: '/reportes/ausentismo',
    name: 'ReporteAusentismo',
    component: ReportesView
  },
  {
    path: '/reportes/productividad',
    name: 'ReporteProductividad',
    component: ReportesView
  },
  {
    path: '/reportes/rankings',
    name: 'ReporteRankings',
    component: ReportesView
  },
  {
    path: '/reportes/horas-excedidas',
    name: 'ReporteHorasExcedidas',
    component: ReportesView
  },
  {
    path: '/lista-cargos',
    name: 'ListaCargos',
    component: ListaCargos
  },
  {
    path: '/crear-cargo',
    name: 'CrearCargo',
    component: CrearCargo
  },
  {
    path: '/editar-cargo/:id',
    name: 'EditarCargo',
    component: EditarCargo
  },
  {
    path: '/lista-grupos',
    name: 'ListaGrupos',
    component: ListaGrupos
  },
  {
    path: '/crear-grupo',
    name: 'CrearGrupo',
    component: CrearGrupo
  },
  {
    path: '/editar-grupo/:id',
    name: 'EditarGrupo',
    component: EditarGrupo
  },
  {
    path: '/evaluaciones',
    name: 'EvaluacionTrabajadores',
    component: EvaluacionTrabajadores
  },
  {
    path: '/grupo/:grupoId/evaluaciones',
    name: 'ListarEvaluaciones',
    component: ListarEvaluacionesView
  },
  {
    path: '/produccion-terminada',
    name: 'ProduccionTerminada',
    component: ProduccionTerminadaList
  },
  {
    path: '/salidas',
    name: 'Salidas',
    component: SalidaList
  },
  {
    path: '/deudas-trabajadores',
    name: 'DeudasTrabajadores',
    component: DeudaTrabajadorList
  },
  {
    path: '/historial-movimientos',
    name: 'HistorialMovimientos',
    component: HistorialMovimientos
  },
  {
    path: '/historial-stock',
    name: 'HistorialStock',
    component: HistorialStock
  },
  {
    path: '/almacenes',
    name: 'Almacenes',
    component: AlmacenList
  },
  {
    path: '/almacenes/:id',
    name: 'DetalleAlmacen',
    component: DetalleAlmacenView
  },
  {
    path: '/conteos-fisicos-almacen',
    name: 'ConteosFisicosAlmacen',
    component: ConteosFisicosAlmacenView
  },
  {
    path: '/reportes-consolidados',
    name: 'ReportesConsolidados',
    component: ReportesConsolidadosView
  },
  {
    path: '/reportes/deudas',
    name: 'ReporteDeudas',
    component: ReporteDeudasPendientes
  },
  {
    path: '/reportes/facturacion',
    name: 'ReporteFacturacionView',
    component: ReporteFacturacion
  },
  {
    path: '/alertas-stock',
    name: 'AlertasStock',
    component: AlertasStockView
  },
  {
    path: '/reportes/kardex',
    name: 'ReporteKardex',
    component: ReporteKardex
  },
  {
    path: '/reportes/movimientos',
    name: 'ReporteMovimientos',
    component: ReporteMovimientosGrafico
  },
  {
    path: '/reportes/ventas-pagos',
    name: 'ResumenVentasPagos',
    component: ResumenVentasPagosView
  },
  {
    path: '/usuarios',
    name: 'Usuarios',
    component: UsuarioList,
    meta: { requiresAdmin: true }
  },
  {
    path: '/auditoria',
    name: 'Auditoria',
    component: AuditoriaList,
    meta: { requiresAdmin: true }
  },
  {
    path: '/configuracion-empresa',
    name: 'ConfiguracionEmpresa',
    component: ConfiguracionEmpresaForm,
    meta: { requiresAdmin: true }
  },
  // Activos Fijos Tangibles (AFT)
  {
    path: '/grupos-activos-fijos',
    name: 'GruposActivosFijos',
    component: GrupoActivoFijoList
  },
  {
    path: '/activos-fijos',
    name: 'ActivosFijos',
    component: ActivoFijoList
  },
  {
    path: '/activos-animales',
    name: 'ActivosAnimales',
    component: ActivoAnimalList
  },
  {
    path: '/plantaciones',
    name: 'Plantaciones',
    component: PlantacionList
  },
  {
    path: '/depreciacion',
    name: 'Depreciacion',
    component: DepreciacionView
  },
  {
    path: '/reportes/consolidado-movimientos',
    name: 'ReporteConsolidadoMovimientos',
    component: ReporteConsolidadoMovimientos
  },
  {
    path: '/liquidacion-caja',
    name: 'LiquidacionCaja',
    component: LiquidacionCajaView
  },
  {
    path: '/arqueos-caja',
    name: 'ArqueosCaja',
    component: ArqueosCajaView
  },
  {
    path: '/caja-oficial',
    name: 'CajaOficial',
    component: CajaOficialView
  },
  {
    path: '/documentos-caja',
    name: 'DocumentosCaja',
    component: DocumentosCajaView
  },
  {
    path: '/banco',
    name: 'Banco',
    component: BancoView
  },
  {
    path: '/consecutivos-documentales',
    name: 'ConsecutivosDocumentales',
    component: ConsecutivosDocumentalesView
  },
  // Tipos de Reporte (nomenclador)
  {
    path: '/lista-tipo-reportes',
    name: 'ListaTipoReportes',
    component: ListaTipoReportes
  },
  {
    path: '/crear-tipo-reporte',
    name: 'CrearTipoReporte',
    component: CrearTipoReporte
  },
  {
    path: '/editar-tipo-reporte/:id',
    name: 'EditarTipoReporte',
    component: EditarTipoReporte
  },
  // Tipos de Animal (nomenclador para Vaquería)
  {
    path: '/lista-tipo-animales',
    name: 'ListaTipoAnimales',
    component: ListaTipoAnimales
  },
  {
    path: '/crear-tipo-animal',
    name: 'CrearTipoAnimal',
    component: CrearTipoAnimal
  },
  {
    path: '/editar-tipo-animal/:id',
    name: 'EditarTipoAnimal',
    component: EditarTipoAnimal
  },
  // Centros de Costo (Contabilidad)
  {
    path: '/centros-costo',
    name: 'CentrosCosto',
    component: CentroCostoList
  },
  {
    path: '/crear-centro-costo',
    name: 'CrearCentroCosto',
    component: CrearCentroCosto
  },
  {
    path: '/editar-centro-costo/:id',
    name: 'EditarCentroCosto',
    component: EditarCentroCosto
  },
  // Contabilidad
  {
    path: '/contabilidad/libro-diario',
    name: 'LibroDiario',
    component: LibroDiario
  },
  {
    path: '/contabilidad/mayor-por-cuenta',
    name: 'MayorPorCuenta',
    component: MayorPorCuenta
  },
  {
    path: '/contabilidad/balance-comprobacion',
    name: 'BalanceComprobacion',
    component: BalanceComprobacion
  },
  {
    path: '/contabilidad/reglas',
    name: 'ReglasContabilizacion',
    component: ReglasContabilizacion
  },
  {
    path: '/contabilidad/plan-cuentas',
    name: 'PlanCuentas',
    component: PlanCuentas
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const isPublic = to.meta.public === true
  const isAuthenticated = AuthService.isAuthenticated()

  if (!isPublic && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
