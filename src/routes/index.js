const express = require('express');
const router = express.Router();


const productosRoutes = require('./productosRoutes');
const categoriasRoutes = require('./categoriasRoutes');
const divisasRoutes = require('./divisasRoutes');
const marcasRoutes = require('./marcasRoutes');
 const proveedoresRoutes = require('./proveedoresRoutes');
 const inventarioRoutes = require('./inventarioRoutes');
const movimientosInventarioRoutes = require('./movimientosInventarioRoutes');

router.get('/test', (req, res) => {
  res.json({ message: 'API de inventario funcionando correctamente' });
});

// Montar solo las rutas que sabemos que funcionan
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
 router.use('/marcas', marcasRoutes);
 router.use('/proveedores', proveedoresRoutes);
 router.use('/inventario', inventarioRoutes);
 router.use('/movimientos', movimientosInventarioRoutes);
router.use('/divisas', divisasRoutes);
module.exports = router;