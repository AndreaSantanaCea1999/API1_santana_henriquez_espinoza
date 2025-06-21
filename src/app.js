const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

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

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Ruta health para monitoreo del estado del servicio
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    message: 'API de Inventario y Ventas FERREMAS funcionando correctamente',
    timestamp: Date.now()
  });
});

// Ruta raíz (info básica de API)
app.get('/', (req, res) => {
  res.status(200).json({
    message: '📦 API de Inventario y Ventas FERREMAS funcionando correctamente',
    version: '1.0.0',
    documentation: '/api',
    status: 'active'
  });
});

// Rutas principales
app.use('/api', mainRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableEndpoints: '/api'
  });
});

// Manejo de errores global (opcional pero recomendado)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

// Función para conectar DB y arrancar servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    await sequelize.sync({ alter: false }); // Usa alter: true solo en desarrollo
    console.log('📦 Modelos sincronizados correctamente');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor o conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
