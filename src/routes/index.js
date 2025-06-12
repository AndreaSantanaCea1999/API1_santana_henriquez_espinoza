const express = require('express');
const router = express.Router();

// Importar rutas por módulo
const productosRoutes = require('./productosRoutes');
const categoriasRoutes = require('./categoriasRoutes');
const marcasRoutes = require('./marcasRoutes');
const proveedoresRoutes = require('./proveedoresRoutes');
const inventarioRoutes = require('./inventarioRoutes'); // Asegúrate que este archivo exista
const movimientosInventarioRoutes = require('./movimientosInventarioRoutes');
const divisasRoutes = require('./divisasRoutes');
const usuariosRoutes = require('./usuariosRoutes');
const pedidosRoutes = require('./pedidosRoutes');
const sucursalesRoutes = require('./sucursalesRoutes');

// Logs para debug
console.log('🔔 Montando rutas principales...');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: '✅ API de inventario funcionando correctamente' });
});

// Ruta principal de documentación de la API
router.get('/', (req, res) => {
  res.json({ 
    message: '📦 API FERREMAS - Sistema de Inventario y Ventas',
    version: '1.0.0',
    status: 'active',
    usage: 'Accede a cada módulo de la API usando los endpoints listados a continuación.',
    endpoints: {
      productos: '/api/productos',
      categorias: '/api/categorias',
      marcas: '/api/marcas',
      proveedores: '/api/proveedores',
      inventario: '/api/inventario',
      movimientos: '/api/movimientos',
      divisas: '/api/divisas',
      usuarios: '/api/usuarios',
      pedidos: '/api/pedidos',
      sucursales: '/api/sucursales'
    }
  });
});

// Montar rutas
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/marcas', marcasRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/movimientos', movimientosInventarioRoutes);
router.use('/divisas', divisasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/sucursales', sucursalesRoutes);

module.exports = router;
