const express = require('express');
const router = express.Router();

// Importar rutas
const productosRoutes = require('./productosRoutes');
const categoriasRoutes = require('./categoriasRoutes');
// Comenta las demás importaciones por ahora
const marcasRoutes = require('./marcasRoutes');
 const proveedoresRoutes = require('./proveedoresRoutes');
 const inventarioRoutes = require('./inventarioRoutes');
const movimientosInventarioRoutes = require('./movimientosInventarioRoutes');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'API de inventario funcionando correctamente' });
});

// Montar solo las rutas que sabemos que funcionan
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
// Comenta las demás rutas por ahora
 router.use('/marcas', marcasRoutes);
 router.use('/proveedores', proveedoresRoutes);
 router.use('/inventario', inventarioRoutes);
 router.use('/movimientos', movimientosInventarioRoutes);

module.exports = router;