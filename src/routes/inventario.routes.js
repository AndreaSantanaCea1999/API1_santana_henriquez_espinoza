const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

// Rutas de consulta
router.get('/', inventarioController.getAllInventario);
router.get('/:id', inventarioController.getInventarioById);

// Estas deben existir en tu controller:
router.get('/producto/:idProducto/sucursal/:idSucursal', inventarioController.getByProductoAndSucursal);
router.get('/producto/:idProducto', inventarioController.getByProducto);

router.get('/stock', inventarioController.getInventarioStockByProductoAndSucursal);

// Crear inventario
router.post('/', inventarioController.createInventario);

// Actualizar inventario (sin tocar stock, producto ni sucursal)
router.put('/:id', inventarioController.updateInventarioFields);

// Movimiento de stock (entrada/salida)
router.post('/:id/movimiento', inventarioController.createMovimientoInventario);

// Eliminar inventario (y sus movimientos)
router.delete('/:id', inventarioController.deleteInventario);

module.exports = router;
