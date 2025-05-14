const express = require('express');
const router = express.Router();

// Importar las funciones del controlador de inventario
const {
  getAllInventario,
  getInventarioStockByProductoAndSucursal,
  getInventarioById,
  getInventarioBySucursal,
  getInventarioByProducto,
  createInventario,
  updateInventarioFields,
  createMovimientoInventario,
  deleteInventario
} = require('../controllers/inventario.controller');

// GET - Obtener todo el inventario
router.get('/', getAllInventario);

// GET - Obtener stock de un producto en una sucursal específica (NUEVO ENDPOINT)
// Ejemplo de llamada: /api/inventario/stock?productoId=1&sucursalId=1
router.get('/stock', getInventarioStockByProductoAndSucursal);

// GET - Obtener inventario por ID
router.get('/:id', getInventarioById);

// GET - Obtener inventario de una sucursal
router.get('/sucursal/:idSucursal', getInventarioBySucursal);

// GET - Obtener inventario de un producto
router.get('/producto/:idProducto', getInventarioByProducto);

// POST - Crear nuevo registro de inventario
router.post('/', createInventario);

// PATCH - Actualizar un registro de inventario
// Este PATCH actualiza campos generales del inventario, no el stock directamente.
router.patch('/:id', updateInventarioFields);

// POST - Registrar movimiento de inventario
router.post('/:id/movimiento', createMovimientoInventario);

// DELETE - Eliminar un registro de inventario
router.delete('/:id', deleteInventario);

module.exports = router;
