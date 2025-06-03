const express = require('express');
const router = express.Router();

// Importar rutas existentes
const productosRoutes = require('./productosRoutes');
const categoriasRoutes = require('./categoriasRoutes');
const divisasRoutes = require('./divisasRoutes');
const marcasRoutes = require('./marcasRoutes');
const proveedoresRoutes = require('./proveedoresRoutes');
const inventarioRoutes = require('./inventarioRoutes');
const movimientosInventarioRoutes = require('./movimientosInventarioRoutes');

// Importar nuevas rutas
const usuariosRoutes = require('./usuariosRoutes');
const pedidosRoutes = require('./pedidosRoutes');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'API de inventario funcionando correctamente' });
});

// Ruta de estado general de la API
router.get('/', (req, res) => {
  res.json({ 
    message: 'API FERREMAS - Sistema de Inventario y Ventas',
    version: '1.0.0',
    endpoints: {
      productos: '/api/productos',
      categorias: '/api/categorias',
      marcas: '/api/marcas',
      proveedores: '/api/proveedores',
      inventario: '/api/inventario',
      movimientos: '/api/movimientos',
      divisas: '/api/divisas',
      usuarios: '/api/usuarios',
      pedidos: '/api/pedidos'
    }
  });
});

// Montar rutas existentes
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/marcas', marcasRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/movimientos', movimientosInventarioRoutes);
router.use('/divisas', divisasRoutes);

// Montar nuevas rutas
router.use('/usuarios', usuariosRoutes);
router.use('/pedidos', pedidosRoutes);

module.exports = router;