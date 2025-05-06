const express = require('express');
const cors = require('cors');
const { testConnection } = require('../config/db');



// o algo similar

// Importar rutas
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const clientesRoutes = require('./routes/clientes.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const marcasRoutes = require('./routes/marcas.routes');
const divisasRoutes = require('./routes/divisas.routes');
// Crear aplicación Express
const app = express();

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Configurar rutas
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/divisas', divisasRoutes);
// Ruta de prueba para verificar que la API está funcionando
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API de Ventas funcionando correctamente',
    endpoints: [
      '/api/productos',
      '/api/pedidos',
      '/api/clientes',
      '/api/categorias',
      '/api/inventario',
      '/api/marcas',
      '/api/divisas'
    ],
    version: '1.0.0',
    fecha: new Date()
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor API iniciado en puerto ${PORT}`);
  
  // Comprobar la conexión a la base de datos
  await testConnection();
});

module.exports = app;
