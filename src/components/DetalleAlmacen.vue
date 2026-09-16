<!-- src/components/DetalleAlmacen.vue -->

<template>
  <div class="detalle-almacen">
    <div class="detalle-header">
      <div class="header-info">
        <h3>{{ almacen?.nombre || 'Cargando...' }}</h3>
        <span class="inventario-badge">{{ almacen?.inventario }}</span>
      </div>
      <div class="header-actions">
        <button @click="editarAlmacen" class="btn-editar">Editar</button>
        <button @click="cerrar" class="btn-cerrar">&times;</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <span>Cargando detalles...</span>
    </div>

    <div v-else class="detalle-content">
      <div class="section">
        <div class="section-header">
          <h4>Productos en Almacen</h4>
          <div class="section-actions">
            <button @click="abrirModalSalidaMultiple" class="btn-salida-multiple" :disabled="!almacen?.productos?.some(p => p.stock > 0)">
              ↑ Salida múltiple
            </button>
            <button @click="abrirModalAgregar" class="btn-agregar">
              + Agregar Producto
            </button>
          </div>
        </div>

        <div v-if="!almacen?.productos || almacen.productos.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>No hay productos en este almacen</p>
          <button @click="abrirModalAgregar" class="btn-agregar-empty">
            Agregar primer producto
          </button>
        </div>

        <table v-else class="productos-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Finca</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="producto in almacen.productos" :key="producto.id">
              <td>
                <strong>{{ producto.productoName }}</strong>
                <span class="codigo">{{ producto.productoCode }}</span>
              </td>
              <td>{{ producto.fincaName }}</td>
              <td>
                <span :class="['stock-badge', getStockClass(producto.stock)]">
                  {{ producto.stock }}
                </span>
              </td>
              <td class="precio">${{ producto.productoPrice?.toFixed(2) || '0.00' }}</td>
              <td class="acciones-cell">
                <button @click="abrirModalEntrada(producto)" class="btn-entrada" title="Entrada">
                  ↓ Entrada
                </button>
                <button @click="abrirModalSalida(producto)" class="btn-salida" title="Salida">
                  ↑ Salida
                </button>
                <button @click="abrirModalTransferencia(producto)" class="btn-transferir" title="Transferir">
                  ⇄ Transferir
                </button>
                <button @click="confirmarRemover(producto)" class="btn-remover" title="Remover">
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="resumen" v-if="almacen?.productos && almacen.productos.length > 0">
          <div class="resumen-item">
            <span class="label">Total Productos:</span>
            <span class="value">{{ almacen.productos.length }}</span>
          </div>
          <div class="resumen-item">
            <span class="label">Stock Total:</span>
            <span class="value">{{ totalStock }}</span>
          </div>
        </div>
      </div>

      <!-- Asientos Contables Section -->
      <div class="section asientos-section">
        <div class="section-header clickable" @click="toggleAsientos">
          <h4>
            <span class="toggle-icon">{{ mostrarAsientos ? '▼' : '▶' }}</span>
            Asientos Contables Generados
          </h4>
          <span class="badge-count" v-if="asientosContables.length > 0">
            {{ asientosContables.length }}
          </span>
        </div>

        <div v-if="mostrarAsientos" class="asientos-content">
          <div v-if="cargandoAsientos" class="loading-small">
            <div class="spinner-small"></div>
            Cargando asientos...
          </div>

          <div v-else-if="asientosContables.length === 0" class="empty-state-small">
            <p>No hay asientos contables para este almacen</p>
          </div>

          <div v-else class="asientos-list">
            <div v-for="asiento in asientosContables" :key="asiento.id" class="asiento-card">
              <div class="asiento-header">
                <span class="asiento-numero">{{ asiento.numero }}</span>
                <span class="asiento-fecha">{{ formatFecha(asiento.fecha) }}</span>
              </div>
              <div class="asiento-descripcion">{{ asiento.descripcion }}</div>
              <div class="asiento-lineas">
                <div v-for="(linea, idx) in asiento.lineas" :key="idx" class="linea-asiento">
                  <span class="linea-cuenta">{{ linea.codigoCuenta }}</span>
                  <span class="linea-concepto">{{ linea.concepto }}</span>
                  <span class="linea-debe" v-if="linea.debe && linea.debe > 0">D: {{ formatMonto(linea.debe) }}</span>
                  <span class="linea-haber" v-if="linea.haber && linea.haber > 0">H: {{ formatMonto(linea.haber) }}</span>
                </div>
              </div>
              <div class="asiento-totales">
                <span class="total-debe">Total Debe: {{ formatMonto(asiento.totalDebe) }}</span>
                <span class="total-haber">Total Haber: {{ formatMonto(asiento.totalHaber) }}</span>
                <span class="cuadrado-badge" :class="asiento.totalDebe === asiento.totalHaber ? 'ok' : 'error'">
                  {{ asiento.totalDebe === asiento.totalHaber ? '✓ Cuadrado' : '✗ Descuadrado' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agregar Producto -->
    <div v-if="mostrarModalAgregar" class="modal-overlay" @click.self="mostrarModalAgregar = false">
      <div class="modal-agregar">
        <div class="modal-header">
          <h4>Agregar Producto al Almacen</h4>
          <button @click="mostrarModalAgregar = false" class="btn-cerrar-modal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Filtrar productos</label>
            <input
              v-model="busquedaProducto"
              type="text"
              placeholder="Filtrar por nombre o código..."
              class="search-input"
            />
          </div>

          <div v-if="cargandoProductos" class="loading-small">
            Cargando productos...
          </div>

          <template v-else-if="productosDisponibles.length > 0">
            <div class="seleccion-header">
              <label class="checkbox-all">
                <input
                  type="checkbox"
                  :checked="todosSeleccionados"
                  @change="toggleSeleccionTodos"
                />
                <span>Seleccionar todos ({{ productosFiltradosComputed.length }})</span>
              </label>
              <span class="seleccionados-count" v-if="productosSeleccionados.size > 0">
                {{ productosSeleccionados.size }} seleccionado(s)
              </span>
            </div>

            <div class="productos-disponibles">
              <label
                v-for="fp in productosFiltradosComputed"
                :key="fp.id"
                class="producto-item"
                :class="{ 'selected': productosSeleccionados.has(fp.id) }"
              >
                <input
                  type="checkbox"
                  :checked="productosSeleccionados.has(fp.id)"
                  @change="toggleSeleccion(fp.id)"
                />
                <div class="producto-info">
                  <strong>{{ fp.productoName }}</strong>
                  <span class="codigo">{{ fp.productoCode }}</span>
                </div>
                <div class="producto-meta">
                  <span class="stock">Stock: {{ fp.stock }}</span>
                </div>
              </label>
            </div>
          </template>

          <div v-else class="no-resultados">
            No hay productos disponibles para agregar
          </div>
        </div>

        <div class="modal-footer">
          <button @click="mostrarModalAgregar = false" class="btn-cancelar">Cancelar</button>
          <button
            @click="agregarProductos"
            class="btn-confirmar"
            :disabled="productosSeleccionados.size === 0 || agregandoProducto"
          >
            {{ agregandoProducto ? 'Agregando...' : `Agregar (${productosSeleccionados.size})` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Entrada -->
    <div v-if="mostrarModalEntrada" class="modal-overlay" @click.self="cerrarModalEntrada">
      <div class="modal-operacion">
        <div class="modal-header modal-header-entrada">
          <h4>↓ Entrada de Stock</h4>
          <button @click="cerrarModalEntrada" class="btn-cerrar-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="producto-seleccionado">
            <strong>{{ productoOperacion?.productoName }}</strong>
            <span class="stock-actual">Stock actual: {{ productoOperacion?.stock }}</span>
          </div>

          <div class="form-group">
            <label>Tipo de Entrada</label>
            <select v-model="entradaForm.tipo" class="form-control">
              <option value="ENTRADA_PRODUCCION">Producción</option>
              <option value="ENTRADA_FACTURA">Factura</option>
              <option value="ENTRADA_CONDUCE">Conduce</option>
            </select>
          </div>

          <div class="form-group">
            <label>Cantidad</label>
            <input v-model.number="entradaForm.cantidad" type="number" min="0.0001" step="0.0001" class="form-control" placeholder="Cantidad a ingresar" />
          </div>

          <div v-if="entradaForm.tipo === 'ENTRADA_FACTURA'" class="form-group">
            <label>Número de Factura</label>
            <input v-model="entradaForm.numeroFactura" type="text" class="form-control" placeholder="Ej: FAC-001" />
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="entradaForm.descripcion" class="form-control" rows="2" placeholder="Descripción opcional..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalEntrada" class="btn-cancelar">Cancelar</button>
          <button @click="ejecutarEntrada" class="btn-confirmar btn-entrada-confirm" :disabled="!entradaForm.cantidad || procesando">
            {{ procesando ? 'Procesando...' : 'Registrar Entrada' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Salida Wizard -->
    <div v-if="mostrarModalSalida" class="modal-overlay" @click.self="cerrarModalSalida">
      <div class="modal-operacion modal-salida-wizard">
        <div class="modal-header modal-header-salida">
          <h4>↑ Registrar Salida</h4>
          <button @click="cerrarModalSalida" class="btn-cerrar-modal">&times;</button>
        </div>

        <!-- Wizard Steps Indicator -->
        <div class="wizard-steps">
          <div class="step" :class="{ active: salidaStep === 1, completed: salidaStep > 1 }">
            <span class="step-number">1</span>
            <span class="step-label">Destino</span>
          </div>
          <div class="step-line" :class="{ completed: salidaStep > 1 }"></div>
          <div class="step" :class="{ active: salidaStep === 2, completed: salidaStep > 2 }">
            <span class="step-number">2</span>
            <span class="step-label">Items</span>
          </div>
          <div class="step-line" :class="{ completed: salidaStep > 2 }"></div>
          <div class="step" :class="{ active: salidaStep === 3 }">
            <span class="step-number">3</span>
            <span class="step-label">Confirmar</span>
          </div>
        </div>

        <div class="modal-body">
          <!-- Producto Info (siempre visible) -->
          <div class="producto-seleccionado">
            <strong>{{ productoOperacion?.productoName }}</strong>
            <span class="stock-actual">Stock: {{ productoOperacion?.stock }}</span>
          </div>

          <!-- PASO 1: Seleccionar Destino -->
          <div v-if="salidaStep === 1" class="wizard-content">
            <h5 class="step-title">¿A quién va dirigida esta salida?</h5>

            <div class="destino-options">
              <label
                v-for="opt in destinoOptions"
                :key="opt.value"
                class="destino-option"
                :class="{ selected: salidaForm.destino === opt.value }"
              >
                <input type="radio" v-model="salidaForm.destino" :value="opt.value" />
                <div class="destino-content">
                  <span class="destino-icon">{{ opt.icon }}</span>
                  <span class="destino-label">{{ opt.label }}</span>
                  <span class="destino-tipo" :class="opt.tipo === 'FACTURA' ? 'tipo-factura' : 'tipo-vale'">
                    {{ opt.tipo }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <!-- PASO 2: Agregar Items -->
          <div v-if="salidaStep === 2" class="wizard-content">
            <h5 class="step-title">
              {{ salidaForm.destino === 'TRABAJADORES' ? 'Seleccionar trabajadores y cantidades' : 'Definir cantidades' }}
            </h5>

            <!-- Info de destino seleccionado -->
            <div class="destino-selected-info">
              <span>Destino: <strong>{{ getDestinoLabel(salidaForm.destino) }}</strong></span>
              <span class="tipo-badge" :class="tipoGenerado === 'FACTURA' ? 'tipo-factura' : 'tipo-vale'">
                {{ tipoGenerado }}
              </span>
            </div>

            <!-- Stock Info -->
            <div v-if="productoOperacion" class="stock-info-salida">
              <span>Stock disponible: <strong>{{ productoOperacion.stock }}</strong></span>
              <span v-if="cantidadTotalSalida > 0" :class="{ 'error': cantidadTotalSalida > productoOperacion.stock }">
                | A sacar: <strong>{{ cantidadTotalSalida }}</strong>
              </span>
            </div>

            <!-- Items -->
            <div class="items-section">
              <div class="items-header">
                <h5>Items</h5>
                <button type="button" class="btn-agregar-item" @click="agregarItemSalida">+ Agregar</button>
              </div>

              <div v-for="(item, index) in salidaForm.items" :key="index" class="item-row">
                <div class="form-group trabajador-group" v-if="salidaForm.destino === 'TRABAJADORES'">
                  <label>Trabajador *</label>
                  <select v-model="item.trabajadorId" class="form-control" required>
                    <option value="">Seleccione...</option>
                    <option v-for="t in trabajadores" :key="t.id" :value="t.id">
                      {{ t.nombre }}
                    </option>
                  </select>
                </div>
                <div class="form-group cantidad-group">
                  <label>Cantidad *</label>
                  <input v-model.number="item.cantidad" type="number" min="0.0001" step="0.0001" class="form-control" required />
                </div>
                <div class="form-group pagado-group" v-if="salidaForm.destino === 'TRABAJADORES'">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="item.pagado" />
                    <span>Pagado</span>
                  </label>
                </div>
                <button
                  type="button"
                  class="btn-eliminar-item"
                  @click="eliminarItemSalida(index)"
                  v-if="salidaForm.items.length > 1"
                  title="Eliminar"
                >
                  ×
                </button>
              </div>

              <div class="total-items">
                <strong>Total: {{ cantidadTotalSalida }} unidades</strong>
              </div>
            </div>
          </div>

          <!-- PASO 3: Confirmar -->
          <div v-if="salidaStep === 3" class="wizard-content">
            <h5 class="step-title">Confirmar Salida</h5>

            <div class="resumen-salida">
              <div class="resumen-row">
                <span class="resumen-label">Producto:</span>
                <span class="resumen-value">{{ productoOperacion?.productoName }}</span>
              </div>
              <div class="resumen-row">
                <span class="resumen-label">Destino:</span>
                <span class="resumen-value">{{ getDestinoLabel(salidaForm.destino) }}</span>
              </div>
              <div class="resumen-row">
                <span class="resumen-label">Documento:</span>
                <span class="resumen-value tipo-badge" :class="tipoGenerado === 'FACTURA' ? 'tipo-factura' : 'tipo-vale'">
                  {{ tipoGenerado }}
                </span>
              </div>
              <div class="resumen-row">
                <span class="resumen-label">Cantidad Total:</span>
                <span class="resumen-value cantidad-total">{{ cantidadTotalSalida }} unidades</span>
              </div>

              <!-- Detalle de items -->
              <div class="resumen-items" v-if="salidaForm.destino === 'TRABAJADORES'">
                <h6>Detalle:</h6>
                <div v-for="(item, index) in salidaForm.items" :key="index" class="resumen-item">
                  <span class="item-trabajador">{{ getTrabajadorNombre(item.trabajadorId) }}</span>
                  <span class="item-cantidad">{{ item.cantidad }} uds</span>
                  <span class="item-pagado" :class="item.pagado ? 'pagado' : 'deuda'">
                    {{ item.pagado ? '✓ Pagado' : '⏳ Deuda' }}
                  </span>
                </div>
              </div>

              <!-- Observaciones -->
              <div class="form-group observaciones-group">
                <label>Observaciones (opcional)</label>
                <textarea v-model="salidaForm.observaciones" class="form-control" rows="2" placeholder="Observaciones..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con navegación -->
        <div class="modal-footer wizard-footer">
          <button v-if="salidaStep > 1" @click="salidaStep--" class="btn-anterior">
            ← Anterior
          </button>
          <button v-else @click="cerrarModalSalida" class="btn-cancelar">
            Cancelar
          </button>

          <button
            v-if="salidaStep < 3"
            @click="siguientePasoSalida"
            class="btn-siguiente"
            :disabled="!puedeAvanzarPaso"
          >
            Siguiente →
          </button>
          <button
            v-else
            @click="ejecutarSalida"
            class="btn-confirmar btn-salida-confirm"
            :disabled="!isSalidaFormValid || procesando"
          >
            {{ procesando ? 'Procesando...' : '✓ Confirmar Salida' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Salida múltiple -->
    <div v-if="mostrarModalSalidaMultiple" class="modal-overlay" @click.self="cerrarModalSalidaMultiple">
      <div class="modal-operacion modal-salida-multiple">
        <div class="modal-header modal-header-salida">
          <h4>↑ Registrar salida múltiple</h4>
          <button @click="cerrarModalSalidaMultiple" class="btn-cerrar-modal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="multiple-help">
            Seleccione los productos y cantidades para un mismo destino. La operación se confirma completa o no se registra ninguna línea.
          </p>

          <div class="form-group">
            <label>Destino *</label>
            <select v-model="salidaMultipleForm.destino" class="form-control">
              <option v-for="opt in destinoOptionsMultiple" :key="opt.value" :value="opt.value">
                {{ opt.icon }} {{ opt.label }} ({{ opt.tipo }})
              </option>
            </select>
            <small v-if="salidaMultipleForm.destino === 'TRABAJADORES'">
              Para cada producto seleccione los trabajadores compradores, su cantidad y si pagaron. La suma debe coincidir con la salida del producto.
            </small>
          </div>

          <div class="multiple-productos">
            <div class="multiple-productos-header">
              <span>Producto</span>
              <span>Disponible</span>
              <span>Cantidad a sacar</span>
            </div>
            <template v-for="linea in salidaMultipleForm.lineas" :key="linea.almacenFincaProductoId">
              <label
                class="multiple-producto-row"
                :class="{ selected: linea.seleccionada }"
              >
                <input :checked="linea.seleccionada" type="checkbox" @change="alternarLineaSalidaMultiple(linea, $event)" />
                <span class="multiple-producto-nombre">
                  <strong>{{ linea.productoName }}</strong>
                  <small>{{ linea.unidadMedida || 'Unidad' }}</small>
                </span>
                <span>{{ linea.stock }}</span>
                <span class="multiple-cantidad">
                  <template v-if="salidaMultipleForm.destino === 'TRABAJADORES'">
                    <strong>{{ cantidadAsignadaLinea(linea) }}</strong>
                    <small>Asignada a compradores</small>
                  </template>
                  <template v-else>
                    <input
                      v-model.number="linea.cantidad"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      :max="linea.stock"
                      :disabled="!linea.seleccionada"
                      class="form-control"
                    />
                    <small v-if="linea.seleccionada && (!Number.isFinite(linea.cantidad) || linea.cantidad <= 0 || linea.cantidad > linea.stock)" class="error-text">
                      Entre 0.0001 y {{ linea.stock }}
                    </small>
                  </template>
                </span>
              </label>
              <div v-if="salidaMultipleForm.destino === 'TRABAJADORES' && linea.seleccionada" class="compradores-producto">
                <div class="compradores-header">
                  <strong>Compradores de {{ linea.productoName }}</strong>
                  <button type="button" class="btn-agregar-comprador" @click="agregarCompradorLinea(linea)">+ Agregar comprador</button>
                </div>
                <div v-for="(item, index) in linea.items" :key="index" class="comprador-linea">
                  <select v-model="item.trabajadorId" class="form-control">
                    <option value="">Seleccione trabajador</option>
                    <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">{{ trabajador.nombre }}</option>
                  </select>
                  <input v-model.number="item.cantidad" type="number" min="0.0001" step="0.0001" :max="linea.stock" class="form-control" placeholder="Cantidad" />
                  <label class="pagado-check"><input v-model="item.pagado" type="checkbox" /> Pagó</label>
                  <button v-if="linea.items.length > 1" type="button" class="btn-eliminar-comprador" @click="eliminarCompradorLinea(linea, index)">&times;</button>
                </div>
                <small v-if="!lineaValidaParaTrabajadores(linea)" class="error-text">
                  Seleccione cada trabajador una sola vez y asigne entre 1 y {{ linea.stock }} unidades en total.
                </small>
              </div>
            </template>
          </div>

          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="salidaMultipleForm.observaciones" class="form-control" rows="2" placeholder="Observaciones opcionales..."></textarea>
          </div>

          <div class="multiple-summary">
            {{ lineasSalidaMultipleSeleccionadas.length }} producto(s) seleccionado(s),
            {{ cantidadTotalSalidaMultiple }} unidad(es) en total.
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalSalidaMultiple" class="btn-cancelar">Cancelar</button>
          <button @click="ejecutarSalidaMultiple" class="btn-confirmar btn-salida-confirm" :disabled="!esSalidaMultipleValida || procesando">
            {{ procesando ? 'Procesando...' : 'Confirmar salida múltiple' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Transferencia -->
    <div v-if="mostrarModalTransferencia" class="modal-overlay" @click.self="cerrarModalTransferencia">
      <div class="modal-operacion">
        <div class="modal-header modal-header-transferencia">
          <h4>⇄ Transferir a otro Almacén</h4>
          <button @click="cerrarModalTransferencia" class="btn-cerrar-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="producto-seleccionado">
            <strong>{{ productoOperacion?.productoName }}</strong>
            <span class="stock-actual">Stock disponible: {{ productoOperacion?.stock }}</span>
          </div>

          <div class="form-group">
            <label>Almacén Destino</label>
            <select v-model="transferenciaForm.destinoAlmacenId" class="form-control">
              <option value="">Seleccionar almacén...</option>
              <option v-for="dest in almacenesDestino" :key="dest.almacenId" :value="dest.almacenId">
                {{ dest.almacenNombre }} (Stock: {{ dest.stock || 0 }})
              </option>
            </select>
            <small v-if="cargandoDestinos" class="loading-text">Cargando almacenes...</small>
          </div>

          <div class="form-group">
            <label>Cantidad a Transferir</label>
            <input v-model.number="transferenciaForm.cantidad" type="number" min="0.0001" step="0.0001" :max="productoOperacion?.stock" class="form-control" placeholder="Cantidad" />
            <small v-if="transferenciaForm.cantidad > (productoOperacion?.stock || 0)" class="error-text">
              No puede exceder el stock disponible
            </small>
          </div>

          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="transferenciaForm.observaciones" class="form-control" rows="2" placeholder="Observaciones opcionales..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalTransferencia" class="btn-cancelar">Cancelar</button>
          <button @click="ejecutarTransferencia" class="btn-confirmar btn-transferencia-confirm" :disabled="!transferenciaForm.destinoAlmacenId || !transferenciaForm.cantidad || transferenciaForm.cantidad > (productoOperacion?.stock || 0) || procesando">
            {{ procesando ? 'Procesando...' : 'Transferir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import AlmacenService from '@/services/AlmacenService'
import FincaProductoService from '@/services/FincaProductoService'
import SalidaService from '@/services/SalidaService'
import TrabajadorService from '@/services/TrabajadorService'
import { AsientoContableService } from '@/services/ContabilidadService'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Almacen, AlmacenFincaProducto, TipoMovimientoStock } from '@/types/Almacen'
import type { FincaProducto } from '@/types/FincaProducto'
import type { DestinoSalida, ItemSalida, CreateSalidaRequest } from '@/types/Salida'
import type { AsientoContable } from '@/types/Contabilidad'
import { DESTINO_TIPO_MAP } from '@/types/Salida'

interface Trabajador {
  id: string
  nombre: string
}

const props = defineProps<{
  almacenId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', almacen: Almacen): void
  (e: 'updated'): void
}>()

const almacen = ref<Almacen | null>(null)
const isLoading = ref(true)

// Modal agregar producto
const mostrarModalAgregar = ref(false)
const busquedaProducto = ref('')
const productosDisponibles = ref<FincaProducto[]>([])
const productosFiltrados = ref<FincaProducto[]>([])
const productosSeleccionados = ref<Set<string>>(new Set())
const cargandoProductos = ref(false)
const agregandoProducto = ref(false)

// Modales de operaciones
const mostrarModalEntrada = ref(false)
const mostrarModalSalida = ref(false)
const mostrarModalSalidaMultiple = ref(false)
const mostrarModalTransferencia = ref(false)
const productoOperacion = ref<AlmacenFincaProducto | null>(null)
const procesando = ref(false)
const almacenesDestino = ref<AlmacenFincaProducto[]>([])
const cargandoDestinos = ref(false)

// Estado para salida completa (facturas/vales)
const trabajadores = ref<Trabajador[]>([])
const salidaStep = ref(1)

// Estado para asientos contables
const asientosContables = ref<AsientoContable[]>([])
const cargandoAsientos = ref(false)
const mostrarAsientos = ref(false)

// Opciones de destino con iconos
const destinoOptions = [
  { value: 'TRABAJADORES', label: 'Trabajadores', icon: '👷', tipo: 'VALE' },
  { value: 'COMEDOR', label: 'Comedor', icon: '🍽️', tipo: 'VALE' },
  { value: 'VENTA_ESTADO', label: 'Venta Estado', icon: '🏛️', tipo: 'FACTURA' },
  { value: 'POBLACION', label: 'Población', icon: '🏘️', tipo: 'FACTURA' },
  { value: 'INSUMO', label: 'Insumo', icon: '🔧', tipo: 'VALE' },
  { value: 'OTROS', label: 'Otros', icon: '📦', tipo: 'VALE' }
]

const getDestinoLabel = (destino: DestinoSalida): string => {
  const opt = destinoOptions.find(o => o.value === destino)
  return opt ? opt.label : destino
}

const getTrabajadorNombre = (id: string): string => {
  const t = trabajadores.value.find(tr => tr.id === id)
  return t ? t.nombre : 'Sin asignar'
}

const puedeAvanzarPaso = computed(() => {
  if (salidaStep.value === 1) {
    return !!salidaForm.destino
  }
  if (salidaStep.value === 2) {
    const stock = productoOperacion.value?.stock || 0
    const itemsValidos = salidaForm.items.every(item => {
      if (salidaForm.destino === 'TRABAJADORES') {
        return item.trabajadorId && item.cantidad > 0
      }
      return item.cantidad > 0
    })
    return itemsValidos && cantidadTotalSalida.value > 0 && cantidadTotalSalida.value <= stock
  }
  return true
})

const siguientePasoSalida = () => {
  if (puedeAvanzarPaso.value && salidaStep.value < 3) {
    salidaStep.value++
  }
}

// Formularios
const entradaForm = reactive({
  tipo: 'ENTRADA_PRODUCCION' as TipoMovimientoStock,
  cantidad: 0,
  numeroFactura: '',
  descripcion: ''
})

const salidaForm = reactive({
  destino: 'TRABAJADORES' as DestinoSalida,
  observaciones: '',
  items: [{ trabajadorId: '', cantidad: 1, pagado: false }] as ItemSalida[]
})

interface LineaSalidaMultipleForm {
  almacenFincaProductoId: string
  productoName: string
  unidadMedida?: string
  stock: number
  seleccionada: boolean
  cantidad: number
  items: ItemSalida[]
}

const salidaMultipleForm = reactive({
  destino: 'COMEDOR' as DestinoSalida,
  observaciones: '',
  lineas: [] as LineaSalidaMultipleForm[]
})

// RN-09: Tipo automático según destino
const tipoGenerado = computed(() => DESTINO_TIPO_MAP[salidaForm.destino])

const cantidadTotalSalida = computed(() => {
  return salidaForm.items.reduce((sum, item) => sum + (item.cantidad || 0), 0)
})

const isSalidaFormValid = computed(() => {
  const stock = productoOperacion.value?.stock || 0
  return salidaForm.items.length > 0 &&
    cantidadTotalSalida.value > 0 &&
    cantidadTotalSalida.value <= stock
})

const destinoOptionsMultiple = computed(() => destinoOptions)

const lineasSalidaMultipleSeleccionadas = computed(() =>
  salidaMultipleForm.lineas.filter(linea => linea.seleccionada)
)

const cantidadAsignadaLinea = (linea: LineaSalidaMultipleForm): number =>
  linea.items.reduce((total, item) => total + (Number.isFinite(item.cantidad) ? item.cantidad : 0), 0)

const cantidadLineaSalidaMultiple = (linea: LineaSalidaMultipleForm): number =>
  salidaMultipleForm.destino === 'TRABAJADORES' ? cantidadAsignadaLinea(linea) : linea.cantidad

const lineaValidaParaTrabajadores = (linea: LineaSalidaMultipleForm): boolean => {
  if (linea.items.length === 0) return false
  const trabajadoresSeleccionados = new Set<string>()
  const itemsValidos = linea.items.every(item => {
    const trabajadorId = item.trabajadorId || ''
    if (!trabajadorId || !Number.isFinite(item.cantidad) || item.cantidad <= 0 || trabajadoresSeleccionados.has(trabajadorId)) {
      return false
    }
    trabajadoresSeleccionados.add(trabajadorId)
    return true
  })
  const cantidadAsignada = cantidadAsignadaLinea(linea)
  return itemsValidos && cantidadAsignada > 0 && cantidadAsignada <= linea.stock
}

const cantidadTotalSalidaMultiple = computed(() =>
  lineasSalidaMultipleSeleccionadas.value.reduce((total, linea) => total + cantidadLineaSalidaMultiple(linea), 0)
)

const esSalidaMultipleValida = computed(() =>
  lineasSalidaMultipleSeleccionadas.value.length > 0 &&
  lineasSalidaMultipleSeleccionadas.value.every(linea =>
    salidaMultipleForm.destino === 'TRABAJADORES'
      ? lineaValidaParaTrabajadores(linea)
      : Number.isFinite(linea.cantidad) && linea.cantidad > 0 && linea.cantidad <= linea.stock
  )
)

const transferenciaForm = reactive({
  destinoAlmacenId: '',
  cantidad: 0,
  observaciones: ''
})

const totalStock = computed(() => {
  if (!almacen.value?.productos) return 0
  return almacen.value.productos.reduce((sum, p) => sum + (p.stock || 0), 0)
})

// Computed para filtrar productos por búsqueda
const productosFiltradosComputed = computed(() => {
  if (!busquedaProducto.value.trim()) {
    return productosFiltrados.value
  }
  const termino = busquedaProducto.value.toLowerCase()
  return productosFiltrados.value.filter(p =>
    p.productoName?.toLowerCase().includes(termino) ||
    p.productoCode?.toLowerCase().includes(termino)
  )
})

// Computed para verificar si todos están seleccionados
const todosSeleccionados = computed(() => {
  if (productosFiltradosComputed.value.length === 0) return false
  return productosFiltradosComputed.value.every(p => productosSeleccionados.value.has(p.id))
})

const cargarAlmacen = async () => {
  isLoading.value = true
  try {
    const response = await AlmacenService.obtenerAlmacenPorId(props.almacenId)
    almacen.value = response.data
  } catch (error) {
    console.error('Error al cargar almacen:', error)
    notify.error('Error', 'No se pudo cargar el almacen')
  } finally {
    isLoading.value = false
  }
}

const cargarAsientosContables = async () => {
  if (!props.almacenId) return
  cargandoAsientos.value = true
  try {
    const asientos = await AsientoContableService.getByAlmacenId(props.almacenId)
    asientosContables.value = asientos.slice(0, 10) // Show last 10
  } catch (error) {
    console.error('Error al cargar asientos contables:', error)
    asientosContables.value = []
  } finally {
    cargandoAsientos.value = false
  }
}

const toggleAsientos = async () => {
  mostrarAsientos.value = !mostrarAsientos.value
  if (mostrarAsientos.value && asientosContables.value.length === 0) {
    await cargarAsientosContables()
  }
}

const formatFecha = (fecha: string | Date): string => {
  if (!fecha) return '-'
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatMonto = (monto: number | string | undefined): string => {
  if (monto === undefined || monto === null) return '$0.00'
  const num = typeof monto === 'string' ? parseFloat(monto) : monto
  return '$' + num.toFixed(2)
}

const getStockClass = (stock: number): string => {
  if (stock === 0) return 'stock-cero'
  if (stock <= 5) return 'stock-bajo'
  if (stock <= 15) return 'stock-medio'
  return 'stock-alto'
}

const editarAlmacen = () => {
  if (almacen.value) {
    emit('edit', almacen.value)
  }
}

const cerrar = () => {
  emit('close')
}

// Cargar todos los productos de la finca al abrir el modal
const cargarProductosDisponibles = async () => {
  if (!almacen.value?.fincaId) {
    notify.error('Error', 'No se pudo determinar la finca del almacén')
    return
  }

  cargandoProductos.value = true
  try {
    const response = await FincaProductoService.obtenerProductosDeFinca(almacen.value.fincaId)

    const data = response.data as Record<string, unknown>
    let items: FincaProducto[] = []

    // FincaProductoListResponse tiene propiedad 'items'
    if (data.items && Array.isArray(data.items)) {
      items = data.items as FincaProducto[]
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data as FincaProducto[]
    } else if (Array.isArray(response.data)) {
      items = response.data as FincaProducto[]
    }

    // Filtrar los que ya están en el almacén
    const idsEnAlmacen = new Set(almacen.value?.productos?.map(p => p.id) || [])
    productosDisponibles.value = items.filter(p => !idsEnAlmacen.has(p.id))
    productosFiltrados.value = productosDisponibles.value
  } catch (error) {
    console.error('Error al cargar productos:', error)
    notify.error('Error', 'No se pudieron cargar los productos disponibles')
  } finally {
    cargandoProductos.value = false
  }
}

// Abrir modal y cargar productos
const abrirModalAgregar = async () => {
  mostrarModalAgregar.value = true
  productosSeleccionados.value = new Set()
  busquedaProducto.value = ''
  await cargarProductosDisponibles()
}

// Toggle selección de un producto
const toggleSeleccion = (productoId: string) => {
  const nuevaSeleccion = new Set(productosSeleccionados.value)
  if (nuevaSeleccion.has(productoId)) {
    nuevaSeleccion.delete(productoId)
  } else {
    nuevaSeleccion.add(productoId)
  }
  productosSeleccionados.value = nuevaSeleccion
}

// Seleccionar o deseleccionar todos
const toggleSeleccionTodos = () => {
  if (todosSeleccionados.value) {
    // Deseleccionar todos los filtrados
    const nuevaSeleccion = new Set(productosSeleccionados.value)
    productosFiltradosComputed.value.forEach(p => nuevaSeleccion.delete(p.id))
    productosSeleccionados.value = nuevaSeleccion
  } else {
    // Seleccionar todos los filtrados
    const nuevaSeleccion = new Set(productosSeleccionados.value)
    productosFiltradosComputed.value.forEach(p => nuevaSeleccion.add(p.id))
    productosSeleccionados.value = nuevaSeleccion
  }
}

// Agregar productos seleccionados
const agregarProductos = async () => {
  if (productosSeleccionados.value.size === 0 || !almacen.value?.id) return

  agregandoProducto.value = true
  let exitosos = 0
  let errores = 0

  try {
    for (const fincaProductoId of productosSeleccionados.value) {
      try {
        await AlmacenService.agregarProducto({
          almacenId: almacen.value.id,
          fincaProductoId
        })
        exitosos++
      } catch {
        errores++
      }
    }

    if (exitosos > 0) {
      notify.success('Productos agregados', `Se agregaron ${exitosos} producto(s) al almacén`)
    }
    if (errores > 0) {
      notify.error('Errores', `No se pudieron agregar ${errores} producto(s)`)
    }

    mostrarModalAgregar.value = false
    productosSeleccionados.value = new Set()
    busquedaProducto.value = ''
    productosDisponibles.value = []
    await cargarAlmacen()
    emit('updated')
  } catch (error) {
    console.error('Error al agregar productos:', error)
    notify.error('Error', 'No se pudieron agregar los productos')
  } finally {
    agregandoProducto.value = false
  }
}

const confirmarRemover = async (producto: AlmacenFincaProducto) => {
  const confirmed = await confirmDialog.delete(
    producto.productoName,
    'El producto sera removido del almacen pero no eliminado del sistema.'
  )

  if (confirmed && almacen.value?.id) {
    try {
      await AlmacenService.removerProducto(almacen.value.id, producto.id)
      notify.success('Producto removido', 'El producto fue removido del almacen')
      await cargarAlmacen()
      emit('updated')
    } catch (error) {
      console.error('Error al remover producto:', error)
      notify.error('Error', 'No se pudo remover el producto')
    }
  }
}

// ==================== ENTRADA ====================
const abrirModalEntrada = (producto: AlmacenFincaProducto) => {
  productoOperacion.value = producto
  entradaForm.tipo = 'ENTRADA_PRODUCCION'
  entradaForm.cantidad = 0
  entradaForm.numeroFactura = ''
  entradaForm.descripcion = ''
  mostrarModalEntrada.value = true
}

const cerrarModalEntrada = () => {
  mostrarModalEntrada.value = false
  productoOperacion.value = null
}

const ejecutarEntrada = async () => {
  if (!productoOperacion.value || !almacen.value?.id || !entradaForm.cantidad) return

  procesando.value = true
  try {
    await AlmacenService.entradaStock(almacen.value.id, {
      almacenFincaProductoId: productoOperacion.value.id,
      cantidad: entradaForm.cantidad,
      tipo: entradaForm.tipo,
      descripcion: entradaForm.descripcion,
      numeroFactura: entradaForm.numeroFactura
    })
    notify.success('Entrada registrada', `Se agregaron ${entradaForm.cantidad} unidades`)
    cerrarModalEntrada()
    await cargarAlmacen()
    if (mostrarAsientos.value) {
      await cargarAsientosContables()
    }
    emit('updated')
  } catch (error) {
    console.error('Error al registrar entrada:', error)
    notify.error('Error', 'No se pudo registrar la entrada')
  } finally {
    procesando.value = false
  }
}

// ==================== SALIDA (Flujo completo con facturas/vales) ====================
const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 200,
      filter: [
        { key: 'activo', operator: 'EQUALS', value: 'true', logicalOperation: 'AND' }
      ],
      query: '',
      sortBy: 'nombre',
      sortType: 'ASC'
    })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error cargando trabajadores:', error)
  }
}

const abrirModalSalida = async (producto: AlmacenFincaProducto) => {
  productoOperacion.value = producto
  salidaStep.value = 1 // Reset wizard to step 1
  salidaForm.destino = 'TRABAJADORES'
  salidaForm.observaciones = ''
  salidaForm.items = [{ trabajadorId: '', cantidad: 1, pagado: false }]
  mostrarModalSalida.value = true
  await cargarTrabajadores()
}

const cerrarModalSalida = () => {
  mostrarModalSalida.value = false
  productoOperacion.value = null
}

// ==================== SALIDA MÚLTIPLE ====================
const abrirModalSalidaMultiple = async () => {
  salidaMultipleForm.destino = 'COMEDOR'
  salidaMultipleForm.observaciones = ''
  salidaMultipleForm.lineas = (almacen.value?.productos || [])
    .filter(producto => producto.stock > 0)
    .map(producto => ({
      almacenFincaProductoId: producto.id,
      productoName: producto.productoName,
      unidadMedida: producto.unidadMedida,
      stock: producto.stock,
      seleccionada: false,
      cantidad: 1,
      items: []
    }))
  mostrarModalSalidaMultiple.value = true
  await cargarTrabajadores()
}

const cerrarModalSalidaMultiple = () => {
  mostrarModalSalidaMultiple.value = false
  salidaMultipleForm.lineas = []
}

const alternarLineaSalidaMultiple = (linea: LineaSalidaMultipleForm, event: Event) => {
  linea.seleccionada = (event.target as HTMLInputElement).checked
  if (!linea.seleccionada) {
    linea.items = []
  } else if (salidaMultipleForm.destino === 'TRABAJADORES' && linea.items.length === 0) {
    linea.items = [{ trabajadorId: '', cantidad: 1, pagado: false }]
  }
}

const agregarCompradorLinea = (linea: LineaSalidaMultipleForm) => {
  linea.items.push({ trabajadorId: '', cantidad: 1, pagado: false })
}

const eliminarCompradorLinea = (linea: LineaSalidaMultipleForm, index: number) => {
  linea.items.splice(index, 1)
}

const ejecutarSalidaMultiple = async () => {
  if (!almacen.value?.id || !esSalidaMultipleValida.value) return

  procesando.value = true
  try {
    const response = await AlmacenService.salidaMultiple(almacen.value.id, {
      destino: salidaMultipleForm.destino,
      observaciones: salidaMultipleForm.observaciones,
      lineas: lineasSalidaMultipleSeleccionadas.value.map(linea => ({
        almacenFincaProductoId: linea.almacenFincaProductoId,
        cantidad: cantidadLineaSalidaMultiple(linea),
        items: salidaMultipleForm.destino === 'TRABAJADORES'
          ? linea.items.map(item => ({
              trabajadorId: item.trabajadorId,
              cantidad: item.cantidad,
              pagado: Boolean(item.pagado)
            }))
          : undefined
      }))
    })
    const cantidadLineas = response.data.cantidadLineas || lineasSalidaMultipleSeleccionadas.value.length
    notify.success('Salida múltiple registrada', `Se generó un solo vale con ${cantidadLineas} producto(s).`)
    cerrarModalSalidaMultiple()
    await cargarAlmacen()
    if (mostrarAsientos.value) {
      await cargarAsientosContables()
    }
    emit('updated')
  } catch (error: unknown) {
    console.error('Error al registrar salida múltiple:', error)
    const err = error as { response?: { data?: { message?: string } } }
    notify.error('Error', err.response?.data?.message || 'No se pudo registrar la salida múltiple')
  } finally {
    procesando.value = false
  }
}

const agregarItemSalida = () => {
  salidaForm.items.push({ trabajadorId: '', cantidad: 1, pagado: false })
}

const eliminarItemSalida = (index: number) => {
  salidaForm.items.splice(index, 1)
}

// Limpiar trabajadorId cuando cambia el destino
watch(() => salidaForm.destino, (newDestino) => {
  if (newDestino !== 'TRABAJADORES') {
    salidaForm.items.forEach(item => {
      item.trabajadorId = ''
    })
  }
})

watch(() => salidaMultipleForm.destino, async (newDestino) => {
  if (newDestino === 'TRABAJADORES') {
    await cargarTrabajadores()
    salidaMultipleForm.lineas.forEach(linea => {
      if (linea.seleccionada && linea.items.length === 0) {
        linea.items = [{ trabajadorId: '', cantidad: 1, pagado: false }]
      }
    })
    return
  }
  salidaMultipleForm.lineas.forEach(linea => {
    linea.items = []
  })
})

const ejecutarSalida = async () => {
  if (!productoOperacion.value || !isSalidaFormValid.value) return

  procesando.value = true
  try {
    // Get fincaProductoId from the AlmacenFincaProducto
    const afp = productoOperacion.value as AlmacenFincaProducto
    const fincaProductoId = afp.fincaProductoId || afp.id // Fallback to id if fincaProductoId not present

    const data: CreateSalidaRequest = {
      destino: salidaForm.destino,
      fincaProductoId: fincaProductoId,
      almacenFincaProductoId: afp.id, // Pass almacenFincaProductoId to also decrease almacen stock
      observaciones: salidaForm.observaciones,
      items: salidaForm.items.map(item => ({
        trabajadorId: item.trabajadorId || '',
        cantidad: item.cantidad,
        pagado: item.pagado
      }))
    }

    await SalidaService.create(data)
    const tipoDoc = tipoGenerado.value === 'FACTURA' ? 'Factura' : 'Vale'
    notify.success('Salida registrada', `${tipoDoc} generado(a). Se retiraron ${cantidadTotalSalida.value} unidades`)
    cerrarModalSalida()
    await cargarAlmacen()
    if (mostrarAsientos.value) {
      await cargarAsientosContables()
    }
    emit('updated')
  } catch (error: unknown) {
    console.error('Error al registrar salida:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'No se pudo registrar la salida'
    notify.error('Error', msg)
  } finally {
    procesando.value = false
  }
}

// ==================== TRANSFERENCIA ====================
const abrirModalTransferencia = async (producto: AlmacenFincaProducto) => {
  productoOperacion.value = producto
  transferenciaForm.destinoAlmacenId = ''
  transferenciaForm.cantidad = 0
  transferenciaForm.observaciones = ''
  mostrarModalTransferencia.value = true
  await cargarAlmacenesDestino()
}

const cerrarModalTransferencia = () => {
  mostrarModalTransferencia.value = false
  productoOperacion.value = null
  almacenesDestino.value = []
}

const cargarAlmacenesDestino = async () => {
  if (!almacen.value?.id || !productoOperacion.value?.id) return

  cargandoDestinos.value = true
  try {
    const response = await AlmacenService.obtenerDestinosDisponibles(
      almacen.value.id,
      productoOperacion.value.id
    )
    almacenesDestino.value = response.data
  } catch (error) {
    console.error('Error al cargar almacenes destino:', error)
    almacenesDestino.value = []
  } finally {
    cargandoDestinos.value = false
  }
}

const ejecutarTransferencia = async () => {
  if (!productoOperacion.value || !almacen.value?.id || !transferenciaForm.destinoAlmacenId || !transferenciaForm.cantidad) return

  procesando.value = true
  try {
    await AlmacenService.transferirStock(almacen.value.id, {
      almacenFincaProductoId: productoOperacion.value.id,
      destinoAlmacenId: transferenciaForm.destinoAlmacenId,
      cantidad: transferenciaForm.cantidad,
      observaciones: transferenciaForm.observaciones
    })
    notify.success('Transferencia completada', `Se transfirieron ${transferenciaForm.cantidad} unidades`)
    cerrarModalTransferencia()
    await cargarAlmacen()
    if (mostrarAsientos.value) {
      await cargarAsientosContables()
    }
    emit('updated')
  } catch (error) {
    console.error('Error al transferir:', error)
    notify.error('Error', 'No se pudo completar la transferencia')
  } finally {
    procesando.value = false
  }
}

onMounted(() => {
  cargarAlmacen()
})
</script>

<style scoped>
.detalle-almacen {
  background: #fff;
  min-height: 400px;
}

.detalle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  color: white;
}

.header-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.5em;
}

.inventario-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-editar {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-editar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-cerrar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5em;
  line-height: 1;
  transition: all 0.3s ease;
}

.btn-cerrar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #9b59b6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detalle-content {
  padding: 25px;
}

.section {
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.btn-agregar {
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.btn-agregar:hover {
  background: #219a52;
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.empty-state p {
  color: #888;
  margin-bottom: 20px;
}

.btn-agregar-empty {
  padding: 10px 20px;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-salida-multiple {
  padding: 8px 16px;
  background: #e67e22;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-salida-multiple:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.modal-salida-multiple {
  max-width: 760px;
}

.multiple-help {
  margin-top: 0;
  color: #5d6d7e;
  line-height: 1.45;
}

.multiple-productos {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e5e7e9;
  border-radius: 6px;
  margin-bottom: 18px;
}

.multiple-productos-header,
.multiple-producto-row {
  display: grid;
  grid-template-columns: 26px minmax(180px, 1fr) 100px 160px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
}

.multiple-productos-header {
  grid-template-columns: 26px minmax(180px, 1fr) 100px 160px;
  background: #f4f6f7;
  color: #566573;
  font-size: 0.82em;
  font-weight: 700;
}

.multiple-productos-header span:first-child {
  grid-column: 2;
}

.multiple-producto-row {
  border-top: 1px solid #eef1f2;
  cursor: pointer;
}

.multiple-producto-row.selected {
  background: #fef5e7;
}

.multiple-producto-nombre {
  display: flex;
  flex-direction: column;
}

.multiple-producto-nombre small,
.multiple-cantidad small {
  color: #7f8c8d;
  font-size: 0.78em;
}

.multiple-cantidad .form-control {
  width: 100%;
}

.compradores-producto {
  border-top: 1px dashed #f0b27a;
  background: #fffaf2;
  padding: 10px 12px 12px 50px;
}

.compradores-header,
.comprador-linea {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 110px 92px 28px;
  gap: 8px;
  align-items: center;
}

.compradores-header {
  grid-template-columns: 1fr auto;
  margin-bottom: 8px;
  color: #935116;
  font-size: 0.86em;
}

.comprador-linea + .comprador-linea {
  margin-top: 7px;
}

.btn-agregar-comprador,
.btn-eliminar-comprador {
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-agregar-comprador {
  background: #e67e22;
  color: #fff;
  padding: 5px 8px;
  font-size: 0.8em;
}

.btn-eliminar-comprador {
  background: #fdecea;
  color: #c0392b;
  font-size: 1.1em;
  line-height: 28px;
  height: 28px;
}

.pagado-check {
  display: flex;
  gap: 4px;
  align-items: center;
  color: #566573;
  font-size: 0.82em;
  white-space: nowrap;
}

.multiple-summary {
  background: #fef5e7;
  border-radius: 5px;
  color: #935116;
  font-weight: 600;
  padding: 10px 12px;
}

@media (max-width: 650px) {
  .section-actions {
    flex-direction: column;
  }

  .multiple-productos-header,
  .multiple-producto-row {
    grid-template-columns: 22px minmax(110px, 1fr) 70px 95px;
    gap: 6px;
    padding: 9px 7px;
  }

  .compradores-producto {
    padding-left: 14px;
  }

  .comprador-linea {
    grid-template-columns: minmax(100px, 1fr) 74px 68px 24px;
    gap: 5px;
  }

  .compradores-header {
    grid-template-columns: minmax(100px, 1fr) auto;
    gap: 5px;
  }
}

.btn-agregar-empty:hover {
  background: #8e44ad;
}

.productos-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.productos-table th,
.productos-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.productos-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  font-size: 0.85em;
  text-transform: uppercase;
}

.productos-table tr:hover {
  background: #faf8fc;
}

.codigo {
  display: block;
  font-size: 0.8em;
  color: #888;
  margin-top: 2px;
}

.stock-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85em;
}

.stock-cero { background: #ffebee; color: #c62828; }
.stock-bajo { background: #fff3e0; color: #e65100; }
.stock-medio { background: #e3f2fd; color: #1565c0; }
.stock-alto { background: #e8f5e9; color: #2e7d32; }

.precio {
  font-weight: 600;
  color: #27ae60;
}

.btn-remover {
  padding: 5px 12px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remover:hover {
  background: #c0392b;
}

.resumen {
  display: flex;
  gap: 30px;
  margin-top: 20px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.resumen-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.resumen-item .label {
  color: #666;
  font-size: 0.9em;
}

.resumen-item .value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1em;
}

/* Modal Agregar */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-agregar {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.btn-cerrar-modal:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.search-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #9b59b6;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #888;
}

.seleccion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  border: 1px solid #eee;
  border-bottom: none;
}

.checkbox-all {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 600;
  color: #555;
}

.checkbox-all input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #9b59b6;
}

.seleccionados-count {
  font-size: 0.85em;
  color: #9b59b6;
  font-weight: 600;
  background: #f3e5f5;
  padding: 4px 10px;
  border-radius: 12px;
}

.productos-disponibles {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 0 0 8px 8px;
}

.producto-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
}

.producto-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #9b59b6;
  flex-shrink: 0;
}

.producto-item:last-child {
  border-bottom: none;
}

.producto-item:hover {
  background: #f8f9fa;
}

.producto-item.selected {
  background: #f3e5f5;
}

.producto-info {
  flex: 1;
}

.producto-info strong {
  display: block;
  color: #2c3e50;
}

.producto-info .codigo {
  font-size: 0.8em;
  color: #888;
  margin-top: 2px;
}

.producto-meta .stock {
  font-size: 0.85em;
  color: #27ae60;
  font-weight: 600;
}

.no-resultados {
  text-align: center;
  padding: 20px;
  color: #888;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-cancelar {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancelar:hover {
  background: #7f8c8d;
}

.btn-confirmar {
  padding: 10px 20px;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar:hover:not(:disabled) {
  background: #8e44ad;
}

.btn-confirmar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Botones de acciones en tabla */
.acciones-cell {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-entrada, .btn-salida, .btn-transferir {
  padding: 4px 8px;
  font-size: 0.75em;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-entrada {
  background: #27ae60;
  color: white;
}

.btn-entrada:hover {
  background: #219a52;
}

.btn-salida {
  background: #e67e22;
  color: white;
}

.btn-salida:hover {
  background: #d35400;
}

.btn-transferir {
  background: #3498db;
  color: white;
}

.btn-transferir:hover {
  background: #2980b9;
}

/* Modal de operaciones */
.modal-operacion {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header-entrada {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.modal-header-salida {
  background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%);
  color: white;
}

.modal-header-transferencia {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.producto-seleccionado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.producto-seleccionado strong {
  color: #2c3e50;
}

.stock-actual {
  font-size: 0.9em;
  color: #27ae60;
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1em;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #9b59b6;
}

select.form-control {
  cursor: pointer;
  background: white;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.error-text {
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 4px;
  display: block;
}

.loading-text {
  color: #888;
  font-size: 0.85em;
  margin-top: 4px;
  display: block;
}

.btn-entrada-confirm {
  background: #27ae60;
}

.btn-entrada-confirm:hover:not(:disabled) {
  background: #219a52;
}

.btn-salida-confirm {
  background: #e67e22;
}

.btn-salida-confirm:hover:not(:disabled) {
  background: #d35400;
}

.btn-transferencia-confirm {
  background: #3498db;
}

.btn-transferencia-confirm:hover:not(:disabled) {
  background: #2980b9;
}

/* Modal Salida Completa */
.modal-salida-completa {
  max-width: 550px;
  max-height: 90vh;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.tipo-preview {
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tipo-vale {
  background: #e3f2fd;
  color: #1565c0;
  border: 2px solid #1565c0;
}

.tipo-factura {
  background: #fff3e0;
  color: #e65100;
  border: 2px solid #e65100;
}

.tipo-hint {
  font-size: 0.75em;
  font-weight: 400;
  opacity: 0.8;
}

.stock-info-salida {
  background: #e8f5e9;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  color: #2e7d32;
  display: flex;
  gap: 15px;
}

.stock-info-salida .error {
  color: #e74c3c;
}

.items-section {
  border: 2px solid #e0e0e0;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  background: #fafafa;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-header h5 {
  margin: 0;
  color: #2c3e50;
}

.btn-agregar-item {
  background: #27ae60;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85em;
}

.btn-agregar-item:hover {
  background: #219a52;
}

.item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
}

.item-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.cantidad-group {
  max-width: 100px;
}

.pagado-group {
  max-width: 80px;
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.btn-eliminar-item {
  background: #e74c3c;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

.btn-eliminar-item:hover {
  background: #c0392b;
}

.total-items {
  text-align: right;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 8px;
  color: #1565c0;
}

/* ===== WIZARD SALIDA ===== */
.modal-salida-wizard {
  max-width: 600px;
  max-height: 90vh;
}

.wizard-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ddd;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #e67e22;
  color: white;
}

.step.completed .step-number {
  background: #27ae60;
  color: white;
}

.step-label {
  font-size: 0.75em;
  color: #888;
  font-weight: 500;
}

.step.active .step-label {
  color: #e67e22;
  font-weight: 600;
}

.step.completed .step-label {
  color: #27ae60;
}

.step-line {
  width: 60px;
  height: 3px;
  background: #ddd;
  margin: 0 10px;
  margin-bottom: 20px;
  transition: background 0.3s ease;
}

.step-line.completed {
  background: #27ae60;
}

.wizard-content {
  min-height: 250px;
}

.step-title {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.1em;
  text-align: center;
}

/* Destino Options */
.destino-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.destino-option {
  cursor: pointer;
}

.destino-option input[type="radio"] {
  display: none;
}

.destino-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  transition: all 0.2s ease;
}

.destino-option:hover .destino-content {
  border-color: #e67e22;
  background: #fff8f3;
}

.destino-option.selected .destino-content {
  border-color: #e67e22;
  background: #fff8f3;
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.2);
}

.destino-icon {
  font-size: 2em;
}

.destino-label {
  font-weight: 600;
  color: #2c3e50;
}

.destino-tipo {
  font-size: 0.7em;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.destino-selected-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.tipo-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.trabajador-group {
  flex: 2;
}

/* Resumen de salida */
.resumen-salida {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.resumen-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.resumen-row:last-of-type {
  border-bottom: none;
}

.resumen-label {
  color: #666;
  font-weight: 500;
}

.resumen-value {
  font-weight: 600;
  color: #2c3e50;
}

.cantidad-total {
  font-size: 1.1em;
  color: #e67e22;
}

.resumen-items {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #e0e0e0;
}

.resumen-items h6 {
  margin: 0 0 10px 0;
  color: #555;
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #eee;
}

.item-trabajador {
  flex: 1;
  font-weight: 500;
}

.item-cantidad {
  margin: 0 15px;
  color: #666;
}

.item-pagado {
  font-size: 0.85em;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.item-pagado.pagado {
  background: #e8f5e9;
  color: #2e7d32;
}

.item-pagado.deuda {
  background: #fff3e0;
  color: #e65100;
}

.observaciones-group {
  margin-top: 15px;
}

/* Wizard Footer */
.wizard-footer {
  display: flex;
  justify-content: space-between;
}

.btn-anterior {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-anterior:hover {
  background: #7f8c8d;
}

.btn-siguiente {
  padding: 10px 25px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-siguiente:hover:not(:disabled) {
  background: #2980b9;
}

.btn-siguiente:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

@media (max-width: 500px) {
  .destino-options {
    grid-template-columns: 1fr;
  }

  .wizard-steps {
    padding: 15px 10px;
  }

  .step-line {
    width: 30px;
  }

  .item-row {
    flex-wrap: wrap;
  }

  .trabajador-group {
    width: 100%;
    flex: auto;
  }
}

@media (max-width: 768px) {
  .detalle-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .resumen {
    flex-direction: column;
    gap: 10px;
  }

  .productos-table {
    font-size: 0.85em;
  }

  .productos-table th,
  .productos-table td {
    padding: 8px 10px;
  }

  .acciones-cell {
    flex-direction: column;
    gap: 4px;
  }

  .btn-entrada, .btn-salida, .btn-transferir {
    padding: 6px 10px;
  }
}

/* Asientos Contables Section */
.asientos-section {
  margin-top: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.section-header.clickable {
  cursor: pointer;
  background: #f8f9fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
}

.section-header.clickable:hover {
  background: #ecf0f1;
}

.section-header.clickable h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  font-size: 0.8em;
  color: #9b59b6;
}

.badge-count {
  background: #9b59b6;
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}

.asientos-content {
  padding: 20px;
  background: #fff;
}

.loading-small {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #888;
  padding: 20px;
  justify-content: center;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top-color: #9b59b6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state-small {
  text-align: center;
  padding: 20px;
  color: #888;
}

.asientos-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.asiento-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.asiento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.asiento-numero {
  font-weight: 700;
  color: #9b59b6;
  font-family: monospace;
  font-size: 1.1em;
}

.asiento-fecha {
  color: #888;
  font-size: 0.9em;
}

.asiento-descripcion {
  color: #555;
  font-size: 0.9em;
  margin-bottom: 12px;
  font-style: italic;
}

.asiento-lineas {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.linea-asiento {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 0.85em;
}

.linea-cuenta {
  font-family: monospace;
  font-weight: 600;
  color: #2c3e50;
  min-width: 60px;
}

.linea-concepto {
  flex: 1;
  color: #555;
}

.linea-debe {
  color: #27ae60;
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.linea-haber {
  color: #e74c3c;
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.asiento-totales {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #eee;
  font-size: 0.9em;
}

.total-debe {
  color: #27ae60;
  font-weight: 600;
}

.total-haber {
  color: #e74c3c;
  font-weight: 600;
}

.cuadrado-badge {
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85em;
}

.cuadrado-badge.ok {
  background: #d4edda;
  color: #155724;
}

.cuadrado-badge.error {
  background: #f8d7da;
  color: #721c24;
}
</style>
