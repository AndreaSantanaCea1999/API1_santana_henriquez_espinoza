const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Importar todos los modelos desde el index
const { 
  sequelize, 
  Inventario, 
  Productos, 
  MovimientosInventario,
  Usuario,
  Pedidos,
  DetallesPedido
} = require('./models');

const mainRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rutas montadas desde routes/index.js
app.use('/api', mainRoutes);

// Ruta para eliminar inventario por producto (movida a inventarioRoutes.js)
/* app.delete('/api/inventario/producto/:productoId', async (req, res) => {
  try {
    const inventarios = await Inventario.findAll({
      where: { ID_Producto: req.params.productoId }
    });

    if (inventarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron registros de inventario para el producto'
      });
    }

    const idsInventario = inventarios.map(inv => inv.ID_Inventario);

    // Eliminar movimientos asociados
    await MovimientosInventario.destroy({
      where: { ID_Inventario: idsInventario }
    });

    // Eliminar inventario
    const deletedCount = await Inventario.destroy({
      where: { ID_Producto: req.params.productoId }
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} registros de inventario eliminados para el producto`
    });
  } catch (error) {
    console.error('Error al eliminar registros de inventario por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar registros de inventario por producto',
      error: error.message
    });
  }
}); */

// ================================
// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Inventario y Ventas FERREMAS funcionando correctamente',
    version: '1.0.0',
    documentation: '/api',
    status: 'active'
  });
});

// Middleware de errores globales
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableEndpoints: '/api'
  });
});

// Sincronización (solo si es necesario en desarrollo)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('Modelos sincronizados con la base de datos.');
  } catch (error) {
    console.error('Error al sincronizar modelos:', error);
  }
};

// Iniciar servidor y conectar a la base de datos
app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📖 Documentación de la API en http://localhost:${PORT}/api`);

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (process.env.NODE_ENV === 'development') {
      await syncDatabase();
    }
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
});

module.exports = app;
