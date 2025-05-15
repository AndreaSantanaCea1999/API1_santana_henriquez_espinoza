const express = require('express');
const router = express.Router();

// Importar rutas
const inventarioRoutes = require('../routes/inventarios');
const movimientoRoutes = require('../routes/movimientos');
const productoRoutes = require('../routes/productos');
const sucursalRoutes = require('../routes/sucursales');
const bodegueroRoutes = require('../routes/bodegueros');
const pedidoRoutes = require('../routes/pedidos');
const divisaRoutes = require('../routes/divisas');
const marcaRoutes = require('../routes/marcas');
const proveedorRoutes = require('../routes/proveedores');
const clienteRoutes = require('../routes/clientes');

// Usar rutas
router.use('/inventarios', inventarioRoutes);
router.use('/movimientos', movimientoRoutes);
router.use('/productos', productoRoutes);
router.use('/sucursales', sucursalRoutes);
router.use('/bodegueros', bodegueroRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/divisas', divisaRoutes);
router.use('/marcas', marcaRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/clientes', clienteRoutes);

module.exports = router;
