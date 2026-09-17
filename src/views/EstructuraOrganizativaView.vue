<template>
  <main class="estructura">
    <header><h2>Estructura organizativa y plantilla</h2><p>Las áreas y plazas son graduales: no cambian los grupos ni trabajadores existentes.</p></header>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="selector"><label>Finca <select v-model="fincaId" @change="cargar"><option value="">Seleccione</option><option v-for="f in fincas" :key="f.id" :value="f.id">{{ f.code }} - {{ f.name }}</option></select></label></section>
    <template v-if="fincaId">
      <section class="grid">
        <form class="card" @submit.prevent="guardarArea"><h3>{{ areaForm.id ? 'Editar área' : 'Nueva área/departamento/brigada' }}</h3>
          <label>Código <input v-model.trim="areaForm.codigo" required maxlength="30"></label><label>Nombre <input v-model.trim="areaForm.nombre" required maxlength="150"></label>
          <label>Tipo <select v-model="areaForm.tipo"><option value="AREA">Área</option><option value="DEPARTAMENTO">Departamento</option><option value="BRIGADA">Brigada</option></select></label>
          <label>Área superior <select v-model="areaForm.areaPadreId"><option value="">Sin superior</option><option v-for="a in areasActivas" :key="a.id" :value="a.id">{{ a.codigo }} - {{ a.nombre }}</option></select></label>
          <label>Descripción <textarea v-model.trim="areaForm.descripcion" maxlength="500"></textarea></label><label>Vigencia desde <input v-model="areaForm.fechaInicio" type="date"></label><label>hasta <input v-model="areaForm.fechaFin" type="date"></label>
          <div><button>Guardar área</button><button v-if="areaForm.id" type="button" @click="limpiarArea">Cancelar</button></div>
        </form>
        <form class="card" @submit.prevent="guardarPlaza"><h3>{{ plazaForm.id ? 'Editar plaza' : 'Nueva plaza aprobada' }}</h3>
          <label>Código <input v-model.trim="plazaForm.codigo" required maxlength="30"></label><label>Nombre/denominación <input v-model.trim="plazaForm.nombre" maxlength="150"></label>
          <label>Cargo <select v-model="plazaForm.cargoId" required><option value="">Seleccione</option><option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.name }}</option></select></label>
          <label>Área <select v-model="plazaForm.areaId"><option value="">Sin área</option><option v-for="a in areasActivas" :key="a.id" :value="a.id">{{ a.codigo }} - {{ a.nombre }}</option></select></label>
          <label>Grupo/brigada existente <select v-model="plazaForm.grupoId"><option value="">Sin grupo</option><option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option></select></label>
          <label>Vigencia desde <input v-model="plazaForm.fechaInicio" type="date"></label><label>hasta <input v-model="plazaForm.fechaFin" type="date"></label><label>Observaciones <textarea v-model.trim="plazaForm.observaciones" maxlength="500"></textarea></label>
          <div><button>Guardar plaza</button><button v-if="plazaForm.id" type="button" @click="limpiarPlaza">Cancelar</button></div>
        </form>
      </section>
      <section class="card"><h3>Áreas registradas</h3><table><thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Vigencia</th><th></th></tr></thead><tbody><tr v-for="a in areas" :key="a.id"><td>{{ a.codigo }}</td><td>{{ a.nombre }}</td><td>{{ a.tipo }}</td><td>{{ a.activo === false ? 'Inactiva' : 'Activa' }}</td><td><button @click="editarArea(a)">Editar</button><button v-if="a.activo !== false" @click="desactivarArea(a)">Desactivar</button></td></tr></tbody></table></section>
      <section class="card"><h3>Plazas aprobadas</h3><table><thead><tr><th>Código</th><th>Denominación</th><th>Estado</th><th>Trabajador</th><th></th></tr></thead><tbody><tr v-for="p in plazas" :key="p.id"><td>{{ p.codigo }}</td><td>{{ p.nombre || p.cargoId }}</td><td><span :class="p.estado">{{ p.estado }}</span></td><td>{{ p.trabajadorNombre || '—' }}</td><td><button @click="editarPlaza(p)">Editar</button><button v-if="p.trabajadorId" @click="liberar(p)">Liberar</button><button v-if="p.activo !== false && !p.trabajadorId" @click="abrirAsignacion(p)">Asignar</button><button v-if="p.activo !== false" @click="desactivarPlaza(p)">Desactivar</button></td></tr></tbody></table></section>
    </template>
    <div v-if="plazaAsignar" class="modal"><div class="modal-card"><h3>Ocupar plaza {{ plazaAsignar.codigo }}</h3><select v-model="trabajadorId"><option value="">Seleccione trabajador compatible</option><option v-for="t in trabajadoresCompatibles" :key="t.id" :value="t.id">{{ t.nombre }} — {{ t.cargoName }}</option></select><div><button @click="asignar">Confirmar</button><button @click="plazaAsignar = null">Cancelar</button></div></div></div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FincaService from '@/services/FincaService'
import CargoService from '@/services/CargoService'
import GrupoService from '@/services/GrupoService'
import TrabajadorService from '@/services/TrabajadorService'
import EstructuraService from '@/services/EstructuraOrganizativaService'
import type { AreaTrabajo, Plaza } from '@/types/EstructuraOrganizativa'

const fincas = ref<any[]>([]), cargos = ref<any[]>([]), grupos = ref<any[]>([]), trabajadores = ref<any[]>([])
const fincaId = ref(''), areas = ref<AreaTrabajo[]>([]), plazas = ref<Plaza[]>([]), error = ref(''), plazaAsignar = ref<Plaza | null>(null), trabajadorId = ref('')
const nuevaArea = (): AreaTrabajo => ({ fincaId: fincaId.value, codigo: '', nombre: '', tipo: 'AREA', activo: true })
const nuevaPlaza = (): Plaza => ({ fincaId: fincaId.value, codigo: '', cargoId: '', activo: true })
const areaForm = ref<AreaTrabajo>(nuevaArea()), plazaForm = ref<Plaza>(nuevaPlaza())
const areasActivas = computed(() => areas.value.filter(a => a.activo !== false && a.id !== areaForm.value.id))
const trabajadoresCompatibles = computed(() => trabajadores.value.filter(t => t.activo !== false && t.fincaId === fincaId.value && t.cargoId === plazaAsignar.value?.cargoId && !t.plazaId))
const datos = (r: any) => r.data?.content || r.data?.data || r.data || []
async function cargar () { if (!fincaId.value) return; error.value = ''; try { const [a, p, t] = await Promise.all([EstructuraService.listarAreas(fincaId.value), EstructuraService.listarPlazas(fincaId.value), TrabajadorService.buscarTrabajadores({ size: 1000, page: 0 })]); areas.value = a.data; plazas.value = p.data; trabajadores.value = datos(t) } catch (e: any) { error.value = e.response?.data?.message || 'No fue posible cargar la estructura.' } finally { limpiarArea(); limpiarPlaza() } }
async function guardarArea () { try { const data = { ...areaForm.value, fincaId: fincaId.value, areaPadreId: areaForm.value.areaPadreId || undefined }; if (data.id) await EstructuraService.actualizarArea(data.id, data); else await EstructuraService.crearArea(data); await cargar() } catch (e: any) { error.value = e.response?.data?.message || e.message } }
async function guardarPlaza () { try { const data = { ...plazaForm.value, fincaId: fincaId.value, areaId: plazaForm.value.areaId || undefined, grupoId: plazaForm.value.grupoId || undefined }; if (data.id) await EstructuraService.actualizarPlaza(data.id, data); else await EstructuraService.crearPlaza(data); await cargar() } catch (e: any) { error.value = e.response?.data?.message || e.message } }
function editarArea (a: AreaTrabajo) { areaForm.value = { ...a } }
function editarPlaza (p: Plaza) { plazaForm.value = { ...p } }
function limpiarArea () { areaForm.value = nuevaArea() }
function limpiarPlaza () { plazaForm.value = nuevaPlaza() }
async function desactivarArea (a: AreaTrabajo) { if (a.id && confirm(`¿Desactivar ${a.nombre}?`)) { await EstructuraService.desactivarArea(a.id); await cargar() } }
async function desactivarPlaza (p: Plaza) { if (p.id && confirm(`¿Desactivar plaza ${p.codigo}?`)) { try { await EstructuraService.desactivarPlaza(p.id); await cargar() } catch (e: any) { error.value = e.response?.data?.message || e.message } } }
function abrirAsignacion (p: Plaza) { plazaAsignar.value = p; trabajadorId.value = '' }
async function asignar () { if (!plazaAsignar.value?.id || !trabajadorId.value) return; try { await EstructuraService.asignarTrabajador(plazaAsignar.value.id, trabajadorId.value); plazaAsignar.value = null; await cargar() } catch (e: any) { error.value = e.response?.data?.message || e.message } }
async function liberar (p: Plaza) { if (p.id && confirm(`¿Liberar plaza ${p.codigo}?`)) { await EstructuraService.desasignarTrabajador(p.id); await cargar() } }
onMounted(async () => { const [f, c, g] = await Promise.all([FincaService.getAll(), CargoService.getAll(), GrupoService.getAll()]); fincas.value = datos(f); cargos.value = datos(c); grupos.value = datos(g) })
</script>

<style scoped>
.estructura{max-width:1300px;margin:auto;padding:1.25rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:1rem}.card,.selector{background:#fff;border:1px solid #dbe2ea;border-radius:8px;padding:1rem;margin:1rem 0}.card label{display:block;margin:.45rem 0;font-weight:600}.card input,.card select,.card textarea,.selector select{display:block;width:100%;box-sizing:border-box;padding:.45rem;margin-top:.2rem}.card button{margin:.35rem .35rem .1rem 0;padding:.45rem .7rem}.card table{width:100%;border-collapse:collapse}.card th,.card td{padding:.55rem;border-bottom:1px solid #e5e7eb;text-align:left}.VACANTE{color:#a16207}.OCUPADA{color:#15803d}.INACTIVA{color:#64748b}.error{background:#fee2e2;color:#991b1b;padding:.75rem}.modal{position:fixed;inset:0;background:#0007;display:grid;place-items:center}.modal-card{background:#fff;padding:1rem;border-radius:8px;min-width:320px}.modal-card select{display:block;width:100%;margin:1rem 0;padding:.5rem}
</style>
