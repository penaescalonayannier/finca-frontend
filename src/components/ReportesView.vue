<template>
  <div class="reportes-view">
    <h1>Reportes Consolidados</h1>
    <p class="subtitle">Seleccione el tipo de reporte que desea generar</p>

    <div class="reportes-grid">
      <router-link to="/reportes/deudas" class="reporte-card deudas">
        <div class="icon">💰</div>
        <h3>Deudas Pendientes</h3>
        <p>Lista de trabajadores con deuda, ordenados por monto. Incluye totales por finca y estadísticas.</p>
      </router-link>

      <router-link to="/reportes/facturacion" class="reporte-card facturacion">
        <div class="icon">📄</div>
        <h3>Facturación</h3>
        <p>Resumen de vales y facturas emitidos por período. Agrupación por finca, tipo o destino.</p>
      </router-link>

      <router-link to="/reportes/kardex" class="reporte-card kardex">
        <div class="icon">📦</div>
        <h3>Kardex Consolidado</h3>
        <p>Movimientos de stock por producto. Entradas, salidas y balance por período.</p>
      </router-link>

      <router-link to="/reportes/movimientos" class="reporte-card movimientos">
        <div class="icon">📊</div>
        <h3>Gráfico de Movimientos</h3>
        <p>Visualización de entradas vs salidas en el tiempo. Granularidad por día, semana o mes.</p>
      </router-link>

      <router-link to="/alertas-stock" class="reporte-card alertas">
        <div class="icon">⚠️</div>
        <h3>Alertas de Stock</h3>
        <p>Productos con stock bajo o crítico. Configuración de umbrales mínimos y máximos.</p>
      </router-link>

      <router-link to="/reportes/ventas-pagos" class="reporte-card ventas-pagos">
        <div class="icon">💵</div>
        <h3>Resumen Ventas y Pagos</h3>
        <p>Pagos recibidos por método (efectivo/transferencia) y ventas por destino en un período.</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed for this menu view
</script>

<style scoped>
.reportes-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.reportes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.reporte-card {
  display: block;
  padding: 25px;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
  border: 1px solid #e0e0e0;
}

.reporte-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.reporte-card .icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.reporte-card h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.reporte-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.reporte-card.deudas {
  border-left: 4px solid #e74c3c;
}

.reporte-card.facturacion {
  border-left: 4px solid #3498db;
}

.reporte-card.kardex {
  border-left: 4px solid #9b59b6;
}

.reporte-card.movimientos {
  border-left: 4px solid #27ae60;
}

.reporte-card.alertas {
  border-left: 4px solid #f39c12;
}

.reporte-card.ventas-pagos {
  border-left: 4px solid #1abc9c;
}
</style>
