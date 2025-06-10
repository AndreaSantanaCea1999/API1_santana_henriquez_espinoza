const express = require('express');
const router = express.Router();

// ========================
// 🔁 Importar rutas por módulo
// ========================
const productosRoutes = require('./productosRoutes');
const categoriasRoutes = require('./categoriasRoutes');
const marcasRoutes = require('./marcasRoutes');
const proveedoresRoutes = require('./proveedoresRoutes');
const inventarioRoutes = require('./inventarioRoutes');
const movimientosInventarioRoutes = require('./movimientosInventarioRoutes');
const divisasRoutes = require('./divisasRoutes');
const usuariosRoutes = require('./usuariosRoutes');
const pedidosRoutes = require('./pedidosRoutes');

// ========================
// 🔎 Ruta de prueba
// ========================
router.get('/test', (req, res) => {
  res.json({ message: '✅ API de inventario funcionando correctamente' });
});

// ========================
// 📘 Ruta principal de documentación de la API
// ========================
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
      pedidos: '/api/pedidos'
    }
  });
});

// ========================
// 🚀 Montar rutas (agrupadas por módulo lógico)
// ========================
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/marcas', marcasRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/movimientos', movimientosInventarioRoutes);
router.use('/divisas', divisasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/pedidos', pedidosRoutes);

module.exports = router;
