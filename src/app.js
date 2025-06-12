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

// Ruta raíz
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

// Conexión a base de datos y lanzamiento del servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    
    await sequelize.sync({ alter: false }); // Usa alter: true con precaución
    console.log('📦 Modelos sincronizados correctamente');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor o conectar a la base de datos:', error);
    process.exit(1); // Detiene el proceso si hay error
  }
};

startServer();

module.exports = app;
