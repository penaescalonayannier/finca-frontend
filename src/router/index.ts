// src/router/index.ts

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
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

const routes: RouteRecordRaw[] = [
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
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router